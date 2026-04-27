/**
 * @file Data storage -related functionality.
 */

import {
  DomainDataV1,
  domainDataV1Schema,
  URLData,
  DOMAIN_DATA_VERSION,
} from "@/src/typing/data";

/**
 * String used as the top-level key for data stored in localstorage.
 */
const LOCALSTORAGE_KEY = "extension/loop_video" as const;

/**
 * Get a key used for the extension's localStorage data.
 * @param suffix Descriptive of the nature of the data. For representing
 * hierarchy flatly, values should be delimited by forward slashes (/).
 */
// function getStorageKey(suffix: string) {
//   return `${LOCALSTORAGE_KEY}/${suffix}`;
// }

// TODO: should probably be co-located with the domain data typing itself.
/**
 * Depending on the version of the domain data, upgrade it to the most
 * recent version, if possible without breaking anything.
 */
export function upgradeData(data: Record<string, unknown>):
  | {
      /**
       * Whether the upgrade was successful.
       */
      success: true;
      /**
       * The upgraded data.
       */
      data: DomainDataV1;
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
  if (typeof data !== "object") {
    return {
      success: false,
      message: "Wrong type for data, expected object",
    };
  }
  if (!data["version"]) {
    data["version"] = "v1";
  }
  const domainData = domainDataV1Schema.parse(data) as DomainDataV1;
  return { success: true, data: domainData };
}

/**
 * Get the stored data of the domain without performing any validation.
 */
export function getStoredDataRaw(): unknown {
  const data = window.localStorage.getItem(LOCALSTORAGE_KEY);
  const parsedData = JSON.parse(data ?? "null");
  return parsedData;
}

/**
 * Get the stored data of the extension for this domain.
 */
export function getStoredData(): DomainDataV1 | undefined {
  const data = getStoredDataRaw();
  const parsed = domainDataV1Schema.safeParse(data);

  return parsed.success ? parsed.data : undefined;
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
export function setStoredData(data: DomainDataV1) {
  const parsed = domainDataV1Schema.parse(data);
  window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(parsed));
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
