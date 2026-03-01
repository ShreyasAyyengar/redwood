import type { basicUserSchema } from "@redwood/contracts";
import type { z } from "zod";
import { ConfigService } from "../database/config-service";
import { adminProcedure } from "../libs/orpc-procedures";
import { hasCredentials } from "../util/user-util";

export const userRouter = {
  addCredentials: adminProcedure.users.createCredentials.handler(async ({ input: { email, role }, errors }) => {
    const exists = await hasCredentials(email);

    if (exists) throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Credentials already exist." } });

    const basicNewUser: z.infer<typeof basicUserSchema> = {
      email,
      role,
    };

    await ConfigService.findOneAndUpdate(
      {}, // empty filter finds the singleton
      { $push: { users: basicNewUser } },
      { new: true }
    );

    return true;
  }),

  removeCredentials: adminProcedure.users.removeCredentials.handler(async ({ input: { email }, errors }) => {
    const result = await ConfigService.findOneAndUpdate(
      {}, // empty filter finds the singleton
      { $pull: { users: { email } } },
      { new: true }
    );

    if (!result) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });

    // Optional: Check if the user was actually removed
    const userStillExists = result.users.some((user) => user.email === email);
    if (userStillExists) throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Credentials not found." } });

    return true;
  }),

  changeRole: adminProcedure.users.changeRole.handler(async ({ input: { email, newRole }, errors }) => {
    const config = await ConfigService.findOne();
    if (!config) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });

    const userIndex = config.users.findIndex((user) => user.email === email);
    if (userIndex === -1) throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Credentials not found." } });

    // biome-ignore lint/style/noNonNullAssertion: verified above ^
    config.users[userIndex]!.role = newRole;
    await config.save();
    return true;
  }),
};
