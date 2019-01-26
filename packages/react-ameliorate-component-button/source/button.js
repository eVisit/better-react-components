import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text, TouchableOpacity } from '@react-ameliorate/native-shims';
import {
  stopEventPropagation,
  getLargestFlag
}                                       from '@react-ameliorate/utils';
import { Hoverable }                    from '@react-ameliorate/mixin-hoverable';
import styleSheet                       from './button-styles';

export const Button = componentFactory('Button', ({ Parent, componentName }) => {
  return class Button extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      caption: PropTypes.string,
      onPress: PropTypes.func,
      disabled: PropTypes.bool
    };

    constructor(props, ...args) {
      super(props, ...args);
    }

    onPropsUpdated(oldProps, newProps, initial) {
      this.updateComponentFlagsFromProps(oldProps, newProps, initial);
      return super.onPropsUpdated.apply(this, arguments);
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          awaitingClick: false
        })
      };
    }

    getRequestedTheme() {
      return this.props.theme || 'default';
    }

    renderContents(children) {
      if (children)
        return children;

      var caption = this.props.caption,
          theme = this.getRequestedTheme(),
          flags = this.getComponentFlagsAsArray();

      if (!caption)
        caption = '';

      return (
        <Text className={this.getRootClassName(componentName, 'caption')} style={this.style(this.generateStyleNames(theme, 'caption', flags), this.props.captionStyle)}>{caption}</Text>
      );
    }

    onMouseOut(event) {
      return super.onMouseOut(event, { pressed: false });
    }

    async onPress(event) {
      stopEventPropagation(event);

      if (this.props.disabled || this.getState('awaitingClick'))
        return;

      try {
        this.setState({ awaitingClick: true });
        return await this.callProvidedCallback('onPress', { event });
      } finally {
        this.setState({ awaitingClick: false });
      }
    }

    onPressStart(event) {
      if (this.props.disabled || this.isComponentFlag('pressed'))
        return;

      if (this.callProvidedCallback('onPressStart', { event }) === false)
        return;

      return this.setComponentFlagsFromObject({ pressed: true });
    }

    onPressEnd(event) {
      if (this.props.disabled || !this.isComponentFlag('pressed'))
        return;

      if (this.callProvidedCallback('onPressEnd', { event }) === false)
        return;

      return this.setComponentFlagsFromObject({ pressed: false });
    }

    getFlags() {
      var flags = super.getFlags(),
          largestFlag = getLargestFlag(flags);

      return Object.assign({}, flags, { PRESSED: largestFlag << 1 });
    }

    render(_children) {
      var children = this.getChildren(_children),
          theme = this.getRequestedTheme(),
          flags = this.getComponentFlagsAsArray();

      return (
        <TouchableOpacity
          className={this.getRootClassName(componentName, 'container', flags)}
          style={this.style(this.generateStyleNames(theme, 'container', flags), this.props.style)}
          onPress={this.onPress}
          onPressStart={this.onPressStart}
          onPressEnd={this.onPressEnd}
          tooltip={this.props.tooltip}
          tooltip-side={this.props.tooltipSide || 'bottom'}
          {...(Object.assign({}, this.getHoverableProps()))}
        >
          <View className={this.getRootClassName(componentName, 'internalContainer')} style={this.style(this.generateStyleNames(theme, 'internalContainer', flags), this.props.containerStyle)}>
            {this.renderContents(children)}
          </View>
        </TouchableOpacity>
      );
    }
  };
}, { mixins: [ Hoverable ] });

export { styleSheet as buttonStyles };
