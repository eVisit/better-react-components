//###if(MOBILE) {###//
import { TextInput }              from 'react-native';
//###} else {###//
import { utils as U }             from 'evisit-js-utils';
import React                      from 'react';
import { flattenStyle }           from '../shim-utils';
import {
  stopEventPropagation,
  assignRef
}                                 from '@react-ameliorate/utils';
import TextInputPropTypes         from '../prop-types/text-input';

class TextInputShim extends React.Component {
  constructor(props, ...args) {
    super(props, ...args);

    this.state = {
      value: props.defaultValue
    };

    // This is required to get Chrome to TRULY respect 'autoComplete="off"'
    // https://stackoverflow.com/questions/12374442/chrome-ignores-autocomplete-off
    this._autoCompleteRandomValue = U.uuid();
    this._currentSelectionRange = null;
  }

  static propTypes = TextInputPropTypes;

  static getDerivedStateFromProps(nextProps, state) {
    var value = state.value;

    if (nextProps.value !== undefined)
      value = nextProps.value;

    return {
      value
    };
  }

  componentDidMount = () => {
    if (this.props.autoFocus === true && this._inputRef)
      this._inputRef.focus();

    if (this.props.multiline && this._inputRef) {
      this._inputRef.addEventListener('input', this.autoExpand);
      this.autoExpand();
    }
  }

  componentWillUnmount = () => {
    if (this._inputRef)
      this._inputRef.removeEventListener('input', this.autoExpand);
  }

  // After update, make sure to set the specified selection range,
  // or if none is specified, use the recorded selection range
  // before update happened
  componentDidUpdate = (prevProps) => {
    if (this.props.multiline && prevProps.value !== this.props.value)
      this.autoExpand();

    if (!this._inputRef)
      return;

    try {
      var selection = this.props.selection || this._currentSelectionRange,
          start = (selection && selection.start),
          end   = (selection && selection.end);

      if (start == null)
        start = 999999999;

      if (end == null)
        end = start;

      this._inputRef.setSelectionRange(start, end);
    } catch (e) {}
  }

  // Special thanks to Tim Down from StackOverflow for this
  // https://stackoverflow.com/questions/3286595/update-textarea-value-but-keep-cursor-position

  // Here we get the current selection range of the field (before update)
  getInputSelectionRange = () => {
    if (!this._inputRef)
      return { start: 999999999, end: 999999999 };

    var start = 0,
        end = 0,
        normalizedValue,
        range,
        textInputRange,
        len,
        endRange,
        element = this._inputRef;

    if (typeof element.selectionStart == "number" && typeof element.selectionEnd == "number") {
      start = element.selectionStart;
      end = element.selectionEnd;
    } else {
      range = document.selection.createRange();

      if (range && range.parentElement() == element) {
        len = element.value.length;
        normalizedValue = element.value.replace(/\r\n/g, "\n");

        // Create a working TextRange that lives only in the input
        textInputRange = element.createTextRange();
        textInputRange.moveToBookmark(range.getBookmark());

        // Check if the start and end of the selection are at the very end
        // of the input, since moveStart/moveEnd doesn't return what we want
        // in those cases
        endRange = element.createTextRange();
        endRange.collapse(false);

        if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
          start = end = len;
        } else {
          start = -textInputRange.moveStart("character", -len);
          start += normalizedValue.slice(0, start).split("\n").length - 1;

          if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
            end = len;
          } else {
            end = -textInputRange.moveEnd("character", -len);
            end += normalizedValue.slice(0, end).split("\n").length - 1;
          }
        }
      }
    }

    return {
      start,
      end
    };
  }

  autoExpand = () => {
    var textarea = this._inputRef;
    if (!textarea)
      return;

    textarea.style.height = 'initial';

    var computed = window.getComputedStyle(textarea),
        minHeight = parseInt(computed.getPropertyValue('min-height'), 10),
        height = Math.max(minHeight, textarea.scrollHeight);

    textarea.style.height = height + 'px';
  }

  doSubmit = (event, reverseTabOrder) => {
    if (typeof this.props.onSubmitEditing === 'function')
      this.props.onSubmitEditing.call(this, event, reverseTabOrder);

    if (this.props.blurOnSubmit && this._inputRef)
      this._inputRef.blur();
  };

  onChange = (event) => {
    var value = event && event.nativeEvent && event.nativeEvent.target && event.nativeEvent.target.value;
    if (!value)
      value = '';

    this.state.value = value;

    if (typeof this.props.onChange === 'function')
      this.props.onChange.call(this, event);

    if (typeof this.props.onChangeText === 'function')
      this.props.onChangeText.call(this, value, event);
  }

  onKeyDown = (event) => {
    if (typeof this.props.onKeyDown === 'function' && this.props.onKeyDown(event) === false) {
      stopEventPropagation(event);
      return;
    }

    // Keycode 9 never makes it to onKeyPress
    var nativeEvent = event.nativeEvent;
    if (nativeEvent.keyCode === 9)
      this.doSubmit(event, nativeEvent.shiftKey);
  }

  onKeyUp = (event) => {
    if (typeof this.props.onKeyUp === 'function' && this.props.onKeyUp.call(this, event) === false) {
      stopEventPropagation(event);
      return;
    }
  }

  onKeyPress = (event) => {
    var nativeEvent = event.nativeEvent;

    if (typeof this.props.onKeyPress === 'function' && this.props.onKeyPress.call(this, event) === false) {
      stopEventPropagation(event);
      return;
    }

    if (!this.props.multiline && nativeEvent.keyCode === 13)
      this.doSubmit(event);
  }

  onFocus = (event) => {
    if (typeof this.props.onFocus === 'function')
      this.props.onFocus.call(this, event);
  }

  onBlur = (event) => {
    if (typeof this.props.onBlur === 'function')
      this.props.onBlur.call(this, event);
  }

  inputRef = (elem) => {
    this._inputRef = elem;

    if (elem && this.props.autoFocus === true)
      elem.focus();

    assignRef(this.props.inputRef, elem);
  }

  clear = () => {

  }

  focus = () => {
    if (!this._inputRef)
      return;

    this._inputRef.focus();
  }

  blur = () => {
    if (!this._inputRef)
      return;

    this._inputRef.blur();
  }

  // Get current caret position before update (so we can restore it after update)
  getSnapshotBeforeUpdate = () => {
    this._currentSelectionRange = this.getInputSelectionRange();
    return null; // Or React has a hissy fit
  }

  render = () => {
    var providedProps = this.props,
        value = (providedProps.value !== undefined) ? providedProps.value : this.state.value,
        multiline = providedProps.multiline,
        autoComplete = ((providedProps.autoFill !== false && providedProps.name) ? (providedProps.name || providedProps.field) : undefined),
        props = {
          autoComplete: (!autoComplete) ? this._autoCompleteRandomValue : autoComplete,
          name: autoComplete,
          placeholder: providedProps.placeholder,
          onChange: this.onChange,
          onKeyDown: this.onKeyDown,
          onKeyUp: this.onKeyUp,
          onKeyPress: this.onKeyPress,
          onFocus: this.onFocus,
          onBlur: this.onBlur,
          ref: this.inputRef,
          maxLength: providedProps.maxLength,
          className: providedProps.className,
          'data-test-id': providedProps.testID,
          readOnly: providedProps.readOnly,
          max: providedProps.max
        },
        elementName = (multiline) ? 'textarea' : 'input',
        baseStyle = [{
          // boxSizing: 'border-box',
          // display: 'flex',
          // flex: 1,
          // minHeight: 36,
          // minWidth: 50
        }, providedProps.style];

    if (value == null || (typeof value === 'number' && !isFinite(value)))
      value = '';
    else
      value = ('' + value);

    if (providedProps.editable === false)
      props.disabled = "disabled";

    props.value = value;

    if (!multiline)
      props.type = (providedProps.secureTextEntry) ? 'password' : 'text';
    else
      props.rows = 1;

    props.style = flattenStyle(baseStyle);

    return React.createElement(elementName, props);
  }
}

const TextInput = React.forwardRef((props, ref) => {
  return (<TextInputShim {...props} inputRef={ref}/>);
});
//###}###//

export {
  TextInput
};
