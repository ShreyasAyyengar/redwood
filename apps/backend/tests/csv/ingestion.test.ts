import { describe, expect, mock, test } from "bun:test";
import { type FunctionArgs, getFunctionName } from "convex/server";
import type { api, internal } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { ActionCtx, MutationCtx } from "../../convex/_generated/server";
import {
  loadClassroomsByCSV,
  processClassroomsByCSV,
  replaceClassroomsFromCSV,
  scheduleClassroomsFromCSV,
} from "../../convex/core/csv/service.ts";
import { emptySchedule } from "../../convex/lib/csv.ts";

const storageId = "csv-file" as Id<"_storage">;
const upload = { csvFileStorageId: storageId, fileName: "classrooms.csv" };
const validCSV =
  "Room,Weekday,Start_Time,End_Time\nA101,Monday,09:00 AM,10:30 AM\nA101,Friday,01:00 PM,02:00 PM\nB202,Tuesday,11:00 AM,12:00 PM";
const ONE_HOUR_MS = 3_600_000;

// Convex exposes the wrapped handlers at runtime, allowing isolated tests without a deployment.
function getHandler<Ctx, Args>(registered: unknown) {
  return (registered as { _handler: (ctx: Ctx, args: Args) => Promise<unknown> })._handler;
}

const loadCSV = getHandler<ActionCtx, FunctionArgs<typeof api.core.csv.service.loadClassroomsByCSV>>(loadClassroomsByCSV);
const processCSV = getHandler<ActionCtx, FunctionArgs<typeof internal.core.csv.service.processClassroomsByCSV>>(processClassroomsByCSV);
const replaceCSV = getHandler<MutationCtx, FunctionArgs<typeof internal.core.csv.service.replaceClassroomsFromCSV>>(replaceClassroomsFromCSV);
const scheduleCSV = getHandler<MutationCtx, FunctionArgs<typeof internal.core.csv.service.scheduleClassroomsFromCSV>>(scheduleClassroomsFromCSV);

function actionContext(csv: string | null = validCSV, role = "supervisor") {
  const runMutation = mock(async (_reference: unknown, _args: unknown) => null);
  const deleteFile = mock(async (_id: Id<"_storage">) => undefined);
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject: "supervisor", sessionId: "session" }) },
    runQuery: async (_reference: unknown, args: { model: string }) => (args.model === "session" ? { _id: "session" } : { role }),
    runMutation,
    storage: { get: async () => (csv === null ? null : new Blob([csv])), delete: deleteFile },
  } as unknown as ActionCtx;
  return { ctx, runMutation, deleteFile };
}

const room = {
  sourceRoomName: "A101",
  schedule: { ...emptySchedule(), monday: [{ startTimeMin: 540, endTimeMin: 630 }] },
};

function mutationContext(existingRooms: Doc<"classrooms">[] = []) {
  const patch = mock(async (_table: string, _id: Id<"classrooms">, _patch: unknown) => undefined);
  const insert = mock(async (_table: string, _value: unknown) => "record");
  const deleteFile = mock(async (_id: Id<"_storage">) => undefined);
  const runAt = mock(async (_timestamp: number, _reference: unknown, _args: unknown) => "scheduled-job" as Id<"_scheduled_functions">);
  const ctx = {
    db: { query: () => ({ collect: async () => existingRooms }), patch, insert },
    storage: { delete: deleteFile },
    scheduler: { runAt },
  } as unknown as MutationCtx;
  return { ctx, patch, insert, deleteFile, runAt };
}

describe("CSV ingestion", () => {
  test("immediate ingestion groups classroom rows and converts their availability times", async () => {
    const { ctx, runMutation, deleteFile } = actionContext();
    expect(await loadCSV(ctx, upload)).toEqual({ success: true });

    const [reference, args] = runMutation.mock.calls[0] as unknown as [Parameters<typeof getFunctionName>[0], { rooms: (typeof room)[] }];
    expect(getFunctionName(reference)).toBe("core/csv/service:replaceClassroomsFromCSV");
    expect(args).toMatchObject(upload);
    expect(args.rooms).toEqual([
      { ...room, schedule: { ...room.schedule, friday: [{ startTimeMin: 780, endTimeMin: 840 }] } },
      { sourceRoomName: "B202", schedule: { ...emptySchedule(), tuesday: [{ startTimeMin: 660, endTimeMin: 720 }] } },
    ]);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  test("scheduled ingestion validates now and queues without replacing classrooms or deleting the file", async () => {
    const { ctx, runMutation, deleteFile } = actionContext();
    const effectiveOn = new Date(Date.now() + ONE_HOUR_MS).toISOString();
    await loadCSV(ctx, { ...upload, effectiveOn });

    expect(runMutation).toHaveBeenCalledTimes(1);
    const [reference, args] = runMutation.mock.calls[0] as unknown as [Parameters<typeof getFunctionName>[0], unknown];
    expect(getFunctionName(reference)).toBe("core/csv/service:scheduleClassroomsFromCSV");
    expect(args).toMatchObject({ ...upload, effectiveOn });
    expect(deleteFile).not.toHaveBeenCalled();
  });

  test.each([
    ["empty", ""],
    ["headers only", "Room,Weekday,Start_Time,End_Time"],
    ["missing columns", "Room,Weekday\nA101,Monday"],
    ["invalid weekday", "Room,Weekday,Start_Time,End_Time\nA101,Funday,09:00 AM,10:00 AM"],
    ["invalid time", "Room,Weekday,Start_Time,End_Time\nA101,Monday,25:00 AM,10:00 AM"],
    ["reversed time range", "Room,Weekday,Start_Time,End_Time\nA101,Monday,10:00 AM,09:00 AM"],
  ])("rejects %s CSVs before scheduling or changing classrooms", async (_label, csv) => {
    const { ctx, runMutation } = actionContext(csv);
    await expect(loadCSV(ctx, { ...upload, effectiveOn: new Date(Date.now() + ONE_HOUR_MS).toISOString() })).rejects.toThrow(
      "CSV ingestion failed"
    );
    expect(runMutation).not.toHaveBeenCalled();
  });

  test("reports a missing uploaded file", async () => {
    const { ctx, runMutation } = actionContext(null);
    await expect(loadCSV(ctx, upload)).rejects.toThrow("CSV file not found");
    expect(runMutation).not.toHaveBeenCalled();
  });

  test("employees cannot initiate ingestion", async () => {
    const { ctx, runMutation } = actionContext(validCSV, "employee");
    await expect(loadCSV(ctx, upload)).rejects.toThrow("Supervisor access required");
    expect(runMutation).not.toHaveBeenCalled();
  });

  test("queues a mutation for the requested timestamp without changing live data", async () => {
    const { ctx, runAt, patch, insert, deleteFile } = mutationContext();
    const effectiveOn = new Date(Date.now() + ONE_HOUR_MS).toISOString();
    await scheduleCSV(ctx, { ...upload, effectiveOn, rooms: [room] });

    const [timestamp, reference, args] = runAt.mock.calls[0] as unknown as [number, Parameters<typeof getFunctionName>[0], unknown];
    expect(timestamp).toBe(Date.parse(effectiveOn));
    expect(getFunctionName(reference)).toBe("core/csv/service:replaceClassroomsFromCSV");
    expect(args).toEqual({ ...upload, rooms: [room] });
    expect(patch).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(deleteFile).not.toHaveBeenCalled();
  });

  test("rejects past activation times rather than silently applying immediately", async () => {
    const { ctx, runAt } = mutationContext();
    await expect(scheduleCSV(ctx, { ...upload, effectiveOn: "2000-01-01T00:00:00.000Z", rooms: [room] })).rejects.toThrow(
      "Choose a future effective date"
    );
    expect(runAt).not.toHaveBeenCalled();
  });

  test("activation preserves room IDs and metadata, deactivates missing rooms, records application, and cleans storage", async () => {
    const existingRoom: Doc<"classrooms"> = {
      _id: "existing-room" as Id<"classrooms">,
      _creationTime: 0,
      sourceRoomName: "A101",
      displayName: "Custom name",
      groupKey: "Building A",
      attributes: ["attribute" as Id<"attributes">],
      isActive: false,
      schedule: emptySchedule(),
    };
    const omittedRoom = { ...existingRoom, _id: "omitted-room" as Id<"classrooms">, sourceRoomName: "C303", isActive: true };
    const { ctx, patch, insert, deleteFile } = mutationContext([existingRoom, omittedRoom]);
    const newRoom = { ...room, sourceRoomName: "B202" };
    expect(await replaceCSV(ctx, { ...upload, rooms: [room, newRoom] })).toEqual({
      created: 1,
      updated: 1,
      deactivated: 1,
    });
    expect(patch.mock.calls).toEqual([
      ["classrooms", existingRoom._id, { schedule: room.schedule, isActive: true }],
      ["classrooms", omittedRoom._id, { schedule: emptySchedule(), isActive: false }],
    ]);
    expect(insert).toHaveBeenCalledWith("classrooms", {
      ...newRoom,
      displayName: "B202",
      groupKey: "Ungrouped",
      attributes: [],
      isActive: true,
    });
    expect(insert).toHaveBeenCalledWith("csvRecords", { fileName: upload.fileName, dateUploaded: expect.any(String) });
    expect(deleteFile).toHaveBeenCalledWith(storageId);
  });

  test("previously scheduled action entry points still apply their uploaded CSV", async () => {
    const { ctx, runMutation } = actionContext();
    expect(await processCSV(ctx, upload)).toBeNull();
    const [reference] = runMutation.mock.calls[0] as unknown as [Parameters<typeof getFunctionName>[0]];
    expect(getFunctionName(reference)).toBe("core/csv/service:replaceClassroomsFromCSV");
  });
});
