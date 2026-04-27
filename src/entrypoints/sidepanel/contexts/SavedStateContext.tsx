import { createContext } from "react";
import { URLData } from "@/src/typing/data";
import { ValueState } from "@/src/typing/state";
import {
  HookFactoryArgs,
  ContextHookArgs,
  hookFactory as baseHookFactory,
} from "../contextHookFactory";

interface SavedStateAccessor {
  state: URLData;
  setState: (newState: URLData) => void;
}

function createDefaultSavedState(): URLData {
  return {
    loopableIndex: -1,
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

export function SavedStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, _setState] = useState<URLData>(createDefaultSavedState);

  function setState(newState: URLData) {
    _setState(() => newState);
  }

  return (
    <SavedStateContext value={{ state, setState }}>
      {children}
    </SavedStateContext>
  );
}

/**
 * The saved state of the extension for the current URL.
 */
export function useSavedState(
  // it's showing the intention, though not being used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  args?: ContextHookArgs,
): ValueState<URLData> & { reset: () => void } {
  const { state, setState } = useContext(SavedStateContext);
  return {
    set: setState,
    get() {
      return state;
    },
    reset() {
      setState(createDefaultSavedState());
    },
  };
}

function hookFactory<T, K extends keyof URLData, E extends object = object>(
  args: Omit<HookFactoryArgs<T, URLData, Pick<URLData, K>, E>, "contextState">,
) {
  return baseHookFactory({ ...args, contextState: SavedStateContext });
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

/**
 * Access the state of disablement of a time section.
 */
export const useTimeSectionDisable = hookFactory<
  boolean,
  "timeSections",
  TimeSectionArgs
>({
  createNewState(prevState, newValue, hookArgs) {
    prevState.timeSections[hookArgs.index].disabled = newValue;
    return prevState;
  },
  getFromState(state, hookArgs) {
    return !!state.timeSections[hookArgs.index].disabled;
  },
});

const _useTimeSection = hookFactory<URLData["timeSections"], "timeSections">({
  getFromState(state) {
    return state.timeSections;
  },
  createNewState(prevState, newValue) {
    return { timeSections: newValue };
  },
});

function useTimeSection() {
  return _useTimeSection({ args: {} });
}

export function useTimeSectionControl(): {
  length: ValueState<number>;
  setAllDisabled: (disabled: boolean) => void;
} {
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

  /**
   * Set the state of disablement for all time sections.
   */
  function setAllDisabled(disabled: boolean) {
    timeSection.set(
      timeSection.get().map((section) => {
        return {
          ...section,
          disabled,
        };
      }),
    );
  }

  return {
    length: {
      get: getLength,
      set: setLength,
    },
    setAllDisabled,
  };
}

const _useTitle = hookFactory<URLData["title"], "title">({
  getFromState(state) {
    return state.title;
  },
  createNewState(prevState, newValue) {
    return {
      ...prevState,
      title: newValue,
    };
  },
});

/**
 * The title of the current URL.
 */
export function useTitle() {
  return _useTitle({ args: {} });
}

const _useDescription = hookFactory<URLData["description"], "description">({
  getFromState(state) {
    return state.description;
  },
  createNewState(prevState, newValue) {
    return {
      ...prevState,
      description: newValue,
    };
  },
});

/**
 * The description of the current URL.
 */
export function useDescription() {
  return _useDescription({ args: {} });
}

const _useTags = hookFactory<Set<string>, "tags">({
  getFromState(state) {
    return new Set(state.tags);
  },
  createNewState(prevState, newValue) {
    return {
      ...prevState,
      tags: [...newValue],
    };
  },
});

/**
 * Tags for the current URL.
 */
export function useTags() {
  return _useTags({ args: {} });
}
