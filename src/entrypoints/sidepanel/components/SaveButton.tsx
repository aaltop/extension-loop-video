import {
  NOTIFICATION_TIME_LONG,
  NOTIFICATION_TIME_MEDIUM,
} from "@/src/globals";
import { ConsoleContext } from "../contexts/ConsoleContext";
import { useSavedState } from "../contexts/SavedStateContext";
import { commands } from "../commands";
import { handleResponse as baseHandleResponse } from "../helpers";
import { useTimeout } from "../hooks";

import "./Savebutton.css";
import NotificationContext from "../contexts/NotificationContext";
import { use } from "react";
import { notificationHighlight } from "./Notification";
import DomainDataContext from "../contexts/DomainDataContext";
import { usePreferConfirm } from "../contexts/AppSettingsContext";

const DEFAULT_TEXT = "Save state" as const;

export default function SaveButton() {
  const [buttonText, setButtonText] = useState<string>(DEFAULT_TEXT);

  const { logger } = useContext(ConsoleContext);
  const { set: setNotification } = use(NotificationContext);
  const { update: updateDomainData } = use(DomainDataContext);
  const preferConfirm = usePreferConfirm();
  const savedTimeout = useTimeout<"success" | "failure">({
    deactivationDelay: NOTIFICATION_TIME_LONG,
    activationFunction: () => {
      setButtonText(() => "Saved!");
      return { stateValue: "success" };
    },
    deactivationFunction: () => {
      setButtonText(() => DEFAULT_TEXT);
    },
  });
  const popupData = useSavedState();

  return (
    <button
      className={`save-button wrapper ${notificationHighlight} ${savedTimeout.state ?? ""}`}
      onClick={async () => {
        if (preferConfirm.get() && !window.confirm("Save?")) return;
        logger.debug("Saving data");
        const response = await commands.saveData(popupData.get());
        baseHandleResponse(response, logger);

        savedTimeout.activate({
          activationFunction: () => {
            if (response.success) {
              setButtonText(() => "Saved!");
              updateDomainData();
              return { stateValue: "success", delay: NOTIFICATION_TIME_MEDIUM };
            } else {
              setButtonText(() => "Not saved");
              setNotification({
                message: `Unable to save: ${response.message}`,
                type: "error",
              });
              return { stateValue: "failure", delay: NOTIFICATION_TIME_LONG };
            }
          },
        });
      }}
    >
      {buttonText}
    </button>
  );
}
