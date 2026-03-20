import { CommandRegistry } from "@/entrypoints/popup/commands";

function sendResponse<K extends keyof CommandRegistry>(
  baseSendResponse: (response: CommandRegistry[K]["response"]) => void,
  response: CommandRegistry[K]["response"],
) {
  baseSendResponse(response);
}

type ResponseHandler<K extends keyof CommandRegistry> = (
  message: CommandRegistry[K]["request"],
  baseSendResponse: (response?: any) => void,
) => void;

type ResponseRegistry = {
  [K in keyof CommandRegistry]: ResponseHandler<K>;
};

const LOCALSTORAGE_KEY = "extension/loop_video" as const;
const DATA_ATTRIBUTE_PREFIX = "data-loopvideo-" as const;

/**
 * Get an HTML data attribute key.
 * @param suffix Descriptive of the nature of the attribute.
 */
function getDataAttributeKey(suffix: string) {
  return `${DATA_ATTRIBUTE_PREFIX}${suffix}`;
}

/**
 * Get a key used for the extension's localStorage data.
 * @param suffix Descriptive of the nature of the data. For representing
 * hierarchy flatly, values should be delimited by forward slashes (/).
 */
function getStorageKey(suffix: string) {
  return `${LOCALSTORAGE_KEY}/${suffix}`;
}

/**
 * Set of functions that handle responding.
 */
const _responseHandlers: ResponseRegistry = {
  enable_looping: (message, baseSendResponse) => {
    const elements = document.querySelectorAll(message.data.selectors);
    if (elements.length <= message.data.loopableIndex) {
      sendResponse<"enable_looping">(baseSendResponse, {
        success: false,
        message: "Element index out of bounds; check the used selector",
      });
    }
    const element = elements[message.data.loopableIndex] as HTMLVideoElement;
    const intervalId = window.setInterval(() => {
      if (!element) return;

      if (element.currentTime >= message.data.endTime) {
        element.currentTime = message.data.startTime;
      }
    }, 10);

    sendResponse<"enable_looping">(baseSendResponse, {
      success: true,
      data: { intervalId },
    });
  },

  disable_looping: (message, baseSendResponse) => {
    window.clearInterval(message.data.intervalId);
    sendResponse<"disable_looping">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  highlight_elements: (message, baseSendResponse) => {
    try {
      const elems = document.querySelectorAll(message.data.selectors);

      for (const idx of message.data.indices) {
        if (elems.length <= idx || idx < 0) continue;

        // just assume HTMLElement
        const htmlElem = elems[idx] as HTMLElement;
        const highlightedAttr = getDataAttributeKey("highlighted");
        if (htmlElem.getAttribute(highlightedAttr) !== null) {
          // already highlighted, skip this one
          continue;
        }

        const oldBorderStyle = htmlElem.style.border;
        htmlElem.style.border = "5px solid red";
        htmlElem.setAttribute(highlightedAttr, "");
        setTimeout(() => {
          htmlElem.style.border = oldBorderStyle;
          htmlElem.removeAttribute(highlightedAttr);
        }, 3000);
      }
    } catch (error) {
      if (Error.isError(error))
        sendResponse<"highlight_elements">(baseSendResponse, {
          success: false,
          message: error.message,
        });
    }
    sendResponse<"highlight_elements">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  element_list_length: (message, baseSendResponse) => {
    const len = document.querySelectorAll(message.data.selectors).length;
    sendResponse<"element_list_length">(baseSendResponse, {
      success: true,
      data: { length: len },
    });
  },

  load_data: (message, baseSendResponse) => {
    console.log("loading data for Loop Video...");
    const data = window.localStorage.getItem(LOCALSTORAGE_KEY);
    const parsedData = JSON.parse(data ?? "null");
    const url = document.URL;
    if (
      parsedData === null ||
      typeof parsedData !== "object" ||
      !parsedData[url]
    ) {
      sendResponse<"load_data">(baseSendResponse, {
        success: false,
        message: `Data not found for URL ${url}`,
      });
    } else {
      sendResponse<"load_data">(baseSendResponse, {
        success: true,
        data: parsedData[url],
      });
    }
  },

  save_data: (message, baseSendResponse) => {
    console.log("saving data for Loop Video...");

    const url = document.URL;
    let previousData = JSON.parse(
      window.localStorage.getItem(LOCALSTORAGE_KEY) ?? "null",
    );
    if (previousData === null || typeof previousData !== "object") {
      previousData = {};
    }
    previousData[url] = message.data;

    window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(previousData));
    sendResponse<"save_data">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  log_message: (message, baseSendResponse) => {
    console.log(`From popup: ${message.data.message}`);
    sendResponse<"log_message">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  video_time: (message, baseSendResponse) => {
    const elements = document.querySelectorAll(message.data.selectors);
    if (elements.length <= message.data.loopableIndex) {
      sendResponse<"video_time">(baseSendResponse, {
        success: false,
        message: "Element index out of bounds; check the used selector",
      });
    }
    const element = elements[message.data.loopableIndex] as HTMLVideoElement;
    const currentTime = element.currentTime;
    if (currentTime === undefined) {
      sendResponse<"video_time">(baseSendResponse, {
        success: false,
        message: "No video found on page",
      });
    } else {
      sendResponse<"video_time">(baseSendResponse, {
        success: true,
        data: { time: currentTime },
      });
    }
  },

  unknown: (_, baseSendResponse) => {
    sendResponse<"unknown">(baseSendResponse, { success: true, data: null });
  },
};

type GenericResponseRegistry = {
  [K in keyof CommandRegistry]: (
    message: any,
    baseSendResponse: (response?: any) => void,
  ) => void;
};

// Doing this because it seems at least currently that Typescript isn't
// able to narrow the type of data of a discriminated union without
// using a switch statement or similar, basically requiring that
// the type is very specifically known -- through explicit narrowing --
// in a code block. The intention behind responseHandlers is the ability
// to access the correct function by key rather than having to have
// an ugly and wieldy block of switch statements. If a request is passed
// with a given command and that command is found in the ResponseRegistry,
// the request's data should match (by virtue of typing)
// what should be passed to the function that matches the command in the
// ResponseRegistry, but Typescript isn't seemingly able to deduce this.
// So, in order for Typescript to not complain about a non-existent problem,
// use a more generic interface for the handlers.
/**
 * Generic response handlers. Usable for getting the correct
 * handler by a variable union key without having to narrow that
 * key down.
 */
const responseHandlers: GenericResponseRegistry = _responseHandlers;

export default responseHandlers;
