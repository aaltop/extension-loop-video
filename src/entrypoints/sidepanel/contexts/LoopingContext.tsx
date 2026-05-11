import { createContext, use } from "react";
import { commands } from "../commands";
import { useSavedState } from "./SavedStateContext";
import { handleResponse } from "../helpers";
import ConsoleContext from "./ConsoleContext";

interface ContextState {
  // whether looping is enabled.
  enabled: boolean;

  // Enable looping.
  enable: () => Promise<void>;
  // Disable looping.
  disable: () => Promise<void>;
  // Restart looping if it is currently enabled.
  restart: () => Promise<void>;
}

async function placeHolder() {
  throw new Error("Should not be called");
}

export const LoopingContext = createContext<ContextState>({
  enabled: false,
  enable: placeHolder,
  disable: placeHolder,
  restart: placeHolder,
});

export function LoopingContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const savedState = useSavedState();
  const { logger } = use(ConsoleContext);

  const [enabled, setEnabled] = useState<boolean>(false);

  async function enable() {
    logger.debug("Enabling looping");
    const response = await commands.enableLooping(savedState.get());
    handleResponse(response, logger);
    if (response.success) {
      setEnabled(() => true);
    }
  }

  async function disable() {
    logger.debug("Disabling looping");
    const response = await commands.disableLooping();
    handleResponse(response, logger);
    if (response.success) {
      setEnabled(() => false);
    }
  }

  async function restart() {
    if (enabled) {
      logger.debug("Restarting looping");
      const disableResponse = await commands.disableLooping();
      if (!disableResponse.success) {
        logger.error("Error restarting looping:", disableResponse.message);
        return;
      }
      const response = await commands.enableLooping(savedState.get());
      if (!response.success) {
        logger.error("Error restarting looping:", response.message);
        return;
      }
    }
  }

  return (
    <LoopingContext
      value={{
        enabled,
        enable,
        disable,
        restart,
      }}
    >
      {children}
    </LoopingContext>
  );
}
