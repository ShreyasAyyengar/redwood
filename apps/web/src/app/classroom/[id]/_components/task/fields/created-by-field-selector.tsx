import type { basicUserSchema, taskSchema } from "@redwood/contracts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { authClientWeb } from "../../../../../../lib/auth-client-web";
import { webClientORPC } from "../../../../../../lib/orpc-web-client";
import { type FormValues, useFieldContext } from "../task-form";

export default function CreatedByFieldSelector({ existingValue }: { existingValue?: z.infer<typeof taskSchema>["createdBy"] }) {
  const field = useFieldContext<FormValues["createdBy"]>();

  const { data: session } = authClientWeb.useSession();
  const isAdmin = session?.user.role === "admin";
  const [selectedUser, setSelectedUser] = useState<string | undefined>(existingValue);

  const { data: fetchedUsers = [] } = useQuery(
    webClientORPC.users.getUsers.queryOptions({
      input: {},
      enabled: isAdmin,
    })
  );

  return (
    <>
      {isAdmin ? (
        <div className="flex items-center justify-center">
          <Select
            value={selectedUser}
            onValueChange={(value) => {
              setSelectedUser(value);
              field.handleChange(value);
            }}
          >
            <SelectTrigger
              hasArrow={false}
              className="inline-flex h-auto w-auto border bg-transparent px-1 font-semibold text-2xl shadow-none focus:ring-0 focus:ring-offset-0"
            >
              <SelectValue>{selectedUser?.split("@")[0]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {fetchedUsers.map((user: z.infer<typeof basicUserSchema>) => (
                <SelectItem key={user.email} value={user.email} className="border px-2 py-1 text-2xl" hasCheck={false}>
                  {user.email.split("@")[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>&apos;s Task</span>
        </div>
      ) : (
        `${selectedUser?.split("@")[0]}'s Task`
      )}
    </>
  );
}
