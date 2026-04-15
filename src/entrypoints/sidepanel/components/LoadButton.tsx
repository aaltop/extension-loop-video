import { use } from "react";

import ConsoleContext from "../contexts/ConsoleContext";
import { handleResponse as baseHandleResponse } from "../helpers";
import { Response } from "@/src/typing/commands";
import { commands } from "../commands";
import { useSavedState } from "../contexts/SavedStateContext";
import NotificationContext from "../contexts/NotificationContext";
import { useTimeout } from "../hooks";
import { NOTIFICATION_TIME_LONG } from "@/src/globals";
import { notificationHighlight } from "./Notification";

const DEFAULT_TEXT = "Load state" as const;

export default function LoadButton() {
  const [buttonText, setButtonText] = useState<string>(DEFAULT_TEXT);

  const { logger } = use(ConsoleContext);
  const savedState = useSavedState();
  const { set: setNotification } = use(NotificationContext);
  const loadedTimeout = useTimeout<"success" | "failure">({
    activationFunction() {
      return { stateValue: "success" };
    },
    deactivationFunction() {
      setButtonText(() => DEFAULT_TEXT);
    },
    deactivationDelay: NOTIFICATION_TIME_LONG,
  });

  function handleResponse(response: Response<unknown>) {
    return baseHandleResponse(response, logger);
  }

  return (
    <button
      className={`load-button wrapper ${notificationHighlight} ${loadedTimeout.state ?? ""}`}
      onClick={async () => {
        logger.debug("Loading data");
        const response = await commands.loadData();
        handleResponse(response);
        if (response.success) {
          loadedTimeout.activate({
            activationFunction() {
              setButtonText(() => "Loaded!");
              return { stateValue: "success" };
            },
          });
          savedState.set({
            ...savedState.get(),
            ...response.data,
          });
        } else {
          loadedTimeout.activate({
            activationFunction: () => {
              setButtonText(() => "Not loaded");
              setNotification({
                message: `Unable to load: ${response.message}`,
                type: "error",
              });
              return { stateValue: "failure" };
            },
          });
        }
      }}
    >
      {buttonText}
    </button>
  );
}
