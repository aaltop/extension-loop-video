import { commands, DomainData, URLMetaData } from "../commands";
import { ConsoleContext } from "../ConsoleContext";

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

  const data = useMemo<CombinedMetaData[]>(() => {
    return Object.entries(domainData.loopingData).map(([url, dat]) => {
      return { ...dat, url };
    });
  }, [domainData]);

  const tagSet = useMemo<Set<string>>(() => {
    const allTags = Object.entries(data).flatMap(([_, { tags }]) => {
      if (!tags) return [];

      return tags;
    });
    return new Set(allTags);
  }, [data]);

  async function update() {
    const response = await commands.loadDomainData();
    logger.log(JSON.stringify(response));
    if (!response.success) {
      logger.log(response.message);
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
  const [checked, setChecked] = useState<Record<string, unknown>>({});
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
                    onChange={(ev) =>
                      setChecked((prev) => {
                        const ob = { ...prev };
                        if (tag in ob) {
                          delete ob[tag];
                        } else {
                          ob[tag] = "";
                        }
                        return ob;
                      })
                    }
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </details>
      <ul>
        {urlData.data.map(({ url, ...val }) => {
          const correctTags =
            Object.keys(checked).length === 0 ||
            !!val.tags?.reduce((prev, cur) => {
              return prev || Object.keys(checked).includes(cur);
            }, false);

          const matchesTextFilter =
            textFilter === "" ||
            !!val.title?.toLowerCase().includes(textFilter) ||
            val.description?.toLowerCase().includes(textFilter);

          if (!matchesTextFilter || !correctTags) return null;

          return (
            <li key={url}>
              <a href={url}>{`${val.title ?? "<No title>"} (${url})`}</a>
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
    </div>
  );
}
