import * as z from "zod";

/**
 * A message send to a side panel to indicate need for synchronisation due
 * to a change in the document.
 */
// export interface SyncMessage {
//   event: "visibilitychange" | "loaded";
// }

export const syncMessageSchema = z.object({
  event: z.union([z.literal("visibilitychange"), z.literal("loaded")]),
});

export type SyncMessage = z.infer<typeof syncMessageSchema>;
