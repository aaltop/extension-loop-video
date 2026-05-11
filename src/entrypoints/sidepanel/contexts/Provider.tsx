/**
 * @file The combined provider of all top-level providers.
 */

import { NotificationContextProvider } from "./NotificationContext";
import { SavedStateProvider } from "./SavedStateContext";
import { ConsoleContextProvider } from "./ConsoleContext";
import { JSX } from "react";
import { DomainDataContextProvider } from "./DomainDataContext";
import { AppSettingsContextProvider } from "./AppSettingsContext";
import { LoopingContextProvider } from "./LoopingContext";

// lower values are applied later, so wrap all previous ones
const providers = [
  LoopingContextProvider,
  DomainDataContextProvider,
  AppSettingsContextProvider,
  SavedStateProvider,
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
