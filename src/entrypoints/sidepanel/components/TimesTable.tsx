import { TimeSection } from "../commands";

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
  return (
    <td>
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

function TimesTableRow() {
  const times = useTimes();

  return (
    <tr>
      <TimeInput time={times.startTime} setTime={times.setStartTime} />
      <TimeInput time={times.endTime} setTime={times.setEndTime} />
    </tr>
  );
}

export default function TimesTable() {
  const [numSections, _setNumSections] = useState<number>(1);

  function setNumSections(sections: number) {
    if (sections < 1) return;
    _setNumSections(() => sections);
  }

  const sections = Array.from(new Array(numSections), (_, i) => (
    <TimesTableRow key={i} />
  ));

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNumSections(numSections - 1);
        }}
      >
        Remove Section
      </button>
      <button
        type="button"
        onClick={() => {
          setNumSections(numSections + 1);
        }}
      >
        Add Section
      </button>
      <table>
        <thead>
          <tr>
            <th scope="col">Start Time</th>
            <th scope="col">End Time</th>
          </tr>
        </thead>
        <tbody>{sections}</tbody>
      </table>
    </>
  );
}
