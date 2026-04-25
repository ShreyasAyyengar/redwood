import type { redwoodUserSchema } from "@redwood/contracts";
import type { z } from "zod";
import { ConfigService } from "../database/config-service";
import { UserService } from "../database/user-service";
import { adminProcedure } from "../libs/orpc-procedures";
import { hasCredentials } from "../util/user-util";

export const userRouter = {
  getUsers: adminProcedure.users.getUsers.handler(async ({ errors }) => {
    const config = await ConfigService.findOne().lean();
    if (!config) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });
    return config.users;
  }),

  addUser: adminProcedure.users.addUser.handler(async ({ input: { email, role }, errors }) => {
    const exists = await hasCredentials(email);

    if (exists) throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Credentials already exist." } });

    const basicNewUser: z.infer<typeof redwoodUserSchema> = {
      email,
      role,
    };

    await ConfigService.findOneAndUpdate(
      {}, // empty filter finds the singleton
      { $push: { users: basicNewUser } },
      { new: true }
    ).lean();

    return true;
  }),

  removeUser: adminProcedure.users.removeUser.handler(async ({ input: { email }, errors }) => {
    const result = await ConfigService.findOneAndUpdate(
      {}, // empty filter finds the singleton
      { $pull: { users: { email } } },
      { new: true }
    ).lean();

    await UserService.deleteOne({ email }).lean();

    if (!result) throw errors.INTERNAL_SERVER_ERROR({ data: { message: "Configuration not found." } });

    // Optional: Check if the user was actually removed
    const userStillExists = result.users.some((user) => user.email === email);
    if (userStillExists) throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Credentials not found." } });

    return true;
  }),

  changeRole: adminProcedure.users.changeRole.handler(async ({ input: { email, newRole }, errors }) => {
    try {
      const config = await ConfigService.findOne({ "users.email": email }).lean();
      if (!config) {
        throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Credentials not found." } });
      }

      const authUser = await UserService.findOne({ email }).lean();
      if (!authUser) {
        throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Credentials not found." } });
      }

      await ConfigService.updateOne({ "users.email": email }, { $set: { "users.$.role": newRole } }).lean();

      await UserService.updateOne({ email }, { $set: { role: newRole } }).lean();

      return true;
    } catch (e) {
      console.error(e);
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};
