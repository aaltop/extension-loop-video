import { commands, DomainData, URLMetaData } from "../commands";
import { ConsoleContext } from "../contexts/ConsoleContext";
import { handleResponse } from "../helpers";
import { useCheckedMap } from "../hooks";
import ButtonRow from "./ButtonRow";

interface CombinedMetaData extends URLMetaData {
  url: string;
}

function useURLMetaData(): {
  data: CombinedMetaData[];
  tagSet: Set<string>;
  update: () => Promise<void>;
} {
  const [domainData, setDomainData] = useState<DomainData>({ loopingData: {} });
  const { logger } = useContext(ConsoleContext);

  // make a list of the data, flattening the url to be with the data
  const data = useMemo<CombinedMetaData[]>(() => {
    return Object.entries(domainData.loopingData).map(([url, dat]) => {
      return { ...dat, url };
    });
  }, [domainData]);

  // create a set out of the tags
  const tagSet = useMemo<Set<string>>(() => {
    const allTags = Object.entries(data).flatMap(([_, { tags }]) => {
      if (!tags) return [];

      return tags;
    });
    return new Set(allTags);
  }, [data]);

  /**
   * Update the domain data.
   */
  async function update() {
    const response = await commands.loadDomainData();
    if (!response.success) {
      setDomainData(() => {
        return { loopingData: {} };
      });
    } else {
      setDomainData(() => response.data);
    }
  }

  return {
    data,
    tagSet,
    update,
  };
}

export default function DomainDataView() {
  const [textFilter, setTextFilter] = useState<string>("");
  const tagMap = useCheckedMap<string>({ defaultValue: null });
  const urlDataMap = useCheckedMap<string>({ defaultValue: null });
  const urlData = useURLMetaData();
  const { logger } = useContext(ConsoleContext);

  useEffect(() => {
    urlData.update();
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
          await urlData.update();
        }}
      >
        update
      </button>
      <details>
        <summary>Tags</summary>
        <ul style={{ display: "flex" }}>
          {urlData.tagSet.values().map((tag) => {
            return (
              <li style={{ listStyle: "none" }} key={tag}>
                <label>
                  {tag}
                  <input
                    type="checkbox"
                    name={tag}
                    onChange={(ev) => tagMap.toggle(tag)}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </details>
      <ul>
        {urlData.data.map(({ url, ...val }) => {
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
                onChange={(ev) => {
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
              urlData.update();
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
              urlData.update();
            }
          }}
        >
          Delete chosen
        </button>
      </ButtonRow>
    </div>
  );
}
