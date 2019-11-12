import { utils as U }                   from 'evisit-js-utils';
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
      buttons: PropTypes.oneOfType([ PropTypes.array, PropTypes.func ]).isRequired,
      buttonStyle: PropTypes.any,
      calculateButtonRadiusStyle: PropTypes.func,
      direction: PropTypes.string,
      disabled: PropTypes.bool,
      onButtonPress: PropTypes.func,
      renderButton: PropTypes.func,
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

    onPropUpdated_buttons(_buttons) {
      const toggledGroupButtonIndex = (group) => {
        // See if "toggled" is set to true on any buttons in the group
        var index = buttons.findIndex((button) => (button.group === group && button.toggled === true));
        if (index >= 0)
          return index;

        // If not, just return the first button in the group
        return buttons.findIndex((button) => (button.group === group));
      };

      var buttons             = _buttons || [],
          alreadyHandledGroup = {};

      for (var i = 0, il = buttons.length; i < il; i++) {
        var button = buttons[i];

        if (button.group && !alreadyHandledGroup[button.group]) {
          alreadyHandledGroup[button.group] = true;

          var index = toggledGroupButtonIndex(button.group);
          if (index >= 0)
            this.toggleButton({ button: buttons[index], buttonIndex: index });
        } else if (button.toggleable && button.toggled) {
          this.toggleButton({ button, buttonIndex: i });
        }
      }
    }


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
          toggledStates: {}
        })
      };
    }

    getButtonToggleScope({ button, buttonIndex }) {
      var scope = (button.group) ? `group.${button.group}.toggledIndex` : `nogroup.${buttonIndex}.toggledIndex`;
      return scope;
    }

    isButtonToggled({ button, buttonIndex }) {
      var scope = this.getButtonToggleScope({ button, buttonIndex }),
          toggledStates = Object.assign({}, this.getState('toggledStates', {}));

      return (U.get(toggledStates, scope) === buttonIndex);
    }

    toggleButton({ button, buttonIndex }) {
      const getFirstToggledButtonIndexInGroup = (group) => {
        if (!group)
          return;

        var buttons = (this.opts.buttons || []),
            toggledButton;

        for (var i = 0, il = buttons.length; i < il; i++) {
          var thisButton = buttons[i];
          if (thisButton.group === group) {
            if (thisButton.toggled)
              toggledButton = i;
            else if (toggledButton == null)
              toggledButton = i;
          }
        }

        return toggledButton;
      };

      var scope                     = this.getButtonToggleScope({ button, buttonIndex }),
          toggledStates             = Object.assign({}, this.getState('toggledStates', {})),
          currentToggledIndex       = U.get(toggledStates, scope),
          currentToggledButtonIndex = getFirstToggledButtonIndexInGroup(),
          toggledIndex              = buttonIndex;

      if (button.group && !button.toggleable) {
        if (currentToggledIndex == null)
          toggledIndex = (currentToggledButtonIndex == null) ? toggledIndex : currentToggledButtonIndex;
      } else if (button.toggleable) {
        if (currentToggledIndex == buttonIndex)
          toggledIndex = null;
      }

      U.set(toggledStates, scope, toggledIndex);
      this.setState({ toggledStates });
    }

    async onButtonPress(button, buttonIndex, event) {
      var onPress = (button && button.onPress);
      if (typeof onPress === 'function' && (await onPress.call(this, { button, buttonIndex, event })) === false)
        return false;

      if ((await this.callProvidedCallback('onButtonPress', { event, button, buttonIndex })) === false)
        return false;

      if (button.toggleable || button.group)
        this.toggleButton(Object.assign({}, { button, buttonIndex }));
    }

    getDirection() {
      return (this.props.direction || 'horizontal').toLowerCase();
    }

    adjustBorderRadius(radius) {
      return (!radius || typeof radius !== 'number' || !isFinite(radius) || radius - 1 < 0) ? 0 : radius - 1;
    }

    getFirstButtonRadiusStyle({ direction, containerStyle }) {
      if (typeof this.props.calculateButtonRadiusStyle === 'function')
        return this.props.calculateButtonRadiusStyle.call(this, { direction, containerStyle, first: true }, this);

      if (direction === 'horizontal') {
        return {
          borderTopLeftRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderTopLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))),
          borderBottomLeftRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderBottomLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')))
        };
      } else {
        return {
          borderTopLeftRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderTopLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))),
          borderTopRightRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderTopRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')))
        };
      }
    }

    getLastButtonRadiusStyle({ direction, containerStyle }) {
      if (typeof this.props.calculateButtonRadiusStyle === 'function')
        return this.props.calculateButtonRadiusStyle.call(this, { direction, containerStyle, first: false }, this);

      if (direction === 'horizontal') {
        return {
          borderTopRightRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderTopRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))),
          borderBottomRightRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderBottomRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')))
        };
      } else {
        return {
          borderBottomLeftRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderBottomLeftRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS'))),
          borderBottomRightRadius: this.adjustBorderRadius(selectFirst(containerStyle.borderBottomRightRadius, containerStyle.borderRadius, this.styleProp('DEFAULT_CONTAINER_BORDER_RADIUS')))
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

      var colorStyle = null;
      if (button.color)
        colorStyle = { color: button.color };

      return (
        <Button
          className={this.getRootClassName(componentName, buttonNames)}
          key={('' + buttonIndex)}
          onPress={this.onButtonPress.bind(this, button, buttonIndex)}
          style={this.style(this.generateStyleNames(direction, 'buttonContainer', flags), this.props.buttonStyle)}
          internalContainerStyle={this.style(buttonNames, this.props.buttonContainerStyle, toggled && this.props.toggledButtonStyle, isFirst && firstButtonRadiusStyle, isLast && lastButtonRadiusStyle)}
          leftIcon={(!!button.icon && this.props.showIcons !== false) ? button.icon : null}
          leftIconStyle={this.style(buttonIconNames, this.props.buttonIconStyle, colorStyle, toggled && this.props.toggledButtonIconStyle)}
          iconContainerStyle={this.style(buttonIconContainerNames, this.props.buttonIconContainerStyle)}
          caption={(!!button.caption && this.props.showCaptions !== false) ? button.caption : null}
          captionStyle={this.style(buttonCaptionNames, this.props.buttonCaptionStyle, colorStyle, toggled && this.props.toggledButtonCaptionStyle)}
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
      var toggled                   = this.isButtonToggled({ button, buttonIndex }),
          direction                 = this.getDirection(),
          flags                     = { toggled },
          buttonNames               = this.generateStyleNames(direction, 'button', flags),
          buttonIconNames           = this.generateStyleNames(direction, 'buttonIcon', flags),
          buttonIconContainerNames  = this.generateStyleNames(direction, 'buttonIconContainer', flags),
          buttonCaptionNames        = this.generateStyleNames(direction, 'buttonCaption', flags),
          isFirst                   = (buttonIndex === 0),
          isLast                    = (buttonIndex === (buttons.length - 1)),
          firstButtonRadiusStyle    = (isFirst) ? this.getFirstButtonRadiusStyle({ direction, containerStyle }) : null,
          lastButtonRadiusStyle     = (isLast) ? this.getLastButtonRadiusStyle({ direction, containerStyle }) : null,
          args = {
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
          };

      if (typeof this.props.renderButton === 'function')
        return this.props.renderButton.call(this, args, this);

      return this.renderButton(args);
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
