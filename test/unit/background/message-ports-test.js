/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import "test/unit/mocks/browser";
import {
  initializeDataStore,
  openDataStore,
  closeDataStore,
} from "src/background/datastore";
import initializeMessagePorts from "src/background/message-ports";
import telemetry from "src/background/telemetry";
import clipboard from "src/background/clipboard";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("background > message ports", () => {
  let itemId, otherMessagePort, otherListener;

  before(async () => {
    await initializeDataStore();
    await openDataStore();
    initializeMessagePorts();

    otherMessagePort = browser.runtime.connect(undefined, {mockPrimary: false});
  });

  after(async () => {
    // Clear the listeners set in <src/webextension/background/messagePorts.js>.
    browser.runtime.onConnect.mockClearListener();
    browser.runtime.onMessage.mockClearListener();
    await closeDataStore();
  });

  beforeEach(() => {
    otherMessagePort.onMessage.addListener(otherListener = sinon.spy());
  });

  afterEach(() => {
    otherMessagePort.onMessage.mockClearListener();
  });

  it('handle "open_view"', async () => {
    const result = await browser.runtime.sendMessage({
      type: "open_view",
      name: "manage",
    });

    expect(result).to.deep.equal({});
  });

  it('handle "close_view"', async () => {
    const result = await browser.runtime.sendMessage({
      type: "close_view",
      name: "manage",
    });

    expect(result).to.deep.equal({});
  });

  it('handle "add_item"', async () => {
    const item = {
      hostname: "https://origin.com",
      username: "username",
      password: "password",
      usernameField: "",
      passwordField: "",
    };
    const result = await browser.runtime.sendMessage({
      type: "add_item",
      item,
    });
    itemId = result.item.guid;

    expect(result.item).to.deep.include(item);
    expect(otherListener).to.have.callCount(1);
    expect(otherListener.args[0][0].type).to.equal("added_item");
    expect(otherListener.args[0][0].item).to.deep.include(item);
  });

  it('handle "update_item"', async () => {
    const item = {
      guid: itemId,
      hostname: "https://updated-origin.com",
      username: "updated username",
      password: "updated password",
      usernameField: "",
      passwordField: "",
    };
    const result = await browser.runtime.sendMessage({
      type: "update_item",
      item,
    });

    expect(result.item).to.deep.include(item);
    expect(otherListener).to.have.callCount(1);
    expect(otherListener.args[0][0].type).to.equal("updated_item");
    expect(otherListener.args[0][0].item).to.deep.include(item);
  });

  it('handle "get_item"', async () => {
    const result = await browser.runtime.sendMessage({
      type: "get_item",
      guid: itemId,
    });

    expect(result.item).to.deep.include({
      hostname: "https://updated-origin.com",
      username: "updated username",
      password: "updated password",
      usernameField: "",
      passwordField: "",
    });
  });

  it('handle "list_items"', async () => {
    const result = await browser.runtime.sendMessage({
      type: "list_items",
    });

    expect(result.items).to.have.lengthOf(1);
    expect(result.items[0]).to.deep.include({
      guid: itemId,
      hostname: "https://updated-origin.com",
      username: "updated username",
      password: "updated password",
    });
  });

  it('handle "remove_item"', async () => {
    const result = await browser.runtime.sendMessage({
      type: "remove_item",
      guid: itemId,
    });

    expect(result).to.deep.equal({});
    expect(otherListener).to.have.callCount(1);
    expect(otherListener).to.be.calledWith({
      type: "removed_item",
      guid: itemId,
    });
  });

  it('handle "telemetry_event"', async () => {
    const spied = sinon.spy(telemetry, "recordEvent");
    const result = await browser.runtime.sendMessage({
      type: "telemetry_event",
      method: "method",
      object: "object",
      extra: {extra: "value"},
    });

    expect(result).to.deep.equal({});
    expect(spied.called).to.be.true;
    expect(spied).to.have.been.calledWith("method", "object",
                                          {extra: "value"});
    spied.restore();
  });

  it("handles copied_field", async () => {
    const spied = sinon.stub(clipboard, "copyToClipboard").resolves(true);
    const result = await browser.runtime.sendMessage({
      type: "copied_field",
      field: "testField",
      toCopy: "textToCopy",
    });

    expect(result).to.deep.equal({});
    expect(spied.called).to.be.true;
    expect(spied.lastCall.args[0]).to.equal("testField");
    expect(spied.lastCall.args[1]).to.equal("textToCopy");

    spied.restore();
  });

  it("handle unknown message type", async () => {
    const result = await browser.runtime.sendMessage({
      type: "nonexist",
    });
    expect(result).to.equal(null);
  });

  it("handle message port disconnect", async () => {
    otherMessagePort.disconnect();

    // Make sure no message is broadcast now that we've disconnected.
    const item = {
      hostname: "https://origin.com",
      username: "username",
      password: "password",
      usernameField: "",
      passwordField: "",
    };
    await browser.runtime.sendMessage({
      type: "add_item",
      item,
    });
    expect(otherListener).to.have.callCount(0);
  });
});
