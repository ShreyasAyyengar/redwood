import { classroomSchema, classroomSchemaPayload } from "@redwood/contracts";
import { parse } from "csv-parse/sync";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { ConfigService } from "../database/config-service";
import { adminProcedure, protectedProcedure } from "../libs/orpc-procedures";
import { emptySchedule, processTimeRanges, rowSchema } from "../util/csv-util";

export const classroomRouter = {
  loadClassrooms: protectedProcedure.classrooms.loadClassrooms.handler(async ({ input, errors: { INTERNAL_SERVER_ERROR } }) => {
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
      for (const row of typedRows) {
        const roomRows = uploadedRooms[row.Room] ?? [];
        roomRows.push(row);
        uploadedRooms[row.Room] = roomRows;
      }

      const touchedRoomNames = Object.keys(uploadedRooms);

      // Load ALL existing docs to know which ones to deactivate
      const existingRoomDocuments = await ClassroomService.find({}).lean();
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

        const existingRoom = existingByName.get(roomName);

        // if existingRoom exists, spread and only change schedule
        const roomData: z.input<typeof classroomSchema> = existingRoom
          ? { ...existingRoom, schedule, isActive: true }
          : {
              _id: uuidv7(),
              sourceRoomName: roomName,
              displayName: roomName,
              schedule,
              roomStatus: "GOOD" as const,
              isActive: true,
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

      if (ops.length > 0) await ClassroomService.bulkWrite(ops, { ordered: false });

      await ConfigService.findOneAndUpdate(
        {},
        { $set: { "csvRecords.fileName": input.csvFile.name, "csvRecords.dateUploaded": new Date() } },
        { new: true }
      ).lean();

      return true;
    } catch (e) {
      throw INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  getCSVRecord: protectedProcedure.classrooms.getCSVRecord.handler(async ({ errors: { NOT_FOUND } }) => {
    const config = await ConfigService.findOne().lean();
    if (!config) throw NOT_FOUND({ data: { message: "Configuration not found." } });
    return config.csvRecords ?? null;
  }),

  getRoom: protectedProcedure.classrooms.getRoom.handler(async ({ input, errors: { NOT_FOUND } }) => {
    const room = await getRoomPayload(input.id);
    if (!room) throw NOT_FOUND({ data: { message: `Room with id ${input.id} not found` } });

    return room;
  }),

  getRooms: protectedProcedure.classrooms.getRooms.handler(async ({ errors: { INTERNAL_SERVER_ERROR } }) => {
    try {
      return await ClassroomService.aggregate([
        // 1. Filter for active rooms
        { $match: { isActive: true } },

        // 2. Join with tasks & issues collection to append counts

        // append activeIssuesCount
        {
          $lookup: {
            from: "issues",
            let: { roomId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$classroomId", "$$roomId"] },
                  resolution: { $exists: false },
                },
              },
              { $count: "count" },
            ],
            as: "activeIssueCountResult",
          },
        },

        // append openTasksCount
        {
          $lookup: {
            from: "tasks",
            let: { roomId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$classroomId", "$$roomId"] },
                  completion: { $exists: false },
                  $or: [{ visibleAt: { $exists: false } }, { visibleAt: { $lte: new Date() } }],
                },
              },
              { $count: "count" },
            ],
            as: "taskCountResult",
          },
        },

        // 3. Format the output
        {
          $addFields: {
            activeIssuesCount: {
              $ifNull: [{ $arrayElemAt: ["$activeIssueCountResult.count", 0] }, 0],
            },
            openTasksCount: {
              $ifNull: [{ $arrayElemAt: ["$taskCountResult.count", 0] }, 0],
            },
          },
        },

        // 4. Remove the temporary lookup field
        { $project: { activeIssueCountResult: 0, taskCountResult: 0 } },
      ]);
    } catch (e) {
      throw INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  updateRoom: adminProcedure.classrooms.updateRoom.handler(async ({ input, errors: { NOT_FOUND } }) => {
    const { _id, ...updates } = input;
    const $set: Partial<z.infer<typeof classroomSchema>> = {};

    if (updates.groupKey !== undefined) $set.groupKey = updates.groupKey;
    if (updates.attributes !== undefined) $set.attributes = updates.attributes;
    if (updates.captioning !== undefined) $set.captioning = updates.captioning;

    if (Object.keys($set).length > 0) {
      const result = await ClassroomService.updateOne({ _id }, { $set }).lean();
      if (result.matchedCount === 0) throw NOT_FOUND({ data: { message: `Room with id ${_id} not found` } });
    }

    const room = await getRoomPayload(_id);
    if (!room) throw NOT_FOUND({ data: { message: `Room with id ${_id} not found` } });

    return room;
  }),
};

async function getRoomPayload(classroomId: string): Promise<z.infer<typeof classroomSchemaPayload> | undefined> {
  const room = await ClassroomService.aggregate([
    { $match: { _id: classroomId } },
    {
      $lookup: {
        from: "issues",
        let: { roomId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$classroomId", "$$roomId"] },
              resolution: { $exists: false },
            },
          },
          { $count: "count" },
        ],
        as: "activeIssueCountResult",
      },
    },
    {
      $lookup: {
        from: "tasks",
        let: { roomId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$classroomId", "$$roomId"] },
              completion: { $exists: false },
              $or: [{ visibleAt: { $exists: false } }, { visibleAt: { $lte: new Date() } }],
            },
          },
          { $count: "count" },
        ],
        as: "taskCountResult",
      },
    },
    {
      $addFields: {
        activeIssuesCount: {
          $ifNull: [{ $arrayElemAt: ["$activeIssueCountResult.count", 0] }, 0],
        },
        openTasksCount: {
          $ifNull: [{ $arrayElemAt: ["$taskCountResult.count", 0] }, 0],
        },
      },
    },
    { $project: { activeIssueCountResult: 0, taskCountResult: 0 } },
  ]).then((results) => results[0]);

  return room ? classroomSchemaPayload.parse(room) : undefined;
}
