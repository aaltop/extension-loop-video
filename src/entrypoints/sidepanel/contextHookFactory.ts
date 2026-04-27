/**
 * @file Typing for a factory for simplifying the creation of context hooks (
 * hooks that limit access to individual parts of larger context state).
 */

import { ValueState } from "@/src/typing/state";
import { Context, use } from "react";

// interface Permissions {
//   set?: boolean;
// }

// It's a placeholder, might be used, might be not, currently isn't
// but should be added where it could be needed so that if it gets
// updated, it doesn't need to be added everywhere.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ContextHookArgs {}

/**
 * Hook for accessing particular parts of the state of a context.
 * @template T The value that is handled.
 * @template E Arguments passed to the hook.
 */
export type ContextHook<T, E extends object = object> = ({
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
 * Arguments expected by the hook factory.
 * @template T Returned by the getter, set by the setter.
 * @template C The state of the context.
 * @template S State handled by the hook. A subset of C.
 * @template E Arguments passed to the hook and further to handlers;
 * any data that would be relevant for the hook that is not present
 * in the context.
 */
export interface HookFactoryArgs<
  T,
  C extends S,
  S extends object,
  E extends object = object,
> {
  /**
   * Given the state, returns the relevant value.
   * @param state The state.
   * @param hookArgs Arguments passed to the hook during its creation.
   */
  getFromState: (state: S, hookArgs: E) => T;

  /**
   * Given the previous state of a relevant property and a new value for
   * that property (or some part of it), return an updated property.
   * @param prevState The (soon to be) previous state.
   * @param newValue The new value.
   * @param hookArgs Arguments passed to the hook during its creation.
   */
  createNewState: (prevState: S, newValue: T, hookArgs: E) => S;

  /**
   * Context with particular state, passable to a React use or useContext.
   */
  contextState: Context<{ state: C; setState: (newState: C) => void }>;
}

/**
 * Factory for creating hooks for accessing the context.
 * @template T The type handled by the hook.
 * @template S State handled by the hook. A subset of C.
 * @template C The state of the context.
 * @template E Arguments needed for the hook itself.
 */
export function hookFactory<
  T,
  C extends S,
  S extends object,
  E extends object = object,
>(args: HookFactoryArgs<T, C, S, E>): ContextHook<T, E> {
  return function contextHook(contextHookArgs) {
    const { state, setState } = use(args.contextState);

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
