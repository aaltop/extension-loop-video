import { createContext } from "react";
import { commands, DomainData, URLMetaData } from "../commands";

/**
 * Exposes some of the data of the domain in a accessible format.
 */
const DomainDataContext = createContext<ContextState>(
  createDefaultContextState(),
);
export default DomainDataContext;

interface ContextState {
  metadata: CombinedMetaData[];
  /**
   * Set of the combined tags of the {@link metadata}.
   */
  tagSet: Set<string>;
  /**
   * Update (reload) the state.
   */
  update(): Promise<void>;
}

interface CombinedMetaData extends URLMetaData {
  url: string;
}

function createDefaultContextState(): ContextState {
  return {
    metadata: [],
    tagSet: new Set(),
    update() {
      throw new Error("Should not be called");
    },
  };
}

export function DomainDataContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [domainData, setDomainData] = useState<DomainData>({ loopingData: {} });

  const metadata = useMemo<CombinedMetaData[]>(() => {
    return Object.entries(domainData.loopingData).map(([url, dat]) => {
      return { ...dat, url };
    });
  }, [domainData]);

  const tagSet = useMemo<Set<string>>(() => {
    const allTags = Object.entries(metadata).flatMap(([_, { tags }]) => {
      if (!tags) return [];

      return tags;
    });
    return new Set(allTags);
    // TODO: does this cause a double update when metadata updates first,
    // then this?
  }, [metadata]);

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

  return (
    <DomainDataContext value={{ metadata, tagSet, update }}>
      {children}
    </DomainDataContext>
  );
}
