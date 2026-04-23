/**
 * @file Definitions of saved data.
 */

import * as z from "zod";

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
const loopableInfoSchema = z.object({
  loopableIndex: z.number(),
  selectors: z.string(),
});

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
const timeSectionSchema = z.object({
  startTime: z.number(),
  endTime: z.number(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});

/**
 * Describes a video (or similar) loop.
 */
export interface LoopInfo extends LoopableInfo {
  timeSections: TimeSection[];
}
const loopInfoSchema = z.object({
  ...loopableInfoSchema.shape,
  timeSections: z.array(timeSectionSchema),
});

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
const urlMetaDataSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    tags: z.string().array(),
  })
  .partial();

/**
 * The data related to a specific URL.
 */
export interface URLData extends LoopInfo, URLMetaData {}
/**
 * Schema for {@link URLData}.
 */
export const urlDataSchema = z.object({
  ...loopInfoSchema.shape,
  ...urlMetaDataSchema.shape,
});
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
export const domainDataSchema = z.object({
  version: z.literal(DOMAIN_DATA_VERSION),
  loopingData: z.record(z.httpUrl(), urlDataSchema),
});
