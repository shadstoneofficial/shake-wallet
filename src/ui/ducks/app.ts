import {useSelector} from "react-redux";
import {ThunkDispatch} from "redux-thunk";
import deepEqual from "fast-deep-equal";
import {AppRootState} from "@src/ui/store/configureAppStore";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {type Explorer, EXPLORERS} from "@src/util/explorer";

export enum ActionType {
  SET_SHAKE_MOVING = "app/setShakeMoving",
  SET_SHAKE_MESSAGE = "app/setShakeMessage",
  SET_MULTI_ACCOUNTS_ENABLED = "app/setMultiAccountsEnabled",
  SET_EXPLORER = "app/setExplorer",
  SET_SUBMITTED_TX = "app/setSubmittedTx",
  CLEAR_SUBMITTED_TX = "app/clearSubmittedTx",
}

type Action = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  isShakeMoving: boolean;
  shakeMessage: string;
  multiAccountsEnabled: boolean;
  explorer: Explorer;
  submittedTx?: SubmittedTx;
};

const initialState: State = {
  isShakeMoving: false,
  shakeMessage: "",
  multiAccountsEnabled: false,
  explorer: EXPLORERS[0],
};

export type SubmittedTx = {
  hash: string;
  action?: string;
  status: "broadcasting" | "submitted";
};

export const setShakeMoving = (moving: boolean) => {
  return {
    type: ActionType.SET_SHAKE_MOVING,
    payload: moving,
  };
};

export const setMultiAccountsEnabled = (enabled: boolean) => {
  return {
    type: ActionType.SET_MULTI_ACCOUNTS_ENABLED,
    payload: enabled,
  };
};

export const setExplorer = (explorer: Explorer) => {
  return {
    type: ActionType.SET_EXPLORER,
    payload: explorer,
  };
};

export const setSubmittedTx = (tx: SubmittedTx) => {
  return {
    type: ActionType.SET_SUBMITTED_TX,
    payload: tx,
  };
};

export const clearSubmittedTx = () => {
  return {
    type: ActionType.CLEAR_SUBMITTED_TX,
  };
};

export const fetchMultiAccountsEnabled =
  () => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    const enabled = await postMessage({
      type: MessageTypes.GET_MULTI_ACCOUNTS_ENABLED,
    });
    dispatch(setMultiAccountsEnabled(enabled as boolean));
  };

export const fetchExplorer =
  () => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    const explorer = await postMessage({
      type: MessageTypes.GET_EXPLORER,
    }) as Explorer;
    dispatch(setExplorer(explorer || EXPLORERS[0]));
  };

export default function app(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_SHAKE_MOVING:
      return {
        ...state,
        isShakeMoving: action.payload,
      };
    case ActionType.SET_SHAKE_MESSAGE:
      return {
        ...state,
        shakeMessage: action.payload,
      };
    case ActionType.SET_MULTI_ACCOUNTS_ENABLED:
      return {
        ...state,
        multiAccountsEnabled: action.payload,
      };
    case ActionType.SET_EXPLORER:
      return {
        ...state,
        explorer: action.payload,
      };
    case ActionType.SET_SUBMITTED_TX:
      return {
        ...state,
        submittedTx: action.payload,
      };
    case ActionType.CLEAR_SUBMITTED_TX:
      return {
        ...state,
        submittedTx: undefined,
      };
    default:
      return state;
  }
}

export const useShakeMoving = () => {
  return useSelector((state: AppRootState) => {
    return state.app.isShakeMoving;
  }, deepEqual);
};

export const useShakeMessage = () => {
  return useSelector((state: AppRootState) => {
    return state.app.shakeMessage;
  }, deepEqual);
};

export const useMultiAccountsEnabled = () => {
  return useSelector((state: AppRootState) => {
    return state.app.multiAccountsEnabled;
  }, deepEqual);
};

export const useExplorer = () => {
  return useSelector((state: AppRootState) => {
    return state.app.explorer;
  }, deepEqual);
};

export const useSubmittedTx = () => {
  return useSelector((state: AppRootState) => {
    return state.app.submittedTx;
  }, deepEqual);
};
