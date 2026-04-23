import { DOMAIN_DATA_VERSION, DomainData, URLData } from "@/src/typing/data";
import { CommandRegistry } from "@/entrypoints/sidepanel/commands";
import logger from "@/src/logger";
import { playSections } from "./skipping";

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

/**
 * String used as the top-level key for data stored in localstorage.
 */
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

  // TODO: should probably be co-located with the domain data typing itself.
  /**
   * Depending on the version of the domain data, upgrade it to the most
   * recent version, if possible without breaking anything.
   */
  export function upgradeData(data: any):
    | {
        /**
         * Whether the upgrade was successful.
         */
        success: true;
        /**
         * The upgraded data.
         */
        data: DomainData;
      }
    | {
        /**
         * Whether the upgrade was successful.
         */
        success: false;
        /**
         * Info about why the upgrade failed.
         */
        message: string;
      } {
    if (data === undefined || data === null) {
      return { success: false, message: "Data not found" };
    } else if (typeof data !== "object") {
      return {
        success: false,
        message: "Wrong type for data, expected object",
      };
    }
    if (!data["version"]) {
      data["version"] = "v1";
    }
    const domainData = data as DomainData;
    return { success: true, data: domainData };
  }

  /**
   * Whether the parsed stored data is valid.
   */
  export function storedDataIsValid(data: any) {
    return data !== null && typeof data === "object";
  }

  /**
   * Get the stored data of the domain without performing any validation.
   */
  export function getStoredDataRaw(): any {
    const data = window.localStorage.getItem(LOCALSTORAGE_KEY);
    let parsedData = JSON.parse(data ?? "null");
    return parsedData;
  }

  /**
   * Get the stored data of the extension for this domain.
   */
  export function getStoredData(): DomainData | undefined {
    const data = getStoredDataRaw();
    return storedDataIsValid(data) ? data : undefined;
  }

  /**
   * Get the stored data for the current URL.
   */
  export function getStoredURLData(url: string): URLData | undefined {
    const data = getStoredData();
    return data?.loopingData[url];
  }

  /**
   * Set the stored data for this domain.
   */
  export function setStoredData(data: DomainData) {
    window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Delete all the data, including the key, from the storage.
   */
  export function deleteStoredData() {
    window.localStorage.removeItem(LOCALSTORAGE_KEY);
  }

  /**
   * Delete data for the specified urls for the current domain.
   */
  export function deleteStoredDataForUrls(urls: string[]) {
    const data = getStoredData()?.loopingData;
    if (data === undefined) return;
    for (const url of urls) {
      delete data[url];
    }
    setStoredData({ loopingData: data, version: DOMAIN_DATA_VERSION });
  }
}

/**
 * Manipulation of an HTML element meant to store data in the document.
 */
class DataElementHandler {
  #elementId = "extension-loopvideo" as const;

  /**
   * Creates and returns the element if it does not exist, otherwise returns
   * the already existing element.
   */
  get element(): HTMLElement {
    const possiblyExistingElement: HTMLElement | null = document.getElementById(
      this.#elementId,
    );
    if (possiblyExistingElement !== null) {
      return possiblyExistingElement;
    } else {
      const element: HTMLElement = document.createElement("span");
      element.id = this.#elementId;
      element.style.display = "none";
      document.body.appendChild(element);
      return element;
    }
  }

  setData({
    dataAttributeSuffix,
    data,
  }: {
    /**
     * A suffix for a data attribute.
     */
    dataAttributeSuffix: string;
    data: string;
  }) {
    this.element.setAttribute(getDataAttributeKey(dataAttributeSuffix), data);
  }

  removeData({
    dataAttributeSuffix,
  }: {
    /**
     * The suffix that was passed to {@link setData}.
     */
    dataAttributeSuffix: string;
  }) {
    this.element.removeAttribute(getDataAttributeKey(dataAttributeSuffix));
  }

  /**
   * Get the data stored by a data attribute.
   * @returns If the data is found, return a string, else return null.
   */
  getData({
    dataAttributeSuffix,
  }: {
    /**
     * The suffix that was passed to {@link setData}.
     */
    dataAttributeSuffix: string;
  }): string | null {
    return this.element.getAttribute(getDataAttributeKey(dataAttributeSuffix));
  }
}

/**
 * Manipulation of an HTML element meant to store IDs that refer to intervals.
 * Storing of IDs works like a set: does not guarantee for insertion order to be maintained,
 * and all elements are unique.
 */
class LoopIdHandler extends DataElementHandler {
  #idSuffix = "looping-id" as const;

  /**
   * @returns The saved IDs.
   */
  getIds(): number[] {
    return JSON.parse(
      this.getData({ dataAttributeSuffix: this.#idSuffix }) ?? "[]",
    );
  }

  #setIds({ ids }: { ids: number[] }) {
    this.setData({
      dataAttributeSuffix: this.#idSuffix,
      data: JSON.stringify(ids),
    });
  }

  /**
   * Add an ID. Ids that already exist in the data are not added.
   */
  addId({ id }: { id: number }) {
    const data: number[] = this.getIds();
    let newData: number[] = [id];
    if (data.length > 0) {
      if (!data.includes(id)) {
        newData = [...data, id];
      } else {
        newData = data;
      }
    }

    this.#setIds({ ids: newData });
  }

  removeId({ id }: { id: number }) {
    const data: number[] = this.getIds();
    const newData = new Set(data);
    newData.delete(id);
    this.#setIds({ ids: [...newData] });
  }

  removeAllIds() {
    this.#setIds({ ids: [] });
  }
}

const loopIdHandler = new LoopIdHandler();

/**
 * Data attribute ID used to highlight element by toggling styling.
 */
export const HIGHLIGHT_ELEMENT_ATTRIBUTE = getDataAttributeKey("highlighted");

/**
 * Creates a style element whose styling information is used to style
 * highlighted elements.
 */
function setHighlightStyle() {
  const highlightStyleId = "extension-loopvideo-highlightstyle" as const;
  const _highlightStyle: HTMLElement | null = document.getElementById(
    "extension-loopvideo-highlightstyle",
  );
  let highlightStyle: HTMLStyleElement;
  if (!_highlightStyle) {
    highlightStyle = document.createElement("style");
    highlightStyle.id = highlightStyleId;
    document.head.appendChild(highlightStyle);
    // bit of a tough one. Thought of using ::after, but of course doesn't work
    // on "replaced" elements, which a video would be. Other stuff also works
    // variably: using Youtube as the base testing ground, the video is very weird,
    // hidden under the rest of the stuff, and doesn't really want to be affected
    // by "position: " that well, so no z-index, etc. position: fixed; does work,
    // but it's not the most ideal. This works well enough, though would have
    // wanted more of an actual "highlight".
    highlightStyle.sheet?.insertRule(`
      [${HIGHLIGHT_ELEMENT_ATTRIBUTE}=""] {
        transition: transform 1.5s;
        transform: scale(1.5);
      }    
    `);
  }
}

setHighlightStyle();

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
    const skippable = elements[message.data.loopableIndex] as HTMLMediaElement;
    const intervalId = window.setInterval(() => {
      if (!skippable) return;
      playSections({
        skippable,
        timeSections: message.data.timeSections,
        shouldLoop: true,
      });
    }, 20);

    loopIdHandler.addId({ id: intervalId });

    sendResponse<"enable_looping">(baseSendResponse, {
      success: true,
      data: { intervalId },
    });
  },

  disable_looping: (message, baseSendResponse) => {
    loopIdHandler.getIds().forEach((id) => {
      window.clearInterval(id);
    });
    loopIdHandler.removeAllIds();

    sendResponse<"disable_looping">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  get_loop_ids: (message, baseSendResponse) => {
    const ids = loopIdHandler.getIds();

    sendResponse<"get_loop_ids">(baseSendResponse, {
      success: true,
      data: { loopIds: ids },
    });
  },

  highlight_elements: (message, baseSendResponse) => {
    const invalidIndices: number[] = [];
    try {
      const elems = document.querySelectorAll(message.data.selectors);

      for (const idx of message.data.indices) {
        if (elems.length <= idx || idx < 0) {
          invalidIndices.push(idx);
          continue;
        }

        // just assume HTMLElement
        const htmlElem = elems[idx] as HTMLElement;
        const highlightedAttr = HIGHLIGHT_ELEMENT_ATTRIBUTE;
        if (htmlElem.getAttribute(highlightedAttr) !== null) {
          // already highlighted, skip this one
          continue;
        }

        // the styling is applied to this attribute based on the adopted style
        // sheet specified above in setHighlightStyle
        htmlElem.setAttribute(highlightedAttr, "");
        htmlElem.scrollIntoView();
        setTimeout(() => {
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
      data: { invalidIndices },
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
    const url = document.URL;
    let data = storage.getStoredURLData(url);
    if (data === undefined) {
      sendResponse<"load_data">(baseSendResponse, {
        success: false,
        message: `Data not found for URL ${url}`,
      });
    } else {
      sendResponse<"load_data">(baseSendResponse, {
        success: true,
        data,
      });
    }
  },

  load_domain_data: (message, baseSendresponse) => {
    const data = storage.getStoredData();
    if (data === undefined) {
      sendResponse<"load_domain_data">(baseSendresponse, {
        success: false,
        message: "Data not found for current domain",
      });
    } else {
      sendResponse<"load_domain_data">(baseSendresponse, {
        success: true,
        data: data,
      });
    }
  },

  delete_domain_data: (message, baseSendResponse) => {
    storage.deleteStoredData();
    sendResponse<"delete_domain_data">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  delete_domain_url_data: (message, baseSendResponse) => {
    storage.deleteStoredDataForUrls(message.data.urls);
    sendResponse<"delete_domain_url_data">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  upgrade_domain_data: (message, baseSendResponse) => {
    const data = storage.getStoredDataRaw();
    const upgraded = storage.upgradeData(data);
    if (upgraded.success) {
      storage.setStoredData(upgraded.data);
      sendResponse<"upgrade_domain_data">(baseSendResponse, {
        success: true,
        data: null,
      });
    } else {
      sendResponse<"upgrade_domain_data">(baseSendResponse, {
        success: false,
        message: upgraded.message,
      });
    }
  },

  save_data: (message, baseSendResponse) => {
    logger.log("saving data...");

    const url = document.URL;
    let previousData = storage.getStoredData();
    if (previousData === undefined) {
      previousData = { loopingData: {}, version: DOMAIN_DATA_VERSION };
    }
    previousData.loopingData[url] = message.data;

    storage.setStoredData(previousData);
    sendResponse<"save_data">(baseSendResponse, {
      success: true,
      data: null,
    });
  },

  download_data: (message, baseSendResponse) => {
    let data = storage.getStoredData();
    if (data === undefined) {
      data = { loopingData: {}, version: "v1" };
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
    logger.log(`From sidebar: ${message.data.message}`);
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
