import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, TextInput }              from '@react-ameliorate/native-shims';
import { Field }                        from '@react-ameliorate/component-field';
import styleSheet                       from './text-field-styles';

export const TextField = componentFactory('TextField', ({ Parent, componentName }) => {
  return class TextField extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      type: PropTypes.string,
      labelStyle: PropTypes.any
    }

    static defaultProps = {
      type: 'text'
    };

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments),
          labelPosition = props.labelPosition;

      if (!labelPosition)
        labelPosition = 'floating';
      else
        labelPosition = ('' + labelPosition).toLowerCase().trim();

      props.labelPosition = labelPosition;

      return props;
    }

    blur(event) {
      if (super.blur(event) === false)
        return false;

      var value = this.value();
      if (U.noe(value))
        return value;

      // Trim the field value on blur
      this.value(('' + value).trim());
    }

    onChangeText({ event, value }) {
      if (this.callProvidedCallback('onChangeText', { event, value }) === false)
        return false;

      this.value(value, {
        userInitiated: true,
        event
      });
    }

    onKeyDown({ event }) {
      this.callProvidedCallback('onKeyDown', { event });
    }

    onKeyUp({ event }) {
      this.callProvidedCallback('onKeyUp', { event });
    }

    onKeyPress({ event }) {
      this.callProvidedCallback('onKeyPress', { event });
    }

    renderLabel() {
      return (
        <label
          className={this.getClassName(componentName, 'label')}
          style={this.style(this.props.labelStyle)}
        >
          {this.props.caption}
        </label>
      );
    }

    renderTextInput(_value, _props) {
      var props = _props || this.props,
          value = _value || this.value(undefined, { format: 'format' }),
          { caption, type, autoFocus } = props,
          flags = this.getComponentFlagsAsObject();

      if (value === null)
        value = '';

      value = ('' + value);

      return (
        <TextInput
          key="fieldTextInput"
          placeholder={caption}
          autoFocus={autoFocus}
          secureTextEntry={(type === 'password')}
          caption={caption}
          inputRef={this.setNativeFieldReference}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onChangeText={this.onChangeText}
          onSubmitEditing={this.onSubmitEditing}
          onKeyDown={this.onKeyDown}
          onKeyUp={this.onKeyUp}
          onKeyPress={this.onKeyPress}
          defaultValue={(type === 'password') ? value : undefined}
          value={(type === 'password') ? undefined : value}
          style={this.style('inputField', this.props.fieldStyle, (flags.error && 'fieldStateError'))}
        />
      );
    }

    render(children) {
      var labelPosition = this.props.labelPosition;

      return super.render(
        <View className={this.getRootClassName(componentName)} style={this.style('container')} label-side={labelPosition}>
          {(!!labelPosition.match(/^(left|top)$/)) && this.renderLabel()}
          {this.renderTextInput()}
          {(!labelPosition.match(/^(left|top)$/)) && this.renderLabel()}
          {this.getChildren(children)}
        </View>
      );
    }
  };
}, Field);

export { styleSheet as textFieldStyles };
