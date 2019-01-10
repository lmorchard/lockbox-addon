/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createAppStore } from "../store";
import updateBrowserAction from "./browser-action";
import initializeMessagePorts from "./message-ports";
import { initializeTelemetry } from "./telemetry";
import { initializeLogins } from "./logins";

async function init() {
  const store = createAppStore();

  initializeTelemetry(store);
  await initializeLogins(store);
  initializeMessagePorts(store);
  await updateBrowserAction();
}

init();
