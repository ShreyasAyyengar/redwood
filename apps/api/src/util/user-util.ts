import { ConfigService } from "../database/config-service";

export async function hasCredentials(email: string): Promise<boolean> {
  const isInConfig = await ConfigService.findOne({ "users.email": email });
  return !!isInConfig;
}
