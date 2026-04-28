import { use, useState } from "react";
import "./App.css";
import "@/entrypoints/sidepanel/mixins.css";

import { commands } from "./commands";
import { useSavedState } from "./contexts/SavedStateContext";
import {
  ConsoleContext,
  LoggingLevel,
  LoggingLevelNumeric,
} from "./contexts/ConsoleContext";
import { syncMessageSchema } from "../content/typing";
import { handleResponse as baseHandleResponse } from "./helpers";

import TimesTable from "./components/TimesTable";
import DomainDataView from "./components/DomainDataView";
import MetaDataHandler from "./components/Metadata";
import ElementHighlight from "./components/ElementHighlight";
import Console from "./components/Console";
import ButtonRow from "./components/ButtonRow";
import SaveButton from "./components/SaveButton";

import { Response } from "@/src/typing/commands";
import Notification from "./components/Notification.tsx";
import { NotificationContextProvider } from "./contexts/NotificationContext";
import LoadButton from "./components/LoadButton";
import DomainDataContext from "./contexts/DomainDataContext.tsx";
import MenuBar from "./components/MenuBar.tsx";

/**
 * Component containing general controls.
 */
function Controls() {
  const [intervalIds, setIntervalIds] = useState<number[]>([]);

  const { logger } = use(ConsoleContext);
  const popupData = useSavedState();

  function handleResponse(response: Response<unknown>) {
    baseHandleResponse(response, logger);
  }

  useEffect(() => {
    async function init() {
      const response = await commands.getLoopIds();
      handleResponse(response);
      if (response.success) {
        setIntervalIds(() => response.data.loopIds);
      }
    }

    async function receiveFromTab(
      _message: object,
      sender: Browser.runtime.MessageSender,
    ) {
      if (sender.tab) {
        const message = syncMessageSchema.safeParse(_message);
        if (message.success) {
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

  return (
    <NotificationContextProvider>
      <Notification />
      <div className="app controls">
        <ButtonRow>
          <SaveButton />
          <LoadButton />
        </ButtonRow>

        <button
          className="app loop-toggle"
          data-enabled={intervalIds.length > 0}
          type="button"
          onClick={async () => {
            if (intervalIds.length > 0) {
              logger.debug("Disabling looping");
              const response = await commands.disableLooping();
              handleResponse(response);
              setIntervalIds(() => []);
            } else {
              logger.debug("Enabling looping");
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

        <ButtonRow>
          <ElementHighlight />
        </ButtonRow>

        <ButtonRow>
          <button
            type="button"
            onClick={async () => {
              logger.info("Starting download of data");
              const response = await commands.downloadData();
              handleResponse(response);
            }}
          >
            Download data for current domain
          </button>

          <button
            type="button"
            onClick={async () => {
              logger.info("Loading data from file");
              const response = await commands.loadDataFromFile();
              handleResponse(response);
            }}
          >
            Load data from file
          </button>
        </ButtonRow>
      </div>
    </NotificationContextProvider>
  );
}

function ConsoleControl() {
  const [level, setLevel] = useState<LoggingLevelNumeric>(LoggingLevel.ERROR);

  return (
    <details>
      <summary>
        Console{" "}
        <select>
          {Object.entries(LoggingLevel).map(([key, val]) => {
            return (
              <option
                value={val}
                key={key}
                selected={val === LoggingLevel.ERROR}
                onClick={() => {
                  setLevel(() => val);
                }}
              >
                {key}
              </option>
            );
          })}
        </select>
      </summary>
      <Console minLevel={level} />
    </details>
  );
}

export default function App() {
  const { update: updateDomainData } = use(DomainDataContext);

  const [tabChangeCounter, setTabChangeCounter] = useState<number>(0);

  useEffect(() => {
    async function execute() {
      await commands.logMessage("Hello from Loop Video!");
    }
    execute();
  }, []);

  useEffect(() => {
    async function synchronize(
      _message: object,
      sender: Browser.runtime.MessageSender,
    ) {
      if (sender.tab) {
        const message = syncMessageSchema.safeParse(_message);
        if (message.success) {
          updateDomainData();
        }
      }
    }

    browser.runtime.onMessage.addListener(synchronize);
    return () => {
      browser.runtime.onMessage.removeListener(synchronize);
    };
  }, []);

  return (
    <div key={tabChangeCounter} className="app wrapper input-with-button">
      <MenuBar reloadApp={() => setTabChangeCounter((prev) => prev + 1)} />
      <h1>Loop Video</h1>
      <details>
        <summary>Metadata</summary>
        <MetaDataHandler />
      </details>
      <hr />
      <TimesTable />

      <hr />
      <Controls />

      <hr />
      <details>
        <summary>Domain data</summary>
        <DomainDataView />
      </details>

      <ConsoleControl />
      <hr />
    </div>
  );
}
