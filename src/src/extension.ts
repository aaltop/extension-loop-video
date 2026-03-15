/**
 * @file Utilities for working with extension mechanisms.
 */

/**
 * Get tabs that are active and in the current window.
 */
export function getTabs() {
  return browser.tabs.query({ active: true, currentWindow: true });
}
