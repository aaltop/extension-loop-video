import { useState } from "react";
import "./App.css";

import { commands, PopupData } from "./commands";
import { Response } from "@/src/typing/commands";

type ValueSetter<T> = (newValue: T) => void;

function VideoTimeInput({
  setter,
  state,
}: {
  setter: ValueSetter<number>;
  state: { readonly videoTime: number };
}) {
  return (
    <>
      <button
        className="video-time-button"
        type="button"
        onClick={async () => {
          const response = await commands.getVideoTime();
          if (response.success) {
            setter(response.data.time);
          } else {
            await commands.logMessage(response.message);
          }
        }}
      >
        Set as current time
      </button>
      <span>{state.videoTime.toFixed(3)}</span>
    </>
  );
}

type ValueUpdater<T> = (prev: T) => T;

function App() {
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [popupData, setPopupdata] = useState<PopupData>({
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

  return (
    <>
      <h1>Loop Video</h1>
      <div>
        <div>
          <VideoTimeInput
            setter={(newVal) => {
              setStartTime(() => newVal);
            }}
            state={{ videoTime: popupData.startTime }}
          />
        </div>
        <div>
          <VideoTimeInput
            setter={(newVal) => {
              setEndTime(() => newVal);
            }}
            state={{ videoTime: popupData.endTime }}
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
              setPopupdata((_prev) => response.data);
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
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p>{errorMsg}</p>
    </>
  );
}

export default App;
