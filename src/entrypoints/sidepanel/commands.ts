/**
 * Commands for communicating with the content script.
 */

import * as z from "zod";

import {
  parseAndReturnResponse,
  Request,
  requestSchema,
  Response,
  responseSchema,
} from "@/src/typing/commands";
import { getTabs } from "@/src/extension";
import {
  LoopableInfo,
  URLData,
  LoopInfo,
  urlDataSchema,
  domainDataV1Schema,
  loopableInfoSchema,
  loopInfoSchema,
} from "@/src/typing/data";

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
  | "get_media_element_list"
  | "highlight_elements"
  | "get_loop_ids"
  | "unknown";

/**
 * Set of request-response pairs representing communication to and from
 * a content-script.
 */
// this is filled later on in the file, create the doc-comment here though
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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

const videoTimeRequestSchema = requestSchema(
  z.literal("video_time"),
  loopableInfoSchema,
);
const videoTimeResponseSchema = responseSchema(z.object({ time: z.number() }));
export interface CommandRegistry {
  video_time: RequestResponsePair<
    z.infer<typeof videoTimeRequestSchema>,
    z.infer<typeof videoTimeResponseSchema>
  >;
}
/**
 * Get the current time of a video element that is in the current tab.
 */
async function getVideoTime(data: LoopableInfo) {
  const response = await sendToTab<"video_time">({
    command: "video_time",
    data,
  });

  return parseAndReturnResponse(videoTimeResponseSchema, response);
}

const logMessageRequestSchema = requestSchema(
  z.literal("log_message"),
  z.object({ message: z.string() }),
);
const logMessageResponseSchema = responseSchema(z.null());
export interface CommandRegistry {
  log_message: RequestResponsePair<
    z.infer<typeof logMessageRequestSchema>,
    z.infer<typeof logMessageResponseSchema>
  >;
}
/**
 * Send a message to a content script to be logged to console.
 * @param message The message to log.
 */
async function logMessage(message: string) {
  const response = await sendToTab<"log_message">({
    command: "log_message",
    data: { message },
  });

  return parseAndReturnResponse(logMessageResponseSchema, response);
}

const saveDataRequestSchema = requestSchema(
  z.literal("save_data"),
  urlDataSchema,
);
const saveDataResponseSchema = responseSchema(z.null());
export interface CommandRegistry {
  save_data: RequestResponsePair<
    z.infer<typeof saveDataRequestSchema>,
    z.infer<typeof saveDataResponseSchema>
  >;
}
/**
 * Save the passed data.
 */
async function saveData(data: URLData) {
  const response = await sendToTab<"save_data">({ command: "save_data", data });

  return parseAndReturnResponse(saveDataResponseSchema, response);
}

const loadDataRequestSchema = requestSchema(z.literal("load_data"), z.null());
const loadDataResponseSchema = responseSchema(urlDataSchema);
export interface CommandRegistry {
  load_data: RequestResponsePair<
    z.infer<typeof loadDataRequestSchema>,
    z.infer<typeof loadDataResponseSchema>
  >;
}
/**
 * Load data for the current URL.
 */
async function loadData() {
  const response = await sendToTab<"load_data">({
    command: "load_data",
    data: null,
  });
  return parseAndReturnResponse(loadDataResponseSchema, response);
}

const loadDomainDataRequestSchema = requestSchema(
  z.literal("load_domain_data"),
  z.null(),
);
const loadDomainDataResponseSchema = responseSchema(domainDataV1Schema);
export interface CommandRegistry {
  load_domain_data: RequestResponsePair<
    z.infer<typeof loadDomainDataRequestSchema>,
    z.infer<typeof loadDomainDataResponseSchema>
  >;
}

async function loadDomainData() {
  const response = await sendToTab<"load_domain_data">({
    command: "load_domain_data",
    data: null,
  });

  return parseAndReturnResponse(loadDomainDataResponseSchema, response);
}

const deleteDomainDataRequestSchema = requestSchema(
  z.literal("delete_domain_data"),
  z.null(),
);
const deleteDomainDataResponseSchema = responseSchema(z.null());
export interface CommandRegistry {
  delete_domain_data: RequestResponsePair<
    z.infer<typeof deleteDomainDataRequestSchema>,
    z.infer<typeof deleteDomainDataResponseSchema>
  >;
}

/**
 * Delete all the data for this domain from storage.
 */
async function deleteDomainData() {
  const response = await sendToTab<"delete_domain_data">({
    command: "delete_domain_data",
    data: null,
  });

  return parseAndReturnResponse(deleteDomainDataResponseSchema, response);
}

const deleteDomainUrlDataRequestSchema = requestSchema(
  z.literal("delete_domain_url_data"),
  z.object({ urls: z.httpUrl().array() }),
);
const deleteDomainUrlDataResponseSchema = responseSchema(z.null());
export interface CommandRegistry {
  delete_domain_url_data: RequestResponsePair<
    z.infer<typeof deleteDomainUrlDataRequestSchema>,
    z.infer<typeof deleteDomainUrlDataResponseSchema>
  >;
}

/**
 * Delete the data of this domain related to the passed urls.
 */
async function deleteDomainUrlData(data: { urls: string[] }) {
  const response = await sendToTab<"delete_domain_url_data">({
    command: "delete_domain_url_data",
    data,
  });
  return parseAndReturnResponse(deleteDomainUrlDataResponseSchema, response);
}

const enableLoopingRequestSchema = requestSchema(
  z.literal("enable_looping"),
  loopInfoSchema,
);
const enableLoopingResponseSchema = responseSchema(
  z.object({
    intervalId: z.number(),
  }),
);
export interface CommandRegistry {
  enable_looping: RequestResponsePair<
    z.infer<typeof enableLoopingRequestSchema>,
    z.infer<typeof enableLoopingResponseSchema>
  >;
}
/**
 * Start looping a video.
 */
async function enableLooping(loopInfo: LoopInfo) {
  const response = await sendToTab<"enable_looping">({
    command: "enable_looping",
    data: loopInfo,
  });

  return parseAndReturnResponse(enableLoopingResponseSchema, response);
}

const disableLoopingRequestSchema = requestSchema(
  z.literal("disable_looping"),
  z.null(),
);
const disableLoopingResponseSchema = responseSchema(z.null());
export interface CommandRegistry {
  disable_looping: RequestResponsePair<
    z.infer<typeof disableLoopingRequestSchema>,
    z.infer<typeof disableLoopingResponseSchema>
  >;
}
/**
 * Stop looping a video.
 */
async function disableLooping() {
  const response = await sendToTab<"disable_looping">({
    command: "disable_looping",
    data: null,
  });

  return parseAndReturnResponse(disableLoopingResponseSchema, response);
}

// Not an actual request, here to fulfill the interface for the content
// script side to use.
export interface CommandRegistry {
  unknown: RequestResponsePair<Request<"unknown", null>, Response<null>>;
}

const chooseVideoArgsSchema = z.object({
  ...loopableInfoSchema.pick({ selectors: true }).shape,
});
type ChooseVideoArgs = z.infer<typeof chooseVideoArgsSchema>;

const elementListLengthRequestSchema = requestSchema(
  z.literal("element_list_length"),
  chooseVideoArgsSchema,
);
const elementListLengthResponseSchema = responseSchema(
  z.object({ length: z.number() }),
);
export interface CommandRegistry {
  element_list_length: RequestResponsePair<
    z.infer<typeof elementListLengthRequestSchema>,
    z.infer<typeof elementListLengthResponseSchema>
  >;
}

/**
 * Check the length of a given list of elements.
 */
async function elementListLength(data: ChooseVideoArgs) {
  const response = await sendToTab<"element_list_length">({
    command: "element_list_length",
    data,
  });

  return parseAndReturnResponse(elementListLengthResponseSchema, response);
}

const getMediaElementListArgsSchema = z.object({
  selectors: z.literal("video"),
});
export const getMediaElementListRequestSchema = requestSchema(
  z.literal("get_media_element_list"),
  // limit to videos for now
  getMediaElementListArgsSchema,
);

const getMediaElementListResponseSchema = responseSchema(
  z.array(z.object({ paused: z.boolean() })),
);

export interface CommandRegistry {
  get_media_element_list: RequestResponsePair<
    z.infer<typeof getMediaElementListRequestSchema>,
    z.infer<typeof getMediaElementListResponseSchema>
  >;
}

/**
 * Get HTML media element information for the current page.
 */
async function getMediaElementList() {
  const response = await sendToTab<"get_media_element_list">({
    command: "get_media_element_list",
    data: { selectors: "video" },
  });

  return parseAndReturnResponse(getMediaElementListResponseSchema, response);
}

const highlightComponentArgsSchema = z.object({
  ...loopableInfoSchema.pick({ selectors: true }).shape,
  indices: z.number().array(),
});
type HighlightComponentArgs = z.infer<typeof highlightComponentArgsSchema>;
const highlightElementsRequestSchema = requestSchema(
  z.literal("highlight_elements"),
  highlightComponentArgsSchema,
);
const highlightElementsResponseSchema = responseSchema(
  z.object({ invalidIndices: z.number().array() }),
);
export interface CommandRegistry {
  highlight_elements: RequestResponsePair<
    z.infer<typeof highlightElementsRequestSchema>,
    z.infer<typeof highlightElementsResponseSchema>
  >;
}
/**
 * Highlight elements based on the query selector and the given indices.
 * See `elementListLength()` for querying the length of a list of elements.
 */
async function highlightElements(data: HighlightComponentArgs) {
  const response = await sendToTab<"highlight_elements">({
    command: "highlight_elements",
    data,
  });

  return parseAndReturnResponse(highlightElementsResponseSchema, response);
}

const downloadDataRequestSchema = requestSchema(
  z.literal("download_data"),
  z.null(),
);
const downloadDataResponseSchema = responseSchema(
  z.object({ filename: z.string() }),
);
export interface CommandRegistry {
  download_data: RequestResponsePair<
    z.infer<typeof downloadDataRequestSchema>,
    z.infer<typeof downloadDataResponseSchema>
  >;
}
/**
 * Download the data for this domain.
 */
async function downloadData() {
  const response = await sendToTab<"download_data">({
    command: "download_data",
    data: null,
  });

  return parseAndReturnResponse(downloadDataResponseSchema, response);
}

const loadDataFromFileRequestSchema = requestSchema(
  z.literal("load_data_from_file"),
  z.null(),
);
const loadDataFromFileResponseSchema = responseSchema(z.null());
export interface CommandRegistry {
  load_data_from_file: RequestResponsePair<
    z.infer<typeof loadDataFromFileRequestSchema>,
    z.infer<typeof loadDataFromFileResponseSchema>
  >;
}

/**
 * Start the process of downloading data from file.
 */
async function loadDataFromFile() {
  const response = await sendToTab<"load_data_from_file">({
    command: "load_data_from_file",
    data: null,
  });

  return parseAndReturnResponse(loadDataFromFileResponseSchema, response);
}

const upgradeDomainDataRequestSchema = requestSchema(
  z.literal("upgrade_domain_data"),
  z.null(),
);
const upgradeDomainDataResponseSchema = responseSchema(z.null());
export interface CommandRegistry {
  upgrade_domain_data: RequestResponsePair<
    z.infer<typeof upgradeDomainDataRequestSchema>,
    z.infer<typeof upgradeDomainDataResponseSchema>
  >;
}

/**
 * Migrate the domain data that is in storage to the most up-to-date version.
 */
async function upgradeDomainData() {
  const response = await sendToTab<"upgrade_domain_data">({
    command: "upgrade_domain_data",
    data: null,
  });

  return parseAndReturnResponse(upgradeDomainDataResponseSchema, response);
}

const getLoopIdsRequestSchema = requestSchema(
  z.literal("get_loop_ids"),
  z.null(),
);
const getLoopIdsResponseSchema = responseSchema(
  z.object({ loopIds: z.number().array() }),
);
export interface CommandRegistry {
  get_loop_ids: RequestResponsePair<
    z.infer<typeof getLoopIdsRequestSchema>,
    z.infer<typeof getLoopIdsResponseSchema>
  >;
}

/**
 * Get the current loop interval ids.
 */
async function getLoopIds() {
  const response = await sendToTab<"get_loop_ids">({
    command: "get_loop_ids",
    data: null,
  });

  return parseAndReturnResponse(getLoopIdsResponseSchema, response);
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
  getMediaElementList,
  highlightElements,
  downloadData,
  loadDataFromFile,
};

/**
 * Holds validation schemas for requests created by commands.
 */
export const requestSchemas = {
  videoTime: videoTimeRequestSchema,
  logMessage: logMessageRequestSchema,
  saveData: saveDataRequestSchema,
  loadData: loadDataRequestSchema,
  loadDomainData: loadDomainDataRequestSchema,
  deleteDomainData: deleteDomainDataRequestSchema,
  deleteDomainUrlData: deleteDomainUrlDataRequestSchema,
  upgradeDomainData: upgradeDomainDataRequestSchema,
  enableLooping: enableLoopingRequestSchema,
  disableLooping: disableLoopingRequestSchema,
  getLoopIds: getLoopIdsRequestSchema,
  elementListLength: elementListLengthRequestSchema,
  getMediaElementList: getMediaElementListRequestSchema,
  highlightElements: highlightElementsRequestSchema,
  downloadData: downloadDataRequestSchema,
  loadDataFromFile: loadDataFromFileRequestSchema,
};
