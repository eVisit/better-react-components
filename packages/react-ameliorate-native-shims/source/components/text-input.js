//###if(MOBILE) {###//
export { TextInput }            from 'react-native';
//###} else {###//
import React                    from 'react';
import { StyleSheetBuilder }    from '@react-ameliorate/styles';
import PropTypes                from '@react-ameliorate/prop-types';
import { stopEventPropagation } from '@react-ameliorate/utils';

export class TextInput extends React.Component {
  constructor(props, ...args) {
    super(props, ...args);

    this.state = {
      value: props.defaultValue
    };
  }

  static propTypes = {
    defaultValue: PropTypes.string,
    value: PropTypes.string,
    editable: PropTypes.bool,
    maxLength: PropTypes.number,
    multiline: PropTypes.bool,
    numberOfLines: PropTypes.number,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onChangeText: PropTypes.func,
    onKeyPress: PropTypes.func,
    onSubmitEditing: PropTypes.func,
    placeholder: PropTypes.string,
    secureTextEntry: PropTypes.bool
  };

  onChange = (event) => {
    var value = event && event.nativeEvent && event.nativeEvent.target && event.nativeEvent.target.value;
    if (!value)
      value = '';

    this.state.value = value;

    if (typeof this.props.onChange === 'function')
      this.props.onChange({ event });

    if (typeof this.props.onChangeText === 'function')
      this.props.onChangeText({ event, value });
  }

  onKeyDown = (event) => {
    if (typeof this.props.onKeyDown === 'function' && this.props.onKeyDown({ event }) === false) {
      stopEventPropagation(event);
      return;
    }

    // Keycode 9 never makes it to onKeyPress
    var nativeEvent = event.nativeEvent;
    if (typeof this.props.onSubmitEditing === 'function' && nativeEvent.keyCode === 9)
      this.props.onSubmitEditing({ event });
  }

  onKeyUp = (event) => {
    if (typeof this.props.onKeyUp === 'function' && this.props.onKeyUp({ event }) === false) {
      stopEventPropagation(event);
      return;
    }
  }

  onKeyPress = (event) => {
    var nativeEvent = event.nativeEvent;

    if (typeof this.props.onKeyPress === 'function' && this.props.onKeyPress({ event }) === false) {
      stopEventPropagation(event);
      return;
    }

    if (typeof this.props.onSubmitEditing === 'function' && nativeEvent.keyCode === 13)
      this.props.onSubmitEditing({ event });
  }

  onFocus = () => {
    if (typeof this.props.onFocus === 'function')
      this.props.onFocus({ event });
  }

  onBlur = () => {
    if (typeof this.props.onBlur === 'function')
      this.props.onBlur({ event });
  }

  inputRef = (reference) => {
    if (reference && this.props.autoFocus === true)
      reference.focus();

    if (typeof this.props.inputRef === 'function')
      this.props.inputRef(reference);
  }

  render() {
    var value = (this.props.value !== undefined) ? this.props.value : this.state.value,
        multiline = this.props.multiline,
        props = {
          placeholder: this.props.placeholder,
          onChange: this.onChange,
          onKeyDown: this.onKeyDown,
          onKeyUp: this.onKeyUp,
          onKeyPress: this.onKeyPress,
          onFocus: this.onFocus,
          onBlur: this.onBlur,
          ref: this.inputRef
        },
        elemType = (multiline) ? 'textarea' : 'input',
        baseStyle = [{
          boxSizing: 'border-box',
          display: 'flex',
          flex: 1,
          minHeight: 36,
          minWidth: 50
        }, this.props.style];

    if (value == null || (typeof value === 'number' && !isFinite(value)))
      value = '';
    else
      value = ('' + value);

    if (this.props.editable === false)
      props.disabled = "disabled";

    if (!multiline) {
      props.value = value;
      props.type = (this.props.secureTextEntry) ? 'password' : 'text';
    }

    props.style = StyleSheetBuilder.flattenInternalStyleSheet(baseStyle);

    return React.createElement(elemType, props, (multiline) ? value : undefined);
  }
}
//###}###//
