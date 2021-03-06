/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from "react-redux";

import ItemListPanel from "../components/item-list-panel";
import { selectItem } from "../../actions";
import { parseFilterString, filterItem } from "../../filter";
const collator = new Intl.Collator();

export default connect(
  (state, ownProps) => {
    const filter = parseFilterString(state.list.filter.query);
    const items = state.cache.items
                       .filter((i) => filterItem(filter, i))
                       .sort((a, b) => collator.compare(a.title, b.title));
    const isFiltering = state.list.filter.query.length;
    if (items.length || state.list.filter.userEntered) {
      return {...ownProps, items, noResultsBanner: false, isFiltering};
    }
    // An autogenerated filter that produced no results; show everything, plus
    // a banner informing users.
    return {...ownProps, items: state.cache.items, noResultsBanner: true};
  },
  (dispatch) => ({
    onClick: (id) => { dispatch(selectItem(id)); },
  }),
)(ItemListPanel);
