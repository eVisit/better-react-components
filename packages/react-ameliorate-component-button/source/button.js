import { utils as U }                           from 'evisit-js-utils';
import React                                    from 'react';
import { componentFactory, PropTypes }          from '@react-ameliorate/core';
import { View, Text, TouchableOpacity }         from '@react-ameliorate/native-shims';
import { Icon }                                 from '@react-ameliorate/component-icon';
import { stopEventPropagation, getLargestFlag } from '@react-ameliorate/utils';
import { Hoverable }                            from '@react-ameliorate/mixin-hoverable';
import styleSheet                               from './button-styles';

export const Button = componentFactory('Button', ({ Parent, componentName }) => {
  return class Button extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
      caption: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ]),
      captionStyle: PropTypes.any,
      disabled: PropTypes.bool,
      iconContainerStyle: PropTypes.any,
      iconStyle: PropTypes.any,
      internalContainerStyle: PropTypes.any,
      leftIcon: PropTypes.string,
      leftIconContainerStyle: PropTypes.any,
      leftIconStyle: PropTypes.any,
      onPress: PropTypes.func,
      onPressEnd: PropTypes.func,
      onPressStart: PropTypes.func,
      rightIcon: PropTypes.string,
      rightIconContainerStyle: PropTypes.any,
      rightIconStyle: PropTypes.any,
      tabIndex: PropTypes.number,
      theme: PropTypes.string,
      tooltip: PropTypes.string,
      tooltipSide: PropTypes.string,
      tooltipType: PropTypes.string
    };

    static defaultProps = {
      _raMeasurable: true
    };

    constructor(props, ...args) {
      super(props, ...args);
    }

    formatPropValue(name, _value) {
      var value = super.formatPropValue(name, _value);

      if (name === 'caption')
        return this.formatVerbiageProp(value);

      return value;
    }

    onPropsUpdated(newProps, oldProps, initial) {
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

    onMouseLeave(event) {
      return super.onMouseLeave(event, { extraState: { pressed: false } });
    }

    // Used by global keyboard navigation (on "Enter")
    onAction({ event }) {
      return this.onPress(event);
    }

    async onPressHandler(event, args) {
      return await this.callProvidedCallback('onPress', { event, ...(args || {}) });
    }

    async onPress(event) {
      stopEventPropagation(event);

      if (this.props.disabled || this.getState('awaitingClick'))
        return;

      try {
        this.setState({ awaitingClick: true });
        return this.onPressHandler(event);
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

    renderDefaultContent({
      leftIcon,
      rightIcon,
      caption,
      theme,
      flags,
      captionClassName,
      leftIconClassName,
      rightIconClassName,
      captionStyleNames,
      leftIconStyleNames,
      rightIconStyleNames,
      leftIconContainerStyleNames,
      rightIconContainerStyleNames,
      extraCaptionStyle,
      extraIconStyle,
      extraIconContainerStyle,
      extraLeftIconStyle,
      extraLeftIconContainerStyle,
      extraRightIconStyle,
      extraRightIconContainerStyle,
      children
    }) {
      return (
        <React.Fragment>
          {(!!leftIcon) && (
            <Icon
              className={leftIconClassName}
              icon={leftIcon}
              containerStyle={this.style(leftIconContainerStyleNames, extraIconContainerStyle, extraLeftIconContainerStyle, this.props.iconContainerStyle, this.props.leftIconContainerStyle)}
              style={this.style(leftIconStyleNames, this.props.captionStyle, extraIconStyle, extraLeftIconStyle, this.props.iconStyle, this.props.leftIconStyle)}
            />
          )}

          {(!!caption) && (
            <Text
              className={captionClassName}
              style={this.style(captionStyleNames, extraCaptionStyle, this.props.captionStyle)}
            >
              {caption}
            </Text>
          )}

          {(!!rightIcon) && (
            <Icon
              className={rightIconClassName}
              icon={rightIcon}
              containerStyle={this.style(rightIconContainerStyleNames, extraIconContainerStyle, extraRightIconContainerStyle, this.props.iconContainerStyle, this.props.rightIconContainerStyle)}
              style={this.style(rightIconStyleNames, this.props.captionStyle, extraIconStyle, extraRightIconStyle, this.props.iconStyle, this.props.rightIconStyle)}
            />
          )}

          {children}
        </React.Fragment>
      );
    }

    _renderContent(args) {
      var {
            leftIcon,
            rightIcon,
            caption
          }                             = this.props,
          {
            flags,
            theme
          }                             = args,
          iconStyleNames                = this.generateStyleNames(theme, 'icon', flags),
          iconContainerStyleNames       = this.generateStyleNames(theme, 'iconContainer', flags),
          captionClassName              = this.getClassName(componentName, 'caption'),
          captionStyleNames             = this.generateStyleNames(theme, 'caption', flags),
          leftIconClassName             = this.getClassName(componentName, 'leftIcon'),
          leftIconStyleNames            = iconStyleNames.concat(this.generateStyleNames(theme, 'leftIcon', flags)),
          leftIconContainerStyleNames   = iconContainerStyleNames.concat(this.generateStyleNames(theme, 'leftIconContainer', flags)),
          rightIconClassName            = this.getClassName(componentName, 'rightIcon'),
          rightIconStyleNames           = iconStyleNames.concat(this.generateStyleNames(theme, 'rightIcon', flags)),
          rightIconContainerStyleNames  = iconContainerStyleNames.concat(this.generateStyleNames(theme, 'rightIconContainer', flags));

      if (!caption)
        caption = '';

      var callArgs = Object.assign({}, args, {
        leftIcon,
        rightIcon,
        caption,
        captionClassName,
        captionStyleNames,
        leftIconClassName,
        leftIconStyleNames,
        rightIconClassName,
        rightIconStyleNames,
        leftIconContainerStyleNames,
        rightIconContainerStyleNames
      });

      return this.renderContent(callArgs);
    }

    renderContent(args) {
      var { children } = args;

      if (children && typeof children === 'function')
        return children.call(this, { ...args, children: null }, this);

      if (children)
        return children;

      return this.renderDefaultContent(args);
    }

    _renderInternalContainer(args) {
      var { theme, flags } = args,
          internalContainerClassName  = this.getRootClassName(componentName, 'internalContainer'),
          internalContainerStyleNames = this.generateStyleNames(theme, 'internalContainer', flags);

      var callArgs = Object.assign({}, args, {
        internalContainerClassName,
        internalContainerStyleNames
      });

      return this.renderInternalContainer(callArgs);
    }

    renderInternalContainer(args) {
      var {
        internalContainerClassName,
        internalContainerStyleNames,
        internalContainerExtraStyle
      } = args;

      return (
        <View className={internalContainerClassName} style={this.style(internalContainerStyleNames, internalContainerExtraStyle, this.props.internalContainerStyle)}>
          {this._renderContent(args)}
        </View>
      );
    }

    _renderContainer(args) {
      var { theme, flags }    = args,
          containerClassName  = this.getRootClassName(componentName, 'container', flags),
          containerStyleNames = this.generateStyleNames(theme, 'container', flags);

      var callArgs = Object.assign({}, args, {
        containerClassName,
        containerStyleNames
      });

      return this.renderContainer(callArgs);
    }

    renderContainer(args) {
      var {
        containerClassName,
        containerStyleNames,
        containerExtraStyle
      } = args;

      return (
        <TouchableOpacity
          activeOpacity={this.styleProp('DEFAULT_ACTIVE_OPACITY')}
          pointerEvents="auto"
          {...this.props}
          className={containerClassName}
          style={this.style(containerStyleNames, containerExtraStyle, this.props.style)}
          onPress={this.onPress}
          onPressStart={this.onPressStart}
          onPressEnd={this.onPressEnd}
          data-tooltip={this.props.tooltip}
          data-tooltip-side={this.props.tooltipSide || 'bottom'}
          data-tooltip-type={this.props.tooltipType || 'default'}
          data-tabindex={this.props.tabIndex}
          {...this.getHoverableProps()}
          ref={this.captureReference('_rootView')}
        >
          {this._renderInternalContainer(args)}
        </TouchableOpacity>
      );
    }

    render(_children) {
      var children = this.getChildren(_children),
          theme = this.getRequestedTheme(),
          flags = this.getComponentFlagsAsArray();

      if (!U.noe(this.props.caption))
        flags.push('withCaption');

      return super.render(this._renderContainer({ children, theme, flags }));
    }
  };
}, { mixins: [ Hoverable ] });

export { styleSheet as buttonStyles };
