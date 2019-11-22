import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Text, View, ScrollView }       from '@react-ameliorate/native-shims';
import { Button }                       from '@react-ameliorate/component-button';
import { Icon }                         from '@react-ameliorate/component-icon';
import { Modal }                        from '@react-ameliorate/component-modal';
import { LayoutContainer }              from '@react-ameliorate/component-layout-container';
import {
  findDOMNode,
  isElementOrDescendant,
  formatClientText,
  selectFirst
}                                       from '@react-ameliorate/utils';
import styleSheet                       from './generic-modal-styles';

export const GenericModal = componentFactory('GenericModal', ({ Parent, componentName }) => {
  return class GenericModal extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
      allowScrolling: PropTypes.bool,
      buttonContainerProps: PropTypes.object,
      buttonContainerSpacerStyle: PropTypes.any,
      buttonContainerStyle: PropTypes.any,
      buttonGroupContainerProps: PropTypes.object,
      buttonGroupContainerSpacerStyle: PropTypes.any,
      buttonGroupContainerStyle: PropTypes.any,
      buttonHorizontalSpacing: PropTypes.number,
      buttonInternalContainerStyle: PropTypes.any,
      buttonProps: PropTypes.object,
      buttons: PropTypes.oneOfType([ PropTypes.array, PropTypes.func ]),
      buttonStyle: PropTypes.any,
      buttonVerticalSpacing: PropTypes.number,
      closeButton: PropTypes.bool,
      closeButtonContainerStyle: PropTypes.any,
      closeButtonEventName: PropTypes.string,
      closeButtonIconStyle: PropTypes.any,
      closeButtonProps: PropTypes.object,
      closeButtonStyle: PropTypes.any,
      contentContainerStyle: PropTypes.any,
      icon: PropTypes.string,
      iconContainerStyle: PropTypes.any,
      iconStyle: PropTypes.any,
      scrollViewProps: PropTypes.object,
      title: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ])
    };

    static resolvableProps = [ 'title', 'message', 'buttonVerticalSpacing', 'buttonHorizontalSpacing' ];

    constructor(...args) {
      super(...args);

      Object.defineProperties(this, {
        'closing': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: false
        }
      });
    }

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments);

      if (typeof props.buttons === 'function') {
        props.buttons = props.buttons.call(this, this.getButtons(), this);
        if (!props.buttons)
          props.buttons = [];
      }

      return {
        ...props,
        contentContainerStyle: this.style('formContainer')
      };
    }

    formatPropValue(name, _value) {
      var value = super.formatPropValue(name, _value);

      if (name === 'title')
        return this.formatVerbiageProp(value);

      return value;
    }

    resolve(eventName, result, args) {
      return this.close({ ...args, eventName, result });
    }

    onTitleBarMouseDown(event) {
      if (!(event.buttons & 0x01))
        return;

      var titleBarElem = this.getReference('titleBar');
      if (!event || !event.target || !titleBarElem)
        return;

      if (isElementOrDescendant(titleBarElem, event.target)) {
        this._moveStartPosition = {
          x: event.clientX,
          y: event.clientY
        };

        if (!this._moveCurrentPosition) {
          this._moveCurrentPosition = {
            x: 0,
            y: 0
          };
        }
      }
    }

    onTitleBarMouseUp(event) {
      if (event.buttons & 0x01)
        return;

      this._moveStartPosition = null;
    }

    onTitleBarMouseMove(event) {
      var startPos = this._moveStartPosition;
      if (!startPos)
        return;

      var relX = event.clientX - startPos.x,
          relY = event.clientY - startPos.y,
          currentPosition = this._moveCurrentPosition;

      if (!isFinite(relX) || !isFinite(relY))
        return;

      this._moveStartPosition.x = event.clientX;
      this._moveStartPosition.y = event.clientY;
      currentPosition.x += relX;
      currentPosition.y += relY;

      this.setState({
        modalPositionStyle: [
          {
            translateX: currentPosition.x
          },
          {
            translateY: currentPosition.y
          },
        ]
      });
    }

    convertTitleBarReference(_elem) {
      if (!window.document)
        return;

      var elem = findDOMNode(_elem),
          currentReference = this.getReference('titleBar');

      if (currentReference) {
        window.document.removeEventListener('mousemove', this.onTitleBarMouseMove);
        window.document.removeEventListener('mouseup', this.onTitleBarMouseUp);
        window.document.removeEventListener('mousedown', this.onTitleBarMouseDown);
      }

      if (elem) {
        window.document.addEventListener('mousedown', this.onTitleBarMouseDown);
        window.document.addEventListener('mouseup', this.onTitleBarMouseUp);
        window.document.addEventListener('mousemove', this.onTitleBarMouseMove);
      }

      return elem;
    }

    renderTitleBar() {
      return (
        <View
          className={this.getClassName(componentName, 'titleBar')}
          ref={this.captureReference('titleBar', this.convertTitleBarReference)}
          key="generic-modal-title-bar"
          style={this.style('titleBar')}
        >
          <View
            className={this.getClassName(componentName, 'titleBarTitle')}
            key="generic-modal-title"
            style={this.style('titleBarTitle')}
          >
            {(!!this.props.icon) && (
              <Icon
                className={this.getClassName(componentName, 'titleBarIcon')}
                icon={this.props.icon}
                style={this.style('titleBarTitleIcon', this.props.iconStyle)}
                containerStyle={this.style('titleBarTitleIconContainer', this.props.iconContainerStyle)}
              />
            )}

            {this.getTitle({ title: this.props.title })}
          </View>
          {this._renderCloseButton()}
        </View>
      );
    }

    _renderTitleBar(args = {}) {
      return this.renderTitleBar(args);
    }

    onCloseButtonPress(args) {
      this.resolve(this.props.closeButtonEventName, -1, args);
    }

    renderCloseButton({ children }) {
      return (
        <Button
          className={this.getClassName(componentName, 'closeButton')}
          theme="white"
          testID="genericModalClose"
          {...(this.props.closeButtonProps || {})}
          key="generic-modal-close-button"
          onPress={this.onCloseButtonPress}
          style={this.style('closeButton', this.props.closeButtonStyle)}
          internalContainerStyle={this.style('closeButtonInternalContainer', this.props.closeButtonContainerStyle)}
        >
          {(children) ? children : (<Icon style={this.style('closeButtonIcon', this.props.closeButtonIconStyle)} icon="close|cancel"/>)}
        </Button>
      );
    }

    _renderCloseButton(args = {}) {
      if (this.props.closeButton === false)
        return null;

      return this.renderCloseButton(args);
    }

    renderContent({ children }) {
      const doRender = () => {
        if (this.props.allowScrolling === false) {
        return (
          <View
            className={this.getClassName(componentName, 'content')}
            key="generic-modal-content"
            style={this.style('contentScrollContainer')}
          >
            {children}
          </View>
        );
        }

        var scrollViewProps = this.props.scrollViewProps || {};

        return (
          <ScrollView
            className={this.getClassName(componentName, 'content')}
            {...scrollViewProps}
            key="generic-modal-content"
            style={this.style('contentScrollView')}
            contentContainerStyle={this.style('contentScrollContainer')}
          >
            {children}
          </ScrollView>
        );
      };

      return (
        <View
          className={this.getClassName(componentName, 'contentContainer')}
          key="generic-modal-content-container"
          style={this.style('contentContainer', this.props.contentContainerStyle)}
        >
          {doRender()}
        </View>
      );
    }

    _renderContent(args = {}) {
      return this.renderContent(args);
    }

    _renderButton(args) {
      return this.renderButton(args);
    }

    renderButton({ button, buttonIndex, buttonStyle, buttonInternalContainerStyle }) {
      if (this.isValidElement(button))
        return button;

      if (typeof button.onShouldShow === 'function' && !button.onShouldShow.call(this, { button, buttonIndex }))
        return null;

      var closing = false;

      return (
        <Button
          theme={button.theme || 'white'}
          {...(this.props.buttonProps || {})}
          {...button}
          testID={button.testID}
          key={button.key || (('' + buttonIndex) + button.caption)}
          caption={button.caption}
          style={this.style('button', this.props.buttonStyle, buttonStyle, button.style)}
          internalContainerStyle={this.style('buttonInternalContainer', this.props.buttonInternalContainerStyle, buttonInternalContainerStyle)}
          onPress={async (_args) => {
            if (closing)
              return;

            closing = true;

            var args = Object.assign({}, _args || {}, { button, buttonIndex });

            if (typeof button.onPress === 'function') {
              var result = await button.onPress.call(this, { ...args, modal: this });
              if (result === false) {
                closing = false;
                return;
              }
            }

            this.close(args);
          }}
        />
      );
    }

    _renderButtons(args = {}) {
      var buttons = this._getButtons();
      return this.renderButtons(Object.assign({}, args, { buttons }));
    }

    renderButtons(args) {
      var {
            buttonContainerProps,
            buttonContainerSpacerStyle,
            buttonContainerStyle,
            buttonGroupContainerProps,
            buttonGroupContainerSpacerStyle,
            buttonGroupContainerStyle,
            buttonHorizontalSpacing,
            buttons,
            buttonVerticalSpacing
          } = args;

      var buttonGroupKeys = Object.keys(buttons || {});

      return (
        <LayoutContainer
          className={this.getClassName(componentName, 'buttonGroupContainer')}
          spacing={selectFirst(buttonVerticalSpacing, this.props.buttonVerticalSpacing, this.styleProp('MODAL_BUTTON_VERTICAL_SPACING'))}
          {...(this.props.buttonGroupContainerProps || {})}
          direction="vertical"
          key="generic-modal-button-group-container"
          style={this.style('buttonGroupContainer', this.props.buttonGroupContainerStyle, buttonGroupContainerStyle)}
          spacerStyle={this.style('buttonGroupContainerSpacer', this.props.buttonGroupContainerSpacerStyle, buttonGroupContainerSpacerStyle)}
          {...(buttonGroupContainerProps || {})}
        >
          {buttonGroupKeys.map((key, groupIndex) => {
            var groupButtons = buttons[key];

            return (
              <LayoutContainer
                className={this.getClassName(componentName, 'buttonContainer')}
                spacing={selectFirst(buttonHorizontalSpacing, this.props.buttonHorizontalSpacing, this.styleProp('MODAL_BUTTON_HORIZONTAL_SPACING'))}
                {...(this.props.buttonContainerProps || {})}
                direction="horizontal"
                key={`generic-modal-button-container-${key}`}
                style={this.style('buttonContainer', this.props.buttonContainerStyle, buttonContainerStyle)}
                spacerStyle={this.style('buttonContainerSpacer', this.props.buttonContainerSpacerStyle, buttonContainerSpacerStyle)}
                {...(buttonContainerProps || {})}
              >
                {(groupButtons || []).map((button, buttonIndex) => {
                  return this._renderButton({ ...args, button, buttonIndex });
                })}
              </LayoutContainer>
            );
          })}
        </LayoutContainer>
      );
    }

    _buttonsArrayToButtonMap(buttons) {
      var buttonMap = {};

      for (var i = 0, il = buttons.length; i < il; i++) {
        var button = buttons[i],
            buttonGroup = button.group || '0',
            group = buttonMap[buttonGroup];

        if (!group)
          group = buttonMap[buttonGroup] = [];

        group.push(button);
      }

      return buttonMap;
    }

    _getButtons() {
      if (this.props.buttons)
        return this.props.buttons;

      return this.memoize(() => {
        return this._buttonsArrayToButtonMap((this.getButtons() || []).filter(Boolean));
      });
    }

    getButtons() {
      return [];
    }

    getTitle({ title }) {
      if (!title)
        return null;

      if (!this.isValidElement(title)) {
        return (
          <Text
            className={this.getClassName(componentName, 'titleBarTitleText')}
            key="generic-modal-title-text"
            style={this.style('titleBarTitleText')}
          >
            {formatClientText(title || '')}
          </Text>
        );
      }

      return title;
    }

    getContent(args) {
      var { children } = (args || {});

      if (typeof children === 'function')
        return children.call(this, { ...(args || {}), ref: this, refProps: this.props });

      return children;
    }

    render(_children) {
      var children  = this.getContent({ children: this.getChildren(_children) });

      return super.render(
        <React.Fragment>
          {this._renderTitleBar()}
          {this._renderContent({ children })}
          {this._renderButtons()}
        </React.Fragment>
      );
    }
  };
}, Modal);

export { styleSheet as genericModalStyles };
