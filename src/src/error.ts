/**
 * @file Utilities for working with error handling.
 */

/**
 * Wraps a trycatch block.
 * @param tryFunc The function to call in the try part.
 */
export function trycatch<TSucceed>(tryFunc: () => TSucceed): TSucceed | void;
/**
 * Wraps a trycatch block.
 * @param tryFunc The function to call in the try part.
 * @param catchFunc The function to call with the error in the catch part.
 */
export function trycatch<TSucceed, TFail>(
  tryFunc: () => TSucceed,
  catchFunc: (err: Error) => TFail,
): TSucceed | TFail;
/**
 * Wraps a trycatch block.
 * @param tryFunc The function to call in the try part.
 * @param catchFunc The function to call with the error in the catch part.
 * If not specified, log the error and return.
 */
export function trycatch<TSucceed, TFail>(
  tryFunc: () => TSucceed,
  catchFunc?: (err: Error) => TFail,
): TSucceed | TFail | void {
  try {
    return tryFunc();
  } catch (error) {
    // don't really know in what situation it isn't an Error
    const err = error as Error;
    return catchFunc ? catchFunc(err) : console.error(err);
  }
}
