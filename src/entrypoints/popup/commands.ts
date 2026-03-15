import { Request, Response } from "@/src/typing/commands";
import { getTabs } from "@/src/extension";

/**
 * Possible command strings to be sent to a content script.
 */
export type CommandString =
  | "video_time"
  | "log_message"
  | "save_data"
  | "load_data";

/**
 * A request-response pair.
 */
export interface RequestResponsePair<
  Req extends Request<CommandString, object | null>,
  Res extends Response<object | null>,
> {
  request: Req;
  response: Res;
}

/**
 * The data retained by the popup.
 */
export type PopupData = {
  count: number;
};

/**
 * Set of request-response pairs representing communication to and from
 * a content-script.
 */
export interface CommandRegistry {}

/**
 * Union of possible request-response pairs received and sent by a
 * content script.
 */
export type CommandUnion = {
  [K in keyof CommandRegistry]: CommandRegistry[K];
}[keyof CommandRegistry];

/**
 * Send message to content script.
 */
async function sendToTab<K extends keyof CommandRegistry>(
  request: CommandRegistry[K]["request"],
): Promise<CommandRegistry[K]["response"]> {
  try {
    const tabs = await getTabs();
    const tabId = tabs[0].id;
    if (tabId !== undefined) {
      const response = await browser.tabs.sendMessage(tabId, request);
      return response;
    }
  } catch (error) {
    if (Error.isError(error)) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  return {
    success: false,
    message: "sendToTab: Unknown error occurred",
  };
}

export interface CommandRegistry {
  video_time: RequestResponsePair<
    Request<"video_time", null>,
    Response<{ time: number | null }>
  >;
}
/**
 * Get the current time of a video component that is in the current tab.
 */
export async function getVideoTime() {
  return await sendToTab<"video_time">({
    command: "video_time",
    data: null,
  });
}

export interface CommandRegistry {
  log_message: RequestResponsePair<
    Request<"log_message", { message: string }>,
    Response<null>
  >;
}
/**
 * Send a message to a content script to be logged to console.
 * @param message The message to log.
 */
export async function logMessage(message: string) {
  return await sendToTab<"log_message">({
    command: "log_message",
    data: { message },
  });
}

export interface CommandRegistry {
  save_data: RequestResponsePair<
    Request<"save_data", PopupData>,
    Response<null>
  >;
}
/**
 * Save the passed data.
 */
export async function saveData(data: PopupData) {
  return await sendToTab<"save_data">({ command: "save_data", data });
}

export interface CommandRegistry {
  load_data: RequestResponsePair<
    Request<"load_data", null>,
    Response<PopupData>
  >;
}
/**
 * Load popup data.
 */
export async function loadData() {
  return await sendToTab<"load_data">({ command: "load_data", data: null });
}
