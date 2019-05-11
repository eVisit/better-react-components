import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import {
  preventEventDefault,
  isElementOrDescendant,
  findDOMNode,
  getDraggedItems
}                                       from '@react-ameliorate/utils';
import styleSheet                       from './droppable-view-styles';

export const DroppableView = componentFactory('DroppableView', ({ Parent, componentName }) => {
  return class DroppableView extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      onDragEnter: PropTypes.func,
      onDragLeave: PropTypes.func,
      onDragOver: PropTypes.func,
      onDrop: PropTypes.func,
      droppableStyle: PropTypes.any,
      acceptDrop: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
      disabled: PropTypes.bool
    };

    resolveState({ props }) {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          dropStyle: null,
          entered: false
        })
      };
    }

    doesAcceptDrop(event) {
      const acceptsDrop = (item) => {
        if (typeof acceptDrop === 'function')
          return acceptDrop.call(this, { event, item });

        var element = item.element;
        if (!element)
          return false;

        if (typeof element.matches === 'function' && (typeof acceptDrop === 'string' || (acceptDrop instanceof String)))
          return element.matches(('' + acceptDrop));

        return false;
      };

      var acceptDrop = this.props.acceptDrop,
          items = getDraggedItems();

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item)
          continue;

        if (!acceptsDrop(item))
          return false;
      }

      return true;
    }

    getDroppableStyle(event) {
      var droppableStyle = this.props.droppableStyle;
      if (typeof droppableStyle === 'function') {
        var item = this.getDragElement(event);
        droppableStyle = droppableStyle.call(this, { event, item });
      }

      return droppableStyle;
    }

    onDragEnter(event) {
      var nativeEvent = (event && event.nativeEvent),
          rootElement = this.getReference('rootElement');

      if (this.props.disabled || this.getState('entered') || (nativeEvent && nativeEvent.toElement !== rootElement || !this.doesAcceptDrop(event))) {
        preventEventDefault(event);
        return;
      }

      var dropStyle = this.getDroppableStyle(event);
      this.setState({ dropStyle, entered: true });

      this.callProvidedCallback('onDragEnter', { event, items: getDraggedItems(), target: this });
    }

    onDragLeave(event) {
      var nativeEvent = (event && event.nativeEvent),
          rootElement = this.getReference('rootElement');

      if (this.props.disabled || !this.getState('entered') || (nativeEvent && isElementOrDescendant(rootElement, nativeEvent.fromElement))) {
        preventEventDefault(event);
        return;
      }

      this.setState({ dropStyle: null, entered: false });

      this.callProvidedCallback('onDragLeave', { event, items: getDraggedItems(), target: this });
    }

    onDragOver(event) {
      if (this.props.disabled || !this.getState('entered') || !this.doesAcceptDrop(event)) {
        preventEventDefault(event);
        return;
      }

      this.callProvidedCallback('onDragOver', { event, items: getDraggedItems(), target: this });
    }

    onDrop(event) {
      if (this.props.disabled || !this.getState('entered') || !this.doesAcceptDrop(event)) {
        preventEventDefault(event);
        return;
      }

      this.setState({ dropStyle: null });

      this.callProvidedCallback('onDrop', { event, items: getDraggedItems(), target: this });
    }

    onDragStart(event) {
      preventEventDefault(event);
      return false;
    }

    onDragEnd(event) {
      preventEventDefault(event);
      return false;
    }

    render(children) {
      return super.render(
        <View
          pointerEvents="box-none"
          {...this.passProps((key) => {
            return (!!key.match(/^(on[A-Z])/));
          })}
          ref={this.captureReference('rootElement', findDOMNode)}
          style={this.style(this.props.style, this.getState('dropStyle'))}
          className={this.getRootClassName(componentName)}
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}
          onDragEnter={this.onDragEnter}
          onDragLeave={this.onDragLeave}
          onDragOver={this.onDragOver}
          onDrop={this.onDrop}
        >
          {this.getChildren(children)}
        </View>
      );
    }
  };
});

export { styleSheet as droppableViewStyles };
