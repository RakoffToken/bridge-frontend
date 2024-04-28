import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home} from "./main";
import { Bridge } from "./pages/Bridge";
import { Notification } from "./Notification";
import { useEffect } from "react";
import {atom, useRecoilState} from 'recoil';

export type NotificationType = {
  message: string;
  timeout: number;
}

export const notificationsState = atom<NotificationType[]>({
  key: 'notificationsState',
  default: []
});

export const useNotifications = () => {
  const [notifications, setNotifications] = useRecoilState(notificationsState);
  const addNotification = (message: string) => {
    console.log(notifications)
    const newNote = {message: message, timeout: Date.now() + 5000};
    const currentTime = Date.now();
    const filteredNotifications = notifications.filter(note => note.timeout > currentTime);
    setNotifications([...filteredNotifications, newNote]);
  };

  return {notifications, addNotification};
}

export const App = () => {

  const {notifications} = useNotifications();

  useEffect(() => {
    console.log(notifications);
  }, [notifications]);

  /*const elems: JSX.Element[] = [];
  useEffect(() => {
    const elems: JSX.Element[] = [];
    notifications.forEach((val, idx, notifications) => {
      elems.push((<Notification key={idx} message={val.message} duration={5000} />));
    });
  }, [notifications]);*/

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
          <Route path="/bridge" element={<Bridge />} />
          </Route>
        </Routes>
      </BrowserRouter>
      {
        notifications.length > 0 && <Notification message={notifications[notifications.length-1].message} />
      }
    </div>
  );
};
