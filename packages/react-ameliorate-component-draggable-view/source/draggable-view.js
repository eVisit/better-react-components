import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import styleSheet                       from './draggable-view-styles';
import {
  setDraggedItems,
  isElementOrDescendant,
  preventEventDefault,
  findDOMNode
}                                       from '@base/utils';

const DraggableView = componentFactory('DraggableView', ({ Parent, componentName }) => {
  return class DraggableView extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      onDragStart: PropTypes.func,
      onDragEnd: PropTypes.func,
      disabled: PropTypes.bool
    };

    resolveState({ props }) {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
        })
      };
    }

    onDragStart(event) {
      if (this.props.disabled) {
        preventEventDefault(event);
        return false;
      }

      var nativeEvent = (event && event.nativeEvent);
      if (nativeEvent && nativeEvent.target)
        setDraggedItems([{ component: this, element: nativeEvent.target }]);

      this.callProvidedCallback('onDragStart', { event });
    }

    onDragEnd(event) {
      if (this.props.disabled) {
        preventEventDefault(event);
        return false;
      }

      this.callProvidedCallback('onDragEnd', { event });
      setDraggedItems([]);
    }

    onClick(event) {
      if (this.props.disabled)
        return;

      var target = U.get(event, 'nativeEvent.target'),
          rootElement = this.getReference('rootElement');

      if (!isElementOrDescendant(rootElement, target))
        return;

      if (typeof this.props.onPress === 'function')
        this.props.onPress.call(this, event);
    }

    onMouseDown(event) {
      if (this.props.disabled)
        return;

      var target = U.get(event, 'nativeEvent.target'),
          rootElement = this.getReference('rootElement');

      if (!isElementOrDescendant(rootElement, target))
        return;

      if (typeof this.props.onPressStart === 'function')
        this.props.onPressStart.call(this, event);
    }

    onMouseUp(event) {
      if (this.props.disabled)
        return;

      var target = U.get(event, 'nativeEvent.target'),
          rootElement = this.getReference('rootElement');

      if (!isElementOrDescendant(rootElement, target))
        return;

      if (typeof this.props.onPressEnd === 'function')
        this.props.onPressEnd.call(this, event);
    }

    render(children) {
      return super.render(
        <View
          {...this.filterProps((key) => {
            if (key.match(/^(onPress)$/))
              return false;

            return (!!key.match(/^(on[A-Z]|style)/));
          })}
          ref={this.captureReference('rootElement', findDOMNode)}
          className={this.getRootClassName(componentName)}
          draggable="true"
          onClick={this.onClick}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}
        >
          {this.getChildren(children)}
        </View>
      );
    }
  };
});

export { DraggableView };
