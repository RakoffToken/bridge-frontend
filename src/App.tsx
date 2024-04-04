import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./main";
import { Bridge } from "./pages/Bridge";

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
        <Route path="/bridge" element={<Bridge />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
