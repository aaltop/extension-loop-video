/**
 * @file Typing for messages.
 */

import z from "zod";

/**
 * Create the schema for a message.
 */
function messageSchema<Event extends z.ZodType, Data extends z.ZodType>(
  event: Event,
  data: Data,
) {
  return z.object({
    event,
    data,
  });
}

/**
 * Schema for {@link SyncMessage}.
 */
export const syncMessageSchema = messageSchema(
  z.union([z.literal("visibilitychange"), z.literal("loaded")]),
  z.null(),
);
/**
 * A message that indicates that synchronisation might be required due to
 * a change in the browser.
 */
export type SyncMessage = z.infer<typeof syncMessageSchema>;

const logLevelSchema = z.union([
  z.literal("DEBUG"),
  z.literal("INFO"),
  z.literal("WARNING"),
  z.literal("ERROR"),
  z.literal("CRITICAL"),
]);

/**
 * Schema for {@link LogMessage}.
 */
export const logMessageSchema = messageSchema(
  z.literal("log"),
  z.object({
    level: logLevelSchema,
    data: z.string(),
  }),
);

/**
 * A message carrying content that is meant to be logged.
 */
export type LogMessage = z.infer<typeof logMessageSchema>;
