import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { parse } from "csv-parse/browser/esm/sync";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";
import { csvRowSchema, emptySchedule, processTimeRanges } from "../../lib/csv.ts";
import { internalAction, internalMutation, protectedQuery, supervisorAction, supervisorMutation } from "../../lib/procedures.ts";
import { scheduleSchema } from "../classrooms/schemas.ts";
import { csvRecordSchema, csvRoomSchema } from "./schemas.ts";

const processClassroomsByCSVArgs = z.object({
  csvFileStorageId: zid("_storage"),
  fileName: z.string().min(1),
  effectiveOn: z.iso.datetime().optional(),
});

type ProcessClassroomsByCSVArgs = z.infer<typeof processClassroomsByCSVArgs>;
type CsvActionCtx = Pick<ActionCtx, "runMutation" | "storage">;

export const generateCSVUploadUrl = supervisorMutation({
  returns: z.string(),
  handler: (ctx) => ctx.storage.generateUploadUrl(),
});

async function processClassroomsByCSVFile(ctx: CsvActionCtx, args: ProcessClassroomsByCSVArgs): Promise<void> {
  const csvFile = await ctx.storage.get(args.csvFileStorageId);
  if (!csvFile) throw new ConvexError({ code: "NOT_FOUND", message: "CSV file not found." });

  try {
    const parsedRows = parse(await csvFile.text(), {
      columns: true,
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as unknown[];
    const typedRows = z.array(csvRowSchema).parse(parsedRows);
    const rowsByRoom = new Map<string, z.infer<typeof csvRowSchema>[]>();

    for (const row of typedRows) {
      const roomRows = rowsByRoom.get(row.Room) ?? [];
      roomRows.push(row);
      rowsByRoom.set(row.Room, roomRows);
    }

    const rooms = [...rowsByRoom].map(([sourceRoomName, rows]) => ({
      sourceRoomName,
      schedule: scheduleSchema.parse(processTimeRanges(rows)),
    }));

    await ctx.runMutation(internal.core.csv.service.replaceClassroomsFromCSV, {
      fileName: args.fileName,
      rooms,
    });

    await ctx.storage.delete(args.csvFileStorageId);
  } catch (error) {
    if (error instanceof ConvexError) throw error;

    throw new ConvexError({
      code: "UNPROCESSABLE_CONTENT",
      message: `CSV ingestion failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

export const loadClassroomsByCSV = supervisorAction({
  args: processClassroomsByCSVArgs,
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const csvFile = await ctx.storage.get(args.csvFileStorageId);
    if (!csvFile) throw new ConvexError({ code: "NOT_FOUND", message: "CSV file not found." });

    if (args.effectiveOn) {
      await ctx.scheduler.runAt(new Date(args.effectiveOn), internal.core.csv.service.processClassroomsByCSV, {
        csvFileStorageId: args.csvFileStorageId,
        fileName: args.fileName,
      });

      return { success: true };
    }

    await processClassroomsByCSVFile(ctx, args);
    return { success: true };
  },
});

export const processClassroomsByCSV = internalAction({
  args: processClassroomsByCSVArgs,
  returns: z.null(),
  handler: async (ctx, args) => {
    await processClassroomsByCSVFile(ctx, args);
    return null;
  },
});

export const replaceClassroomsFromCSV = internalMutation({
  args: z.object({
    fileName: z.string().min(1),
    rooms: z.array(csvRoomSchema),
  }),
  returns: z.object({
    created: z.number(),
    updated: z.number(),
    deactivated: z.number(),
  }),
  handler: async (ctx, args) => {
    const existingRooms = await ctx.db.query("classrooms").collect();
    const existingByName = new Map(existingRooms.map((room) => [room.sourceRoomName, room] as const));
    const importedNames = new Set(args.rooms.map((room) => room.sourceRoomName));
    let created = 0;
    let updated = 0;
    let deactivated = 0;

    for (const importedRoom of args.rooms) {
      const existingRoom = existingByName.get(importedRoom.sourceRoomName);

      if (existingRoom) {
        await ctx.db.patch("classrooms", existingRoom._id, {
          schedule: importedRoom.schedule,
          isActive: true,
        });
        updated += 1;
      } else {
        await ctx.db.insert("classrooms", {
          sourceRoomName: importedRoom.sourceRoomName,
          displayName: importedRoom.sourceRoomName,
          groupKey: "Ungrouped",
          schedule: importedRoom.schedule,
          isActive: true,
          attributes: [],
        });
        created += 1;
      }
    }

    for (const existingRoom of existingRooms) {
      if (!importedNames.has(existingRoom.sourceRoomName)) {
        await ctx.db.patch("classrooms", existingRoom._id, {
          isActive: false,
          schedule: emptySchedule(),
        });
        deactivated += 1;
      }
    }

    await ctx.db.insert("csvRecords", {
      fileName: args.fileName,
      dateUploaded: new Date().toISOString(),
    });

    return { created, updated, deactivated };
  },
});

export const getCSVRecord = protectedQuery({
  returns: csvRecordSchema.nullable(),
  handler: async (ctx) => {
    const record = await ctx.db.query("csvRecords").withIndex("byDateUploaded").order("desc").first();
    return record ? csvRecordSchema.parse(record) : null;
  },
});
