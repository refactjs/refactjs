import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ActionFunc,
  ActionHandler,
  ActionOptions,
  ActionPayload,
  ActionPayloads,
  GLOBAL_DISPATCH_KEY,
  GlobalContextType,
  GlobalProviderProps,
  initialState,
} from "./global.types";
import { withGlobal } from "./global.hoc";

let currentGlobal = initialState;
const actionHandlers: Record<string, ActionHandler> = {};
const actions: Record<string, ActionFunc> = {};

const GlobalContext = createContext<GlobalContextType>(initialState);

export const GlobalProvider: FC<PropsWithChildren<GlobalProviderProps>> = ({
  children,
}) => {
  const [globalState, setGlobalState] =
    useState<GlobalContextType>(initialState);

  const onDispatch = async ({
    detail: { action, payload },
  }: CustomEvent<{
    payload: any;
    action: string;
  }>) => {
    const reducer = actionHandlers[action];
    let reducerResult = reducer(globalState, actionHandlers, payload);
    if (reducerResult instanceof Promise) {
      reducerResult = await reducerResult;
    }
    if (reducerResult) {
      setGlobalState(reducerResult);
      currentGlobal = reducerResult;
    }
  };
  useEffect(() => {
    document.addEventListener(GLOBAL_DISPATCH_KEY, onDispatch as AnyFunction);

    return () => {
      document.removeEventListener(GLOBAL_DISPATCH_KEY, () => {});
    };
  }, []);

  return (
    <GlobalContext.Provider value={globalState}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const theme = useContext(GlobalContext);

  if (!theme)
    throw new Error("You must use theme hook as a child of theme provider");

  return theme;
};

export function getGlobal<T>() {
  return currentGlobal as T;
}

export const dispatch = (action: string, payload: any) => {
  document.dispatchEvent(
    new CustomEvent(GLOBAL_DISPATCH_KEY, {
      detail: {
        action,
        payload,
      },
    })
  );
};

export const addActionHandler = (
  actionName: string,
  resolver: ActionHandler
) => {
  actionHandlers[actionName] = resolver;
  actions[actionName] = (payload?: ActionPayload, options?: ActionOptions) => {
    dispatch(actionName, payload);
  };
};

// type GetActionFunc = (payload) => void
export const getActions = () => {
  console.log("GetActions Called", actions);
  return actions;
};

export const typify = <GLOBAL, ACTIONS, UNTYPED_ACTIONS>() => {
  type CombineActions = ACTIONS & UNTYPED_ACTIONS;
  type CombineActionNames = keyof CombineActions;
  type ActionHandlers = {
    [ActionName in keyof CombineActions]: (
      global: GLOBAL,
      actions: Record<string, ActionHandler>,
      payload: CombineActions[ActionName]
    ) => GLOBAL | void | Promise<void>;
  };
  type Actions = {
    [ActionName in keyof CombineActions]: (
      payload: CombineActions[ActionName]
    ) => void;
  };

  return {
    getGlobal: getGlobal as () => GLOBAL,
    addActionHandler: addActionHandler as <
      ActionName extends CombineActionNames
    >(
      action: ActionName,
      resolver: ActionHandlers[ActionName]
    ) => void,
    useGlobal,
    dispatch,
    withGlobal: withGlobal as unknown as <StateProps = any, OwnProps = any>(
      cb: (
        globalContextType: GLOBAL,
        ownProps: OwnProps
      ) => StateProps & OwnProps
    ) => (WrappedComponent: any) => any,
    getActions: getActions as () => Actions,
  };
};
