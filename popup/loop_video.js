/**
 *
 * @returns {Promise<{id: number}[]>}
 */
function getTabs() {
  return browser.tabs.query({ active: true, currentWindow: true });
}

/**
 *
 * @param {{ command: string, data: object | undefined }} data
 * @returns {Promise<{ result: object, data: object | null }>}
 */
async function sendToTab(data) {
  try {
    const tabs = await getTabs();
    const response = await browser.tabs.sendMessage(tabs[0].id, data);
    return response;
  } catch (error) {
    writeError(error.message);
  }
}

/**
 *
 * @param {string} selector
 * @param {string} message
 */
function writeInnerText(selector, message) {
  const comp = document.querySelector(selector);
  comp.innerText = message;
}

function writeError(message) {
  writeInnerText("#error-message", message);
}

/**
 * Create a function that has automatic error handling.
 * @param {*} func
 * @param {string} context
 */
function tryCatch(func, context) {
  return async (any) => {
    try {
      await func(any);
    } catch (error) {
      writeError(`${context}: ${error.message}`);
    }
  };
}

function initButton(buttonId, timeId) {
  document.getElementById(buttonId).addEventListener(
    "click",
    tryCatch(async (ev) => {
      const response = await sendToTab({ command: "video_time" });
      writeInnerText(`#${timeId}`, response.data.time ?? "no video found");
    }, `error in ${timeId}`),
  );
}

async function init() {
  writeError("doing init");
  initButton("start-button", "start-time");
  initButton("end-button", "end-time");

  document.getElementById("save-button").addEventListener(
    "click",
    tryCatch(async (ev) => {
      const response = await sendToTab({
        command: "save_data",
        data: { is: true },
      });
    }, "save-button"),
  );

  const response = await sendToTab({ command: "load_data" });
  await sendToTab({
    command: "log_message",
    data: { message: `Loaded data: ${JSON.stringify(response.data)}` },
  });
}

async function main() {
  try {
    await browser.tabs.executeScript({
      file: "/content_scripts/loop_video.js",
    });
    await init();
  } catch (error) {
    writeError(`error in main: ${er.message}`);
  }
}

main();
