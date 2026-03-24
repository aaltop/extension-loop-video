import { createContext } from "react";
import { ExtensionData } from "@/entrypoints/sidepanel/commands";
import { ValueState } from "@/src/typing/state";

interface SavedStateAccessor {
  state: ExtensionData;
  setState: (newState: ExtensionData) => void;
}

const defaultSavedState: ExtensionData = {
  loopableIndex: 0,
  selectors: "video",
  timeSections: [{ startTime: 0.0, endTime: 0.0 }],
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
  const [state, _setState] = useState<ExtensionData>(defaultSavedState);

  function setState(newState: ExtensionData) {
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

/**
 * @template T Returned by the getter, set by the setter.
 * @template K Key of property in the save data that is needed
 * for updating this value, if previous data is needed.
 */
interface HookFactoryArgs<T, K extends keyof ExtensionData> {
  /**
   * Given the state, returns the relevant value.
   */
  getFromState: (state: Pick<ExtensionData, K>) => T;

  /**
   * Given the previous state of a relevant property and a new value for
   * that property (or some part of it), return an updated property.
   */
  createNewState: (
    prevState: Pick<ExtensionData, K>,
    newValue: T,
  ) => Pick<ExtensionData, K>;
}

function hookFactory<T, K extends keyof ExtensionData>(
  args: HookFactoryArgs<T, K>,
): ContextHook<T> {
  return function contextHook(hookArgs) {
    const { state, setState } = useContext(SavedStateContext);
    return {
      set(newValue) {
        setState({ ...state, ...args.createNewState(state, newValue) });
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
export function useSavedState(
  args?: ContextHookArgs,
): ValueState<ExtensionData> {
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
export const useLoopableIndex = hookFactory<number, "loopableIndex">({
  createNewState(prevState, newValue) {
    return { loopableIndex: newValue };
  },
  getFromState(state) {
    return state.loopableIndex;
  },
});

/**
 * The selectors used to query for the loopable elements.
 */
export const useSelectors = hookFactory<string, "selectors">({
  createNewState(prevState, newValue) {
    return { selectors: newValue };
  },
  getFromState(state) {
    return state.selectors;
  },
});

/**
 * The loop startpoint.
 */
export const useStartTime = hookFactory<number, "timeSections">({
  createNewState(prev, startTime) {
    // TODO: would this be a problem?
    prev.timeSections[0].startTime = startTime;
    return prev;
  },
  getFromState(state) {
    return state.timeSections[0].startTime;
  },
});

/**
 * The loop endpoint.
 */
export const useEndTime = hookFactory<number, "timeSections">({
  createNewState(prev, newValue) {
    prev.timeSections[0].endTime = newValue;
    return prev;
  },
  getFromState(state) {
    return state.timeSections[0].endTime;
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
