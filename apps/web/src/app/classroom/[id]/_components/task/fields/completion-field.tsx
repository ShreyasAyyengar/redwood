import type { redwoodUserSchema, taskSchema } from "@redwood/contracts";
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
import { type TaskFormValues, useFieldContext } from "../task-form-context";

export default function CompletionField({ existingValue }: { existingValue?: z.infer<typeof taskSchema>["completion"] }) {
  const field = useFieldContext<TaskFormValues["completion"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const { data } = authClientWeb.useSession();
  // biome-ignore lint/style/noNonNullAssertion: user must be logged in to see this page
  const session = data!;

  const isAdmin = session.user.role === "admin";
  const defaultCompletedBy = existingValue?.completedBy ?? session.user.email;

  // completing checkbox toggled
  const [completing, setCompleting] = useState(Boolean(existingValue));

  // local values of the completion
  const [localValue, setLocalValue] = useState<string | undefined>(existingValue?.comment ?? undefined);
  const [selectedCompletedBy, setSelectedCompletedBy] = useState<string>(defaultCompletedBy);
  const [localCompletedAt, setLocalCompletedAt] = useState<Date | undefined>(existingValue?.completedAt ?? new Date());

  const { data: fetchedUsers = [] } = useQuery(
    webClientORPC.users.getUsers.queryOptions({
      enabled: isAdmin,
    })
  );

  useEffect(() => {
    if (existingValue) {
      setLocalValue(existingValue.comment);
      setSelectedCompletedBy(existingValue.completedBy);
      field.handleChange({
        comment: existingValue.comment,
        completedBy: existingValue.completedBy,
        completedAt: existingValue.completedAt,
      });
    }
  }, [existingValue]);

  useEffect(() => {
    if (!completing) field.handleChange(undefined);
    else field.handleChange({ comment: localValue, completedBy: selectedCompletedBy, completedAt: localCompletedAt });
  }, [completing, localValue, selectedCompletedBy, localCompletedAt]);

  return (
    <>
      <div className={cn("flex items-center gap-2")}>
        <Checkbox
          className="h-5 w-5 border border-neutral-400"
          checked={completing}
          onCheckedChange={(checked) => {
            const next = checked === true;
            setCompleting(next);
          }}
        />
        <span>Mark as Completed</span>
      </div>

      {completing && (
        <Field data-invalid={isInvalid}>
          <div className="flex flex-col space-y-1">
            <Textarea
              className="border border-white/30 bg-zinc-950/30 p-3 text-lg"
              placeholder="Describe how it was completed (optional)..."
              value={localValue}
              onChange={(e) => {
                const next = e.target.value;
                setLocalValue(next);
                field.handleChange({
                  comment: next,
                  completedBy: selectedCompletedBy,
                  completedAt: localCompletedAt,
                });
              }}
            />

            {isAdmin ? (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <span>Completed by:</span>
                  <Select
                    value={selectedCompletedBy}
                    onValueChange={(value) => {
                      setSelectedCompletedBy(value);
                      field.handleChange({
                        comment: localValue,
                        completedBy: value,
                        completedAt: localCompletedAt,
                      });
                    }}
                  >
                    <SelectTrigger
                      hasArrow={false}
                      className="inline-flex h-auto! w-auto rounded-md border bg-neutral-900 p-1 text-md! text-muted-foreground text-sm shadow-none focus:ring-0 focus:ring-offset-0"
                    >
                      <SelectValue className="text-2xl">{selectedCompletedBy?.split("@")[0]}</SelectValue>
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
                  <span>Completed on:</span>
                  <Popover>
                    <PopoverTrigger asChild disabled={!isAdmin}>
                      <Button
                        type="button"
                        variant="ghost"
                        data-empty={!localCompletedAt}
                        className="inline-flex h-auto w-auto rounded-md border bg-neutral-900 p-1 text-muted-foreground text-sm shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 data-[empty=true]:text-muted-foreground"
                      >
                        <CalendarDays className="size-4!" />
                        <span>
                          {localCompletedAt
                            ? localCompletedAt.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                            : "Pick a date"}
                        </span>
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localCompletedAt}
                        onSelect={(date) => {
                          setLocalCompletedAt(date);
                          field.handleChange({
                            comment: localValue,
                            completedBy: selectedCompletedBy,
                            completedAt: date,
                          });
                        }}
                        defaultMonth={localCompletedAt}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              existingValue && <div className="text-muted-foreground text-sm">Completed by: {existingValue.completedBy?.split("@")[0]}</div>
            )}
          </div>

          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
      )}
    </>
  );
}
