import { ConsoleContext, toStringIndividual } from "../contexts/ConsoleContext";

import "./Console.css";

/**
 * Component for displaying messages sent to the console.
 */
export default function Console({
  minLevel,
}: {
  /**
   * The logging level; see LoggingLevel.
   */
  minLevel: number;
}) {
  const { log } = useContext(ConsoleContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref || !ref.current) return;
    ref.current.scroll({
      left: 0,
      top: ref.current.scrollHeight,
      behavior: "instant",
    });
  }, [minLevel]);

  return (
    <div ref={ref} className="console wrapper">
      {log.map((msg, i) => {
        if (msg.level < minLevel) {
          return null;
        }
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
