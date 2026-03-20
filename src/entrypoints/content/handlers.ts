import { CommandRegistry, PopupData } from "@/entrypoints/popup/commands";
import logger from "@/src/logger";

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
 * Data storage -related functionality.
 */
namespace storage {
  /**
   * Get a key used for the extension's localStorage data.
   * @param suffix Descriptive of the nature of the data. For representing
   * hierarchy flatly, values should be delimited by forward slashes (/).
   */
  function getStorageKey(suffix: string) {
    return `${LOCALSTORAGE_KEY}/${suffix}`;
  }

  /**
   * Whether the parsed stored data is valid.
   */
  export function storedDataIsValid(data: any) {
    return data !== null && typeof data === "object";
  }

  const LOOPING_DATA_KEY = "looping_data" as const;
  /**
   * Get the stored data of the extension for this domain.
   */
  export function getStoredData(): Record<string, PopupData> | undefined {
    const data = window.localStorage.getItem(LOCALSTORAGE_KEY);
    let parsedData = JSON.parse(data ?? "null");
    if (parsedData !== null) {
      parsedData = parsedData[LOOPING_DATA_KEY];
    }
    return storedDataIsValid(parsedData) ? parsedData : undefined;
  }

  /**
   * Set the stored data.
   */
  export function setStoredData(data: Record<string, unknown>) {
    const allData: Record<string, unknown> = {};
    allData[LOOPING_DATA_KEY] = data;
    window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(allData));
  }
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
    logger.log("loading data...");
    const data = storage.getStoredData();
    const url = document.URL;
    if (data === undefined || !data[url]) {
      sendResponse<"load_data">(baseSendResponse, {
        success: false,
        message: `Data not found for URL ${url}`,
      });
    } else {
      sendResponse<"load_data">(baseSendResponse, {
        success: true,
        data: data[url],
      });
    }
  },

  save_data: (message, baseSendResponse) => {
    logger.log("saving data...");

    const url = document.URL;
    let previousData = storage.getStoredData();
    if (previousData === undefined) {
      previousData = {};
    }
    previousData[url] = message.data;

    storage.setStoredData(previousData);
    sendResponse<"save_data">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  download_data: (message, baseSendResponse) => {
    let data = storage.getStoredData();
    if (data === undefined) {
      data = {};
    }

    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    const objUrl = URL.createObjectURL(blob);
    const hostname = new URL(document.URL).hostname;
    const filename = `loop_video_data_${hostname}.json`;
    try {
      const link = document.createElement("a");
      link.href = objUrl;

      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      if (Error.isError(error)) {
        sendResponse<"download_data">(baseSendResponse, {
          success: false,
          message: `Error while downloading data: ${error.message}`,
        });
      }
    } finally {
      URL.revokeObjectURL(objUrl);
    }
    sendResponse<"download_data">(baseSendResponse, {
      success: true,
      data: {
        filename,
      },
    });
  },

  load_data_from_file: (message, baseSendResponse) => {
    // create input and dialog to put it in
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    const dialog = document.createElement("dialog");
    dialog.appendChild(fileInput);

    function closeAndRemoveDialog() {
      dialog.close();
      dialog.remove();
    }

    // a close button for the dialog
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.addEventListener("click", () => {
      closeAndRemoveDialog();
    });
    closeButton.innerText = "Close";
    dialog.appendChild(closeButton);

    fileInput.addEventListener("change", async function () {
      const files = this.files;
      if (files !== null) {
        const file = files[0];

        const data = JSON.parse(await file.text());
        if (data !== null || typeof data === "object") {
          storage.setStoredData(data);
          sendResponse<"load_data_from_file">(baseSendResponse, {
            success: true,
            data: null,
          });
          logger.log("Loaded data from file");
        } else {
          sendResponse<"load_data_from_file">(baseSendResponse, {
            success: false,
            message: "Invalid data read from file: did not resemble an object",
          });
        }
      }

      closeAndRemoveDialog();
    });

    fileInput.addEventListener("cancel", () => {
      closeAndRemoveDialog();
    });

    document.body.appendChild(dialog);
    dialog.showModal();

    sendResponse<"load_data_from_file">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  log_message: (message, baseSendResponse) => {
    logger.log(`From popup: ${message.data.message}`);
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
