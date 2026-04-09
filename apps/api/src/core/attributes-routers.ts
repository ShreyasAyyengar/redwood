import { ConfigService } from "../database/config-service";
import { adminProcedure } from "../libs/orpc-procedures";

export const attributesRouter = {
  getAttributes: adminProcedure.attributes.getAttributes.handler(async ({ errors }) => {
    const config = await ConfigService.findOne();
    if (!config) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });

    return config.attributes;
  }),

  addAttribute: adminProcedure.attributes.addAttribute.handler(async ({ input: { attribute }, errors }) => {
    const config = await ConfigService.findOne();
    if (!config) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });

    config.attributes.push(attribute);
    await config.save();
    return true;
  }),

  deleteAttribute: adminProcedure.attributes.deleteAttribute.handler(async ({ input: { attribute }, errors }) => {
    const config = await ConfigService.findOne();
    if (!config) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });

    config.attributes = config.attributes.filter((a) => a !== attribute);
    await config.save();
    return true;
  }),

  updateAttributes: adminProcedure.attributes.updateAttributes.handler(async ({ input: { attributes }, errors }) => {
    const config = await ConfigService.findOne();
    if (!config) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });

    config.attributes = attributes;
    await config.save();
    return true;
  }),
};
