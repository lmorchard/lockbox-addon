import { withMeta, actions } from "../store";

export async function initializeLogins(store) {
  const { logins } = browser.experiments;
  const { loadLogins, addLogin, updateLogin, removeLogin } = actions;
  const { dispatch, getState } = store;

  const fromBrowser = withMeta({ fromBrowser: true });

  dispatch(fromBrowser(loadLogins)(logins.getAll()));

  logins.onAdded.addListener(({ login }) =>
    dispatch(fromBrowser(addLogin)(login)));
  logins.onUpdated.addListener(({ login }) =>
    dispatch(fromBrowser(updateLogin)(login)));
  logins.onRemoved.addListener(({ login }) =>
    dispatch(fromBrowser(removeLogin)(login)));
}

export default initializeLogins;
