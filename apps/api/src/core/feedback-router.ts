import { env } from "../env";
import { protectedProcedure } from "../libs/orpc-procedures";

// biome-ignore lint/style/noMagicNumbers: Discord upload limits are enforced in binary megabytes.
const maxAttachmentBytes = 24 * 1024 * 1024;
const discordFeedbackColor = 6_189_567;

export const feedbackRouter = {
  sendFeedback: protectedProcedure.feedback.sendFeedback.handler(async ({ input, errors: { INTERNAL_SERVER_ERROR }, context }) => {
    const totalAttachmentBytes = input.attachments.reduce((total, attachment) => total + attachment.size, 0);

    if (totalAttachmentBytes > maxAttachmentBytes) {
      throw INTERNAL_SERVER_ERROR({
        data: { message: "Feedback attachments must not exceed 24 MB total." },
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
            description: input.description,
            color: discordFeedbackColor,
            footer: {
              text: `- ${context.user.email}`,
            },
          },
        ],
        attachments: input.attachments.map((attachment, index) => ({
          id: index,
          filename: attachment.name,
        })),
      })
    );

    for (const [index, attachment] of input.attachments.entries()) {
      formData.append(`files[${index}]`, attachment, attachment.name);
    }

    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw INTERNAL_SERVER_ERROR({
        data: { message: `Failed to send feedback. Discord returned ${response.status}.` },
      });
    }

    return { success: true };
  }),
};
