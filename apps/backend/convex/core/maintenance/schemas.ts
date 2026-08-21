import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

export const maintenanceEntrySchema = z.object({
  classroomId: zid("classrooms"),
  date: z.iso.datetime(),
  completedBy: z.email(),
  microphone: z
    .object({
      batteryStripe: z.enum(["Yes", "Re-applied", "No, task created for completion", "No, issue preventing completion"], "Invalid status"),
      chargerStripe: z.enum(["Yes", "Re-applied", "No, task created for completion", "No, issue preventing completion"], "Invalid status"),
      transmitterStripe: z.enum(["Yes", "Re-applied", "No, task created for completion", "No, issue preventing completion"], "Invalid status"),
      aldBatteriesCharged: z.enum(
        ["Yes", "Battery replaced", "Found dead, now re-charging", "No, task created for completion", "No, issue preventing completion"],
        "Invalid status"
      ),
      windscreenSecure: z.enum(["Yes", "Re-applied", "No, task created for completion", "No, issue preventing completion"], "Invalid status"),
      clipInstalled: z.enum(["Yes", "Re-applied", "No, task created for completion", "No, issue preventing completion"], "Invalid status"),
    })
    .optional(),
  dten: z
    .object({
      licenced: z.enum(["Yes", "Re-licensed", "No, task created for completion", "No, issue preventing completion"]),
      signPresent: z.enum(["Yes", "No, task created for completion"]),
      microphoneWorking: z.enum(["Yes", "No, task created for completion", "No, issue preventing completion"]),
      speakerWorking: z.enum(["Yes", "No, task created for completion", "No, issue preventing completion"]),
      screenWiped: z.enum(["Yes", "No, task created for completion", "No, issue preventing completion"]),
    })
    .optional(),

  surfacesWiped: z.boolean(),
  equipmentChecked: z.boolean(),
});

export const maintenanceFormSchema = maintenanceEntrySchema.omit({ completedBy: true, classroomId: true });
