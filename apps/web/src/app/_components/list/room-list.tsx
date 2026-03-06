import type { classroomSchema } from "@redwood/contracts";
import type { z } from "zod";
import RoomCard from "./room-card";

export default function RoomList({ data }: { data: z.infer<typeof classroomSchema>[] }) {
  return data.map((room) => <RoomCard key={room._id} room={room} />);
}
