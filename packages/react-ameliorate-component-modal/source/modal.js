import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { Paper }                        from '@react-ameliorate/component-paper';
import styleSheet                       from './modal-styles';

export const Modal = componentFactory('Modal', ({ Parent, componentName }) => {
  return class Modal extends Parent {
    static styleSheet = styleSheet;
    static propTypes = [Paper.propTypes, {
      autoClose: PropTypes.bool,
      calculateParentContainerStyle: PropTypes.func,
      defaultSizeConstraints: PropTypes.bool,
      disallowReposition: PropTypes.bool,
      hasBorder: PropTypes.bool,
      inline: PropTypes.bool,
      modalStyle: PropTypes.any,
      pointerEvents: PropTypes.string
    }];

    static defaultProps = {
      autoClose: true
    };

    constructor(...args) {
      super(...args);

      Object.defineProperties(this, {
        '_closing': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: false
        }
      });
    }

    provideContext() {
      var parentContext = (typeof super.provideContext === 'function') ? super.provideContext.apply(this, arguments) : {};

      return {
        ...parentContext,
        masterLayoutContext: 'modal'
      };
    }

    componentMounting() {
      super.componentMounting.apply(this, arguments);

      this.unregisterDefaultEventActions();
      this.registerDefaultEventAction('keydown', (event) => {
        var nativeEvent = event.nativeEvent,
            key = ('' + nativeEvent.key).toLowerCase();

        // Is this an event I am interested in?
        if (key !== 'escape')
          return;

        nativeEvent.preventDefault();
        nativeEvent.stopImmediatePropagation();

        this.close({ event, result: -2 });
      });
    }

    componentUnmounting() {
      this.unregisterDefaultEventActions();

      if (this._closing !== true) {
        this._closing = true;
        this.callProvidedCallback('onClose', { event: null, result: -2 });
      }

      return super.componentUnmounting.apply(this, arguments);
    }

    async close(_args) {
      const callCallback = async (eventName) => {
        try {
          return await this.callProvidedCallback(eventName, { ...args, eventName, modal: this });
        } catch (e) {
          return false;
        }
      };

      if (this._closing)
        return false;

      var args = _args || {},
          result;

      this._closing = true;

      if (args.eventName && args.eventName !== 'onClose') {
        if ((await callCallback(args.eventName)) === false) {
          this._closing = false;
          return false;
        }
      }

      if ((await callCallback('onClose')) === false) {
        this._closing = false;
        return false;
      }

      this.setState({ visible: false });

      return result;
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          visible: true
        })
      };
    }

    _renderModal(args) {
      return this.renderModal({
        containerClassName: this.getRootClassName(componentName),
        containerStyle: this.style(
          (this.props.defaultSizeConstraints !== false) ? 'defaultConstraints' : null,
          (this.props.hasBorder !== false) ? 'containerBorder' : null,
          'container',
          this.props.style, (!this.props.disallowReposition) ? this.getState('modalPositionStyle') : null,
          this.props.modalStyle
        ),
        pointerEvents: this.props.pointerEvents || 'auto',
        ...(args || {})
      });
    }

    renderModal({ children, containerClassName, containerStyle, pointerEvents }) {
      return (
        <View
          className={containerClassName}
          style={containerStyle}
          pointerEvents={pointerEvents}
        >
          {children}
        </View>
      );
    }

    render(_children) {
      if ((this.context._raModalManager || this.props.inline === true) && !this.getState('visible'))
          return super.render(null);

      var children = this.getChildren(_children);
      if (this.context._raModalManager || this.props.inline === true)
        return super.render(this._renderModal({ children }));

      return super.render(
        <Paper
          {...this.passProps(this.props)}
          id={this.props.id}
          className={this.getClassName(componentName, 'overlay')}
          requiresLayout={false}
        >
          {this._renderModal({ children })}
        </Paper>
      );
    }
  };
});

export { styleSheet as modalStyles };
