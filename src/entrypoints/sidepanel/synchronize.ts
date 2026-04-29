/**
 * @file Function to be called passed to an effect to set a synchronization
 * callback when a change happens in the tab.
 */

import { syncMessageSchema } from "../content/typing";

/**
 * useEffect callback that creates a listener that checks
 * for changes in the document, calling `callback` if a change happens.
 * @param callback Any function that should be executed after a change.
 * @returns A function to be passed to a useEffect.
 */
export default function synchronize(callback: () => void) {
  return () => {
    function synchronize(
      _message: object,
      sender: Browser.runtime.MessageSender,
    ) {
      if (sender.tab) {
        const message = syncMessageSchema.safeParse(_message);
        if (message.success) {
          callback();
        }
      }
    }

    browser.runtime.onMessage.addListener(synchronize);
    return () => {
      browser.runtime.onMessage.removeListener(synchronize);
    };
  };
}
