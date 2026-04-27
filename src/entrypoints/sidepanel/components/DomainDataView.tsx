import { use } from "react";
import { commands } from "../commands";
import { ConsoleContext } from "../contexts/ConsoleContext";
import DomainDataContext from "../contexts/DomainDataContext";
import { handleResponse } from "../helpers";
import { useCheckedMap } from "../hooks";
import ButtonRow from "./ButtonRow";

export default function DomainDataView() {
  const [textFilter, setTextFilter] = useState<string>("");
  const tagMap = useCheckedMap<string>({ defaultValue: null });
  const urlDataMap = useCheckedMap<string>({ defaultValue: null });
  const domainData = use(DomainDataContext);
  const { logger } = use(ConsoleContext);

  useEffect(() => {
    domainData.update();
  }, []);

  return (
    <div>
      <input
        type="text"
        value={textFilter}
        onChange={(ev) => {
          setTextFilter(() => ev.target.value.toLowerCase());
        }}
      ></input>
      <button
        type="button"
        onClick={async () => {
          await domainData.update();
        }}
      >
        Update
      </button>
      <details>
        <summary>Tags</summary>
        <ul style={{ display: "flex" }}>
          {domainData.tagSet.values().map((tag) => {
            return (
              <li style={{ listStyle: "none" }} key={tag}>
                <label>
                  {tag}
                  <input
                    type="checkbox"
                    name={tag}
                    onChange={() => tagMap.toggle(tag)}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </details>
      <ul>
        {domainData.metadata.map(({ url, ...val }) => {
          /**
           * Whether this entry has each of the chosen tags.
           */
          const correctTags =
            tagMap.size === 0 ||
            !!val.tags?.reduce((prev, cur) => {
              return prev || tagMap.has(cur);
            }, false);

          /**
           * Whether this entry matches the text filter.
           */
          const matchesTextFilter =
            textFilter === "" ||
            !!val.title?.toLowerCase().includes(textFilter) ||
            !!val.description?.toLowerCase().includes(textFilter);

          if (!matchesTextFilter || !correctTags) return null;

          return (
            <li key={url}>
              <a href={url}>{`${val.title ?? "<No title>"} (${url})`}</a>
              <input
                type="checkbox"
                onChange={() => {
                  urlDataMap.toggle(url);
                }}
              />
              <p>{val.description ?? ""}</p>
              <ul>
                {val.tags?.map((tag) => (
                  <li>{tag}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <ButtonRow>
        <button
          type="button"
          onClick={async () => {
            if (window.confirm("Delete all domain data?")) {
              await commands.deleteDomainData();
              domainData.update();
            }
          }}
        >
          Delete all
        </button>
        <button
          type="button"
          disabled={urlDataMap.size < 1}
          onClick={async () => {
            if (
              urlDataMap.size > 0 &&
              window.confirm("Delete chosen domain data?")
            ) {
              const response = await commands.deleteDomainUrlData({
                urls: [...urlDataMap.keys()],
              });
              handleResponse(response, logger);
              // assume success
              urlDataMap.clear();
              domainData.update();
            }
          }}
        >
          Delete chosen
        </button>
      </ButtonRow>
    </div>
  );
}
