import type { FC } from "react";
import React from "react";
import { RegisterAsync } from "./components/auth/register/register.async";
import {
  addActionHandler,
  GlobalProviderProps,
  GlobalProvider,
} from "./global";

addActionHandler("SET_THEME", (global, actions, payload) => {
  return {
    ...global,
    setting: {
      theme: payload,
    },
  };
});

type StateProps = {};
const App: FC<StateProps> = ({}) => {
  return (
    <GlobalProvider>
      <RegisterAsync />;
    </GlobalProvider>
  );
};

export default App;
