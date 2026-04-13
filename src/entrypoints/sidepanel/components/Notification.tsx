import { use } from "react";
import NotificationContext from "../contexts/NotificationContext";

import "./Notification.css";

export default function Notification() {
  const { notification, reset: resetNotification } = use(NotificationContext);

  const isActive = notification.message !== "";
  return (
    <div className="notification root wrapper">
      <div
        tabIndex={isActive ? 0 : -1}
        className="notification message wrapper"
      >
        <span
          aria-live="polite"
          className={`notification message ${notification.type}`}
        >
          {notification.message}
        </span>
      </div>
      {isActive ? (
        <button
          className="notification dismiss"
          type="button"
          onClick={() => resetNotification()}
        >
          Dismiss notification
        </button>
      ) : (
        <div className="notification dismiss"></div>
      )}
    </div>
  );
}
