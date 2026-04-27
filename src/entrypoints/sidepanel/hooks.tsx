import { NOTIFICATION_TIME_MEDIUM } from "@/src/globals";

function getValidDelay(delay: number) {
  return delay < 0 ? NOTIFICATION_TIME_MEDIUM : delay;
}

/**
 * @template T Type returned by the activation function to represent
 * the result.
 */
export interface TimeoutProps<T = "success" | "failure"> {
  /**
   * Function to execute when activated. Returns a value that represents the result.
   * Can optionally return a custom delay that will be used for the timeout.
   */
  activationFunction(): {
    delay?: number;
    stateValue: T;
  };
  deactivationFunction(): void;
  deactivationDelay: number;
}

/**
 * Handle state changes using timeouts.
 * @param activationFunction Run when `activate()` is run, unless an overriding
 * activationFunction is passed to `activate()`.
 * @param deactivationFunction Run when the timeout time is up or when activating
 * the timeout.
 * @param deactivationDelay The default delay to set for the timeout, in milliseconds.
 */
export function useTimeout<T extends string>({
  activationFunction,
  deactivationDelay,
  deactivationFunction,
}: TimeoutProps<T>): {
  state: T | null;
  setDelay(delay: number): void;
  activate(props: {
    activationFunction?: TimeoutProps<T>["activationFunction"];
  }): void;
} {
  const [state, setState] = useState<T | null>(null);
  const [delay, _setDelay] = useState<number>(() =>
    getValidDelay(deactivationDelay),
  );
  const [timeoutId, setTimeoutId] = useState<number | undefined>(undefined);

  function setDelay(delay: number) {
    _setDelay(() => getValidDelay(delay));
  }

  return {
    state,
    setDelay,
    activate({ activationFunction: executable }) {
      // reset the state
      window.clearTimeout(timeoutId);
      deactivationFunction();
      setState(() => null);

      const ret = executable ? executable() : activationFunction();
      const customDelay: number = getValidDelay(ret.delay ?? delay);
      setState(() => ret.stateValue);
      const id = window.setTimeout(() => {
        deactivationFunction();
        setState(() => null);
      }, customDelay);
      setTimeoutId(() => id);
    },
  };
}

/**
 * Return interface for {@link useCheckedMap}.
 */
type CheckedMapReturn<TKey, TValue> = Pick<
  Map<TKey, TValue>,
  "has" | "size" | "clear"
> & {
  /**
   * Toggle the inclusion of the key.
   * @param value If not specified, set as the defaultValue passed
   * to {@link useCheckedMap}.
   */
  toggle(key: TKey, value?: TValue): void;

  /**
   * An iterable for the key-value pairs.
   */
  entries(): Iterable<[TKey, TValue]>;

  /**
   * An iterable for the keys.
   */
  keys(): Iterable<TKey>;

  /**
   * An iterable for the values.
   */
  values(): Iterable<TValue>;
};
/**
 * A "checked map" meant primarily for use in situations where multiple
 * related values can be included or excluded, e.g. a set of checkbox
 * inputs. Allows easy toggling of a value's inclusion.
 * @template TKey The key of the map.
 * @template TValue The value of the map.
 */
export function useCheckedMap<TKey = unknown, TValue = unknown>({
  defaultValue,
}: {
  defaultValue: TValue;
}): CheckedMapReturn<TKey, TValue> {
  type TMap = Map<TKey, TValue>;

  const [state, setState] = useState<TMap>(() => new Map<TKey, TValue>());

  /**
   * Operate in-place on a shallow-copied version of the map based on an passed
   * operator function.
   */
  function operateInPlace(operator: (newMap: TMap) => void) {
    setState((prev) => {
      const newMap = new Map<TKey, TValue>([...prev]);
      operator(newMap);
      return newMap;
    });
  }

  const ret: CheckedMapReturn<TKey, TValue> = {
    toggle(key, value) {
      operateInPlace((map) => {
        if (map.has(key)) {
          map.delete(key);
        } else {
          map.set(key, value ?? defaultValue);
        }
      });
    },
    has(key) {
      return state.has(key);
    },
    entries() {
      return state.entries();
    },
    values() {
      return state.values();
    },
    keys() {
      return state.keys();
    },
    clear() {
      operateInPlace((map) => {
        map.clear();
      });
    },
    size: state.size,
  };
  return ret;
}
