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
  const [elemNum, setElemNum] = useState<number | null>(null);

  useEffect(() => {
    queryAndSetElemNum();
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
    const len = await getElementListLength(selectors.get());
    setElemNum(() => len ?? null);
  }

  async function addToIndex(val: number) {
    await queryAndSetElemNum();
    const prev = loopableIndex.get();
    if (elemNum === 0 || elemNum === null) {
      return;
    }

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

  return <p className="error">{`${latest ? latest.message : ""}`}</p>;
}

function App() {
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const { log, logger } = useContext(ConsoleContext);
  const endpoints = useLoopEnds();
  const popupData = useSavedState();

  useEffect(() => {
    async function execute() {
      await commands.logMessage("Hello from Loop Video!");
    }
    execute();
  }, []);

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
          <VideoHighlight />
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
