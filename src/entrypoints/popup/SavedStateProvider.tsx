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

/**
 * The saved state of the popup.
 */
export function useSavedState(): ValueState<PopupData> {
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
export function useLoopableIndex(args?: ContextHookArgs): ValueState<number> {
  const { state, setState } = useContext(SavedStateContext);

  return {
    get() {
      return state.loopableIndex;
    },
    set(newValue) {
      setState({ ...state, loopableIndex: newValue });
    },
  };
}

/**
 * The selectors used to query for the loopable elements.
 */
export function useSelectors(args?: ContextHookArgs): ValueState<string> {
  const { state, setState } = useContext(SavedStateContext);

  return {
    get() {
      return state.selectors;
    },
    set(newValue) {
      setState({ ...state, selectors: newValue });
    },
  };
}

/**
 * The loop startpoint.
 */
export function useStartTime(args?: ContextHookArgs): ValueState<number> {
  const { state, setState } = useContext(SavedStateContext);

  return {
    get() {
      return state.startTime;
    },
    set(newValue) {
      setState({ ...state, startTime: newValue });
    },
  };
}

/**
 * The loop endpoint.
 */
export function useEndTime(args?: ContextHookArgs): ValueState<number> {
  const { state, setState } = useContext(SavedStateContext);

  return {
    get() {
      return state.endTime;
    },
    set(newValue) {
      setState({ ...state, endTime: newValue });
    },
  };
}

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
