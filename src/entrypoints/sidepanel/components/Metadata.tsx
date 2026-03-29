/**
 * @file Inputs for setting a URL's metadata.
 */
import { useTitle, useDescription, useTags } from "../SavedStateContext";

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
    <div className="metadata-input">
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
  const [newTag, setNewTag] = useState<string>("");
  const tags = useTags();

  const tagsItems = tags
    .get()
    ?.values()
    .map((tag) => {
      return (
        <ToggleableInput
          disabledChild={<li>{tag}</li>}
          enabledChild={
            <li>
              {tag}
              <button
                type="button"
                onClick={() => {
                  const newSet = tags.get();
                  newSet.delete(tag);
                  tags.set(newSet);
                }}
              >
                Remove
              </button>
            </li>
          }
          title="Tag"
        />
      );
    });

  const addTag = (
    <li>
      <label>
        New Tag
        <input
          type="text"
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
    </li>
  );

  return <ul>{tagsItems ? [tagsItems, addTag] : [addTag]}</ul>;
}

export default function MetaDataHandler() {
  const title = useTitle();
  const description = useDescription();
  const tags = useTags();

  return (
    <div className="metadata-handler">
      <Title />
      <Description />
      <Tags />
    </div>
  );
}
