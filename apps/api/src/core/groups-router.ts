import type { groupSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { GroupService } from "../database/groups-service";
import { adminProcedure } from "../libs/orpc-procedures";

export const groupsRouter = {
  getGroups: adminProcedure.groups.getGroups.handler(async ({ errors }) => {
    const groups = await GroupService.find();
    if (!groups) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Groups not found." } });
    return groups;
  }),

  addGroup: adminProcedure.groups.addGroup.handler(async ({ input, errors }) => {
    const existingGroup = await GroupService.findOne({ label: input.label });
    if (existingGroup) throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Group with this label already exists." } });

    const newGroup: z.infer<typeof groupSchema> = {
      ...input,
      _id: uuidv7(),
    };

    const group = await GroupService.create(newGroup);
    if (!group) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Failed to create group." } });
    return { success: true };
  }),

  deleteGroup: adminProcedure.groups.deleteGroup.handler(async ({ input, errors }) => {
    const group = await GroupService.findOne({ _id: input.id });
    if (!group) throw errors.NOT_FOUND({ data: { message: "Group not found." } });

    const res = await GroupService.deleteOne({ _id: input.id });
    if (!res.deletedCount) throw errors.NOT_FOUND({ data: { message: "Group not found." } });

    await ClassroomService.updateMany({ groupKey: group.label }, { $set: { groupKey: "Ungrouped" } });

    return { success: true };
  }),

  updateGroup: adminProcedure.groups.updateGroup.handler(async ({ input, errors }) => {
    const oldGroup = await GroupService.findOne({ _id: input._id });
    if (!oldGroup) throw errors.NOT_FOUND({ data: { message: "Group not found." } });

    const group = await GroupService.findOneAndUpdate({ _id: input._id }, input);
    if (!group) throw errors.NOT_FOUND({ data: { message: "Group not found." } });

    if (input.label && input.label !== oldGroup.label) {
      await ClassroomService.updateMany({ groupKey: oldGroup.label }, { $set: { groupKey: input.label } });
    }

    return { success: true };
  }),

  bulkUpdateClassrooms: adminProcedure.groups.bulkUpdateClassrooms.handler(async ({ input: { updates }, errors }) => {
    try {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.classroomId },
          update: { $set: { groupKey: update.groupKey } },
        },
      }));

      await ClassroomService.bulkWrite(bulkOps);
      return { success: true };
    } catch (e) {
      console.error(e);
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Failed to update classrooms." } });
    }
  }),
};
