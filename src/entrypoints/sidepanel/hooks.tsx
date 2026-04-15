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

      let customDelay: number;
      const ret = executable ? executable() : activationFunction();
      customDelay = getValidDelay(ret.delay ?? delay);
      setState(() => ret.stateValue);
      const id = window.setTimeout(() => {
        deactivationFunction();
        setState(() => null);
      }, customDelay);
      setTimeoutId(() => id);
    },
  };
}
