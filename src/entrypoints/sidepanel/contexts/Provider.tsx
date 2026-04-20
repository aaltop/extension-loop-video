/**
 * @file The combined provider of all top-level providers.
 */

import { NotificationContextProvider } from "./NotificationContext";
import { SavedStateProvider } from "./SavedStateContext";
import { ConsoleContextProvider } from "./ConsoleContext";
import { JSX } from "react";
import { DomainDataContextProvider } from "./DomainDataContext";

const providers = [
  SavedStateProvider,
  DomainDataContextProvider,
  ConsoleContextProvider,
];

export default function Provider({ children }: { children: React.ReactNode }) {
  let child: JSX.Element = (
    <NotificationContextProvider>{children}</NotificationContextProvider>
  );
  for (const Prov of providers) {
    child = <Prov>{child}</Prov>;
  }
  return child;
}
