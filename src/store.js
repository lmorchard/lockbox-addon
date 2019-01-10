import { createStore, combineReducers, compose, applyMiddleware } from "redux";
import { createActions, handleActions, combineActions } from "redux-actions";
import thunkMiddleware from "redux-thunk";
import promiseMiddleware, {
  PENDING,
  FULFILLED,
  REJECTED
} from "redux-promise-middleware";
import typeToReducer from "type-to-reducer";
import { indexBy } from "./common";

export const defaultState = {
  logins: {
    loading: false,
    error: null,
    entries: {}
  }
};

export const selectors = {
  logins: state => Object.entries(state.logins),
  login: state => guid => state.logins[guid],
};

export const actions = createActions(
  {},
  "loadLogins",
  "addLogin",
  "updateLogin",
  "removeLogin",
  "selectLogin",
  "copyField"
);

export const withMeta = (meta = {}) => actionCreator => (...args) => ({
  ...actionCreator(...args),
  meta
});

export const reducers = {
  logins: typeToReducer(
    {
      [actions.loadLogins]: {
        PENDING: state => ({ ...state, loading: true }),
        REJECTED: (state, { payload: error }) => ({
          ...state,
          error,
          loading: false
        }),
        FULFILLED: (state, { payload = [] }) => ({
          ...state,
          entries: indexBy(payload, item => item.guid),
          loading: false,
          error: null
        })
      },
      [actions.addLogin]: (state, { payload: entry }) => ({
        ...state,
        entries: { ...state.entries, [entry.guid]: entry }
      }),
      [actions.updateLogin]: (state, { payload: entry }) => ({
        ...state,
        entries: { ...state.entries, [entry.guid]: entry }
      }),
      [actions.removeLogin]: (state, { payload: entry }) => {
        const newEntries = { ...state.entries };
        delete newEntries[entry.guid];
        return { ...state, entries: newEntries };
      },
    },
    defaultState.logins
  )
};

const debugLogMiddleware = store => next => action => {
  console.log("STORE ACTION", action, store.getState());
  return next(action);
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const createAppStore = (initialState, enhancers = []) =>
  createStore(
    combineReducers(reducers),
    initialState,
    composeEnhancers(
      applyMiddleware(thunkMiddleware, promiseMiddleware(), debugLogMiddleware),
      ...enhancers
    )
  );
