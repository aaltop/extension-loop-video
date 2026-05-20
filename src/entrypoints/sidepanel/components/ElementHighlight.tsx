import { useLoopableIndex } from "../contexts/SavedStateContext";
import { ConsoleContext } from "../contexts/ConsoleContext";
import { commands } from "../commands";
import "./ElementHighlight.css";
import { handleResponse } from "../helpers";
import { synchronize } from "../messages";
import ButtonRow from "./ButtonRow";

/**
 * Component for highlighting elements based on a selector.
 */
export default function ElementHighlight() {
  const loopableIndex = useLoopableIndex();
  const { logger } = useContext(ConsoleContext);
  // const [elemNum, setElemNum] = useState<number>(0);
  const [elements, setElements] = useState<{ paused: boolean }[]>([]);

  useEffect(() => {
    sync();
  }, []);

  useEffect(synchronize(sync), []);

  // doesn't set the loopableIndex because it's better if that updates
  // as a result of user interaction only. That way, the tab can be changed
  // and the state will update, but the choice of index does not. As a result,
  // the user potentially sees a discrepancy but they also don't lose the
  // index they chose in the other tab until they actually interact in this tab.
  async function sync() {
    await queryAndSetElementList();
  }

  /**
   * Queries and sets the information about the elements.
   * @returns the queried-for information.
   */
  async function queryAndSetElementList() {
    const response = await commands.getMediaElementList();
    handleResponse(response, logger);
    if (!response.success) return null;
    setElements(() => response.data);
    return response.data;
  }

  /**
   * Add `val` to the loopableIndex. This updates the state to be current
   * before the update.
   * @returns the new index.
   */
  async function addToIndex(val: number) {
    const elemList = await queryAndSetElementList();
    const newElemNum = elemList?.length ?? 0;
    if (newElemNum === 0) {
      loopableIndex.set(-1);
      return -1;
    }
    const prev = loopableIndex.get();

    let newIndex = prev + val;
    newIndex = (newElemNum + (newIndex % newElemNum)) % newElemNum;
    loopableIndex.set(newIndex);
    return newIndex;
  }

  return (
    <div className="element-highlight-wrapper">
      <ButtonRow>
        <select
          onMouseEnter={() => queryAndSetElementList()}
          onFocus={() => queryAndSetElementList()}
          value={loopableIndex.get().toString()}
          onChange={(ev) => {
            loopableIndex.set(parseInt(ev.target.value));
          }}
        >
          {elements.map((elem, idx) => {
            const state = elem.paused ? "paused" : "playing";
            return (
              <option
                className={`element-highlight-video-option ${state}`}
                // sketchy, but no other particular identifiers
                key={idx}
                value={idx.toString()}
              >{`Video ${idx + 1} (${state})`}</option>
            );
          })}
        </select>
        <button
          type="button"
          className="element-highlight-nav"
          onClick={async () => {
            await addToIndex(-1);
          }}
        >
          Previous
        </button>
        <button
          type="button"
          className="element-highlight-highlight"
          onClick={async () => {
            // this addToIndex call is here mostly to keep the values
            // up to date if something changes on the page.
            const newLoopableIndex = await addToIndex(0);
            if (newLoopableIndex < 0) return;
            const indices = [newLoopableIndex];
            const response = await commands.highlightElements({
              selectors: "video",
              indices,
            });
            handleResponse(response, logger);
          }}
        >
          {`Highlight video ${loopableIndex.get() + 1} out of ${elements.length ?? "none"}`}
        </button>
        <button
          type="button"
          className="element-highlight-nav"
          onClick={async () => await addToIndex(1)}
        >
          Next
        </button>
      </ButtonRow>
    </div>
  );
}
