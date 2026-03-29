import { TimeSection } from "../commands";
import {
  useLoopableIndex,
  useLoopEnds,
  useSelectors,
  useTimeSectionControl,
  useTimeSectionDisable,
} from "../SavedStateProvider";
import { commands } from "../commands";

type Times = TimeSection;

function useTimes() {
  const [times, setTimes] = useState<Times>({ startTime: 0, endTime: 0 });

  function isValid(time: number): boolean {
    return time >= 0;
  }

  function setStartTime(startTime: number) {
    setTimes((prev) => {
      if (!isValid(startTime)) return prev;
      return { ...prev, startTime };
    });
  }

  function setEndTime(endTime: number) {
    setTimes((prev) => {
      if (!isValid) return prev;
      return { ...prev, endTime };
    });
  }

  return { ...times, setStartTime, setEndTime };
}

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
      <button
        className="video-time-button"
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
        type="number"
        value={time}
        onChange={(ev) => {
          setTime(parseFloat(ev.target.value));
        }}
      />
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
