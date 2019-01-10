import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import { Text }                         from '../text';
import styleSheet                       from './button-styles';
import { TouchableOpacity }             from '../touchable-opacity';
import {
  stopEventPropagation,
  getLargestFlag
}                                       from '@base/utils';
import { Hoverable }                    from '@mixins/hoverable';

export const Button = componentFactory('Button', ({ Parent, componentName }) => {
  return class Button extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      caption: PropTypes.string,
      style: PropTypes.any,
      onPress: PropTypes.func,
      disabled: PropTypes.bool
    };

    constructor(props, ...args) {
      super(props, ...args);
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
      var theme = this.props.theme || 'default',
          themeArray = [theme];

      if (this.isComponentFlag('hover'))
        themeArray.push(`${theme}Hover`);

      if (this.isComponentFlag('pressed'))
        themeArray.push(`${theme}Pressed`);

      return themeArray;
    }

    renderContents(children) {
      if (children)
        return children;

      var caption = this.props.caption,
          theme = this.getRequestedTheme();

      if (!caption)
        caption = '';

      return (
        <Text className={this.getRootClassName(componentName, 'caption')} style={this.themedStyle(theme, 'caption', this.props.captionStyle)}>{caption}</Text>
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
          flags = this.getComponentFlagsAsObject();

      return (
        <TouchableOpacity
          className={this.getRootClassName(componentName, 'container', flags)}
          style={this.themedStyle(theme, 'container', (this.props.disabled) ? 'containerDisabled' : 'containerActive', this.props.style)}
          onPress={this.onPress}
          onPressStart={this.onPressStart}
          onPressEnd={this.onPressEnd}
          tooltip={this.props.tooltip}
          tooltip-side={this.props.tooltipSide || 'bottom'}
          {...(Object.assign({}, this.getHoverableProps()))}
        >
          <View className={this.getRootClassName(componentName, 'internalContainer')} style={this.themedStyle(theme, 'internalContainer', this.props.containerStyle)}>
            {this.renderContents(children)}
          </View>
        </TouchableOpacity>
      );
    }
  };
}, { mixins: [ Hoverable ] });
