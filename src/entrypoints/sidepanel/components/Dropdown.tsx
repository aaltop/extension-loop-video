import { useId } from "react";
import "./Dropdown.css";

type PopoverElement = (props: {
  /**
   * Id used for popover element.
   */
  popoverId: string;
  /**
   * Class name used for styling the items of the dropdown.
   */
  itemClassName: string;
}) => React.JSX.Element;
/**
 * A dropdown menu using popover API functionality.
 */
export default function Dropdown({
  title,
  PopoverElement,
}: {
  title: string;
  PopoverElement: PopoverElement;
}) {
  const popoverId = useId();

  return (
    <div className="dropdown-wrapper">
      <button
        className="dropdown-toggle global-basic-button"
        popoverTarget={popoverId}
      >
        {title}
      </button>
      <PopoverElement
        popoverId={popoverId}
        itemClassName="dropdown-menu-item"
      />
    </div>
  );
}
