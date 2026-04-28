/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext } from "react";

export const LoggingLevel = {
  DEBUG: 0,
  INFO: 10,
  WARNING: 20,
  ERROR: 30,
  CRITICAL: 40,
} as const;

/**
 * Inverse mapping of {@link LoggingLevel}.
 */
const LoggingLevelNumber = Object.fromEntries(
  Object.entries(LoggingLevel).map(([key, val]) => [val, key]),
);

/**
 * Union matcing the numeric levels of {@link LoggingLevel}.
 */
export type LoggingLevelNumeric =
  (typeof LoggingLevel)[keyof typeof LoggingLevel];

/**
 * Union matcing the string representation of the levels of {@link LoggingLevel}.
 */
export type LoggingLevelString = keyof typeof LoggingLevel;

/**
 * Get the word that represents the current log level.
 */
export function getLogLevel(level: number): string {
  level = Math.min(Math.max(LoggingLevel.DEBUG, level), LoggingLevel.CRITICAL);
  const idx = Math.floor(level / 10) * 10;
  return LoggingLevelNumber[idx.toString()];
}

/**
 * Represents information logged to console.
 */
export interface ConsoleEntry {
  readonly datetime: Date;
  readonly level: number;
  readonly message: string;
}

function createConsoleEntry(level: number, ...data: any[]): ConsoleEntry {
  const message = data
    .map((datum) => {
      let str = JSON.stringify(datum, undefined, "");
      if (typeof str === "string") {
        // remove the unnecessary quotation marks that surround the string
        str = str.length === 0 ? "" : str.slice(1, -1);
      }
      return str;
    })
    .join(" ");
  return { datetime: new Date(), level, message };
}

export type ConsoleEntryString = {
  [K in keyof ConsoleEntry]: string;
};

/**
 * Transforms the values of the {@link ConsoleEntry} to strings individually.
 */
export function toStringIndividual(entry: ConsoleEntry): ConsoleEntryString {
  return {
    datetime: entry.datetime.toISOString(),
    level: getLogLevel(entry.level),
    message: entry.message,
  };
}

/**
 * Return the console entry as a string.
 */
export function toString(entry: ConsoleEntry) {
  const stringEntry = toStringIndividual(entry);
  return `${stringEntry.datetime} [${stringEntry.level}] ${stringEntry.message}`;
}

type Log = ConsoleEntry[];

type LogCall = (...data: any[]) => void;
export interface Logger {
  debug: LogCall;
  info: LogCall;
  warning: LogCall;
  error: LogCall;
  critical: LogCall;
  log: (level: number, ...data: any[]) => void;
}

interface ConsoleContextValue {
  readonly log: Log;
  readonly logger: Logger;
}

function placeholder() {
  throw new Error("should not be called");
}
export const ConsoleContext = createContext<ConsoleContextValue>({
  log: [],
  logger: {
    log: placeholder,
    critical: placeholder,
    debug: placeholder,
    error: placeholder,
    info: placeholder,
    warning: placeholder,
  },
});

export function ConsoleContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [log, setLog] = useState<Log>([]);

  function loggerWithLevel(level: LoggingLevelNumeric) {
    function log(...data: any[]) {
      setLog((prev) => [...prev, createConsoleEntry(level, ...data)]);
    }
    return log;
  }

  const logger: Logger = {
    log(level, ...data) {
      setLog((prev) => [...prev, createConsoleEntry(level, ...data)]);
    },
    critical: loggerWithLevel(LoggingLevel.CRITICAL),
    debug: loggerWithLevel(LoggingLevel.DEBUG),
    error: loggerWithLevel(LoggingLevel.ERROR),
    info: loggerWithLevel(LoggingLevel.INFO),
    warning: loggerWithLevel(LoggingLevel.WARNING),
  };

  return (
    <ConsoleContext
      value={{
        log,
        logger,
      }}
    >
      {children}
    </ConsoleContext>
  );
}

export default ConsoleContext;
