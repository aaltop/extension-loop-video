/**
 *
 * @param {{ command: string, data: object | undefined }} message
 * @param {*} _
 * @param {*} sendResponse
 */
function handleMessage(message, _, sendResponse) {
  const com = message.command;
  const video = document.querySelector("video");
  const dataKey = "loop_video:data";
  switch (com) {
    case "video_time":
      console.log("Current video time:", video?.currentTime);
      sendResponse({
        result: { success: true },
        data: { time: video?.currentTime },
      });
      break;

    case "save_data":
      console.log("saving data for Loop Video...");
      window.localStorage.setItem(dataKey, JSON.stringify(message.data ?? {}));
      sendResponse({ result: { success: true }, data: {} });
      break;

    case "load_data":
      console.log("loading data for Loop Video...");
      const data = window.localStorage.getItem(dataKey);
      sendResponse({
        result: { success: true },
        data: data ? JSON.parse(data) : null,
      });
      break;

    case "log_message":
      console.log(`From popup: ${message.data.message}`);
      sendResponse({ result: { success: true }, data: null });
      break;

    default:
      console.log(`Received unknown command ${com}`);
      break;
  }
}

function main() {
  if (window.hasRun) {
    return;
  }

  window.hasRun = true;

  browser.runtime.onMessage.addListener(handleMessage);
}

main();
