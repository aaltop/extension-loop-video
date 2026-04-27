import { useLoopableIndex, useSelectors } from "../contexts/SavedStateContext";
import { ConsoleContext } from "../contexts/ConsoleContext";
import { commands } from "../commands";
import "./ElementHighlight.css";
import { handleResponse } from "../helpers";

/**
 * Component for highlighting elements based on a selector.
 */
export default function ElementHighlight() {
  const loopableIndex = useLoopableIndex();
  const selectors = useSelectors();
  const { logger } = useContext(ConsoleContext);
  const [elemNum, setElemNum] = useState<number>(0);

  useEffect(() => {
    async function execute() {
      await queryAndSetElemNum();
    }
    execute();
  }, []);

  async function getElementListLength(selectors: string) {
    const response = await commands.elementListLength({
      selectors,
    });
    if (response.success) {
      return response.data.length;
    }
  }

  /**
   * Queries and sets the number of elements matching the current
   * selectors value.
   * @returns the new elemNum value.
   */
  async function queryAndSetElemNum() {
    const len = (await getElementListLength(selectors.get())) ?? 0;
    setElemNum(() => len);
    return len;
  }

  /**
   * Add `val` to the loopableIndex. This updates the state to be current
   * before the update.
   * @returns the new index.
   */
  async function addToIndex(val: number) {
    const newElemNum = await queryAndSetElemNum();
    if (newElemNum === 0 || newElemNum === null) {
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
    <>
      <button
        type="button"
        className="element-highlight nav"
        onClick={async () => await addToIndex(-1)}
      >
        Previous
      </button>
      <button
        type="button"
        className="element-highlight highlight"
        onClick={async () => {
          // this addToIndex call is here mostly to keep the values
          // up to date if something changes on the page.
          const newLoopableIndex = await addToIndex(0);
          if (newLoopableIndex < 0) return;
          const indices = [newLoopableIndex];
          const response = await commands.highlightElements({
            selectors: selectors.get(),
            indices,
          });
          handleResponse(response, logger);
        }}
      >
        {`Highlight video ${loopableIndex.get() + 1} out of ${elemNum ?? "none"}`}
      </button>
      <button
        type="button"
        className="element-highlight nav"
        onClick={async () => await addToIndex(1)}
      >
        Next
      </button>
    </>
  );
}
