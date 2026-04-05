import "./ButtonRow.css";

/**
 * Component that stylises button child elements that are set in a row.
 */
export default function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="button-row">{children}</div>;
}
