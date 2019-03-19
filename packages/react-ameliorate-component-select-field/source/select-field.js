import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback
}                                       from '@react-ameliorate/native-shims';
import { Field }                        from '@react-ameliorate/component-field';
import { TextField }                    from '@react-ameliorate/component-text-field';
import { Icon }                         from '@react-ameliorate/component-icon';
import { Paper }                        from '@react-ameliorate/component-paper';
import {
  stopEventPropagation,
  preventEventDefault
}                                       from '@react-ameliorate/utils';
import styleSheet                       from './select-field-styles';

export const SelectField = componentFactory('SelectField', ({ Parent, componentName }) => {
  return class SelectField extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      renderOptionsInline: PropTypes.bool,
      optionsAlwaysVisible: PropTypes.bool,
      optionSelectedCaptionStyle: PropTypes.any
    };

    componentMounted() {
      super.componentMounted();
    }

    componentUnmounting() {
      super.componentUnmounting();
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          popupVisible: false,
          searchDelay: PropTypes.number,
          focussedOption: null,
          hoveredOption: null,
          waiting: false
        })
      };
    }

    togglePopupVisibility(_set) {
      if (this.props.renderOptionsInline && this.props.optionsAlwaysVisible)
        return;

      var currentState = this.getState('popupVisible'),
          set = _set;

      if (set === undefined)
        set = !currentState;
      else
        set = !!set;

      if (set === currentState)
        return;

      var textField = this.getReference('textField');
      if (textField) {
        var caption = this.getSelectedOptionCaption();
        textField.value(caption);

        if (!set)
          textField.blur();
      }

      var newState = { popupVisible: set, focussedOption: null, hoveredOption: null };
      if (!set)
        newState.filteredOptions = null;
      else
        this.filterOptions('');

      this.setState(newState);
    }

    onOptionMouseOver(option, index, event) {
      var hoveredOption = this.getState('hoveredOption');
      if (hoveredOption === index)
        return;

      if (this.callProvidedCallback('onOptionMouseOver', { event, option, index }) === false)
        return;

      this.setState({ hoveredOption: index });
    }

    onOptionMouseOut(option, index, event) {
      var hoveredOption = this.getState('hoveredOption');
      if (hoveredOption !== index)
        return;

      if (this.callProvidedCallback('onOptionMouseOut', { event, option, index }) === false)
        return;

      this.setState({ hoveredOption: null });
    }

    onOptionSelect(option, index, event) {
      stopEventPropagation(event);

      if (this.callProvidedCallback('onOptionSelect', { event, option, value: option.value, caption: option.caption, index }) === false)
        return;

      var value = option.value;
      this.value(value, { userInitiated: true });

      this.togglePopupVisibility(false);

      return value;
    }

    popupCalculateStyle({ anchor }) {
      if (!anchor || !anchor.rect)
        return null;

      return {
        minWidth: anchor.rect.width
      };
    }

    onPopupLeft() {
      this.togglePopupVisibility(false);
    }

    onFocus(args) {
      super.onFocus(args);
      this.togglePopupVisibility(true);
    }

    onPress(event) {
      stopEventPropagation(event);
    }

    onIconPress(event) {
      stopEventPropagation(event);

      this.getReference('textField', (textField) => {
        textField.focus();
      });
    }

    onSubmit(args) {
      if (this.callProvidedCallback('onSubmit', args) === false)
        return;

      var focussedOption = this.getState('focussedOption');
      if (focussedOption != null) {
        var options = this.getAllOptions(),
            isArray = (options instanceof Array);

        var option = (isArray) ? this.getOptionByIndex(focussedOption) : Object.keys(options || {})[focussedOption],
            optionValue = (option && option.value) || option;

        if (optionValue)
          return this.onOptionSelect({ caption: this.getOptionCaption(optionValue), value: optionValue }, focussedOption, args.event);
      }

      this.togglePopupVisibility(false);
    }

    onChangeText(args) {
      if (this.callProvidedCallback('onChangeText', args) === false)
        return;

      var { value } = args,
          delay = this.props.searchDelay;

      if (!delay) {
        if (typeof this.props.options === 'function')
          delay = 250;
        else
          delay = 1;
      }

      this.delay(() => {
        this.filterOptions(value);
      }, delay);
    }

    onKeyDown({ event }) {
      if (this.callProvidedCallback('onKeyDown', { event }) === false)
        return;

      var key = U.get(event, 'nativeEvent.key');
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        preventEventDefault(event);

        var optionsCount = U.sizeOf(this.getAllOptions()),
            focussedOption = this.getState('focussedOption');

        if (!optionsCount)
          return;

        if (focussedOption == null)
          focussedOption = -1;

        if (key === 'ArrowUp')
          focussedOption--;
        else
          focussedOption++;

        if (focussedOption < 0)
          focussedOption = null;
        else if (focussedOption >= optionsCount)
          focussedOption = optionsCount - 1;

        this.setState({ focussedOption });
      }
    }

    renderAllOptions() {
      var focussedOption = this.getState('focussedOption'),
          hoveredOption = this.getState('hoveredOption'),
          value = this.value();

      return (
        <View style={this.style('optionsContainer')} pointerEvents="auto">
          {this.iterateOptions((option, index) => {
            var isFocussed  = (focussedOption === index),
                isHovered   = (hoveredOption === index),
                isSelected  = (option.value === value);

            return (
              <TouchableOpacity
                key={('' + index)}
                className={this.getRootClassName(
                  componentName, 'option',
                  isFocussed && 'optionFocus',
                  isHovered && 'optionHover',
                  isSelected && 'optionSelected'
                )}
                style={this.style(
                  'optionContainer',
                  this.optionStyle,
                  isFocussed && ['optionFocus', this.props.optionFocusStyle],
                  isHovered && ['optionHover', this.props.optionHoverStyle],
                  isSelected && ['optionSelected', this.props.optionSelectedStyle]
                )}
                onPress={this.onOptionSelect.bind(this, option, index)}
                onMouseOver={this.onOptionMouseOver.bind(this, option, index)}
                onMouseOut={this.onOptionMouseOut.bind(this, option, index)}
              >
                <Text
                  className={this.getClassName(componentName, 'optionCaption')}
                  style={this.style('optionCaption', isSelected && ['optionCaptionSelected', this.props.optionSelectedCaptionStyle])}
                >
                  {option.caption}
                </Text>
              </TouchableOpacity>
            );
          }, { maxOptions: this.props.maxOptions })}
        </View>
      );
    }

    renderOptions() {
      if (this.props.renderOptionsInline === true)
        return this.renderAllOptions();

      return (
        <Paper
          anchorElement={this.getNativeFieldReference()}
          anchorPosition={{
            'bottom': 'top',
            'left': 'left'
          }}
          calculateStyle={this.popupCalculateStyle}
          onLeft={this.onPopupLeft}
          id={this.getFieldID()}
        >
          {this.renderAllOptions()}
        </Paper>
      );
    }

    renderIcon() {
      return (
        <TouchableOpacity style={this.style('arrowContainer')} onPress={this.onIconPress}>
          <Icon icon="chevron-down" style={this.style('arrow')}/>
        </TouchableOpacity>
      );
    }

    render(_children) {
      var popupVisible  = this.getState('popupVisible'),
          waiting       = this.getState('waiting'),
          defaultValue  = this.getSelectedOptionCaption();

      return super.render(
        <View
          className={this.getRootClassName(componentName)}
          style={this.style('container', this.props.fieldStyle)}
        >
          <TouchableWithoutFeedback
            className={this.getClassName(componentName, 'fieldContainer')}
            onPress={this.onPress}
          >
            <View style={this.style('fieldContainer', this.props.fieldContainerStyle)}>
              <TextField
                componentFlags={this.getComponentFlags()}
                {...this.passProps(/^(on[A-Z]|defaultValue$|value$)/, this.props)}
                defaultValue={defaultValue}
                field="_autoCompleteInternal"
                onChangeText={this.onChangeText}
                style={this.style('field', this.props.textFieldStyle)}
                fieldStyle={this.style('textField', this.props.textFieldFieldStyle)}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
                onMouseOver={this.onMouseOver}
                onMouseOut={this.onMouseOut}
                onSubmit={this.onSubmit}
                onKeyDown={this.onKeyDown}
                ref={this.captureReference('textField')}
                inputRef={this.setNativeFieldReference}
                skipFormRegistration
              />

              {this.renderIcon()}

              {(waiting) && (
                <View style={this.style('waitingSpinnerContainer')}>
                  <ActivityIndicator size={this.styleProp('LOADING_SPINNER_SIZE')} color={this.styleProp('MAIN_COLOR')}/>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>

          {(popupVisible || (this.props.renderOptionsInline && this.props.optionsAlwaysVisible)) && this.renderOptions()}

          {this.getChildren(_children)}
        </View>
      );
    }
  };
}, Field);

export { styleSheet as selectFieldStyles };
