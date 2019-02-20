/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect } from "chai";
import sinon from "sinon";

import "test/unit/mocks/browser";

import {
  initializeDataStore,
  openDataStore,
  closeDataStore,
  normalizeInfo,
} from "src/background/datastore";

const LOGINS_METHODS = ["getAll", "add", "update", "remove"];
const LOGINS_EVENTS = [
  "Added",
  "Updated",
  "Removed",
  "AllRemoved",
].map(name => `on${name}`);

const cmpAlphaBy = name => (a, b) => a[name].localeCompare(b[name]);

const SAMPLE_INFOS = {
  FOO: {
    guid: "FOO",
    title: "FOO title",
    hostname: "https://foo.example.com",
    httpRealm: null,
    username: "FOOuser",
    password: "FOOpass",
    usernameField: "username",
    passwordField: "password",
    timesUsed: 1,
    timeLastUsed: new Date("2019-01-03T12:00:00Z").getTime(),
    timePasswordChanged: new Date("2019-01-02T12:00:00Z").getTime(),
    timeCreated: new Date("2019-01-01T12:00:00Z").getTime(),
  },
  BAR: {
    guid: "BAR",
    title: "BAR title",
    hostname: "https://www.bar.example.com",
    httpRealm: null,
    username: "BARuser",
    password: "BARpass",
    usernameField: "username",
    passwordField: "password",
    timesUsed: 0,
    timeLastUsed: new Date("2019-01-04T12:00:00Z").getTime(),
    timePasswordChanged: new Date("2019-01-03T12:00:00Z").getTime(),
    timeCreated: new Date("2019-01-02T12:00:00Z").getTime(),
  },
  BAZ: {
    guid: "BAZ",
    title: "BAZ title",
    hostname: "http://baz.example.com",
    httpRealm: null,
    username: "BAZuser",
    password: "BAZpass",
    usernameField: "username",
    passwordField: "password",
    timesUsed: 3,
    timeLastUsed: new Date("2019-01-05T12:00:00Z").getTime(),
    timePasswordChanged: new Date("2019-01-05T11:00:00Z").getTime(),
    timeCreated: new Date("2019-01-05T10:00:00Z").getTime(),
  },
};

describe("background > datastore", () => {
  let store;

  beforeEach(async () => {
    const infos = Object.values(SAMPLE_INFOS);
    sinon.stub(browser.experiments.logins, "getAll").resolves(infos);

    sinon
      .stub(browser.experiments.logins, "add")
      .callsFake(login =>
        browser.experiments.logins.onAdded.getListener()({ login }),
      );
    sinon
      .stub(browser.experiments.logins, "update")
      .callsFake(login =>
        browser.experiments.logins.onUpdated.getListener()({ login }),
      );
    sinon
      .stub(browser.experiments.logins, "remove")
      .callsFake(guid =>
        browser.experiments.logins.onRemoved.getListener()({ login: { guid } }),
      );

    await initializeDataStore();
    store = await openDataStore();
  });

  afterEach(async () => {
    for (let name of LOGINS_METHODS) {
      browser.experiments.logins[name].restore();
    }
    for (let name of LOGINS_EVENTS) {
      browser.experiments.logins[name].mockClearListener();
    }
    await closeDataStore();
  });

  it("sets up Logins API event listeners in initializeDataStore()", async () => {
    for (let name of LOGINS_EVENTS) {
      const ev = browser.experiments.logins[name];
      expect(ev.getListener()).to.be.a("function");
    }
  });

  it("yields a datastore instance from openDataStore()", async () => {
    const store = await openDataStore();
    expect(store).to.not.be.undefined;
    const expectedLength = Object.values(SAMPLE_INFOS).length;
    expect(await store.list()).to.have.length(expectedLength);
  });

  it("fetches initial items from Logins API", async () => {
    expect(browser.experiments.logins.getAll.callCount).to.equal(1);

    const expectedItems = Object.values(SAMPLE_INFOS)
      .map(normalizeInfo)
      .sort(cmpAlphaBy("guid"));
    const resultItems = (await store.list()).sort(cmpAlphaBy("guid"));

    expect(resultItems).to.deep.equal(expectedItems);
  });

  it("handles onAdded event from Logins API", async () => {
    const beforeItem = await store.get("XYZZY");
    expect(beforeItem).to.equal(null);

    const info = normalizeInfo({
      guid: "XYZZY",
      title: "XYZZY title",
      hostname: "http://XYZZY.example.com",
      httpRealm: null,
      username: "XYZZYuser",
      password: "XYZZYpass",
      usernameField: "username",
      passwordField: "password",
    });

    const addedListener = browser.experiments.logins.onAdded.getListener();
    addedListener({ login: info });

    const afterItem = await store.get("XYZZY");
    expect(afterItem).to.deep.equal(info);
  });

  it("handles onUpdated event from Logins API", async () => {
    const info = normalizeInfo({
      ...SAMPLE_INFOS.FOO,
      password: "updated FOO password",
    });

    const updatedListener = browser.experiments.logins.onUpdated.getListener();
    updatedListener({ login: info });

    const resultItem = await store.get("FOO");
    expect(resultItem).to.deep.equal(info);
  });

  it("handles onRemoved event from Logins API", async () => {
    const info = {
      ...SAMPLE_INFOS.BAR,
      password: "updated BAR password",
    };

    const removedListener = browser.experiments.logins.onRemoved.getListener();
    removedListener({ login: info });

    const resultItem = await store.get("BAR");
    expect(resultItem).to.equal(null);
  });

  const info = {
    guid: "QUUX",
    title: "QUUX title",
    hostname: "http://quux.example.com",
    formSubmitURL: "http://quux.example.com",
    httpRealm: null,
    username: "QUUXuser",
    password: "QUUXpass",
    usernameField: "username",
    passwordField: "password",
  };

  it("handles onAllRemoved event from Logins API", async () => {
    const addedItem = await store.add(info);

    const beforeItem = await store.get(addedItem.guid);
    expect(beforeItem).to.deep.equal(addedItem);

    const allRemovedListener =
      browser.experiments.logins.onAllRemoved.getListener();
    allRemovedListener();

    const afterItem = await store.get(addedItem.guid);
    expect(afterItem).to.be.null;
  });

  it("allows an item to be fetched", async () => {
    const resultItem = await store.get("FOO");
    expect(resultItem).to.deep.equal(normalizeInfo(SAMPLE_INFOS.FOO));
  });

  it("allows an item to be added", async () => {
    const addedItem = await store.add(info);
    const {
      guid,
      timesUsed,
      timeLastUsed,
      timeCreated,
      timePasswordChanged
    } = addedItem;
    const expectedItem = normalizeInfo({
      ...info,
      guid,
      timesUsed,
      timeLastUsed,
      timeCreated,
      timePasswordChanged,
    });
    expect(addedItem).to.deep.equal(expectedItem);

    const resultItem = await store.get(addedItem.guid);
    expect(resultItem).to.deep.equal(addedItem);

    const apiAdd = browser.experiments.logins.add;
    expect(apiAdd.callCount).to.equal(1);

    const expectedApiInfo = {
      ...info,
      guid: addedItem.guid,
    };

    const {
      timesUsed: resultTimesUsed,
      timeLastUsed: resultTimeLastUsed,
      timeCreated: resultTimeCreated,
      timePasswordChanged: resultTimePasswordChanged,
      ...resultApiInfo
    } = apiAdd.lastCall.lastArg;

    expect(resultTimesUsed).to.equal(0);
    expect(resultTimeLastUsed).to.not.be.undefined;
    expect(resultTimeCreated).to.not.be.undefined;
    expect(resultTimePasswordChanged).to.not.be.undefined;
    expect(resultApiInfo).to.deep.equal(expectedApiInfo);
  });

  it("allows an item to be updated", async () => {
    const guid = "BAR";

    const originalItem = await store.get(guid);
    
    const updatedItem = await store.update({
      ...originalItem,
      password: "updated password",
    });

    const expectedItem = {
      ...originalItem,
      password: "updated password",
      timePasswordChanged: updatedItem.timePasswordChanged,
    };
    expect(updatedItem).to.deep.equal(expectedItem);

    const fetchedItem = await store.get(guid);
    expect(fetchedItem).to.deep.equal(expectedItem);

    const apiUpdate = browser.experiments.logins.update;
    expect(apiUpdate.callCount).to.equal(1);

    const expectedApiInfo = {
      ...expectedItem,
      guid: expectedItem.guid,
    };

    expect(apiUpdate.lastCall.lastArg)
      .to.deep.equal(expectedApiInfo);
  });

  it("allows an item to be removed", async () => {
    const guid = "BAZ";

    const beforeItem = await store.get(guid);
    expect(beforeItem).to.not.equal(null);

    const removedItem = await store.remove(guid);
    expect(removedItem).to.deep.equal(beforeItem);

    const afterItem = await store.get(guid);
    expect(afterItem).to.equal(null);

    const apiRemove = browser.experiments.logins.remove;
    expect(apiRemove.callCount).to.equal(1);
    expect(apiRemove.lastCall.lastArg).to.equal(guid);
  });

  describe("hostname to title conversion", () => {
    let info = Object.assign({}, SAMPLE_INFOS.FOO);
    it("removes the initial 'https://' part of a hostname", () => {
      info.hostname = "https://example.com";
      const item = normalizeInfo(info);
      expect(item.title).to.equal("example.com");
    });
    it("removes the initial 'http://' part of a hostname", () => {
      info.hostname = "http://example.com";
      const item = normalizeInfo(info);
      expect(item.title).to.equal("example.com");
    });
    it("removes the 'www' subdomain", () => {
      info.hostname = "http://www.example.com";
      const item = normalizeInfo(info);
      expect(item.title).to.equal("example.com");
    });
    it("removes the 'www1' subdomain", () => {
      info.hostname = "http://www1.example.com";
      const item = normalizeInfo(info);
      expect(item.title).to.equal("example.com");
    });
    it("does not remove the 'foo' subdomain", () => {
      info.hostname = "http://foo.example.com";
      const item = normalizeInfo(info);
      expect(item.title).to.equal("foo.example.com");
    });
    it("does not remove the '.com' public suffix", () => {
      info.hostname = "https://www.example.com";
      const item = normalizeInfo(info);
      expect(item.title.endsWith(".com")).to.be.true;
    });
  });
});
