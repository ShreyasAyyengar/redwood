import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { Field, FieldLabel } from "@redwood/shad-ui/components/field";
import { Input } from "@redwood/shad-ui/components/input";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@redwood/shad-ui/components/multi-select";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ClassroomSummary } from "../../model/classroom-types";

type Room = ClassroomSummary;
type Attribute = Doc<"attributes">;
type Captioning = NonNullable<Room["captioning"]>;

const defaultCaptioning: Captioning = {
  isCaptioningThisQuarter: false,
  type: "DTEN",
  identifier: "",
};

export function RoomSettingsDialog({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  const [groupKey, setGroupKey] = useState(room.groupKey);
  const [attributeIds, setAttributeIds] = useState<string[]>(room.attributes);
  const [captioning, setCaptioning] = useState<Captioning>(room.captioning ?? defaultCaptioning);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  const attributes = useQuery(api.core.attributes.service.getAllAttributes, open ? {} : "skip");
  const groups = useQuery(api.core.groups.service.getGroups, open ? {} : "skip");
  const updateRoom = useMutation(api.core.classrooms.service.updateRoomMetadata);

  const groupOptions = useMemo(() => {
    const labels = groups?.map((group) => group.label) ?? [];
    return Array.from(new Set(["Ungrouped", ...labels]));
  }, [groups]);

  useEffect(() => {
    if (!open) return;
    setGroupKey(room.groupKey);
    setAttributeIds(room.attributes);
    setCaptioning(room.captioning ?? defaultCaptioning);
  }, [open, room]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const identifier = captioning.identifier.trim();
    const shouldSaveCaptioning = room.captioning !== undefined || captioning.isCaptioningThisQuarter || identifier.length > 0;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateRoom({
        classroomId: room._id,
        metadata: {
          groupKey,
          attributes: attributeIds as Id<"attributes">[],
          ...(shouldSaveCaptioning
            ? {
                captioning: {
                  ...captioning,
                  identifier,
                },
              }
            : {}),
        },
      });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error : new Error("Unable to save room settings."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Room settings" title="Room settings" className="text-zinc-400 hover:bg-zinc-900">
          <Settings className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-zinc-800">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
              Room Settings
              <p className="mt-2 text-sm uppercase tracking-widest">{room.displayName}</p>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
            <div className="my-2 flex flex-col gap-5 px-1">
              <section className="space-y-3">
                <h2 className="font-semibold text-lg">Attributes</h2>
                <Field>
                  <FieldLabel className="font-semibold text-sm">Room Attributes</FieldLabel>
                  <MultiSelect values={attributeIds} onValuesChange={setAttributeIds}>
                    <MultiSelectTrigger className="w-full bg-zinc-950/40">
                      <MultiSelectValue placeholder="Select attributes" overflowBehavior="cutoff" />
                    </MultiSelectTrigger>
                    <MultiSelectContent search={{ placeholder: "Search attributes...", emptyMessage: "No attributes found." }}>
                      <MultiSelectGroup>
                        {attributes?.map((attribute) => (
                          <MultiSelectItem
                            key={attribute._id}
                            value={attribute._id}
                            badgeLabel={<AttributeLabel attribute={attribute} compact />}
                          >
                            <AttributeLabel attribute={attribute} />
                          </MultiSelectItem>
                        ))}
                      </MultiSelectGroup>
                    </MultiSelectContent>
                  </MultiSelect>
                </Field>
              </section>

              <Separator className="bg-zinc-700" />

              <section className="space-y-3">
                <h2 className="font-semibold text-lg">Group</h2>
                <Field>
                  <FieldLabel className="font-semibold text-sm">Classroom Group</FieldLabel>
                  <Select value={groupKey} onValueChange={setGroupKey}>
                    <SelectTrigger className="w-full bg-zinc-950/40">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </section>

              <Separator className="bg-zinc-700" />

              <section className="space-y-3">
                <h2 className="font-semibold text-lg">Captioning</h2>
                <Field orientation="horizontal" className="items-center rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                  <Checkbox
                    id="captioning-active"
                    checked={captioning.isCaptioningThisQuarter}
                    onCheckedChange={(checked) => setCaptioning((current) => ({ ...current, isCaptioningThisQuarter: checked === true }))}
                  />
                  <FieldLabel htmlFor="captioning-active" className="font-medium text-sm">
                    Captioning this quarter
                  </FieldLabel>
                </Field>

                <div className={cn("grid gap-4 transition-opacity sm:grid-cols-2", !captioning.isCaptioningThisQuarter && "opacity-50")}>
                  <Field>
                    <FieldLabel className="font-semibold text-sm">Device Type</FieldLabel>
                    <Select
                      value={captioning.type}
                      onValueChange={(type) => setCaptioning((current) => ({ ...current, type: type as Captioning["type"] }))}
                    >
                      <SelectTrigger className="w-full bg-zinc-950/40">
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DTEN">DTEN</SelectItem>
                        <SelectItem value="MAC">MAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="captioning-identifier" className="font-semibold text-sm">
                      {captioning.type === "MAC" ? "MAC IP Address" : "DTEN Name"}
                    </FieldLabel>
                    <Input
                      id="captioning-identifier"
                      value={captioning.identifier}
                      onChange={(event) => setCaptioning((current) => ({ ...current, identifier: event.target.value }))}
                      className="border-zinc-700 bg-zinc-950/40"
                      autoComplete="off"
                      placeholder={captioning.type === "MAC" ? "Ex. 192.168.1.100" : "Ex. SocSci-1-149-DTEN"}
                    />
                  </Field>
                </div>
              </section>

              {saveError && <p className="text-red-300 text-sm">{saveError.message}</p>}
            </div>
          </ScrollArea>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AttributeLabel({ attribute, compact = false }: { attribute: Attribute; compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: attribute.color }} />
      <span className={cn("min-w-0 truncate", compact && "max-w-32")}>{attribute.label}</span>
    </span>
  );
}
