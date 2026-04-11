import type { redwoodUserSchema, issueSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Field, FieldError } from "@redwood/shad-ui/components/field";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { authClientWeb } from "../../../../../../lib/auth-client-web";
import { webClientORPC } from "../../../../../../lib/orpc-web-client";
import { type FormValues, useFieldContext } from "../issue-form";

export default function ResolutionField({ existingValue }: { existingValue?: z.infer<typeof issueSchema>["resolution"] }) {
  const field = useFieldContext<FormValues["resolution"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const { data } = authClientWeb.useSession();
  // biome-ignore lint/style/noNonNullAssertion: user must be logged in to see this page
  const session = data!;

  const isAdmin = session.user.role === "admin";
  const defaultResolvedBy = existingValue?.resolvedBy ?? session.user.email;

  // resolving checkbox toggled
  const [resolving, setResolving] = useState(Boolean(existingValue?.comment ?? field.state.value?.comment));

  // local values of the resolution
  const [localValue, setLocalValue] = useState(existingValue?.comment ?? "");
  const [selectedResolvedBy, setSelectedResolvedBy] = useState<string>(defaultResolvedBy);
  const [localResolvedAt, setLocalResolvedAt] = useState<Date | undefined>(existingValue?.resolvedAt ?? new Date());

  const { data: fetchedUsers = [] } = useQuery(
    webClientORPC.users.getUsers.queryOptions({
      input: {},
      enabled: isAdmin,
    })
  );

  useEffect(() => {
    if (existingValue) {
      setLocalValue(existingValue.comment);
      setSelectedResolvedBy(existingValue.resolvedBy);
      field.handleChange({
        comment: existingValue.comment,
        resolvedBy: existingValue.resolvedBy,
        resolvedAt: existingValue.resolvedAt,
      });
    }
  }, [existingValue]);

  useEffect(() => {
    if (!resolving) field.handleChange(undefined);
    else field.handleChange({ comment: localValue, resolvedBy: selectedResolvedBy, resolvedAt: localResolvedAt });
  }, [resolving, localValue, selectedResolvedBy, localResolvedAt]);

  return (
    <>
      <div className={cn("flex items-center gap-2")}>
        <Checkbox
          className="h-5 w-5 border border-neutral-400"
          checked={resolving}
          onCheckedChange={(checked) => {
            const next = checked === true;
            setResolving(next);
          }}
        />
        <span>Mark as Resolved</span>
      </div>

      {resolving && (
        <Field data-invalid={isInvalid}>
          <div className="flex flex-col space-y-1">
            <Textarea
              className="border border-white/30 bg-zinc-950/30 p-3 text-lg"
              placeholder="Describe how it was resolved..."
              value={localValue}
              onChange={(e) => {
                const next = e.target.value;
                setLocalValue(next);
                field.handleChange({
                  comment: next,
                  resolvedBy: selectedResolvedBy,
                  resolvedAt: localResolvedAt,
                });
              }}
            />

            {isAdmin ? (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <span>Resolved by:</span>
                  <Select
                    value={selectedResolvedBy}
                    onValueChange={(value) => {
                      setSelectedResolvedBy(value);
                      field.handleChange({
                        comment: localValue,
                        resolvedBy: value,
                        resolvedAt: localResolvedAt,
                      });
                    }}
                  >
                    <SelectTrigger
                      hasArrow={false}
                      className="inline-flex h-auto! w-auto rounded-md border bg-neutral-900 p-1 text-md! text-muted-foreground text-sm shadow-none focus:ring-0 focus:ring-offset-0"
                    >
                      <SelectValue className="text-2xl">{selectedResolvedBy?.split("@")[0]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {fetchedUsers.map((user: z.infer<typeof redwoodUserSchema>) => (
                        <SelectItem key={user.email} value={user.email} className="border px-2 py-1 text-sm" hasCheck={false}>
                          {user.email.split("@")[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <span>Resolved on:</span>
                  <Popover>
                    <PopoverTrigger asChild disabled={!isAdmin}>
                      <Button
                        type="button"
                        variant="ghost"
                        data-empty={!localResolvedAt}
                        className="inline-flex h-auto w-auto rounded-md border bg-neutral-900 p-1 text-muted-foreground text-sm shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[empty=true]:text-muted-foreground"
                      >
                        <CalendarDays className="h-4! w-4!" />
                        <span>{localResolvedAt ? localResolvedAt.toLocaleDateString() : "Pick a date"}</span>
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localResolvedAt}
                        onSelect={(date) => {
                          setLocalResolvedAt(date);
                          field.handleChange({
                            comment: localValue,
                            resolvedBy: selectedResolvedBy,
                            resolvedAt: date,
                          });
                        }}
                        defaultMonth={localResolvedAt}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              existingValue && <div className="text-muted-foreground text-sm">Resolved by: {existingValue.resolvedBy?.split("@")[0]}</div>
            )}
          </div>

          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
      )}
    </>
  );
}
