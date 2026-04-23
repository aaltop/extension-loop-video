/**
 * Commands for communicating with the content script.
 */

import { Request, Response } from "@/src/typing/commands";
import { getTabs } from "@/src/extension";
import { LoopableInfo, DomainData, URLData, LoopInfo } from "@/src/typing/data";

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
 * Possible command strings to be sent to a content script.
 */
export type CommandString =
  | "video_time"
  | "log_message"
  | "save_data"
  | "load_data"
  | "load_domain_data"
  | "delete_domain_data"
  | "delete_domain_url_data"
  | "upgrade_domain_data"
  | "download_data"
  | "load_data_from_file"
  | "enable_looping"
  | "disable_looping"
  | "element_list_length"
  | "highlight_elements"
  | "get_loop_ids"
  | "unknown";

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
    Request<"video_time", LoopableInfo>,
    Response<{ time: number }>
  >;
}
/**
 * Get the current time of a video element that is in the current tab.
 */
async function getVideoTime(data: LoopableInfo) {
  return await sendToTab<"video_time">({
    command: "video_time",
    data,
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
  save_data: RequestResponsePair<Request<"save_data", URLData>, Response<null>>;
}
/**
 * Save the passed data.
 */
async function saveData(data: URLData) {
  return await sendToTab<"save_data">({ command: "save_data", data });
}

export interface CommandRegistry {
  load_data: RequestResponsePair<Request<"load_data", null>, Response<URLData>>;
}
/**
 * Load data for the current URL.
 */
async function loadData() {
  return await sendToTab<"load_data">({ command: "load_data", data: null });
}

export interface CommandRegistry {
  load_domain_data: RequestResponsePair<
    Request<"load_domain_data", null>,
    Response<DomainData>
  >;
}

async function loadDomainData() {
  return await sendToTab<"load_domain_data">({
    command: "load_domain_data",
    data: null,
  });
}

export interface CommandRegistry {
  delete_domain_data: RequestResponsePair<
    Request<"delete_domain_data", null>,
    Response<null>
  >;
}

/**
 * Delete all the data for this domain from storage.
 */
async function deleteDomainData() {
  return await sendToTab<"delete_domain_data">({
    command: "delete_domain_data",
    data: null,
  });
}

export interface CommandRegistry {
  delete_domain_url_data: RequestResponsePair<
    Request<"delete_domain_url_data", { urls: string[] }>,
    Response<null>
  >;
}

/**
 * Delete the data of this domain related to the passed urls.
 */
async function deleteDomainUrlData(data: { urls: string[] }) {
  return await sendToTab<"delete_domain_url_data">({
    command: "delete_domain_url_data",
    data,
  });
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
    Request<"disable_looping", null>,
    Response<null>
  >;
}
/**
 * Stop looping a video.
 */
async function disableLooping() {
  return await sendToTab<"disable_looping">({
    command: "disable_looping",
    data: null,
  });
}

export interface CommandRegistry {
  unknown: RequestResponsePair<Request<"unknown", null>, Response<null>>;
}

interface ChooseVideoArgs extends Pick<LoopableInfo, "selectors"> {}
export interface CommandRegistry {
  element_list_length: RequestResponsePair<
    Request<"element_list_length", ChooseVideoArgs>,
    Response<{ length: number }>
  >;
}

/**
 * Check the length of a given list of elements.
 */
async function elementListLength(data: ChooseVideoArgs) {
  return await sendToTab<"element_list_length">({
    command: "element_list_length",
    data,
  });
}

interface HighlightComponentArgs extends Pick<LoopableInfo, "selectors"> {
  indices: number[];
}
export interface CommandRegistry {
  highlight_elements: RequestResponsePair<
    Request<"highlight_elements", HighlightComponentArgs>,
    Response<{ invalidIndices: number[] }>
  >;
}
/**
 * Highlight elements based on the query selector and the given indices.
 * See `elementListLength()` for querying the length of a list of elements.
 */
async function highlightElements(data: HighlightComponentArgs) {
  return await sendToTab<"highlight_elements">({
    command: "highlight_elements",
    data,
  });
}

export interface CommandRegistry {
  download_data: RequestResponsePair<
    Request<"download_data", null>,
    Response<{ filename: string }>
  >;
}
/**
 * Download the data for this domain.
 */
async function downloadData() {
  return await sendToTab<"download_data">({
    command: "download_data",
    data: null,
  });
}

export interface CommandRegistry {
  load_data_from_file: RequestResponsePair<
    Request<"load_data_from_file", null>,
    Response<null>
  >;
}

/**
 * Start the process of downloading data from file.
 */
async function loadDataFromFile() {
  return await sendToTab<"load_data_from_file">({
    command: "load_data_from_file",
    data: null,
  });
}

export interface CommandRegistry {
  upgrade_domain_data: RequestResponsePair<
    Request<"upgrade_domain_data", null>,
    Response<null>
  >;
}

/**
 * Migrate the domain data that is in storage to the most up-to-date version.
 */
async function upgradeDomainData() {
  return await sendToTab<"upgrade_domain_data">({
    command: "upgrade_domain_data",
    data: null,
  });
}

export interface CommandRegistry {
  get_loop_ids: RequestResponsePair<
    Request<"get_loop_ids", null>,
    Response<{ loopIds: number[] }>
  >;
}

/**
 * Get the current loop interval ids.
 */
async function getLoopIds() {
  return await sendToTab<"get_loop_ids">({
    command: "get_loop_ids",
    data: null,
  });
}

/**
 * Holds commands used to communicate with a content script.
 */
export const commands = {
  getVideoTime,
  logMessage,
  saveData,
  loadData,
  loadDomainData,
  deleteDomainData,
  deleteDomainUrlData,
  upgradeDomainData,
  enableLooping,
  disableLooping,
  getLoopIds,
  elementListLength,
  highlightElements,
  downloadData,
  loadDataFromFile,
};
