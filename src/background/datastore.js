/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import UUID from "uuid";

import { broadcast } from "./message-ports";
import telemetry from "./telemetry";

export function normalizeInfo(info) {
  if (!info) {
    return null;
  }
  let title;
  try {
    title = (new URL(info.hostname)).host;
  } catch (ex) {
    title = info.hostname;
  }
  title = title.replace(/^http(s)?:\/\//, "").
                replace(/^www\d*\./, "");

  const origins = [ info.hostname, info.formSubmitURL ].
      filter((u) => !!u);

  return {
    ...info,
    title,
  };
}

async function recordMetric(method, itemid, fields) {
  let extra = {
    itemid,
  };
  if (fields) {
    extra = {
      ...extra,
      fields,
    };
  }
  telemetry.recordEvent(method, "datastore", extra);
}

class DataStore {
  constructor() {
    this._all = {};
  }

  async _allLogins() {
    return Object.values(this._all);
  }

  async list() {
    const logins = await this._allLogins();
    const items = logins.map(normalizeInfo);

    return items;
  }
  async get(id) {
    return normalizeInfo(this._all[id]);
  }
  async add(info) {
    if (!info) {
      throw new TypeError("invalid item");
    }
    if (!info.hostname) {
      throw new TypeError("missing hostname");
    }
    if (!info.password) {
      throw new TypeError("missing password");
    }
    if (!info.username) {
      info.username = "";
    }

    if (!info.formSubmitURL && !info.httpRealm) {
      // assume formSubmitURL === hostname
      info.formSubmitURL = info.hostname;
    }

    let added = {
      ...info,
      guid: UUID(),
      timesUsed: 0,
      timeLastUsed: Date.now(),
      timeCreated: Date.now(),
      timePasswordChanged: Date.now(),
    };
    await browser.experiments.logins.add(added);

    added = normalizeInfo(added);
    recordMetric("added", added.id);

    return added;
  }
  async update(info) {
    const guid = info.guid;
    if (!guid) {
      throw new TypeError("id missing");
    }
    const orig = await this.get(guid);
    if (!orig) {
      throw new Error(`no existing item for ${id}`);
    }

    let updated = { ...info };
    if (orig.password !== info.password) {
      updated.timePasswordChanged = Date.now();
    }
    await browser.experiments.logins.update(updated);

    updated = normalizeInfo(updated);
    recordMetric("updated", info.guid);

    return updated;
  }
  async remove(guid) {
    const item = await this.get(guid);
    if (item) {
      await browser.experiments.logins.remove(item.guid);
      recordMetric("deleted", item.guid);
    }
    return item || null;
  }

  // TODO: Until issue #21 is resolved, this stuff handles raw info from the
  // API rather than UI items.

  loadInfo(logins) {
    this._all = {};
    for (let login of logins) {
      this._all[login.guid] = login;
    }
  }

  addInfo(info) {
    this._all[info.guid] = info;
    const item = normalizeInfo(info);
    broadcast({ type: "added_item", item });
  }

  updateInfo(info) {
    this._all[info.guid] = info;
    const item = normalizeInfo(info);
    broadcast({ type: "updated_item", item });
  }

  removeInfo({ guid }) {
    delete this._all[guid];
    broadcast({ type: "removed_item", guid });
  }

  removeAll() {
    this._all = {};
    broadcast({ type: "removed_all" });
  }
}

let bootstrap;
export async function openDataStore() {
  if (!bootstrap) {
    bootstrap = new DataStore();
  }
  return bootstrap;
}

export async function closeDataStore() {
  bootstrap = null;
}

export async function initializeDataStore() {
  const { logins } = browser.experiments;

  const entries = await logins.getAll();
  const dataStore = await openDataStore();
  dataStore.loadInfo(entries);

  logins.onAdded.addListener(({ login }) => dataStore.addInfo(login));
  logins.onUpdated.addListener(({ login }) => dataStore.updateInfo(login));
  logins.onRemoved.addListener(({ login }) => dataStore.removeInfo(login));
  logins.onAllRemoved.addListener(() => dataStore.removeAll());
}

export default openDataStore;
