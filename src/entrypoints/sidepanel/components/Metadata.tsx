/**
 * @file Inputs for setting a URL's metadata.
 */
import { use, useId } from "react";

import {
  useTitle,
  useDescription,
  useTags,
} from "../contexts/SavedStateContext";
import DomainDataContext from "../contexts/DomainDataContext";

import "./Metadata.css";

function ToggleableInput({
  title,
  enabledChild,
  disabledChild,
  toggleInfo,
}: {
  title: string;
  enabledChild: React.ReactNode;
  disabledChild: React.ReactNode;
  toggleInfo?: { disabled: string; enabled: string };
}) {
  const [disabled, setDisabled] = useState<boolean>(true);

  const disabledInfo = toggleInfo?.disabled ?? `Change ${title}`;
  const enabledInfo = toggleInfo?.enabled ?? `Lock ${title}`;

  return (
    <div>
      {disabled ? (
        disabledChild
      ) : (
        <label>
          {title}
          {enabledChild}
        </label>
      )}
      <button
        type="button"
        onClick={() => {
          setDisabled((prev) => !prev);
        }}
      >
        {disabled ? disabledInfo : enabledInfo}
      </button>
    </div>
  );
}

function Title() {
  const title = useTitle();

  const placeHolder = "<No title>";
  return (
    <ToggleableInput
      disabledChild={<h2 id="url-title">{title.get() ?? placeHolder}</h2>}
      enabledChild={
        <input
          value={title.get()}
          onChange={(ev) => {
            title.set(ev.target.value);
          }}
          placeholder={placeHolder}
        />
      }
      title="Title"
    />
  );
}

function DescriptionText({ disabled }: { disabled?: boolean }) {
  const desc = useDescription();
  return (
    <textarea
      id="description-input"
      value={desc.get()}
      onChange={(ev) => {
        desc.set(ev.target.value);
      }}
      disabled={disabled}
    />
  );
}

function Description() {
  const desc = useDescription();

  return (
    <ToggleableInput
      disabledChild={<p>{desc.get() ?? ""}</p>}
      enabledChild={<DescriptionText />}
      title="Description"
    />
  );
}

function Tags() {
  const allTagsDatalistId = useId();

  const [newTag, setNewTag] = useState<string>("");
  const [modify, setModify] = useState<boolean>(false);
  const [deleteTags, setDeleteTags] = useState<string[]>(() => []);
  const { tagSet: globalTags } = use(DomainDataContext);
  const tags = useTags();

  const tagsItems = tags
    .get()
    ?.values()
    .map((tag) => {
      return (
        <li key={tag} className={`metadata ${modify ? "" : "static"}`}>
          <b>
            {modify ? (
              <label>
                {tag}{" "}
                <input
                  type="checkbox"
                  name={tag}
                  onChange={(ev) => {
                    setDeleteTags((prev) => {
                      const curr = new Set(prev);
                      if (ev.target.checked) {
                        curr.add(tag);
                      } else {
                        curr.delete(tag);
                      }
                      return [...curr];
                    });
                  }}
                />
              </label>
            ) : (
              tag
            )}
          </b>
        </li>
      );
    });

  const addTag = (
    <label>
      New Tag
      <input
        type="text"
        list={allTagsDatalistId}
        value={newTag}
        onChange={(ev) => {
          const newValue = ev.target.value;
          setNewTag(() => newValue);
        }}
        placeholder="New Tag"
      />
      <button
        type="button"
        onClick={() => {
          if (newTag.length > 0) {
            const newSet = tags.get();
            newSet.add(newTag);
            tags.set(newSet);
          }
        }}
      >
        Save New Tag
      </button>
    </label>
  );

  return (
    <div className="metadata-tags-wrapper">
      <fieldset className="metadata-tags">
        <legend>Tags</legend>
        <button
          type="button"
          className={`metadata ${tags.get().size > 0 ? "" : "global-hidden"}`}
          onClick={() => setModify((prev) => !prev)}
        >
          {modify ? "lock" : "modify"}
        </button>
        <button
          className={`metadata-delete-tags ${modify ? "" : "global-hidden"}`}
          type="button"
          disabled={deleteTags.length < 1}
          onClick={() => {
            const newTags = tags.get().difference(new Set(deleteTags));
            tags.set(newTags);
            setDeleteTags(() => []);
            if (newTags.size < 1) {
              setModify(() => false);
            }
          }}
        >
          Delete checked
        </button>
        <ul>{tagsItems}</ul>
      </fieldset>

      <datalist id={allTagsDatalistId}>
        {globalTags.values().map((tag) => {
          return <option key={tag} value={tag}></option>;
        })}
      </datalist>

      <div>{addTag}</div>
    </div>
  );
}

export default function MetaDataHandler() {
  return (
    <div className="metadata-wrapper">
      <Title />
      <Description />
      <Tags />
    </div>
  );
}
