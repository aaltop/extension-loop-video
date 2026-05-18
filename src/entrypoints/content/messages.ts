/**
 * @file Utilities for working with brower.runtime.sendMessage
 * (sending messages between the content script and the side panel).
 */

import { LogMessage, SyncMessage } from "@/src/typing/messages";

const sendMessage = browser.runtime.sendMessage;

/**
 * Report to the extension that synchronisation may be required due to
 * a change in the browser.
 */
export function sync(event: SyncMessage["event"]) {
  sendMessage<SyncMessage>({
    event,
    data: null,
  });
}

/**
 * Send a message from a content script to a listening part of the extension,
 * intended to be logged by the receiver.
 */
export function log(data: LogMessage["data"]) {
  sendMessage<LogMessage>({
    event: "log",
    data,
  });
}
