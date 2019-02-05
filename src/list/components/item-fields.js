/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Localized } from "fluent-react";
import PropTypes from "prop-types";
import React from "react";

import { classNames } from "../../common";
import CopyToClipboardButton from "../../widgets/copy-to-clipboard-button";
import FieldText from "../../widgets/field-text";
import Input from "../../widgets/input";
import LabelText from "../../widgets/label-text";
import PasswordInput from "../../widgets/password-input";

import styles from "./item-fields.css";

const PASSWORD_DOT = "\u25cf";

const fieldsPropTypes = PropTypes.shape({
  origin: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
});

export function ItemFields({fields, onCopy}) {
  return (
    <div className={styles.itemFields}>
      <div className={styles.field}>
        <Localized id="item-fields-title">
          <LabelText className={styles.firstLabel}>tITLe</LabelText>
        </Localized>
        <FieldText data-name="title">{fields.title}</FieldText>
      </div>
      <div className={styles.field}>
        <Localized id="item-fields-origin">
          <LabelText>oRIGIn</LabelText>
        </Localized>
        <FieldText data-name="origin">
          {fields.origin}
        </FieldText>
      </div>
      <div className={styles.field}>
        <Localized id="item-fields-username">
          <LabelText>uSERNAMe</LabelText>
        </Localized>
        <div className={styles.inlineButton}>
          <FieldText data-name="username">
            {fields.username}
          </FieldText>
          <Localized id="item-fields-copy-username">
            <CopyToClipboardButton value={fields.username}
                                   onCopy={toCopy => onCopy("username", toCopy)}/>
          </Localized>
        </div>
      </div>
      <div className={styles.field}>
        <Localized id="item-fields-password">
          <LabelText>pASSWORd</LabelText>
        </Localized>
        <div className={styles.inlineButton}>
          <FieldText monospace data-name="password">
            {PASSWORD_DOT.repeat(fields.password.length)}
          </FieldText>
          <Localized id="item-fields-copy-password">
            <CopyToClipboardButton value={fields.password}
                                   onCopy={toCopy => onCopy("password", toCopy)}/>
          </Localized>
        </div>
      </div>
    </div>
  );
}

ItemFields.propTypes = {
  fields: fieldsPropTypes,
  onCopy: PropTypes.func.isRequired,
};

export class EditItemFields extends React.Component {
  static get propTypes() {
    return {
      fields: fieldsPropTypes.isRequired,
      onChange: PropTypes.func.isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      focusedField: null,
    };
  }

  focusField(name) {
    return this.setState({ focusedField: name });
  }

  componentDidMount() {
    this._firstField.focus();
  }

  render() {
    const {fields, onChange} = this.props;
    const {focusedField} = this.state;

    const validators = {
      origin: value =>
        value.startsWith("http://")
        || value.startsWith("https://"),
    };

    const isValid = {};
    for (let [name, value] of Object.entries(fields)) {
      const validator = validators[name];
      isValid[name] = validator ? validator(value) : true;
    }

    const controlledProps = ({
      name,
      className = styles.input,
      errorClassName = styles.inputError,
      maxLength = 500,
      ...props
    }) => {
      const value = fields[name];
      return {
        ...props,
        name,
        value,
        className: classNames([
          className,
          (!isValid[name]) && errorClassName,
        ]),
        onFocus: () => this.focusField(name),
        onChange: (e) => onChange(e),
        maxLength: maxLength.toString(),
      };
    };

    return (
      <div className={styles.itemFields}>
        <label>
          <Localized id="item-fields-title">
            <LabelText className={styles.firstLabel}>tITLe</LabelText>
          </Localized>
          <FieldText data-name="title">{fields.title}</FieldText>
        </label>
        <label>
          <Localized id="item-fields-origin">
            <LabelText>oRIGIn</LabelText>
          </Localized>
          <div className={styles.fieldAndTip}>
            <Localized id="item-fields-origin-input" attrs={{placeholder: true}}>
              <Input type="text"
                     placeholder="wWw.eXAMPLe.cOm"
                     ref={(element) => this._firstField = element}
                     {...controlledProps({ name: "origin" })}
                     />
            </Localized>
            {focusedField === "origin" &&
              <Localized id="item-fields-origin-tip">
                <div className={styles.tip}>
                  mAKe sURe tHIs mATCHEs
                </div>
              </Localized>}
            {!isValid.origin &&
              <Localized id="item-fields-origin-error-tip">
                <div className={styles.errorTip}>
                  tHIs iS iNVALId
                </div>
              </Localized>}
          </div>
        </label>
        <label>
          <Localized id="item-fields-username">
            <LabelText>uSERNAMe</LabelText>
          </Localized>
          <Localized id="item-fields-username-input"
                     attrs={{placeholder: true}}>
            <Input type="text"
                   placeholder="nAMe@eXAMPLe.cOm"
                   {...controlledProps({ name: "username" })}
                   />
          </Localized>
        </label>
        <label>
          <Localized id="item-fields-password">
            <LabelText>pASSWORd</LabelText>
          </Localized>
          <PasswordInput {...controlledProps({
                           name: "password",
                           className: styles.password,
                           errorClassName: styles.errorPassword,
                         })}
                         />
        </label>
      </div>
    );
  }
}
