/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect } from "chai";

import * as actions from "src/list/actions";
import {
  cacheReducer, listReducer,
} from "src/list/reducers";
import { NEW_ITEM_ID } from "src/list/common";

describe("list > reducers", () => {
  describe("cache reducer", () => {
    it("initial state", () => {
      const action = {};

      expect(cacheReducer(undefined, action)).to.deep.equal({
        items: [],
        currentItem: null,
      });
    });

    it("handle LIST_ITEMS_COMPLETED", () => {
      const action = {
        type: actions.LIST_ITEMS_COMPLETED,
        items: [
          {id: "1", title: "title 1"},
          {id: "2", title: "title 2"},
        ],
      };

      expect(cacheReducer(undefined, action)).to.deep.equal({
        items: action.items,
        currentItem: null,
      });
    });

    describe("handle ADD_ITEM_*", () => {
      it("handle ADD_ITEM_STARTING", () => {
        const action = {
          type: actions.ADD_ITEM_STARTING,
          actionId: 0,
          item: {
            title: "title",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
        };

        expect(cacheReducer(undefined, action)).to.deep.equal({
          items: [],
          currentItem: null,
        });
      });

      it("handle ADD_ITEM_COMPLETED (interactive)", () => {
        const state = {
          items: [],
          currentItem: null,
        };
        const action = {
          type: actions.ADD_ITEM_COMPLETED,
          actionId: 0,
          item: {
            guid: "1",
            title: "title",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
          interactive: true,
        };

        expect(cacheReducer(state, action)).to.deep.equal({
          items: [{
            guid: action.item.guid,
            title: action.item.title,
            username: action.item.username,
            hostname: action.item.hostname,
          }],
          currentItem: action.item,
        });
      });

      it("handle ADD_ITEM_COMPLETED (non-interactive)", () => {
        const state = {
          items: [],
          currentItem: null,
        };
        const action = {
          type: actions.ADD_ITEM_COMPLETED,
          actionId: 0,
          item: {
            guid: "1",
            title: "title",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
          interactive: false,
        };

        expect(cacheReducer(state, action)).to.deep.equal({
          items: [{
            guid: action.item.guid,
            title: action.item.title,
            username: action.item.username,
            hostname: action.item.hostname,
          }],
          currentItem: null,
        });
      });
    });

    describe("handle UPDATE_ITEM_COMPLETED", () => {
      it("selected", () => {
        const state = {
          items: [
            {guid: "1", title: "original title"},
            {guid: "2", title: "another title"},
          ],
          currentItem: {
            guid: "1",
            title: "title",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
        };
        const action = {
          type: actions.UPDATE_ITEM_COMPLETED,
          actionId: 0,
          item: {
            guid: "1",
            title: "title",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
        };

        expect(cacheReducer(state, action)).to.deep.equal({
          items: [
            {
              guid: action.item.guid,
              title: action.item.title,
              username: action.item.username,
              hostname: action.item.hostname,
            },
            state.items[1],
          ],
          currentItem: action.item,
        });
      });

      it("unselected", () => {
        const state = {
          items: [
            {guid: "1", title: "original title", username: "original username",
             origins: ["original-origin.com"]},
            {guid: "2", title: "another title", username: "another username",
             origins: ["another-origin.com"]},
          ],
          currentItem: null,
        };
        const action = {
          type: actions.UPDATE_ITEM_COMPLETED,
          actionId: 0,
          item: {
            guid: "1",
            title: "title",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
        };

        expect(cacheReducer(state, action)).to.deep.equal({
          items: [
            {
              guid: action.item.guid,
              title: action.item.title,
              username: action.item.username,
              hostname: action.item.hostname,
            },
            state.items[1],
          ],
          currentItem: null,
        });
      });
    });

    describe("handle REMOVE_ITEM_COMPLETED", () => {
      it("selected", () => {
        const state = {
          items: [{guid: "1", title: "title", username: "username",
                   hostname: "https://origin.com"}],
          currentItem: {
            guid: "1",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
        };
        const action = {
          type: actions.REMOVE_ITEM_COMPLETED,
          actionId: 0,
          guid: "1",
        };

        expect(cacheReducer(state, action)).to.deep.equal({
          items: [],
          currentItem: null,
        });
      });

      it("unselected", () => {
        const state = {
          items: [
            {guid: "1", title: "title", username: "username",
              hostname: "https://origin.com"},
            {guid: "2", title: "other title", username: "another username",
              hostname: "https://another-origin.com"},
          ],
          currentItem: {
            title: "title",
            guid: "1",
            hostname: "https://origin.com",
            username: "username",
            password: "password",
          },
        };
        const action = {
          type: actions.REMOVE_ITEM_COMPLETED,
          actionguid: 0,
          guid: "2",
        };

        expect(cacheReducer(state, action)).to.deep.equal({
          items: [state.items[0]],
          currentItem: state.currentItem,
        });
      });
    });

    it("handle SELECT_ITEM_COMPLETED", () => {
      const state = {
        items: [{id: "1", title: "title"}],
        currentItem: null,
      };
      const action = {
        type: actions.SELECT_ITEM_COMPLETED,
        item: {
          title: "title",
          id: "1",
          origins: ["origin.com"],
          entry: {
            kind: "login",
            username: "username",
            password: "password",
            notes: "notes",
          },
        },
      };

      expect(cacheReducer(state, action)).to.deep.equal({
        items: state.items,
        currentItem: action.item,
      });
    });

    it("handle START_NEW_ITEM", () => {
      const state = {
        items: [
          {id: "1", title: "title", username: "username",
           origins: ["origin.com"]},
        ],
        currentItem: {
          title: "title",
          id: "1",
          origins: ["origin.com"],
          entry: {
            kind: "login",
            username: "username",
            password: "password",
            notes: "notes",
          },
        },
      };
      const action = {
        type: actions.START_NEW_ITEM,
      };

      expect(cacheReducer(state, action)).to.deep.equal({
        items: state.items,
        currentItem: null,
      });
    });
  });

  describe("list reducer", () => {
    it("initial state", () => {
      expect(listReducer(undefined, {})).to.deep.equal({
        selectedItemId: null,
        filter: {
          query: "",
          userEntered: true,
        },
      });
    });

    describe("handle ADD_ITEM_COMPLETED", () => {
      it("interactive", () => {
        const action = {
          type: actions.ADD_ITEM_COMPLETED,
          actionId: 0,
          item: {
            guid: "1",
          },
          interactive: true,
        };

        expect(listReducer(undefined, action)).to.deep.equal({
          selectedItemId: "1",
          filter: {
            query: "",
            userEntered: true,
          },
        });
      });

      it("non-interactive", () => {
        const action = {
          type: actions.ADD_ITEM_COMPLETED,
          actionId: 0,
          item: {
            id: "1",
          },
          interactive: false,
        };

        expect(listReducer(undefined, action)).to.deep.equal({
          selectedItemId: null,
          filter: {
            query: "",
            userEntered: true,
          },
        });
      });
    });

    it("handle SELECT_ITEM_STARTING", () => {
      const action = {
        type: actions.SELECT_ITEM_STARTING,
        actionId: 0,
        guid: "1",
      };

      expect(listReducer(undefined, action)).to.deep.equal({
        selectedItemId: "1",
        filter: {
          query: "",
          userEntered: true,
        },
      });
    });

    it("handle START_NEW_ITEM", () => {
      const action = {
        type: actions.START_NEW_ITEM,
      };

      expect(listReducer(undefined, action)).to.deep.equal({
        selectedItemId: NEW_ITEM_ID,
        filter: {
          query: "",
          userEntered: true,
        },
      });
    });

    describe("handle CANCEL_EDITING", () => {
      it("new item", () => {
        const state = {
          selectedItemId: NEW_ITEM_ID,
          filter: {
            query: "",
            userEntered: true,
          },
        };
        const action = {
          type: actions.CANCEL_EDITING,
        };

        expect(listReducer(state, action)).to.deep.equal({
          selectedItemId: null,
          filter: {
            query: "",
            userEntered: true,
          },
        });
      });

      it("existing item", () => {
        const state = {
          selectedItemId: "1",
          filter: {
            query: "",
            userEntered: true,
          },
        };
        const action = {
          type: actions.CANCEL_EDITING,
        };

        expect(listReducer(state, action)).to.deep.equal({
          selectedItemId: "1",
          filter: {
            query: "",
            userEntered: true,
          },
        });
      });
    });

    it("handle FILTER_ITEMS", () => {
      const action = {
        type: actions.FILTER_ITEMS,
        filter: "my filter",
        userEntered: false,
      };

      expect(listReducer(undefined, action)).to.deep.equal({
        selectedItemId: null,
        filter: {
          query: "my filter",
          userEntered: false,
        },
      });
    });
  });
});
