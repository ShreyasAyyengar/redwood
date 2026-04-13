import type { attributeSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { AttributeService } from "../database/attribute-service";
import { ClassroomService } from "../database/classroom-service";
import { adminProcedure } from "../libs/orpc-procedures";

export const attributesRouter = {
  getAttributes: adminProcedure.attributes.getAttributes.handler(async ({ errors }) => {
    const attributes = await AttributeService.find();
    if (!attributes) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Attributes not found." } });
    return attributes;
  }),

  addAttribute: adminProcedure.attributes.addAttribute.handler(async ({ input, errors }) => {
    const existingAttribute = await AttributeService.findOne({ label: input.label });
    if (existingAttribute) throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Attribute with this label already exists." } });

    const newAttribute: z.infer<typeof attributeSchema> = {
      ...input,
      _id: uuidv7(),
    };

    const attribute = await AttributeService.create(newAttribute);
    if (!attribute) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Failed to create attribute." } });
    return { success: true };
  }),

  deleteAttribute: adminProcedure.attributes.deleteAttribute.handler(async ({ input, errors }) => {
    const res = await AttributeService.deleteOne({ _id: input.id });
    if (!res.deletedCount) throw errors.NOT_FOUND({ data: { message: "Attribute not found." } });

    await ClassroomService.updateMany({ attributes: input.id }, { $pull: { attributes: input.id } });

    return { success: true };
  }),

  updateAttribute: adminProcedure.attributes.updateAttribute.handler(async ({ input, errors }) => {
    const attribute = await AttributeService.findOneAndUpdate({ _id: input._id }, input);
    if (!attribute) throw errors.NOT_FOUND({ data: { message: "Attribute not found." } });
    return { success: true };
  }),

  bulkUpdateClassrooms: adminProcedure.attributes.bulkUpdateClassrooms.handler(async ({ input: { updates }, errors }) => {
    console.log(updates);

    try {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.classroomId },
          update: { $set: { attributes: update.attributes } },
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
