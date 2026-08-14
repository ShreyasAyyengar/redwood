import { ConvexError } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { env } from "../_generated/server";
import { protectedAction, protectedMutation } from "../lib/procedures.ts";

const maxAttachmentBytes = 24 * 1024 * 1024;
const maxAttachments = 10;
const discordFeedbackColor = 6_189_567;

export const generateFeedbackAttachmentUploadUrls = protectedMutation({
  args: z.object({
    uploadCount: z.number().int().min(0).max(maxAttachments),
  }),
  returns: z.array(z.string()),
  handler: async (ctx, { uploadCount }) => Promise.all(Array.from({ length: uploadCount }, () => ctx.storage.generateUploadUrl())),
});

export const sendFeedback = protectedAction({
  args: z.object({
    description: z.string().trim().min(1),
    attachments: z
      .array(
        z.object({
          storageId: zid("_storage"),
          filename: z.string().trim().min(1).max(255),
        })
      )
      .max(maxAttachments),
  }),
  returns: z.object({
    success: z.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const attachments = await Promise.all(
        args.attachments.map(async (attachment) => {
          const blob = await ctx.storage.get(attachment.storageId);

          if (!blob) {
            throw new ConvexError({
              code: "UNPROCESSABLE_CONTENT",
              message: `Feedback attachment "${attachment.filename}" was not found.`,
            });
          }

          return {
            ...attachment,
            blob,
          };
        })
      );

      const totalAttachmentBytes = attachments.reduce((total, attachment) => total + attachment.blob.size, 0);

      if (totalAttachmentBytes > maxAttachmentBytes) {
        throw new ConvexError({
          code: "UNPROCESSABLE_CONTENT",
          message: "Feedback attachments must not exceed 24 MB total.",
        });
      }

      const formData = new FormData();

      formData.append(
        "payload_json",
        JSON.stringify({
          content: null,
          embeds: [
            {
              title: "New Feedback",
              description: args.description,
              color: discordFeedbackColor,
              footer: {
                text: `- ${ctx.identity.email ?? ctx.identity.subject}`,
              },
            },
          ],
          attachments: attachments.map((attachment, index) => ({
            id: index,
            filename: attachment.filename,
          })),
        })
      );

      attachments.forEach((attachment, index) => {
        formData.append(`files[${index}]`, attachment.blob, attachment.filename);
      });

      const response = await fetch(env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new ConvexError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send feedback. Discord returned ${response.status}.`,
        });
      }

      return { success: true };
    } finally {
      // These are temporary feedback files, so remove them even if Discord fails.
      await Promise.allSettled(args.attachments.map(({ storageId }) => ctx.storage.delete(storageId)));
    }
  },
});
