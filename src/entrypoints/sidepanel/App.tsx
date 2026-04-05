import { useState } from "react";
import "./App.css";

import { commands } from "./commands";
import { Response } from "@/src/typing/commands";
import { useSavedState } from "./SavedStateContext";
import { ConsoleContext } from "./ConsoleContext";
import { SyncMessage } from "../content/typing";

import TimesTable from "./components/TimesTable";
import DomainDataView from "./components/DomainDataView";
import MetaDataHandler from "./components/Metadata";
import ElementHighlight from "./components/ElementHighlight";
import Console from "./components/Console";

function App() {
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
      <div className="app button-controls">
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
          <ElementHighlight />
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
        <summary>Domain data</summary>
        <DomainDataView />
      </details>
      <hr />
      <details>
        <summary>Console</summary>
        <Console />
      </details>
    </div>
  );
}

export default App;
