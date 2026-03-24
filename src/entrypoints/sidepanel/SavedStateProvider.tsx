import { createContext } from "react";
import { ExtensionData } from "@/entrypoints/sidepanel/commands";
import { ValueState } from "@/src/typing/state";

interface SavedStateAccessor {
  state: ExtensionData;
  setState: (newState: ExtensionData) => void;
}

function createDefaultSavedState(): ExtensionData {
  return {
    loopableIndex: 0,
    selectors: "video",
    timeSections: [{ startTime: 0.0, endTime: 0.0 }],
  };
}

const defaultSavedStateAccessor = {
  state: createDefaultSavedState(),
  setState: () => {
    throw new Error("Should not be called");
  },
};

// const defaultSavedStateAccessor: SavedStateAccessor

const SavedStateContext = createContext<SavedStateAccessor>(
  defaultSavedStateAccessor,
);

function SavedStateProvider({ children }: { children: React.ReactNode }) {
  const [state, _setState] = useState<ExtensionData>(createDefaultSavedState);

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

/**
 * Hook for accessing particular parts of the state of a context.
 * @template T The value that is handled.
 * @template E Arguments passed to the hook.
 */
type ContextHook<T, E extends object = object> = ({
  args,
}: {
  /**
   * Arguments passed to the hook that pertain to a specific hook.
   */
  readonly args: E;
  // currently not used, but have it here so its purpose is obvious
  hookArgs?: ContextHookArgs;
}) => ValueState<T>;

/**
 * @template T Returned by the getter, set by the setter.
 * @template K Key of property in the save data that is needed
 * for updating this value, if previous data is needed.
 * @template E Arguments passed to the hook and further to handlers;
 * any data that would be relevant for the hook that is not present
 * in the context.
 */
interface HookFactoryArgs<
  T,
  K extends keyof ExtensionData,
  E extends object = object,
> {
  /**
   * Given the state, returns the relevant value.
   * @param state The state.
   * @param hookArgs Arguments passed to the hook during its creation.
   */
  getFromState: (state: Pick<ExtensionData, K>, hookArgs: E) => T;

  /**
   * Given the previous state of a relevant property and a new value for
   * that property (or some part of it), return an updated property.
   * @param prevState The (soon to be) previous state.
   * @param newValue The new value.
   * @param hookArgs Arguments passed to the hook during its creation.
   */
  createNewState: (
    prevState: Pick<ExtensionData, K>,
    newValue: T,
    hookArgs: E,
  ) => Pick<ExtensionData, K>;
}

/**
 * Factory for creating hooks for accessing the context.
 * @template T The type handled by the hook.
 * @template K Key used to limit access to the context state. Specify
 * the key of the property that is relevant for this hook.
 * @template E Arguments needed for the hook itself.
 */
function hookFactory<
  T,
  K extends keyof ExtensionData,
  E extends object = object,
>(args: HookFactoryArgs<T, K, E>): ContextHook<T, E> {
  return function contextHook(contextHookArgs) {
    const { state, setState } = useContext(SavedStateContext);

    // quick-and-dirty deep copy
    function copy<T>(state: T): T {
      return JSON.parse(JSON.stringify(state));
    }

    return {
      set(newValue) {
        setState({
          ...state,
          ...args.createNewState(copy(state), newValue, contextHookArgs.args),
        });
      },
      get() {
        return args.getFromState(copy(state), contextHookArgs.args);
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
const _useLoopableIndex = hookFactory<number, "loopableIndex">({
  createNewState(prevState, newValue) {
    return { loopableIndex: newValue };
  },
  getFromState(state) {
    return state.loopableIndex;
  },
});

/**
 * The index of the loopable element.
 */
export function useLoopableIndex() {
  return _useLoopableIndex({ args: {} });
}

/**
 * The selectors used to query for the loopable elements.
 */
const _useSelectors = hookFactory<string, "selectors">({
  createNewState(prevState, newValue) {
    return { selectors: newValue };
  },
  getFromState(state) {
    return state.selectors;
  },
});

/**
 * The selectors used to query for the loopable elements.
 */
export function useSelectors() {
  return _useSelectors({ args: {} });
}

interface TimeSectionArgs {
  index: number;
}

/**
 * The loop startpoint.
 */
export const useStartTime = hookFactory<
  number,
  "timeSections",
  TimeSectionArgs
>({
  createNewState(prev, startTime, hookArgs) {
    prev.timeSections[hookArgs.index].startTime = startTime;
    return prev;
  },
  getFromState(state, hookArgs) {
    return state.timeSections[hookArgs.index].startTime;
  },
});

/**
 * The loop endpoint.
 */
export const useEndTime = hookFactory<number, "timeSections", TimeSectionArgs>({
  createNewState(prev, newValue, hookArgs) {
    prev.timeSections[hookArgs.index].endTime = newValue;
    return prev;
  },
  getFromState(state, hookArgs) {
    return state.timeSections[hookArgs.index].endTime;
  },
});

/**
 * The loop endpoints.
 */
export function useLoopEnds({
  index,
  startArgs,
  endArgs,
}: {
  index: number;
  startArgs?: ContextHookArgs;
  endArgs?: ContextHookArgs;
}): {
  startTime: ValueState<number>;
  endTime: ValueState<number>;
} {
  const startTime = useStartTime({ hookArgs: startArgs, args: { index } });
  const endTime = useEndTime({ hookArgs: endArgs, args: { index } });

  return { startTime: startTime, endTime: endTime };
}

const _useTimeSection = hookFactory<
  ExtensionData["timeSections"],
  "timeSections"
>({
  getFromState(state, hookArgs) {
    return state.timeSections;
  },
  createNewState(prevState, newValue, hookArgs) {
    return { timeSections: newValue };
  },
});

function useTimeSection() {
  return _useTimeSection({ args: {} });
}

export function useTimeSectionControl(): { length: ValueState<number> } {
  const timeSection = useTimeSection();

  /**
   * The length of the time section array.
   */
  function getLength(): number {
    return timeSection.get().length;
  }

  /**
   * Set the length of the time section array. Increasing the size
   * Automatically adds default values, and decreasing the size
   * Gets rid of values. Same length is a no-op.
   * @param length The new length, should be > 0.
   */
  function setLength(length: number) {
    if (length < 1) return;

    const prev = timeSection.get();
    const spotsNeeded = length - prev.length;
    let current: ReturnType<typeof timeSection.get>;
    if (spotsNeeded === 0) {
      return;
    } else if (spotsNeeded > 0) {
      current = [
        ...prev,
        ...Array(spotsNeeded)
          .fill(null)
          .map(() => createDefaultSavedState().timeSections[0]),
      ];
    } else {
      current = prev.slice(0, length);
    }

    timeSection.set(current);
  }

  return {
    length: {
      get: getLength,
      set: setLength,
    },
  };
}

export default SavedStateProvider;
