import { utils as U }                     from 'evisit-js-utils';
import React                              from 'react';
import { componentFactory }               from '@react-ameliorate/core';
import { View, TouchableWithoutFeedback } from '@react-ameliorate/native-shims';
import { ChildHandler }                   from '@react-ameliorate/mixin-child-handler';
import { TransitionGroup }                from '@react-ameliorate/component-transition-group';
import {
  nextTick,
  findDOMNode,
  isDescendantElement,
  preventEventDefault,
  stopEventPropagation,
  stopEventImmediatePropagation

}                                         from '@react-ameliorate/utils';
import styleSheet                         from './overlay-styles';

export const Overlay = componentFactory('Overlay', ({ Parent, componentName }) => {
  return class Overlay extends Parent {
    static styleSheet = styleSheet;

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          children: []
        })
      };
    }

    // _debugStateUpdates(newState, oldState) {
    //   if (newState.children !== oldState.children)
    //     console.trace('Children: ', newState.children, oldState.children);
    // }

    //###if(!MOBILE){###//
    componentMounted() {
      super.componentMounted.apply(this, arguments);

      this.registerDefaultEventAction('keydown', this.onKeyDown);
    }

    componentUnmounting() {
      this.unregisterDefaultEventActions();

      return super.componentUnmounting.apply(this, arguments);
    }

    onPress(event) {
      var nativeEvent = event && event.nativeEvent,
          rootElement = this.getReference('overlayRoot');

      if (!nativeEvent || !rootElement)
        return;

      if (nativeEvent.target.closest(`.${this.getClassName(componentName, 'ingnoreClick')}`))
        return;

      if (isDescendantElement(rootElement, nativeEvent.target))
        return;

      // Make sure it wasn't one of the anchors that was clicked on
      var children = this.getState('children', []);
      for (var i = 0, il = children.length; i < il; i++) {
        var child = children[i],
            anchor = (child && child.props && child.props.anchor),
            anchorElem = (anchor && typeof anchor.getDOMNode === 'function' && anchor.getDOMNode());

        if (!anchorElem)
          continue;

        if (isDescendantElement(anchorElem, nativeEvent.target))
          return;
      }

      this.closeAll();
    }

    onKeyDown(event) {
      var nativeEvent = (event && event.nativeEvent);

      if (nativeEvent && nativeEvent.code === 'Escape') {
        var children = this.getState('children', []);
        if (!children.length)
          return;

        preventEventDefault(event);
        stopEventPropagation(event);
        stopEventImmediatePropagation(event);

        this.closeAll();
      }
    }
    //###}###//

    provideContext() {
      return {
        _raOverlay: this,
        _raPaperContext: this
      };
    }

    closeAll() {
      this.setState({ children: this.requestChildrenClose(undefined, undefined, 'close') });
    }

    requestChildrenClose(_children, isException, sourceAction, extraProps) {
      var children = (_children) ? _children : this.getState('children', []);

      var remainingChildren = children.filter((thisChild) => {
        if (!thisChild)
          return false;

        if (!this._isChildReady(thisChild))
          return true;

        const shouldKeep = () => {
          if (typeof isException === 'function' && isException(thisChild))
            return true;

          var onShouldClose = (thisChild.props && thisChild.props.onShouldClose);
          if (typeof onShouldClose === 'function' && !onShouldClose.call(this, Object.assign({ child: thisChild, childProps: thisChild.props, action: sourceAction }, extraProps || {})))
            return true;

          return false;
        };

        return shouldKeep();
      });

      return remainingChildren;
    }

    addChild(child) {
      if (!child)
        return;

      nextTick(() => {
        var children = this.getState('children', []).slice(),
            index = children.findIndex((thisChild) => (thisChild.props.id === child.props.id || thisChild === child));

        if (index < 0)
          children.push(child);
        else
          children[index] = child;

        this.setState({ children: this.requestChildrenClose(children, (childInstance) => (childInstance === child), 'add', { actionChild: child }) });
      });
    }

    removeChild(child) {
      nextTick(() => {
        var children = this.getState('children', []),
            index = children.findIndex((thisChild) => (thisChild.props.id === child.props.id || thisChild === child));

        if (index >= 0) {
          children = children.slice();
          children.splice(index, 1);

          this.setState({ children });
        }
      });
    }

    _getChildFromStateObject(stateObject) {
      if (!stateObject)
        return;

      return stateObject.element;
    }

    _getChildPropsFromChild(child) {
      if (!child)
        return;

      return child.props;
    }

    _getChildPosition(child) {
      if (!child)
        return {};

      var childProps = this._getChildPropsFromChild(child);
      return (childProps && childProps['ra-position']);
    }

    _isChildReady(child) {
      var childProps = this._getChildPropsFromChild(child),
          position = this._getChildPosition(child);

      return (childProps.visible === false || (!position && childProps.anchor)) ? false : true;
    }

    callProxyToOriginalEvent(eventName, stateObject) {
      var child = this._getChildFromStateObject(stateObject);
      if (!child)
        return;

      var childProps = this._getChildPropsFromChild(child),
          func = child[eventName] || childProps[eventName];

      if (typeof func === 'function')
        func.call(this, Object.assign({}, stateObject || {}, childProps));
    }

    onChildEntering(stateObject) {
      return this.callProxyToOriginalEvent('onEntering', stateObject);
    }

    onChildMounted(stateObject) {
      return this.callProxyToOriginalEvent('onMounted', stateObject);
    }

    onChildEntered(stateObject) {
      return this.callProxyToOriginalEvent('onEntered', stateObject);
    }

    onChildLeaving(stateObject) {
      return this.callProxyToOriginalEvent('onLeaving', stateObject);
    }

    onChildLeft(stateObject) {
      return this.callProxyToOriginalEvent('onLeft', stateObject);
    }

    onAnimationStyle(stateObject) {
      var child = this._getChildFromStateObject(stateObject);
      if (!child)
        return;

      var childProps = this._getChildPropsFromChild(child),
          position = this._getChildPosition(child),
          calculateStyle = childProps.calculateStyle,
          extraStyle = (typeof calculateStyle === 'function') ? calculateStyle.call(this, {
            anchor: childProps.anchor,
            anchorLayout: childProps['ra-anchor-layout'],
            targetLayout: childProps['ra-layout'],
            position
          }) : null,
          childStyle = this.style(
            'childContainer',
            (stateObject.state === 'entering' || stateObject.state === 'entered') ? 'childContainerEntering' : 'childContainerLeaving',
            {
              pointerEvents: 'none',
              opacity: stateObject.animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1]
              })
            },
            (position && position.style) ? position.style : this.style('defaultPaperStyle'),
            extraStyle,
            (this._isChildReady(child)) ? null : { opacity: 0 }
          );

      return childStyle;
    }

    renderContent(_children) {
      var overlayChildren = this.getState('children', []),
          hasChildren = !!(overlayChildren && overlayChildren.length);

      return (
        <View
          className={this.getRootClassName(componentName, 'children')}
          style={this.style('internalContainer', this.props.containerStyle)}
          ref={this.captureReference('_rootView')}
        >
          {this.getChildren(_children)}

          <TransitionGroup
            className={this.getRootClassName(componentName, 'overlay')}
            style={this.style('overlay', (hasChildren) ? 'containerHasChildren' : 'containerNoChildren')}
            onAnimationStyle={this.onAnimationStyle}
            onEntering={this.onChildEntering}
            onMounted={this.onChildMounted}
            onEntered={this.onChildEntered}
            onLeaving={this.onChildLeaving}
            onLeft={this.onChildLeft}
            rootViewRef={this.captureReference('overlayRoot', findDOMNode)}
            pointerEvents="box-none"
          >
            {overlayChildren}
          </TransitionGroup>
        </View>
      );
    }

    //###if(MOBILE){###//
    _platformRender(children) {
      return this.renderContent(children);
    }
    //###}else{###//
    _platformRender(children) {
      return (
        <TouchableWithoutFeedback
          className={this.getRootClassName(componentName)}
          style={this.style('container', this.props.style)}
          onPress={this.onPress}
          tabIndex="-1"
        >
          {this.renderContent(children)}
        </TouchableWithoutFeedback>
      );
    }
    //###}###//

    render(_children) {
      var children = this.getChildren(_children);
      return super.render(this._platformRender(children));
    }
  };
}, { mixins: [ ChildHandler ] });

export { styleSheet as overlayStyles };
