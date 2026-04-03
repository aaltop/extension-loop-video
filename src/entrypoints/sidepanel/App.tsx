import { useState } from "react";
import "./App.css";

import { commands } from "./commands";
import { Response } from "@/src/typing/commands";
import {
  useLoopableIndex,
  useSavedState,
  useSelectors,
} from "./SavedStateContext";
import { ConsoleContext } from "./ConsoleProvider";
import TimesTable from "./components/TimesTable";
import { SyncMessage } from "../content/typing";
import DomainDataView from "./components/DomainDataView";
import MetaDataHandler from "./components/Metadata";

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

  /**
   * Queries and sets the number of elements matching the current
   * selectors value.
   * @returns the new elemNum value.
   */
  async function queryAndSetElemNum() {
    const len = (await getElementListLength(selectors.get())) ?? 0;
    setElemNum(() => len);
    return len;
  }

  /**
   * Add `val` to the loopableIndex. This updates the state to be current
   * before the update.
   * @returns the new index.
   */
  async function addToIndex(val: number) {
    const newElemNum = await queryAndSetElemNum();
    if (newElemNum === 0 || newElemNum === null) {
      loopableIndex.set(-1);
      return -1;
    }
    const prev = loopableIndex.get();

    let newIndex = prev + val;
    newIndex = (newElemNum + (newIndex % newElemNum)) % newElemNum;
    loopableIndex.set(newIndex);
    return newIndex;
  }

  return (
    <>
      <button type="button" onClick={async () => await addToIndex(-1)}>
        Previous
      </button>
      <button
        type="button"
        onClick={async () => {
          // this addToIndex call is here mostly to keep the values
          // up to date if something changes on the page.
          const newLoopableIndex = await addToIndex(0);
          if (newLoopableIndex < 0) return;
          const indices = [newLoopableIndex];
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

  return (
    <>
      {log.slice(-5).map((msg, i) => {
        const message = msg
          ? `${msg.datetime.toISOString()} ${msg.message}`
          : "";
        return (
          <p key={i} className="error">
            {message}
          </p>
        );
      })}
    </>
  );
}

function App() {
  // why array? Thinking ahead to the possibility of having multiple loops
  // active at once, though perhaps not so likely to be implemented.
  const [intervalIds, setIntervalIds] = useState<number[]>([]);
  const [tabChangeCounter, setTabChangeCounter] = useState<number>(0);
  const { log, logger } = useContext(ConsoleContext);
  const popupData = useSavedState();

  useEffect(() => {
    async function execute() {
      await commands.logMessage("Hello from Loop Video!");
    }
    execute();
  }, []);

  useEffect(() => {
    async function init() {
      const response = await commands.getLoopIds();
      handleResponse(response);
      if (response.success) {
        setIntervalIds(() => response.data.loopIds);
      }
    }

    async function receiveFromTab(
      _message: any,
      sender: Browser.runtime.MessageSender,
    ) {
      if (sender.tab) {
        const message = _message as SyncMessage;
        if (message?.event) {
          init();
        }
      }
    }

    init();
    browser.runtime.onMessage.addListener(receiveFromTab);
    return () => {
      browser.runtime.onMessage.removeListener(receiveFromTab);
    };
  }, []);

  function handleResponse(response: Response<unknown>) {
    if (!response.success) {
      logger.log(response.message);
    }
  }

  return (
    <div key={tabChangeCounter}>
      <button
        type="button"
        onClick={() => {
          popupData.reset();
          setTabChangeCounter((prev) => prev + 1);
        }}
      >
        Reset state (reload)
      </button>
      <h1>Loop Video</h1>
      <details>
        <summary>Metadata</summary>
        <MetaDataHandler />
      </details>
      <TimesTable />
      <div>
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
              if (intervalIds.length > 0) {
                const response = await commands.disableLooping();
                handleResponse(response);
                setIntervalIds(() => []);
              } else {
                const response = await commands.enableLooping(popupData.get());
                handleResponse(response);
                if (response.success) {
                  setIntervalIds((prev) => {
                    return [...prev, response.data.intervalId];
                  });
                }
              }
            }}
          >
            {intervalIds.length > 0 ? "Disable looping" : "Enable looping"}
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
      <details>
        <summary>Console</summary>
        <ErrorMessage />
      </details>
      <hr />
      <details>
        <summary>Domain data</summary>
        <DomainDataView />
      </details>
    </div>
  );
}

export default App;
