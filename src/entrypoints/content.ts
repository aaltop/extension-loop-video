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
        const currentTime = video?.currentTime;
        if (currentTime === undefined) {
          sendResponse<"video_time">(baseSendResponse, {
            success: false,
            message: "No video found on page",
          });
        } else {
          sendResponse<"video_time">(baseSendResponse, {
            success: true,
            data: { time: currentTime },
          });
        }
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

        if (data === null) {
          sendResponse<"load_data">(baseSendResponse, {
            success: false,
            message: "Data not found",
          });
        } else {
          sendResponse<"load_data">(baseSendResponse, {
            success: true,
            data: JSON.parse(data),
          });
        }

        break;

      case "log_message":
        console.log(`From popup: ${message.data.message}`);
        sendResponse<"log_message">(baseSendResponse, {
          success: true,
          data: null,
        });
        break;

      case "enable_looping":
        const intervalId = window.setInterval(() => {
          if (!video) return;

          if (video.currentTime >= message.data.endTime) {
            video.currentTime = message.data.startTime;
          }
        }, 10);

        sendResponse<"enable_looping">(baseSendResponse, {
          success: true,
          data: { intervalId },
        });

        break;

      case "disable_looping":
        window.clearInterval(message.data.intervalId);
        sendResponse<"disable_looping">(baseSendResponse, {
          success: true,
          data: null,
        });
        break;

      default:
        const unknownMessage = `Received unknown command ${com}`;
        console.log(`Loop Video: ${unknownMessage}`);
        sendResponse<"unknown">(baseSendResponse, {
          success: false,
          message: unknownMessage,
        });
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
