import { use, useState } from "react";
import "./App.css";
import "@/entrypoints/sidepanel/mixins.css";

import { commands } from "./commands";
import { useSavedState } from "./contexts/SavedStateContext";
import { ConsoleContext } from "./contexts/ConsoleContext";
import { SyncMessage } from "../content/typing";
import {
  handleResponse as baseHandleResponse,
  handleResponse,
} from "./helpers";

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

export default function App() {
  const popupData = useSavedState();
  const { update: updateDomainData } = use(DomainDataContext);
  const { logger } = use(ConsoleContext);

  const [tabChangeCounter, setTabChangeCounter] = useState<number>(0);

  useEffect(() => {
    async function execute() {
      await commands.logMessage("Hello from Loop Video!");
    }
    execute();
  }, []);

  useEffect(() => {
    async function synchronize(
      _message: any,
      sender: Browser.runtime.MessageSender,
    ) {
      if (sender.tab) {
        const message = _message as SyncMessage;
        if (message?.event) {
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
      <ButtonRow>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("reset?")) return;
            popupData.reset();
            setTabChangeCounter((prev) => prev + 1);
          }}
        >
          Reset state (reload)
        </button>
        <button
          type="button"
          onClick={async () => {
            const message =
              "Upgrade data version? this will make the current domain's data's version compatible " +
              "with the current application version. Be sure to backup the data before doing this.";
            if (!window.confirm(message)) return;
            const response = await commands.upgradeDomainData();
            handleResponse(response, logger);
          }}
        >
          Upgrade data version
        </button>
      </ButtonRow>
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

      <hr />
      <details>
        <summary>Console</summary>
        <Console />
      </details>
    </div>
  );
}
