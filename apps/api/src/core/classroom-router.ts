import { classroomContract, classroomSchema } from "@redwood/contracts";
import { parse } from "csv-parse/sync";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { publicProcedure } from "../libs/orpc-procedures";
import { emptySchedule, processTimeRanges, rowSchema } from "../util/csv-util";

export const classroomRouter = {
  loadClassrooms: publicProcedure.classrooms.loadRooms.handler(async ({ input, errors: { INTERNAL_SERVER_ERROR } }) => {
    try {
      const text = await input.csvFile.text();
      const parsedCSV = parse(text, {
        columns: true,
        bom: true,
        trim: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      const typedRows = (parsedCSV as unknown[]).map((row) => rowSchema.parse(row));

      // Group rows by Room
      const uploadedRooms: Record<string, z.infer<typeof rowSchema>[]> = {};
      for (const row of typedRows) (uploadedRooms[row.Room] ??= []).push(row);

      const touchedRoomNames = Object.keys(uploadedRooms);

      // Load ALL existing docs to know which ones to deactivate
      const existingRoomDocuments = await ClassroomService.find({});
      const existingByName = new Map(
        existingRoomDocuments.map((doc) => {
          const parsed = classroomSchema.parse(doc);
          return [parsed.sourceRoomName, parsed] as const;
        })
      );

      const roomsToUpsert: z.infer<typeof classroomSchema>[] = [];

      // Build complete schema objects for touched rooms
      for (const [roomName, rows] of Object.entries(uploadedRooms)) {
        const schedule = processTimeRanges(rows);

        const numberMatch = roomName.match(/\d+$/);
        const number = numberMatch ? numberMatch[0] : "";

        const displayName = roomName.replace(/\s+(Clrm|Com|Acad|Engr)\s+/, " ").trim();

        const groupKey = roomName.split(/\s+/)[0] || "Miscellaneous";

        const existingRoom = existingByName.get(roomName);

        const roomData: z.infer<typeof classroomSchema> = {
          _id: existingRoom?._id ?? uuidv7(), // Keep existing ID or generate new
          sourceRoomName: roomName,
          groupKey,
          displayName,
          number,
          isActive: true,
          schedule,
          openTasksCount: existingRoom?.openTasksCount ?? 0,
          lastMaintenance: existingRoom?.lastMaintenance,
          captioning: existingRoom?.captioning,
        };

        // Validate against schema
        const validatedRoom = classroomSchema.parse(roomData);
        roomsToUpsert.push(validatedRoom);
      }

      // Build complete schema objects for untouched rooms (deactivate them)
      const touchedSet = new Set(touchedRoomNames);
      for (const [roomName, existingRoom] of existingByName) {
        if (!touchedSet.has(roomName)) {
          const deactivatedRoom: z.infer<typeof classroomSchema> = {
            ...existingRoom,
            isActive: false,
            schedule: emptySchedule(),
          };

          const validatedRoom = classroomSchema.parse(deactivatedRoom);
          roomsToUpsert.push(validatedRoom);
        }
      }

      // Upsert all rooms
      const ops = roomsToUpsert.map((room) => ({
        updateOne: {
          filter: { sourceRoomName: room.sourceRoomName },
          update: { $set: room },
          upsert: true,
        },
      }));

      if (ops.length > 0) {
        const result = await ClassroomService.bulkWrite(ops, { ordered: false });
        console.log("Bulk write completed:", result);
      }

      return true;
    } catch (e) {
      console.error(e);
      throw INTERNAL_SERVER_ERROR({ message: e.toString() });
    }
  }),
  getClassroom: classroomContract.getRoom,
  addMaintenanceEntry: classroomContract.addMaintenanceEntry,
  editMaintenanceEntry: classroomContract.editMaintenanceEntry,
};
