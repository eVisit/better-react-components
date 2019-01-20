import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Text, View, ScrollView }       from '@react-ameliorate/native-shims';
import { Button }                       from '@react-ameliorate/component-button';
import { Icon }                         from '@react-ameliorate/component-icon';
import { Modal }                        from '@react-ameliorate/component-modal';
import { LayoutContainer }              from '@react-ameliorate/component-layout-container';
import {
  findDOMNode,
  isElementOrDescendant
}                                       from '@react-ameliorate/utils';
import styleSheet                       from './generic-modal-styles';

export const GenericModal = componentFactory('GenericModal', ({ Parent, componentName }) => {
  return class GenericModal extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
      title: PropTypes.string,
      message: PropTypes.string,
      buttons: PropTypes.array
    };

    static resolvableProps = ['buttons', 'title', 'message'];

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

      if (elem && !currentReference) {
        window.document.addEventListener('mousedown', this.onTitleBarMouseDown);
        window.document.addEventListener('mouseup', this.onTitleBarMouseUp);
        window.document.addEventListener('mousemove', this.onTitleBarMouseMove);
      } else if (currentReference) {
        window.document.removeEventListener('mousemove', this.onTitleBarMouseMove);
        window.document.removeEventListener('mouseup', this.onTitleBarMouseUp);
        window.document.removeEventListener('mousedown', this.onTitleBarMouseDown);
      }

      return elem;
    }

    renderTitleBar(children) {
      return (
        <View
          ref={this.captureReference('titleBar', this.convertTitleBarReference)}
          key="generic-modal-title-bar"
          style={this.style('titleBar')}
        >
          {(children || null)}
        </View>
      );
    }

    renderCloseButton(children) {
      return (
        <Button
          theme="white"
          key="generic-modal-close-button"
          onPress={this.requestClose}
          style={this.style('closeButton')}
          containerStyle={this.style('closeButtonContainer')}
        >
          {(children) ? children : (<Icon style={this.style('closeButtonIcon')} icon="close|cancel"/>)}
        </Button>
      );
    }

    renderModalContent(children) {
      return (
        <ScrollView key="generic-modal-content" style={this.style('contentContainer')}>
          {(children || null)}
        </ScrollView>
      );
    }

    renderButtons(_buttons) {
      var buttons = this.getValidChildrenAsArray(_buttons);

      return (
        <LayoutContainer
          key="generic-modal-button-container"
          style={this.style('buttonContainer')}
          spacing={this.styleProp('MODAL_BUTTON_SPACING')}
        >
          {buttons.map((button, index) => {
            if (!button)
              return null;

            if (this.isValidElement(button))
              return button;

            if (typeof button.onShouldShow === 'function' && !button.onShouldShow.call(this, { button, index }))
              return null;

            return (
              <Button
                key={button.key || ('' + index)}
                theme={button.theme || 'white'}
                caption={button.caption}
                style={this.style('button', button.style)}
                onPress={(_args) => {
                  var args = Object.assign({}, args || {}, { button, index, });

                  if (typeof button.onPress === 'function' && button.onPress.call(this, args) === false)
                    return;

                  this.requestClose(args);
                }}
              />
            );
          })}
        </LayoutContainer>
      );
    }

    render(_children) {
      var { title, message, buttons } = this.props,
          children = this.getChildren(_children);

      if (!this.isValidElement(title))
        title = (<Text key="generic-modal-title-text" style={this.style('titleBarTitleText')}>{(title || '')}</Text>);

      if (!children)
        children = (<Text key="generic-modal-content-text" style={this.style('contentTitleText')}>{(message || '')}</Text>);

      return super.render([
        this.renderTitleBar([
          <View key="generic-modal-title" style={this.style('titleBarTitle')}>{title}</View>,
          this.renderCloseButton()
        ]),
        this.renderModalContent(children),
        this.renderButtons(buttons)
      ]);
    }
  };
}, Modal);

export { styleSheet as genericModalStyles };
