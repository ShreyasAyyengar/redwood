import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { z } from "zod";

const MILLISECONDS_PER_MINUTE = 60_000;
const DATE_TIME_LOCAL_LENGTH = 16;

export const hotlineFormSchema = z.object({
  dateOfCall: z.string().min(1, "Choose the date and time of the call."),
  takenBy: z.string().min(1, "Choose who took the call."),
  callerLocation: z.string().trim().min(1, "Enter a caller location."),
  callerIssueDescription: z.string().trim().min(1, "Describe why the caller contacted the hotline."),
  callerIdentifier: z.string().trim().min(1, "Enter a caller ID."),
  department: z.enum(["INSTRUCTION", "EVENTS"]),
  calleeResolution: z.string().trim().min(1, "Describe the resolution given to the caller."),
  hotlineCategory: z.string().min(1, "Choose a hotline category."),
  serviceLocation: z.enum(["ON-SITE", "PHONE"]),
});

export type HotlineFormValues = z.infer<typeof hotlineFormSchema>;
type HotlineFormPreset = Partial<
  Pick<HotlineFormValues, "calleeResolution" | "callerIssueDescription" | "department" | "hotlineCategory" | "serviceLocation">
>;

export const MEDIA_CODE_CATEGORY_LABEL = "Media Code Request";
export const MEDIA_CODE_PRESET = {
  callerIssueDescription: "Media Code Request",
  calleeResolution: "Gave caller media code.",
  department: "INSTRUCTION",
  serviceLocation: "PHONE",
} satisfies HotlineFormPreset;

export function toDateTimeLocalValue(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * MILLISECONDS_PER_MINUTE);
  return localTime.toISOString().slice(0, DATE_TIME_LOCAL_LENGTH);
}

export function getHotlineFormValues(
  existingEntry: Doc<"hotline"> | undefined,
  classrooms: Doc<"classrooms">[],
  currentUserEmail: string
): HotlineFormValues {
  const classroomById = new Map(classrooms.map((classroom) => [classroom._id, classroom]));

  if (existingEntry) {
    return {
      dateOfCall: toDateTimeLocalValue(existingEntry.dateOfCall),
      takenBy: existingEntry.takenBy,
      callerLocation: classroomById.get(existingEntry.callerLocation as Id<"classrooms">)?.displayName ?? existingEntry.callerLocation,
      callerIssueDescription: existingEntry.callerIssueDescription,
      callerIdentifier: existingEntry.callerIdentifier,
      department: existingEntry.department,
      calleeResolution: existingEntry.calleeResolution,
      hotlineCategory: existingEntry.hotlineCategory,
      serviceLocation: existingEntry.serviceLocation,
    };
  }

  return {
    dateOfCall: toDateTimeLocalValue(new Date()),
    takenBy: currentUserEmail,
    callerLocation: "",
    callerIssueDescription: "",
    callerIdentifier: "",
    department: "INSTRUCTION",
    calleeResolution: "",
    hotlineCategory: "",
    serviceLocation: "PHONE",
  };
}

export function serializeHotlineFormValues(values: HotlineFormValues, classrooms: Doc<"classrooms">[]) {
  const matchedClassroom = classrooms.find(
    (classroom) => classroom.displayName.localeCompare(values.callerLocation.trim(), undefined, { sensitivity: "accent" }) === 0
  );

  return {
    dateOfCall: new Date(values.dateOfCall).toISOString(),
    takenBy: values.takenBy,
    callerLocation: matchedClassroom?._id ?? values.callerLocation.trim(),
    callerIssueDescription: values.callerIssueDescription.trim(),
    callerIdentifier: values.callerIdentifier.trim(),
    department: values.department,
    calleeResolution: values.calleeResolution.trim(),
    hotlineCategory: values.hotlineCategory as Id<"hotlineCategories">,
    serviceLocation: values.serviceLocation,
  };
}
