import * as z from "zod";

import {
  CommandRegistry,
  CommandUnion,
} from "@/entrypoints/sidepanel/commands";
import responseHandlers from "./handlers";
import logger from "@/src/logger";
import * as messages from "./messages";

function sendResponse<K extends keyof CommandRegistry>(
  baseSendResponse: (response: CommandRegistry[K]["response"]) => void,
  response: CommandRegistry[K]["response"],
) {
  baseSendResponse(response);
}

function addMessageHandler() {
  // message contains more than "command", so use loose to pass everything
  // on, but for now only "command" is needed here
  const messageParser = z.looseObject({ command: z.string() });
  browser.runtime.onMessage.addListener((_message, _, baseSendResponse) => {
    // pointing out that it's supposed to be CommandUnion["request"], but
    // that only the command itself is required, and in practice that
    // command does not even need to technically be one of the defined
    // commands, only a string, as is evident below in the if-else.
    const message = messageParser.parse(_message) as CommandUnion["request"];
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
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        messages.sync("visibilitychange");
      }
    });

    messages.sync("loaded");
  },
});
