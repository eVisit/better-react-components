import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { findNodeHandle, View }         from '@react-ameliorate/native-shims';
import styleSheet                       from './paper-styles';

export const Paper = componentFactory('Paper', ({ Parent, componentName }) => {
  return class Paper extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      id: PropTypes.string,
      position: PropTypes.func,
      anchor: PropTypes.any,
      anchorPosition: PropTypes.object,
      onShouldClose: PropTypes.func,
      onEntering: PropTypes.func,
      onMounted: PropTypes.func,
      onEntered: PropTypes.func,
      onLeaving: PropTypes.func,
      onLeft: PropTypes.func,
      calculateStyle: PropTypes.func,
      pointerEvents: PropTypes.string,
      updateCounter: PropTypes.number
    };

    static defaultProps = {
      ready: true
    };

    construct() {
      Object.defineProperty(this, '_overlayChild', {
        writable: false,
        enumerable: false,
        configurable: false,
        value: {
          instance: this,
          layout: null,
          ready: this.props.ready
        }
      });
    }

    provideContext() {
      return {
        _raPaper: this
      };
    }

    getLayout() {
      // this.delay(() => {
      //   var rootView = this.getReference('_rootView');
      //   if (!rootView)
      //     return;

      //   var paperContext = this.props.raApplication || this.context.application || this.props.raPaperContext || this.context._raPaperContext,
      //       node = (paperContext) ? findNodeHandle(paperContext) : null;

      //   if (!node) {
      //     rootView.measureInWindow((...args) => {
      //       console.log('WINDOW MEASURE: ', args);
      //     });

      //     return;
      //   }

      //   rootView.measureLayout(node, (...args) => {
      //     console.log('LAYOUT MEASURE: ', args);
      //   }, (...args) => {
      //     console.log('ERROR ON MEASURE LAYOUT: ', args);
      //   });
      // }, 10, 'layoutUpdateDelay');
    }

    addToOverlay() {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      this.getLayout();

      //overlay.addChild(this);
    }

    removeFromOverlay() {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      overlay.removeChild(this);
    }

    componentMounted() {
      super.componentMounted();
      this.addToOverlay();
    }

    componentUnmounting() {
      this.removeFromOverlay();
      super.componentUnmounting();
    }

    onPropsUpdated(oldProps, props, ...args) {
      super.onPropsUpdated(oldProps, props, ...args);

      this._overlayChild.ready = !!props.ready;

      if (this.mounted())
        this.addToOverlay();
    }

    render(_children) {
      var children = this.getChildren(_children);

      children = React.Children.only(children);
      if (!children.props)
        throw new TypeError('Paper component must be given only one child that is a valid react element');

      var id = this.props.id,
          childProps = children.props;

      if (!id)
        id = childProps.id;

      if (!id)
        throw new TypeError('Paper component child must have a valid unique "id" prop');

      return super.render(
        <View
          ref={this.captureReference('_rootView')}
          id={('' + id)}
          key={('' + id)}
          style={childProps.style}
          pointerEvents={childProps.pointerEvents}
          _child={this._overlayChild}
        >
          {children}
        </View>
      );
    }
  };
});

export { styleSheet as paperStyles };
