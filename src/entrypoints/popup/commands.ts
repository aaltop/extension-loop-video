import { Request, Response } from "@/src/typing/commands";
import { getTabs } from "@/src/extension";

/**
 * Possible command strings to be sent to a content script.
 */
export type CommandString =
  | "video_time"
  | "log_message"
  | "save_data"
  | "load_data"
  | "enable_looping"
  | "disable_looping"
  | "unknown";

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
 * Info needed to create a video (or similar) loop.
 */
export interface LoopInfo {
  startTime: number;
  endTime: number;
}

/**
 * The data retained by the popup.
 */
export interface PopupData extends LoopInfo {}

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
    Response<{ time: number }>
  >;
}
/**
 * Get the current time of a video component that is in the current tab.
 */
async function getVideoTime() {
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
async function logMessage(message: string) {
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
async function saveData(data: PopupData) {
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
async function loadData() {
  return await sendToTab<"load_data">({ command: "load_data", data: null });
}

interface IntervalIdData {
  intervalId: number;
}

export interface CommandRegistry {
  enable_looping: RequestResponsePair<
    Request<"enable_looping", LoopInfo>,
    Response<IntervalIdData>
  >;
}
/**
 * Start looping a video.
 */
async function enableLooping(loopInfo: LoopInfo) {
  return await sendToTab<"enable_looping">({
    command: "enable_looping",
    data: loopInfo,
  });
}

export interface CommandRegistry {
  disable_looping: RequestResponsePair<
    Request<"disable_looping", IntervalIdData>,
    Response<null>
  >;
}
/**
 * Stop looping a video.
 */
async function disableLooping(intervalId: number) {
  return await sendToTab<"disable_looping">({
    command: "disable_looping",
    data: { intervalId },
  });
}

export interface CommandRegistry {
  unknown: RequestResponsePair<Request<"unknown", null>, Response<null>>;
}

/**
 * Holds commands used to communicate with a content script.
 */
export const commands = {
  getVideoTime,
  logMessage,
  saveData,
  loadData,
  enableLooping,
  disableLooping,
};
