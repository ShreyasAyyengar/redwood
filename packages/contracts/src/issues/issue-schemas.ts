import z from "zod";

export const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "video/mp4", "video/quicktime"] as const;

export const fileUploadSchema = z.object({
  id: z.uuid(),
  file: z.file("Invalid file."),
  mimeType: z.enum(VALID_MIME_TYPES, "Invalid file type."),
});

// TODO if issue has no resolution, cannot edit resolution in payload, must resolve first
// anyone can edit the issue, and can edit the resolution if it exists
// show: created by, resolved by, last edited by

export const uploadPhotoInput = z.object({
  id: z.uuidv7(),
  file: z.file("Invalid file."),
});

// Valid MIME types for uploaded files: JPEG, PNG, WebP, GIF, AVIF, TIFF and SVG
export const VALID_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/tiff",
  "image/svg+xml",
] as const;

export const commonAdminNotesSchema = z.enum(["Escalated to MSE"]);

const issueDetailsSchema = z.object({
  reportedBy: z.email("Issue reportedBy must be provided."),
  reportedAt: z.coerce.date("Issue reportedAt must be provided"),
  description: z.string("Issue description must be provided").min(1, "Issue description must be provided"),
  sodId: z.string().optional(),
  cruzfixId: z.string().optional(),
  urgent: z.boolean(),
  supervisorNeeded: z.boolean(),
});

const issueEditSchema = z.object({
  editedBy: z.email("Issue edited.editedBy must be provided"),
  editDate: z.coerce.date("Issue edited.editDate must be provided"),
});

const issueResolutionSchema = z.object({
  resolvedBy: z.email("Issue resolution.resolvedBy must be provided"),
  resolvedAt: z.coerce.date("Issue resolution.resolvedAt must be provided"),
  comment: z.string("Issue resolution.comment must be provided"),
});

// DB Schema - The complete object as stored in the database
export const issueSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  createdBy: z.email(), // non-editable
  createdAt: z.coerce.date(), // non-editable

  issue: issueDetailsSchema,
  edited: issueEditSchema.optional(),
  resolution: issueResolutionSchema.optional(),

  adminNotes: z.array(z.union([commonAdminNotesSchema, z.string()])),
  files: z.array(z.uuid()).optional(),
});

export const uiIssueFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  urgent: z.boolean().default(false),
  supervisorNeeded: z.boolean().default(false),
  cruzfixId: z.string().optional(),
  sodId: z.string().optional(),

  // edit-specific fields
  reportedBy: z.email().optional(),
  reportedAt: z.coerce.date().optional(),

  resolution: z
    .object({
      comment: z.string().min(1, "Issue resolution.comment must be provided"),
      resolvedBy: z.email(),
    })
    .optional(),
  adminNotes: z.array(z.string()).optional(),
});
