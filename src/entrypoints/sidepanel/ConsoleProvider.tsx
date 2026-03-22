import { createContext } from "react";

interface ConsoleEntry {
  datetime: Date;
  message: string;
}

type Log = ConsoleEntry[];

interface Logger {
  log: (message: string) => void;
}

interface ConsoleContextValue {
  readonly log: Log;
  readonly logger: Logger;
}

export const ConsoleContext = createContext<ConsoleContextValue>({
  log: [],
  logger: {
    log: () => {
      throw new Error("should not be called");
    },
  },
});

function ConsoleContextProvider({ children }: { children: React.ReactNode }) {
  const [log, setLog] = useState<Log>([]);

  const logger: Logger = {
    log(message) {
      setLog((prev) => [...prev, { datetime: new Date(), message }]);
    },
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

export default ConsoleContextProvider;
