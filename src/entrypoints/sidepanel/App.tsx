import { useState } from "react";
import "./App.css";

import { commands } from "./commands";
import { Response } from "@/src/typing/commands";
import {
  useLoopableIndex,
  useLoopEnds,
  useSavedState,
  useSelectors,
} from "./SavedStateProvider";
import { ValueState } from "@/src/typing/state";
import { ConsoleContext } from "./ConsoleProvider";
import { SyncMessage } from "../content/typing";

function VideoTimeInput({
  videoTime,
  state,
}: {
  videoTime: ValueState<number>;
  state: {
    buttonText: string;
  };
}) {
  const loopableIndex = useLoopableIndex();
  const selectors = useSelectors();

  return (
    <>
      <button
        className="video-time-button"
        type="button"
        onClick={async () => {
          const response = await commands.getVideoTime({
            loopableIndex: loopableIndex.get(),
            selectors: selectors.get(),
          });
          if (response.success) {
            videoTime.set(response.data.time);
          } else {
            await commands.logMessage(response.message);
          }
        }}
      >
        {state.buttonText}
      </button>
      <span>{videoTime.get().toFixed(3)}</span>
    </>
  );
}

function VideoHighlight() {
  const loopableIndex = useLoopableIndex();
  const selectors = useSelectors();
  const { logger } = useContext(ConsoleContext);
  const [elemNum, setElemNum] = useState<number>(0);

  useEffect(() => {
    async function execute() {
      await queryAndSetElemNum();
    }
    execute();
  }, []);

  async function getElementListLength(selectors: string) {
    const response = await commands.elementListLength({
      selectors,
    });
    if (response.success) {
      return response.data.length;
    }
  }

  async function queryAndSetElemNum() {
    const len = (await getElementListLength(selectors.get())) ?? 0;
    setElemNum(() => len);
    return len;
  }

  async function addToIndex(val: number) {
    await queryAndSetElemNum();
    if (elemNum === 0 || elemNum === null) {
      return;
    }
    const prev = loopableIndex.get();

    let newIndex = prev + val;
    newIndex = (elemNum + (newIndex % elemNum)) % elemNum;
    loopableIndex.set(newIndex);
  }

  return (
    <>
      <button type="button" onClick={async () => await addToIndex(-1)}>
        Previous
      </button>
      <button
        type="button"
        onClick={async () => {
          queryAndSetElemNum();
          const indices = [loopableIndex.get()];
          const response = await commands.highlightElements({
            selectors: selectors.get(),
            indices,
          });
          // if (response.success && response.data.invalidIndices.length > 0) {
          //   const indicesString = JSON.stringify(response.data.invalidIndices);
          //   logger.log(
          //     JSON.stringify(`Invalid highlight indices: ${indicesString}`),
          //   );
          // }
        }}
      >
        {`Highlight video ${loopableIndex.get() + 1} out of ${elemNum ?? "none"}`}
      </button>
      <button type="button" onClick={async () => await addToIndex(1)}>
        Next
      </button>
    </>
  );
}

function ErrorMessage() {
  const { log } = useContext(ConsoleContext);

  const latest = log.at(-1);

  const message = latest
    ? `${latest.datetime.toISOString()} ${latest.message}`
    : "";

  return <p className="error">{message}</p>;
}

function App() {
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [tabChangeCounter, setTabChangeCounter] = useState<number>(0);
  const { log, logger } = useContext(ConsoleContext);
  const endpoints = useLoopEnds();
  const popupData = useSavedState();

  useEffect(() => {
    async function execute() {
      await commands.logMessage("Hello from Loop Video!");
    }
    execute();
  }, []);

  // useEffect(() => {
  //   function receiveFromTab(
  //     _message: any,
  //     sender: Browser.runtime.MessageSender,
  //   ) {
  //     if (sender.tab) {
  //       const message = _message as SyncMessage;
  //       if (message?.event) {
  //         // cause an update of the side panel to occur whenever the
  //         // tab changes
  //         setTabChangeCounter((prev) => prev + 1);
  //       }
  //     }
  //   }

  //   browser.runtime.onMessage.addListener(receiveFromTab);
  //   return () => {
  //     browser.runtime.onMessage.removeListener(receiveFromTab);
  //   };
  // }, []);

  function handleResponse(response: Response<unknown>) {
    if (!response.success) {
      logger.log(response.message);
    }
  }

  return (
    <>
      <h1>Loop Video</h1>
      <div>
        <div>
          <VideoTimeInput
            videoTime={endpoints.startTime}
            state={{
              buttonText: "Set start time",
            }}
          />
        </div>
        <div>
          <VideoTimeInput
            videoTime={endpoints.endTime}
            state={{
              buttonText: "Set end time",
            }}
          />
        </div>
        <button
          onClick={async () => {
            const response = await commands.saveData(popupData.get());
            handleResponse(response);
          }}
        >
          Save state
        </button>
        <button
          onClick={async () => {
            const response = await commands.loadData();
            handleResponse(response);
            if (response.success) {
              popupData.set({
                ...popupData.get(),
                ...response.data,
              });
            }
          }}
        >
          Load state
        </button>
        <div>
          <button
            type="button"
            onClick={async () => {
              if (intervalId !== null) {
                const response = await commands.disableLooping(intervalId);
                handleResponse(response);
                setIntervalId(() => null);
              } else {
                const response = await commands.enableLooping(popupData.get());
                handleResponse(response);
                if (response.success) {
                  setIntervalId(() => response.data.intervalId);
                }
              }
            }}
          >
            {intervalId !== null ? "Disable looping" : "Enable looping"}
          </button>
        </div>

        <div>
          <VideoHighlight key={tabChangeCounter} />
        </div>
        <div>
          <button
            type="button"
            onClick={async () => {
              const response = await commands.downloadData();
              handleResponse(response);
            }}
          >
            Download data for current domain
          </button>
        </div>
        <div>
          <button
            type="button"
            onClick={async () => {
              const response = await commands.loadDataFromFile();
              handleResponse(response);
            }}
          >
            Load data from file
          </button>
        </div>
      </div>
      <ErrorMessage />
    </>
  );
}

export default App;
