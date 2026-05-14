export type MenuView = "actions" | "accounts";

export type AccountProfile = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type DeviceSession = {
  session: {
    token: string;
  };
  user: AccountProfile;
};
