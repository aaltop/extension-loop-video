import { ConsoleContext } from "../ConsoleContext";

/**
 * Component for displaying messages sent to the console.
 */
export default function Console() {
  const { log } = useContext(ConsoleContext);

  const latest = log.at(-1);

  const message = latest
    ? `${latest.datetime.toISOString()} ${latest.message}`
    : "";

  return (
    <>
      {log.slice(-5).map((msg, i) => {
        const message = msg
          ? `${msg.datetime.toISOString()} ${msg.message}`
          : "";
        return (
          <p key={i} className="error">
            {message}
          </p>
        );
      })}
    </>
  );
}
