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
      title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      icon: PropTypes.string,
      iconStyle: PropTypes.any,
      iconContainerStyle: PropTypes.any,
      buttons: PropTypes.array,
      allowScrolling: PropTypes.bool,
      scrollViewProps: PropTypes.object,
      contentContainerStyle: PropTypes.any,
      buttonContainerSpacing: PropTypes.number,
      buttonContainerProps: PropTypes.object,
      buttonContainerStyle: PropTypes.any,
      buttonContainerSpacerStyle: PropTypes.any,
      buttonProps: PropTypes.object,
      buttonStyle: PropTypes.any,
      buttonInternalContainerStyle: PropTypes.any,
      closeButton: PropTypes.bool,
      closeButtonEventName: PropTypes.string,
      closeButtonProps: PropTypes.object,
      closeButtonStyle: PropTypes.any,
      closeButtonContainerStyle: PropTypes.any,
    };

    static resolvableProps = ['buttons', 'title', 'message'];

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

      return {
        ...props,
        title: this.resolveCaptionProp(props.title)
      };
    }

    async resolve(eventName, result, args, force) {
      if (force !== true && this.closing)
        return false;

      this.closing = true;

      if (eventName) {
        var callbackResult = await this.callProvidedCallback(eventName, { ...args, modal: this });
        if (callbackResult === false) {
          this.closing = false;
          return false;
        }
      }

      this.close({ ...args, result });

      return false;
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

      this.setState({ modalPositionStyle: { transform: `translate(${currentPosition.x}px, ${currentPosition.y}px)` } });
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
          <View key="generic-modal-title" style={this.style('titleBarTitle')}>
            {(!!this.props.icon) && (<Icon icon={this.props.icon} style={this.style('titleBarTitleIcon', this.props.iconStyle)} containerStyle={this.style('titleBarTitleIconContainer', this.props.iconContainerStyle)}/>)}

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
      this.close({ ...args, eventName: this.props.closeButtonEventName, result: -1 });
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
          {(children) ? children : (<Icon style={this.style('closeButtonIcon')} icon="close|cancel"/>)}
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
          <View key="generic-modal-content" style={this.style('contentContainer', this.props.contentContainerStyle)}>
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
            contentContainerStyle={this.style('contentScrollContainer')}
          >
            {children}
          </ScrollView>
        );
      };

      return (
        <View key="generic-modal-content-container" style={this.style('contentContainer', this.props.contentContainerStyle)}>
          {doRender()}
        </View>
      );
    }

    _renderContent(args = {}) {
      return this.renderContent(args);
    }

    renderButtons() {
      var modalButtons = this.getButtons();
      if (!modalButtons || !modalButtons.length)
        return null;

      return (
        <LayoutContainer
          className={this.getClassName(componentName, 'buttonContainer')}
          spacing={selectFirst(this.props.buttonContainerSpacing, this.styleProp('MODAL_BUTTON_SPACING'))}
          {...(this.props.buttonContainerProps || {})}
          key="generic-modal-button-container"
          style={this.style('buttonContainer', this.props.buttonContainerStyle)}
          spacerStyle={this.style('buttonContainerSpacer', this.props.buttonContainerSpacerStyle)}
        >
          {modalButtons.map((button, index) => {
            if (this.isValidElement(button))
              return button;

            if (typeof button.onShouldShow === 'function' && !button.onShouldShow.call(this, { button, index }))
              return null;

            var closing = false;

            return (
              <Button
                theme={button.theme || 'white'}
                {...(this.props.buttonProps || {})}
                {...button}
                testID={button.testID}
                key={button.key || (('' + index) + button.caption)}
                caption={button.caption}
                style={this.style('button', this.props.buttonStyle, button.style)}
                internalContainerStyle={this.style('buttonInternalContainer', this.props.buttonInternalContainerStyle)}
                onPress={async (_args) => {
                  if (closing)
                    return;

                  closing = true;

                  var args = Object.assign({}, _args || {}, { button, index });

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
          })}
        </LayoutContainer>
      );
    }

    _renderButtons(args = {}) {
      return this.renderButtons(args);
    }

    getTitle({ title }) {
      if (!this.isValidElement(title))
        return (<Text key="generic-modal-title-text" style={this.style('titleBarTitleText')}>{formatClientText(title || '')}</Text>);

      return title;
    }

    getContent({ children }) {
      return children;
    }

    getButtons() {
      return this.props.buttons || [];
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
