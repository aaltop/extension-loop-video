import { CommandRegistry, CommandUnion } from "@/entrypoints/popup/commands";
import responseHandlers from "./handlers";
import logger from "@/src/logger";

function sendResponse<K extends keyof CommandRegistry>(
  baseSendResponse: (response: CommandRegistry[K]["response"]) => void,
  response: CommandRegistry[K]["response"],
) {
  baseSendResponse(response);
}

function addMessageHandler() {
  browser.runtime.onMessage.addListener((_message, _, baseSendResponse) => {
    const message = _message as CommandUnion["request"];
    const com = message.command;

    if (responseHandlers[com]) {
      responseHandlers[com](message, baseSendResponse);
    } else {
      const unknownMessage = `Received unknown command ${com}`;
      logger.log(unknownMessage);
      sendResponse<"unknown">(baseSendResponse, {
        success: false,
        message: unknownMessage,
      });
    }
  });
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    addMessageHandler();
  },
});
