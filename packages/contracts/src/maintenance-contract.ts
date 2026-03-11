import { oc } from "@orpc/contract";
import { z } from "zod";
import { classroomSchema } from "./classroom-contract";

export const commonAdminNotesSchema = z.enum(["Escalated to MSE"]);

export const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "video/mp4", "video/quicktime"] as const;

export const fileUploadSchema = z.object({
  id: z.uuid(),
  file: z.file("Invalid file."),
  mimeType: z.enum(VALID_MIME_TYPES, "Invalid file type."),
});

// TODO if issue has no resolution, cannot edit resolution in payload, must resolve first
// anyone can edit the issue, and can edit the resolution if it exists
// show: created by, resolved by, last edited byi

export const issueSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  issue: z.object({
    reportedBy: z.email(),
    description: z.string(),
    sodEntered: z.boolean().optional(),
    cruzfixId: z.string().optional(),
    urgent: z.boolean(),
    supervisorNeeded: z.boolean(),
    issueDate: z.coerce.date(),
  }),

  edited: z
    .object({
      editedBy: z.email(),
      editDate: z.coerce.date(),
    })
    .optional(),

  resolution: z
    .object({
      resolvedBy: z.email().optional(),
      comment: z.string().optional(),
      resolutionDate: z.coerce.date().optional(),
    })
    .optional(),

  adminNotes: z.array(z.union([commonAdminNotesSchema, z.string()])),
  files: z.array(z.uuid()).optional(), // UUIDs of uploaded files to R2
});

export const taskSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  task: z.object({
    createdBy: z.email(),
    createdAt: z.coerce.date(),
    description: z.string(),
    urgent: z.boolean(),
    visibleAt: z.coerce.date().optional(),
    completeBy: z.coerce.date().optional(),
  }),

  edited: z
    .object({
      editedBy: z.email(),
      editDate: z.coerce.date(),
    })
    .optional(),

  completion: z
    .object({
      completedBy: z.email().optional(),
      comment: z.string().optional(),
      completionDate: z.coerce.date().optional(),
    })
    .optional(),
});

export const maintenanceEntrySchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),
  date: z.coerce.date(),
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
  equipmentChecked: z.boolean(), // TODO maybe expand this into fields for each piece of equipment
});

export const maintenanceFormSchema = maintenanceEntrySchema.omit({ _id: true, completedBy: true, classroomId: true });

export const maintenanceContract = {
  addMaintenanceEntry: oc
    .route({
      method: "POST",
    })
    .input(maintenanceEntrySchema.omit({ _id: true, completedBy: true }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getHistory: oc
    .route({
      method: "GET",
    })
    .input(maintenanceEntrySchema.pick({ classroomId: true }))
    .output(z.array(maintenanceEntrySchema))
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  addIssue: oc
    .route({
      method: "POST",
    })
    .input(issueSchema.pick({ classroomId: true, issue: true }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  deleteIssue: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ issueId: issueSchema.shape._id }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  editIssue: oc
    .route({
      method: "PUT",
    })
    .input(issueSchema.omit({ classroomId: true }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  resolveIssue: oc
    .route({
      method: "PUT",
    })
    .input(issueSchema.pick({ _id: true, resolution: true }))
    .output(z.boolean())
    .errors({
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getIssues: oc
    .route({
      method: "GET",
    })
    .input(z.object({ classroomId: classroomSchema.shape._id }))
    .output(z.array(issueSchema))
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  addTask: oc
    .route({
      method: "POST",
    })
    .input(taskSchema.omit({ _id: true }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  deleteTask: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ taskId: taskSchema.shape._id }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  editTask: oc
    .route({
      method: "PUT",
    })
    .input(taskSchema.omit({ _id: true }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  resolveTask: oc
    .route({
      method: "PUT",
    })
    .input(taskSchema.pick({ _id: true, completion: true }))
    .output(z.boolean())
    .errors({
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getTasks: oc
    .route({
      method: "GET",
    })
    .input(taskSchema.pick({ classroomId: true }))
    .output(z.array(taskSchema))
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
