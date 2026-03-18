import { useState } from "react";
import "./App.css";

import { commands, PopupData } from "./commands";
import { Response } from "@/src/typing/commands";

type ValueSetter<T> = (newValue: T) => void;
interface ValueState<T> {
  readonly set: ValueSetter<T>;
  readonly value: T;
}

function VideoTimeInput({
  videoTime,
  state,
}: {
  videoTime: ValueState<number>;
  state: {
    buttonText: string;
    videoIndex: number;
    selectors: string;
  };
}) {
  return (
    <>
      <button
        className="video-time-button"
        type="button"
        onClick={async () => {
          const response = await commands.getVideoTime({
            loopableIndex: state.videoIndex,
            selectors: state.selectors,
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
      <span>{videoTime.value.toFixed(3)}</span>
    </>
  );
}

function VideoHighlight({ indexVal }: { indexVal: ValueState<number> }) {
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

  const selectors = "video";

  async function queryAndSetElemNum() {
    const len = await getElementListLength(selectors);
    setElemNum(() => len ?? null);
  }

  async function addToIndex(val: number) {
    await queryAndSetElemNum();
    const prev = indexVal.value;
    if (elemNum === 0 || elemNum === null) {
      return;
    }

    let newIndex = prev + val;
    newIndex = (elemNum + (newIndex % elemNum)) % elemNum;
    indexVal.set(newIndex);
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
          const indices = [indexVal.value];
          const response = await commands.highlightElements({
            selectors,
            indices,
          });
        }}
      >
        {`Highlight video ${indexVal.value + 1} out of ${elemNum ?? "none"}`}
      </button>
      <button type="button" onClick={async () => await addToIndex(1)}>
        Next
      </button>
    </>
  );
}

type ValueUpdater<T> = (prev: T) => T;

function App() {
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [popupData, setPopupdata] = useState<PopupData>({
    loopableIndex: 0,
    selectors: "video",
    startTime: 0.0,
    endTime: 0.0,
  });

  useEffect(() => {
    async function execute() {
      await commands.logMessage("Hello from Loop Video!");
    }
    execute();
  }, []);

  function handleResponse(response: Response<unknown>) {
    if (!response.success) {
      setErrorMsg(response.message);
    } else {
      setErrorMsg("");
    }
  }

  function setStartTime(setter: ValueUpdater<number>) {
    setPopupdata((prev) => {
      return {
        ...prev,
        startTime: setter(prev.startTime),
      };
    });
  }

  function setEndTime(setter: ValueUpdater<number>) {
    setPopupdata((prev) => {
      return {
        ...prev,
        endTime: setter(prev.endTime),
      };
    });
  }

  function setLoopableIndex(setter: ValueUpdater<number>) {
    setPopupdata((prev) => {
      return {
        ...prev,
        loopableIndex: setter(prev.loopableIndex),
      };
    });
  }

  return (
    <>
      <h1>Loop Video</h1>
      <div>
        <div>
          <VideoTimeInput
            videoTime={{
              set(newVal) {
                setStartTime(() => newVal);
              },
              value: popupData.startTime,
            }}
            state={{
              buttonText: "Set start time",
              videoIndex: popupData.loopableIndex,
              selectors: popupData.selectors,
            }}
          />
        </div>
        <div>
          <VideoTimeInput
            videoTime={{
              set(newVal) {
                setEndTime(() => newVal);
              },
              value: popupData.endTime,
            }}
            state={{
              buttonText: "Set end time",
              videoIndex: popupData.loopableIndex,
              selectors: popupData.selectors,
            }}
          />
        </div>
        <button
          onClick={async () => {
            const response = await commands.saveData(popupData);
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
              setPopupdata((prev) => {
                return {
                  ...prev,
                  ...response.data,
                };
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
                const response = await commands.enableLooping({
                  startTime: popupData.startTime,
                  endTime: popupData.endTime,
                  loopableIndex: popupData.loopableIndex,
                  selectors: popupData.selectors,
                });
                handleResponse(response);
                if (response.success) {
                  setIntervalId(() => response.data.intervalId);
                }
              }
            }}
          >
            {intervalId !== null ? "Disable looping" : "Enable looping"}
          </button>
          <VideoHighlight
            indexVal={{
              set(newValue) {
                setLoopableIndex(() => newValue);
              },
              value: popupData.loopableIndex,
            }}
          />
        </div>
      </div>
      <p>{errorMsg}</p>
    </>
  );
}

export default App;
