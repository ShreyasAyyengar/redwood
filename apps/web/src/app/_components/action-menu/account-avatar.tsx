import { Avatar, AvatarFallback, AvatarImage } from "@redwood/shad-ui/components/avatar";
import type { AccountProfile } from "./types";

const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.slice(0, 2).toUpperCase() ?? "RW";
};

type AccountAvatarProps = {
  account: AccountProfile;
  imageAlt: string;
};

export function AccountAvatar({ account, imageAlt }: AccountAvatarProps) {
  return (
    <Avatar className="size-full">
      {account.image && <AvatarImage src={account.image} alt={imageAlt} />}
      <AvatarFallback className="bg-zinc-700 font-bold text-white text-xs">{getInitials(account.name, account.email)}</AvatarFallback>
    </Avatar>
  );
}
