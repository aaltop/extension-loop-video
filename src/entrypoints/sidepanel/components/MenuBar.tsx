import { use } from "react";

import { useSavedState } from "../contexts/SavedStateContext";
import Dropdown from "./Dropdown";
import { commands } from "../commands";
import { handleResponse } from "../helpers";
import ConsoleContext from "../contexts/ConsoleContext";
import { usePreferConfirm } from "../contexts/AppSettingsContext";

import "./MenuBar.css";

export default function MenuBar({
  reloadApp,
}: {
  /**
   * Reload the app.
   */
  reloadApp: () => void;
}) {
  const appData = useSavedState();
  const { logger } = use(ConsoleContext);
  const preferConfirm = usePreferConfirm();

  return (
    <div className="menubar-wrapper">
      <Dropdown
        title="Menu"
        PopoverElement={({ popoverId, itemClassName }) => {
          const menuItemClass = `global-basic-button ${itemClassName}`;
          return (
            <div className="menubar-menu-wrapper" popover="auto" id={popoverId}>
              <button
                className={menuItemClass}
                type="button"
                onClick={() => {
                  if (!window.confirm("reset?")) return;
                  appData.reset();
                  reloadApp();
                }}
              >
                Reset state (reload)
              </button>

              <button
                className={menuItemClass}
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
            </div>
          );
        }}
      />
      <Dropdown
        title="Preferences"
        PopoverElement={({ popoverId, itemClassName }) => {
          const menuItemClass = `global-basic-button ${itemClassName}`;
          return (
            <div className="menubar-menu-wrapper" popover="auto" id={popoverId}>
              <button
                className={menuItemClass}
                type="button"
                onClick={() => {
                  const info =
                    "'Confirm Actions' changes whether saving and loading is confirmed.";
                  if (
                    !window.confirm(
                      `Set 'Confirm Actions' to ${!preferConfirm.get()}? ${info}`,
                    )
                  ) {
                    return;
                  } else {
                    preferConfirm.set(!preferConfirm.get());
                  }
                }}
              >
                {`Confirm Actions: ${preferConfirm.get()}`}
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
