import { createContext } from "react";

export interface NotificationInfo {
  message: string;
  /**
   * Describes the type of the notification.
   */
  type: "info" | "error";
}

function createDefaultNotificationInfo(): NotificationInfo {
  return {
    message: "",
    type: "info",
  };
}

export interface NotificationContextProps {
  readonly notification: NotificationInfo;
  readonly set: (newValue: NotificationInfo) => void;
}
const NotificationContext = createContext<NotificationContextProps>({
  notification: createDefaultNotificationInfo(),
  set(newValue) {
    throw new Error("Should not be called");
  },
});

export function NotificationContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<NotificationInfo>(
    createDefaultNotificationInfo,
  );

  return (
    <NotificationContext
      value={{
        notification: state,
        set(newValue) {
          setState(() => newValue);
        },
      }}
    >
      {children}
    </NotificationContext>
  );
}

export default NotificationContext;
