/**
 * A message send to a side panel to indicate need for synchronisation due
 * to a change in the document.
 */
export interface SyncMessage {
  event: "visibilitychange" | "loaded";
}
