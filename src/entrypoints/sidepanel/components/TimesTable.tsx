/**
 * @file Table containing inputs for time.
 */

import {
  useLoopableIndex,
  useLoopEnds,
  useSelectors,
  useTimeSectionControl,
  useTimeSectionDisable,
} from "../SavedStateContext";
import { commands } from "../commands";
import ButtonRow from "./ButtonRow";

import "./TimesTable.css";

function TimeInput({
  time,
  setTime,
}: {
  time: number;
  setTime: (time: number) => void;
}) {
  const loopableIndex = useLoopableIndex();
  const selectors = useSelectors();

  return (
    <td>
      <div className="times-table">
        <button
          className="times-table"
          type="button"
          onClick={async () => {
            const response = await commands.getVideoTime({
              loopableIndex: loopableIndex.get(),
              selectors: selectors.get(),
            });
            if (response.success) {
              setTime(response.data.time);
            } else {
              await commands.logMessage(response.message);
            }
          }}
        >
          Set as current video time
        </button>
        <input
          className="times-table"
          type="number"
          min={0}
          value={time}
          onChange={(ev) => {
            setTime(parseFloat(ev.target.value));
          }}
        />
      </div>
    </td>
  );
}

function TimesTableRow({ index }: { index: number }) {
  const { startTime, endTime } = useLoopEnds({ index });
  const disabled = useTimeSectionDisable({ args: { index } });

  return (
    <tr>
      <td>
        <button type="button" onClick={() => disabled.set(!disabled.get())}>
          {disabled.get() ? "Enable" : "Disable"}
        </button>
      </td>
      <TimeInput time={startTime.get()} setTime={startTime.set} />
      <TimeInput time={endTime.get()} setTime={endTime.set} />
    </tr>
  );
}

export default function TimesTable() {
  const { length: timeSectionsLength, setAllDisabled } =
    useTimeSectionControl();
  const [prevAllDisabled, setPrevAllDisabled] = useState<boolean>(false);

  const sections = Array.from(new Array(timeSectionsLength.get()), (_, i) => (
    <TimesTableRow key={i} index={i} />
  ));

  return (
    <>
      <ButtonRow>
        <button
          type="button"
          onClick={() => {
            setAllDisabled(!prevAllDisabled);
            setPrevAllDisabled(!prevAllDisabled);
          }}
        >
          {prevAllDisabled ? "Enable all" : "Disable All"}
        </button>
        <button
          type="button"
          disabled={timeSectionsLength.get() <= 1}
          onClick={() => {
            timeSectionsLength.set(timeSectionsLength.get() - 1);
          }}
        >
          Remove Section
        </button>
        <button
          type="button"
          onClick={() => {
            timeSectionsLength.set(timeSectionsLength.get() + 1);
          }}
        >
          Add Section
        </button>
      </ButtonRow>
      <table>
        <thead>
          <tr>
            <th scope="col">Disable/Enable Section</th>
            <th scope="col">Start Time</th>
            <th scope="col">End Time</th>
          </tr>
        </thead>
        <tbody>{sections}</tbody>
      </table>
    </>
  );
}
