import { CommandRegistry, CommandUnion } from "./popup/commands";

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
    const video = document.querySelector("video");
    const dataKey = "loop_video:data";
    switch (com) {
      case "video_time":
        console.log("Current video time:", video?.currentTime);
        sendResponse<"video_time">(baseSendResponse, {
          success: true,
          data: { time: video?.currentTime ?? null },
        });
        break;

      case "save_data":
        console.log("saving data for Loop Video...");
        window.localStorage.setItem(
          dataKey,
          JSON.stringify(message.data ?? {}),
        );
        sendResponse<"save_data">(baseSendResponse, {
          success: true,
          data: null,
        });
        break;

      case "load_data":
        console.log("loading data for Loop Video...");
        const data = window.localStorage.getItem(dataKey);
        sendResponse<"load_data">(baseSendResponse, {
          success: true,
          data: data ? JSON.parse(data) : null,
        });
        break;

      case "log_message":
        console.log(`From popup: ${message.data.message}`);
        sendResponse<"log_message">(baseSendResponse, {
          success: true,
          data: null,
        });
        break;

      default:
        console.log(`Received unknown command ${com}`);
        break;
    }
  });
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    addMessageHandler();
  },
});
