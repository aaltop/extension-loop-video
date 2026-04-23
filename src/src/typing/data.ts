/**
 * @file Definitions of saved data.
 */

/**
 * Info about the loopable element.
 */
export interface LoopableInfo {
  /**
   * The index of the element in a list of possible elements.
   */
  loopableIndex: number;

  /**
   * Selectors as passed to `document.querySelectorAll()`.
   */
  selectors: string;
}

export interface TimeSection {
  startTime: number;
  endTime: number;

  /**
   * Whether this timeSection should be considered when doing an operation
   * based on it.
   */
  disabled?: boolean;
  description?: string;
}

/**
 * Describes a video (or similar) loop.
 */
export interface LoopInfo extends LoopableInfo {
  timeSections: TimeSection[];
}

/**
 * Metadata related to a specific URL.
 */
export interface URLMetaData {
  /**
   * A short description of the URL.
   */
  title?: string;
  /**
   * A longer description of the URL.
   */
  description?: string;
  /**
   * Tags for the URL.
   */
  tags?: string[];
}

/**
 * The data related to a specific URL.
 */
export interface URLData extends LoopInfo, URLMetaData {}

/**
 * Key under which the looping data is stored for the domain.
 */
export const LOOPING_DATA_KEY = "loopingData" as const;
/**
 * The version of the domain data.
 */
export const DOMAIN_DATA_VERSION = "v1" as const;
export interface DomainData {
  version: "v1";
  loopingData: Record<string, URLData>;
}
