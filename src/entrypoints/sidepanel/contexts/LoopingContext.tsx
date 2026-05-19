import { createContext, use } from "react";
import { commands } from "../commands";
import { useSavedState } from "./SavedStateContext";
import { handleResponse } from "../helpers";
import ConsoleContext from "./ConsoleContext";
import { synchronize } from "../messages";

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

  // bit of a hack for allowing synchronisation after savedState is
  // updated. When this updates (see restart()), the effect runs and
  // the looping can be started with new values. More robust ways,
  // but this was a fast one.
  const [update, setUpdate] = useState<number>(0);
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    async function execute() {
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
    execute();
  }, [update]);

  // If there are currently loop ids, there
  // is a loop active. This is needed to set the state when the side panel
  // first loads.
  useEffect(
    synchronize(async () => {
      const response = await commands.getLoopIds();
      if (response.success) {
        if (response.data.loopIds.length > 0) {
          setEnabled(() => true);
        } else {
          setEnabled(() => false);
        }
      } else {
        logger.error("Error syncing loop:", response.message);
      }
    }),
    [],
  );

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
    setUpdate((prev) => (prev + 1) % 2);
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
