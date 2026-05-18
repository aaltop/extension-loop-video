/**
 * @file Functions to be passed to a useEffect for handling messages
 * received from a content script.
 */

import {
  LogMessage,
  logMessageSchema,
  syncMessageSchema,
} from "@/src/typing/messages";

type onMessageCallback = (
  message: unknown,
  sender: Browser.runtime.MessageSender,
) => void;

/**
 * Create a listener passed to browser.runtime.onMessage.addListener.
 */
function listenerFactory(callback: onMessageCallback) {
  function listener(message: unknown, sender: Browser.runtime.MessageSender) {
    if (sender.tab) {
      callback(message, sender);
    }
  }
  return listener;
}

/**
 * Create an effect intended to be passed to a useEffect call.
 */
function effectFactory(callback: onMessageCallback) {
  return () => {
    const listener = listenerFactory(callback);

    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  };
}
/**
 * Create effect that calls `callback` if a change happens.
 * @param callback Any function that should be executed after a change.
 * @returns A function to be passed to a useEffect.
 */
export function synchronize(callback: () => void) {
  const effect = effectFactory((_message) => {
    const message = syncMessageSchema.safeParse(_message);
    if (message.success) {
      callback();
    }
  });
  return effect;
}

/**
 * Create effect that calls `callback` if a log message is received
 * from a content script.
 * @param callback Logs the message.
 * @returns A function to be passed to a useEffect.
 */
export function receiveLog(callback: (data: LogMessage["data"]) => void) {
  const effect = effectFactory((_message) => {
    const message = logMessageSchema.safeParse(_message);
    if (message.success) {
      callback(message.data.data);
    }
  });
  return effect;
}
