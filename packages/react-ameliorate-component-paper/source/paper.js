import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { findDOMNode }                  from '@react-ameliorate/utils';
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

    provideContext() {
      return {
        _raPaper: this
      };
    }

    updateLayout() {
      this.delay(() => {
        if (!this.mounted())
          return this.updateLayout();

        var rootView = this.getReference('_rootView');
        if (!rootView)
          return;

        var paperContext = this.props.raPaperContext || this.context._raPaperContext,
            node = findDOMNode(paperContext);

        if (!node)
          return this.updateLayout();

        rootView.measureLayout(node, (...args) => {
          console.log('LAYOUT MEASURE: ', args);
        }, (...args) => {
          console.log('ERROR ON MEASURE LAYOUT: ', args);
        });
      }, 10, 'layoutUpdateDelay');
    }

    addToOverlay(child) {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      // this.updateLayout();

      overlay.addChild(child);
    }

    removeFromOverlay(child) {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      overlay.removeChild(child);
    }

    componentUnmounting() {
      this.removeFromOverlay({ props: { id: this.props.id } });
      super.componentUnmounting();
    }

    render(_children) {
      var children = this.getChildren(_children);
      if (!this.props.id)
        throw new TypeError('Paper component child must have a valid unique "id" prop');

      this.addToOverlay(
        <View
          {...this.passProps(this.props)}
          className={this.getRootClassName(componentName)}
          ref={this.captureReference('_rootView')}
          onLayout={this.updateLayout}
        >
          {children}
        </View>
      );

      return super.render(null);
    }
  };
});

export { styleSheet as paperStyles };
