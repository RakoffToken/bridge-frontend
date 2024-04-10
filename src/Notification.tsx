import React, { useState, useEffect } from 'react';
import './Notification.css'; // Styling for the Notification component
import { useNotifications } from './App';

interface NotificationProps {
  message: string;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({ message, duration = 5000 }) => {
  const [visible, setVisible] = useState(false);
  const {notifications, addNotification} = useNotifications();

  useEffect(() => {
    console.log("notifications in Notification component")
    console.log(notifications);
    if (notifications.length == 0) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return; // () => clearTimeout(timer);
  }, [notifications, duration]);

  return (
    visible && (
      <div className="notification">
        <div className="notification-content">{message}</div>
      </div>
    )
  );
};

export default Notification;
