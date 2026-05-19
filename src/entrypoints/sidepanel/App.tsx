import { use, useState } from "react";
import "./App.css";
import "@/entrypoints/sidepanel/mixins.css";

import { commands } from "./commands";
import {
  ConsoleContext,
  LoggingLevel,
  LoggingLevelNumeric,
} from "./contexts/ConsoleContext";
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
import { receiveLog, synchronize } from "./messages.ts";
import { LoopingContext } from "./contexts/LoopingContext.tsx";

/**
 * Component containing general controls.
 */
function Controls() {
  const looping = use(LoopingContext);

  const { logger } = use(ConsoleContext);

  function handleResponse(response: Response<unknown>) {
    baseHandleResponse(response, logger);
  }

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
          data-enabled={looping.enabled}
          type="button"
          onClick={async () => {
            if (looping.enabled) {
              looping.disable();
            } else {
              looping.enable();
            }
          }}
        >
          {looping.enabled ? "Disable looping" : "Enable looping"}
        </button>

        <ElementHighlight />

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
        <select defaultValue={LoggingLevel.ERROR}>
          {Object.entries(LoggingLevel).map(([key, val]) => {
            return (
              <option
                value={val}
                key={key}
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
  const { logger } = use(ConsoleContext);

  const [tabChangeCounter, setTabChangeCounter] = useState<number>(0);

  useEffect(synchronize(updateDomainData), []);
  useEffect(
    receiveLog((message) => {
      switch (message.level) {
        case "DEBUG":
          logger.debug(message.data);
          break;

        case "INFO":
          logger.info(message.data);
          break;

        case "WARNING":
          logger.warning(message.data);
          break;

        case "ERROR":
          logger.error(message.data);
          break;

        case "CRITICAL":
          logger.critical(message.data);
          break;

        default:
          logger.critical(
            "Invalid log received from content script: ",
            message.data,
          );
          break;
      }
    }),
  );

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
