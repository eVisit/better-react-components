import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { selectFirst }                  from '@react-ameliorate/utils';
import { LayoutContainer }              from '@react-ameliorate/component-layout-container';
import { Button }                       from '@react-ameliorate/component-button';
import styleSheet                       from './button-bar-styles';

export const ButtonBar = componentFactory('ButtonBar', ({ Parent, componentName }) => {
  return class ButtonBar extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      buttonCaptionContainerStyle: PropTypes.any,
      buttonCaptionStyle: PropTypes.any,
      buttonContainerStyle: PropTypes.any,
      buttonIconContainerStyle: PropTypes.any,
      buttonIconStyle: PropTypes.any,
      buttons: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
      buttonStyle: PropTypes.any,
      direction: PropTypes.string,
      disabled: PropTypes.bool,
      onButtonPress: PropTypes.func,
      showCaptions: PropTypes.bool,
      showIcons: PropTypes.bool,
      spacerStyle: PropTypes.any,
      spacing: PropTypes.number,
      toggledButtonCaptionContainerStyle: PropTypes.any,
      toggledButtonCaptionStyle: PropTypes.any,
      toggledButtonContainerStyle: PropTypes.any,
      toggledButtonIconContainerStyle: PropTypes.any,
      toggledButtonIconStyle: PropTypes.any,
      toggledButtonStyle: PropTypes.any,
    };

    static defaultProps = {
      spacing: 1,
      showCaptions: false
    };

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments),
          buttons  = props.buttons;

      if (typeof buttons === 'function')
        props.buttons = buttons.call(this);

      return props;
    }

    resolveState({ props }) {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
        })
      };
    }

    async onButtonPress(button, buttonIndex, event) {
      var onPress = (button && button.onPress);
      if (typeof onPress === 'function' && (await onPress.call(this, { button, buttonIndex, event })) === false)
        return false;

      if ((await this.callProvidedCallback('onButtonPress', { event, button, buttonIndex })) === false)
        return false;
    }

    getDirection() {
      return (this.props.direction || 'horizontal').toLowerCase();
    }

    getFirstButtonRadiusStyle({ direction, containerStyle }) {
      if (direction === 'horizontal') {
        return {
          borderTopLeftRadius: selectFirst(containerStyle.borderTopLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')),
          borderBottomLeftRadius: selectFirst(containerStyle.borderBottomLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))
        };
      } else {
        return {
          borderTopLeftRadius: selectFirst(containerStyle.borderTopLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')),
          borderTopRightRadius: selectFirst(containerStyle.borderTopRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))
        };
      }
    }

    getLastButtonRadiusStyle({ direction, containerStyle }) {
      if (direction === 'horizontal') {
        return {
          borderTopRightRadius: selectFirst(containerStyle.borderTopRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')),
          borderBottomRightRadius: selectFirst(containerStyle.borderBottomRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))
        };
      } else {
        return {
          borderBottomLeftRadius: selectFirst(containerStyle.borderBottomLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')),
          borderBottomRightRadius: selectFirst(containerStyle.borderBottomRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))
        };
      }
    }

    renderButton(args) {
      var {
        button,
        buttonCaptionNames,
        buttonIconContainerNames,
        buttonIconNames,
        buttonIndex,
        buttonNames,
        children,
        direction,
        firstButtonRadiusStyle,
        flags,
        isFirst,
        isLast,
        lastButtonRadiusStyle,
        toggled,
      } = args;

      return (
        <Button
          className={this.getRootClassName(componentName, buttonNames)}
          key={('' + buttonIndex)}
          onPress={this.onButtonPress.bind(this, button, buttonIndex)}
          style={this.style(this.generateStyleNames(direction, 'buttonContainer', flags))}
          internalContainerStyle={this.style(buttonNames, this.props.buttonStyle, toggled && this.props.toggledButtonStyle, isFirst && firstButtonRadiusStyle, isLast && lastButtonRadiusStyle)}
          leftIcon={(!!button.icon && this.props.showIcons !== false) ? button.icon : null}
          leftIconStyle={this.style(buttonIconNames, this.props.buttonIconStyle, toggled && this.props.toggledButtonIconStyle)}
          iconContainerStyle={this.style(buttonIconContainerNames, this.props.buttonIconContainerStyle)}
          caption={(!!button.caption && this.props.showCaptions !== false) ? button.caption : null}
          captionStyle={this.style(buttonCaptionNames, this.props.buttonCaptionStyle, toggled && this.props.toggledButtonCaptionStyle)}
          tooltip={button.tooltip}
          tooltipSide={button.tooltipSide}
          tooltipType={button.tooltipType || 'default'}
          theme={button.theme || 'white'}
          disabled={button.disabled || this.props.disabled}
        >
          {(buttonArgs, button) => {
            return (
              <React.Fragment>
                {button.renderDefaultContent(buttonArgs)}

                {children}

                {(typeof button.renderExtra === 'function') ? button.renderExtra.call(this, args) : null}
              </React.Fragment>
            );
          }}
        </Button>
      );
    }

    _renderButton({ button, buttonIndex, buttons, containerStyle }) {
      var toggled                    = false,
          direction                 = this.getDirection(),
          flags                     = { toggled },
          buttonNames               = this.generateStyleNames(direction, 'button', flags),
          buttonIconNames           = this.generateStyleNames(direction, 'buttonIcon', flags),
          buttonIconContainerNames  = this.generateStyleNames(direction, 'buttonIconContainer', flags),
          buttonCaptionNames        = this.generateStyleNames(direction, 'buttonCaption', flags),
          isFirst                   = (buttonIndex === 0),
          isLast                    = (buttonIndex === (buttons.length - 1)),
          firstButtonRadiusStyle    = (isFirst) ? this.getFirstButtonRadiusStyle({ direction, containerStyle }) : null,
          lastButtonRadiusStyle     = (isLast) ? this.getLastButtonRadiusStyle({ direction, containerStyle }) : null;

      return this.renderButton({
        button,
        buttonCaptionNames,
        buttonIconContainerNames,
        buttonIconNames,
        buttonIndex,
        buttonNames,
        direction,
        firstButtonRadiusStyle,
        flags,
        isFirst,
        isLast,
        lastButtonRadiusStyle,
        toggled,
      });
    }

    getContainerStyle(raw, ...args) {
      var direction = this.getDirection();
      return this[(raw) ? 'rawStyle' : 'style']('container', this.generateStyleNames(direction, 'container'), ...args, this.props.style);
    }

    getSpacerStyle(...args) {
      var direction = this.getDirection();
      return this.style('spacer', this.generateStyleNames(direction, 'spacer'), ...args, this.props.spacerStyle);
    }

    render(_children) {
      var direction       = this.getDirection(),
          buttons         = this.props.buttons || [],
          containerStyle  = this.getContainerStyle(true);

      return super.render(
        <LayoutContainer
          className={this.getRootClassName(componentName, this.generateStyleNames(direction, 'container'))}
          direction={this.props.direction}
          spacerStyle={this.getSpacerStyle()}
          spacing={this.props.spacing}
          style={containerStyle}
          debug
        >
          {buttons.map((button, buttonIndex) => this._renderButton({ button, buttonIndex, buttons, containerStyle }))}

          {this.getChildren(_children)}
        </LayoutContainer>
      );
    }
  };
});

export { styleSheet as buttonBarStyles };
