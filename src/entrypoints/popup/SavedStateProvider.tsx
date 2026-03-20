import { createContext } from "react";
import { PopupData } from "@/entrypoints/popup/commands";
import { ValueState } from "@/src/typing/state";

// type SavedStateAccessor = {
//     [K in keyof PopupData]: ValueState<PopupData[K]>
// }

interface SavedStateAccessor {
  state: PopupData;
  setState: (newState: PopupData) => void;
}

const defaultSavedState: PopupData = {
  loopableIndex: 0,
  selectors: "video",
  startTime: 0.0,
  endTime: 0.0,
} as const;

const defaultSavedStateAccessor = {
  state: defaultSavedState,
  setState: () => {
    throw new Error("Should not be called");
  },
};

// const defaultSavedStateAccessor: SavedStateAccessor

const SavedStateContext = createContext<SavedStateAccessor>(
  defaultSavedStateAccessor,
);

function SavedStateProvider({ children }: { children: React.ReactNode }) {
  const [state, _setState] = useState<PopupData>(defaultSavedState);

  function setState(newState: PopupData) {
    _setState(() => newState);
  }

  return (
    <SavedStateContext value={{ state, setState }}>
      {children}
    </SavedStateContext>
  );
}

interface Permissions {
  set?: boolean;
}

interface ContextHookArgs {}
type ContextHook<T> = (args?: ContextHookArgs) => ValueState<T>;

interface HookFactoryArgs<T> {
  /**
   * Given the state, returns the relevant value.
   */
  getFromState: (state: PopupData) => T;

  /**
   * Given the previous state and a new value, return an updated state.
   */
  createNewState: (prevState: PopupData, newValue: T) => PopupData;
}

function hookFactory<T>(args: HookFactoryArgs<T>): ContextHook<T> {
  return function contextHook(hookArgs) {
    const { state, setState } = useContext(SavedStateContext);
    return {
      set(newValue) {
        setState(args.createNewState(state, newValue));
      },
      get() {
        return args.getFromState(state);
      },
    };
  };
}

/**
 * The saved state of the popup.
 */
export function useSavedState(args?: ContextHookArgs): ValueState<PopupData> {
  const { state, setState } = useContext(SavedStateContext);
  return {
    set: setState,
    get() {
      return state;
    },
  };
}

/**
 * The index of the loopable element.
 */
export const useLoopableIndex = hookFactory<number>({
  createNewState(prevState, newValue) {
    return { ...prevState, loopableIndex: newValue };
  },
  getFromState(state) {
    return state.loopableIndex;
  },
});

/**
 * The selectors used to query for the loopable elements.
 */
export const useSelectors = hookFactory<string>({
  createNewState(prevState, newValue) {
    return { ...prevState, selectors: newValue };
  },
  getFromState(state) {
    return state.selectors;
  },
});

/**
 * The loop startpoint.
 */
export const useStartTime = hookFactory<number>({
  createNewState(prevState, newValue) {
    return { ...prevState, startTime: newValue };
  },
  getFromState(state) {
    return state.startTime;
  },
});

/**
 * The loop endpoint.
 */
export const useEndTime = hookFactory<number>({
  createNewState(prevState, newValue) {
    return { ...prevState, endTime: newValue };
  },
  getFromState(state) {
    return state.endTime;
  },
});

/**
 * The loop endpoints.
 */
export function useLoopEnds(
  startArgs?: ContextHookArgs,
  endArgs?: ContextHookArgs,
): {
  startTime: ValueState<number>;
  endTime: ValueState<number>;
} {
  const startTime = useStartTime(startArgs);
  const endTime = useEndTime(endArgs);

  return { startTime: startTime, endTime: endTime };
}

export default SavedStateProvider;
