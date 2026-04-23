/**
 * Context for accessing app settings.
 */

import { trycatch } from "@/src/error";
import { createContext, use } from "react";
import {
  hookFactory as baseHookFactory,
  HookFactoryArgs,
} from "../contextHookFactory";

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

function hookFactory<T, K extends keyof Settings, E extends object = object>(
  args: Omit<
    HookFactoryArgs<T, Settings, Pick<Settings, K>, E>,
    "contextState"
  >,
) {
  return baseHookFactory({ ...args, contextState: AppSettingsContext });
}

const _usePreferConfirm = hookFactory<boolean, "preferConfirm">({
  createNewState(_prevState, newValue) {
    return { preferConfirm: newValue };
  },
  getFromState(state) {
    return state.preferConfirm;
  },
});

/**
 * See {@link Settings.preferConfirm}.
 */
export function usePreferConfirm() {
  return _usePreferConfirm({ args: {} });
}
