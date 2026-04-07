import type { basicUserSchema, issueSchema } from "@redwood/contracts";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Field, FieldError } from "@redwood/shad-ui/components/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { authClientWeb } from "../../../../../../lib/auth-client-web";
import { webClientORPC } from "../../../../../../lib/orpc-web-client";
import { type FormValues, useFieldContext } from "../issue-form";

export default function ResolutionField({ existingValue }: { existingValue?: z.infer<typeof issueSchema>["resolution"] }) {
  const field = useFieldContext<FormValues["resolution"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const { data: session } = authClientWeb.useSession();
  const isAdmin = session?.user.role === "admin";

  const defaultResolvedBy = existingValue?.resolvedBy ?? field.state.value?.resolvedBy ?? session?.user.email;

  // resolving checkbox toggled
  const [resolving, setResolving] = useState(Boolean(existingValue?.comment ?? field.state.value?.comment));

  // local values of the resolution
  const [localValue, setLocalValue] = useState(existingValue?.comment ?? field.state.value?.comment ?? "");
  const [selectedResolvedBy, setSelectedResolvedBy] = useState<string | undefined>(defaultResolvedBy);

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
      });
    }
  }, [existingValue]);

  useEffect(() => {
    if (!resolving) field.handleChange(undefined);
    else field.handleChange({ comment: localValue, resolvedBy: selectedResolvedBy });
  }, [resolving, localValue, selectedResolvedBy]);

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
                });
              }}
            />

            {isAdmin ? (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <span>Resolved by:</span>
                <Select
                  value={selectedResolvedBy}
                  onValueChange={(value) => {
                    setSelectedResolvedBy(value);
                    field.handleChange({
                      comment: localValue,
                      resolvedBy: value,
                    });
                  }}
                >
                  <SelectTrigger
                    hasArrow={false}
                    className="inline-flex h-auto w-auto border bg-transparent px-1 text-muted-foreground text-sm shadow-none focus:ring-0 focus:ring-offset-0"
                  >
                    <SelectValue>{selectedResolvedBy?.split("@")[0]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {fetchedUsers.map((user: z.infer<typeof basicUserSchema>) => (
                      <SelectItem key={user.email} value={user.email} className="border px-2 py-1 text-sm" hasCheck={false}>
                        {user.email.split("@")[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
