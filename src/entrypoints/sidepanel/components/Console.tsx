import { ConsoleContext, toStringIndividual } from "../ConsoleContext";

import "./Console.css";

/**
 * Component for displaying messages sent to the console.
 */
export default function Console() {
  const { log } = useContext(ConsoleContext);

  return (
    <div className="console wrapper">
      {log.map((msg, i) => {
        const message = toStringIndividual(msg);
        return (
          <p key={i} className={"console entry"}>
            <span className="console datetime">{message.datetime}</span>
            <span className={`console level ${message.level.toLowerCase()}`}>
              {`[${message.level}]`}
            </span>
            <span className="console message">{message.message}</span>
          </p>
        );
      })}
    </div>
  );
}
