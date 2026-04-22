/**
 * Context for accessing app settings.
 */

import { trycatch } from "@/src/error";
import { createContext, use } from "react";

const settingsStorage = browser.storage.sync;

/**
 * Settings for the app.
 */
export interface Settings {
  /**
   * Whether the user prefers confirmation before certain actions are
   * performed.
   */
  preferConfirm: boolean;
}

interface ContextState {
  state: Settings;
  setState: (newState: Settings) => void;
}

function createDefaultContextState(): ContextState {
  return {
    state: { preferConfirm: true },
    setState(newState) {
      throw new Error("Should not be called");
    },
  };
}

const AppSettingsContext = createContext<ContextState>(
  createDefaultContextState(),
);

export function AppSettingsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, _setState] = useState<Settings>(
    () => createDefaultContextState().state,
  );

  function setState(newValue: Settings) {
    trycatch(() => {
      settingsStorage.set<Settings>(newValue);
      _setState(newValue);
    });
  }

  useEffect(() => {
    async function execute() {
      setState(await settingsStorage.get<Settings>({ preferConfirm: true }));
    }
    execute();
  }, []);

  return (
    <AppSettingsContext
      value={{
        state,
        setState,
      }}
    >
      {children}
    </AppSettingsContext>
  );
}

export function usePreferConfirm() {
  const settings = use(AppSettingsContext);

  return {
    get() {
      return settings.state.preferConfirm;
    },
    set(newValue: boolean) {
      settings.setState({ ...settings.state, preferConfirm: newValue });
    },
  };
}
