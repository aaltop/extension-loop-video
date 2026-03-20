/**
 * @file Types describing getting and handling some state.
 */

export type Setter<T> = (newValue: T) => void;
export type Getter<T> = () => T;

/**
 * Accessors for the state of a value.
 */
export interface ValueState<T> {
  readonly set: Setter<T>;
  readonly get: Getter<T>;
}
