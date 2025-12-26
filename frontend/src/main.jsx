import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import './index.css';


import "./styles.css";
import App2 from "./App2";
import App3 from "./App3";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App2 />
    

    </Provider>
  </React.StrictMode>
);
