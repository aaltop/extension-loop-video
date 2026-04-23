import { use } from "react";

import ConsoleContext from "../contexts/ConsoleContext";
import { handleResponse as baseHandleResponse } from "../helpers";
import { Response } from "@/src/typing/commands";
import { commands } from "../commands";
import { useSavedState } from "../contexts/SavedStateContext";
import NotificationContext from "../contexts/NotificationContext";
import { useTimeout } from "../hooks";
import {
  NOTIFICATION_TIME_LONG,
  NOTIFICATION_TIME_MEDIUM,
} from "@/src/globals";
import { notificationHighlight } from "./Notification";
import { usePreferConfirm } from "../contexts/AppSettingsContext";

const DEFAULT_TEXT = "Load state" as const;

// TODO: could potentially consolidate the behaviour here with the one
// of the SaveButton. Very similar, but also gets to that point
// of potentially far too many props passed to have it have enough
// usability.
export default function LoadButton() {
  const [buttonText, setButtonText] = useState<string>(DEFAULT_TEXT);

  const { logger } = use(ConsoleContext);
  const savedState = useSavedState();
  const preferConfirm = usePreferConfirm();
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
        const query = commands.loadData();
        if (preferConfirm.get() && !window.confirm("Load data for URL?"))
          return;
        logger.debug("Loading data");
        const response = await query;
        handleResponse(response);
        if (response.success) {
          loadedTimeout.activate({
            activationFunction() {
              setButtonText(() => "Loaded!");
              return { stateValue: "success", delay: NOTIFICATION_TIME_MEDIUM };
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
              return { stateValue: "failure", delay: NOTIFICATION_TIME_LONG };
            },
          });
        }
      }}
    >
      {buttonText}
    </button>
  );
}
