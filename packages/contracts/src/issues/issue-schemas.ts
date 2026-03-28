import z from "zod";

export const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "video/mp4", "video/quicktime"] as const;

export const fileUploadSchema = z.object({
  id: z.uuid(),
  file: z.file("Invalid file."),
  mimeType: z.enum(VALID_MIME_TYPES, "Invalid file type."),
});

// TODO if issue has no resolution, cannot edit resolution in payload, must resolve first
// anyone can edit the issue, and can edit the resolution if it exists
// show: created by, resolved by, last edited byi

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

// DB Schema - The complete object as stored in the database
export const issueSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),
  issue: z.object({
    reportedBy: z.email(),
    description: z.string().min(1),
    sodId: z.string().optional(),
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
  files: z.array(z.uuid()).optional(),
});

// Form Schema - What the user fills out in the form
export const issueFormSchema = z.object({
  issue: z.object({
    description: z.string().min(1, "Issue description is required."),
    urgent: z.boolean(),
    supervisorNeeded: z.boolean(),
    issueDate: z.coerce.date(),
    cruzfixId: z.string().optional(),
    sodId: z.string().optional(),
  }),
});

// Create Request Schema - HTTP request body when creating a new issue
export const createIssueRequestSchema = issueFormSchema.extend({
  classroomId: z.uuidv7(),
});

// Update Request Schema - HTTP request body when updating an issue
export const updateIssueRequestSchema = z.object({
  _id: z.uuidv7(),
  issue: issueSchema.shape.issue.partial(),
  // Allow partial updates to issue fields
  adminNotes: z.array(z.union([commonAdminNotesSchema, z.string()])).optional(),
  resolution: issueSchema.shape.resolution.optional(),
  files: z.array(z.uuid()).optional(),
});
