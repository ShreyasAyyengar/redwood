"use client";

import { roles } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@redwood/shad-ui/components/dialog";
import { Field, FieldLabel } from "@redwood/shad-ui/components/field";
import { Input } from "@redwood/shad-ui/components/input";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Separator } from "@redwood/shad-ui/components/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@redwood/shad-ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { webClientORPC } from "../../../../lib/orpc-web-client";

export default function UserEditor() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery(webClientORPC.users.getUsers.queryOptions());

  const [newCruzid, setNewCruzid] = useState("");
  const [newRole, setNewRole] = useState<(typeof roles)[number]>("employee");

  const addUserMutation = useMutation(
    webClientORPC.users.addUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(webClientORPC.users.getUsers.queryOptions());
        setNewCruzid("");
      },
    })
  );

  const removeUserMutation = useMutation(
    webClientORPC.users.removeUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(webClientORPC.users.getUsers.queryOptions());
      },
    })
  );

  const changeRoleMutation = useMutation(
    webClientORPC.users.changeRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(webClientORPC.users.getUsers.queryOptions());
      },
    })
  );

  const handleAddUser = () => {
    if (!newCruzid) return;
    addUserMutation.mutate({
      email: `${newCruzid.trim()}@ucsc.edu`,
      role: newRole,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg bg-neutral-900 p-3">
      <div className="flex shrink-0 flex-col items-center">
        <span className="font-bold text-lg text-zinc-100">User Management</span>
        <span className="text-neutral-300 text-sm">Manage user roles and system access</span>
      </div>
      <Separator className="my-5 shrink-0 bg-white/10" />

      <div className="mb-3 rounded-lg border border-white/5 bg-zinc-950/50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Field className="flex-1">
            <FieldLabel className="text-zinc-400">CruzID</FieldLabel>
            <div className="relative">
              <Input
                placeholder="ssammy"
                value={newCruzid}
                onChange={(e) => setNewCruzid(e.target.value)}
                pattern="^[a-zA-Z0-9]+"
                className="border-white/10 bg-zinc-900 pr-24 text-zinc-200 transition-colors focus:border-white/20"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-zinc-500">@ucsc.edu</span>
            </div>
          </Field>

          <Field className="w-full sm:w-[180px]">
            <FieldLabel className="text-zinc-400">Initial Role</FieldLabel>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as (typeof roles)[number])}>
              <SelectTrigger className="w-full border-white/10 bg-zinc-900 text-zinc-200 transition-colors hover:bg-zinc-800">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900 text-zinc-200">
                {roles.map((role) => (
                  <SelectItem key={role} value={role} className="cursor-pointer focus:bg-white/10 focus:text-white">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Button
            onClick={handleAddUser}
            disabled={!newCruzid || addUserMutation.isPending}
            className="w-full bg-white text-black hover:bg-zinc-200 sm:w-auto"
          >
            {addUserMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Add User
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-zinc-950/50">
        <div className="shrink-0 bg-neutral-900">
          <Table>
            <colgroup>
              <col className="w-[300px]" />
              <col />
              <col className="w-[160px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="pl-4 font-semibold text-zinc-400">Email</TableHead>
                <TableHead className="font-semibold text-zinc-400">Role</TableHead>
                <TableHead className="pr-6 text-right font-semibold text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <Table>
            <colgroup>
              <col className="w-[300px]" />
              <col />
              <col className="w-[160px]" />
            </colgroup>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 border-0 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-6 animate-spin" />
                      <span>Fetching users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 border-0 text-center text-zinc-500">
                    No users found in the system.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.email} className="border-white/5 transition-colors hover:bg-white/[0.02]">
                    <TableCell className="py-4 pl-4 font-medium text-zinc-200">{user.email}</TableCell>
                    <TableCell className="py-4">
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) =>
                          changeRoleMutation.mutate({
                            email: user.email,
                            newRole: value as (typeof roles)[number],
                          })
                        }
                        disabled={changeRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px] border-white/10 bg-zinc-900 text-zinc-200 transition-colors hover:bg-zinc-800">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-zinc-900 text-zinc-200">
                          {roles.map((role) => (
                            <SelectItem key={role} value={role} className="cursor-pointer capitalize focus:bg-white/10 focus:text-white">
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-4 pr-8 text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-red-500/10 text-red-500 transition-all hover:bg-red-600/10 hover:text-red-600"
                            disabled={removeUserMutation.isPending}
                          >
                            <Trash2 className="size-4.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-zinc-100">Remove {user.email.split("@")[0]}?</DialogTitle>
                            <DialogDescription className="text-md text-zinc-400">
                              This will remove <span className="font-semibold text-zinc-200">{user.email}</span>'s access to Redwood immediately.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="mt-4">
                            <Button
                              variant="default"
                              className="w-full bg-red-600 font-bold text-white hover:bg-red-900 sm:w-auto"
                              onClick={() => removeUserMutation.mutate({ email: user.email })}
                              disabled={removeUserMutation.isPending}
                            >
                              {removeUserMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                  Removing...
                                </>
                              ) : (
                                "Remove User"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
