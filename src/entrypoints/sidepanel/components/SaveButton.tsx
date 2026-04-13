import { NOTIFICATION_TIME_MEDIUM } from "@/src/globals";
import { ConsoleContext } from "../contexts/ConsoleContext";
import { useSavedState } from "../contexts/SavedStateContext";
import { commands } from "../commands";
import { handleResponse as baseHandleResponse } from "../helpers";
import { useTimeout } from "../hooks";

import "./Savebutton.css";

const DEFAULT_TEXT = "Save state" as const;

export default function SaveButton() {
  const { logger } = useContext(ConsoleContext);
  const [buttonText, setButtonText] = useState<string>(DEFAULT_TEXT);
  const savedTimeout = useTimeout<"success" | "failure">({
    deactivationDelay: NOTIFICATION_TIME_MEDIUM,
    activationFunction: () => {
      setButtonText(() => "Saved!");
      return { stateValue: "success" };
    },
    deactivationFunction: () => setButtonText(() => DEFAULT_TEXT),
  });
  const popupData = useSavedState();

  return (
    <button
      className={`save-button wrapper ${savedTimeout.state ?? ""}`}
      onClick={async () => {
        logger.debug("Saving data");
        const response = await commands.saveData(popupData.get());
        baseHandleResponse(response, logger);

        savedTimeout.activate({
          activationFunction: () => {
            if (response.success) {
              setButtonText(() => "Saved!");
              return { stateValue: "success" };
            } else {
              setButtonText(() => "Not saved");
              return { stateValue: "failure" };
            }
          },
        });
      }}
    >
      {buttonText}
    </button>
  );
}
