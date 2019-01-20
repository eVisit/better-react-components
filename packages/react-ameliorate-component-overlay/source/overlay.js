import { utils as U }             from 'evisit-js-utils';
import React                      from 'react';
import { componentFactory }       from '@react-ameliorate/core';
import { View, TouchableOpacity } from '@react-ameliorate/native-shims';
import { TransitionGroup }        from '@react-ameliorate/component-transition-group';
import {
  findDOMNode,
  isDescendantElement
}                                 from '@react-ameliorate/utils';
import styleSheet                 from './overlay-styles';

const SIDE_VALUES = {
        left: -1,
        right: 1,
        top: -1,
        bottom: 1,
        center: 0
      };

function getSideValue(side, negate) {
  var value = SIDE_VALUES[side];
  if (!value)
    value = 0;

  return (negate) ? (value * -1) : value;
}

function getSimpleSide(anchorPos, childPos) {
      if (!anchorPos || !anchorPos.x || !anchorPos.y || !childPos || !childPos.x || !childPos.y)
        return [ null, null ];

      var anchorSideX = getSideValue(anchorPos.x.side),
          anchorSideY = getSideValue(anchorPos.y.side),
          popupSideX  = getSideValue(childPos.x.side, true),
          popupSideY  = getSideValue(childPos.y.side, true),
          horizontal  = anchorSideX + popupSideX,
          vertical    = anchorSideY + popupSideY,
          sideX       = null,
          sideY       = null;

      if (horizontal === -2 || horizontal === 2)
        sideX = (horizontal === 2) ? 'right' : 'left';

      if (vertical === -2 || vertical === 2)
        sideY = (vertical === 2) ? 'bottom' : 'top';

      return [ sideX, sideY ];
    }

function getRectPositionOffset(rect, positionKeys, isTarget) {
  const getSideAndOffset = (key) => {
    if (!key)
      return;

    var offset = '',
        side;

    ('' + key).trim().replace(/^(left|bottom|right|top|centerV|centerH)([+-].*)?$/i, (m, _side, _offset) => {
      side = _side.toLowerCase();

      if (_offset) {
        offset = _offset.trim().replace(/^\++/g, '');
        if (offset && !offset.match(/[^\d.-]/))
          offset = `${offset}px`;
      }
    });

    if (!side)
      return;

    return { side, offset };
  };

  var x, y, position;
  for (var i = 0, il = positionKeys.length; i < il; i++) {
    var info = getSideAndOffset(positionKeys[i]);
    if (!info)
      continue;

    var side = info.side,
        transform = null;

    if (side === 'left' || side === 'right' || side === 'centerh') {
      position = (side === 'centerh') ? (rect.left + rect.width * 0.5) : rect[side];
      side = (side === 'centerh') ? 'center' : side;

      if (isTarget && side === 'right')
        transform = '-100%';
      else if (isTarget && side === 'center')
        transform = '-50%';

      x = { position, offset: info.offset, side, transform: transform || 0 };
    } else {
      position = (side === 'centerv') ? (rect.top + rect.height * 0.5) : rect[side];
      side = (side === 'centerv') ? 'center' : side;

      if (isTarget && side === 'bottom')
        transform = '-100%';
      else if (isTarget && side === 'center')
        transform = '-50%';

      y = { position, offset: info.offset, side, transform: transform || 0 };
    }
  }

  return { x, y };
}

function calculateAnchorPosition(anchorElem, _anchorPosition) {
  var anchorPosition = _anchorPosition || {},
      anchorPositionKeys = Object.keys(anchorPosition);

  if (anchorPositionKeys.length !== 2) {
    anchorPosition = {
      'bottom': 'top',
      'left': 'left'
    };

    anchorPositionKeys = Object.keys(anchorPosition);
  }

  var rect = anchorElem.getBoundingClientRect(),
      anchorPos = getRectPositionOffset(rect, anchorPositionKeys),
      childPos = getRectPositionOffset(rect, anchorPositionKeys.map((key) => anchorPosition[key]), true),
      finalStyle = {};

  if (!childPos.x || !childPos.y || !anchorPos.x || !anchorPos.y)
    return;

  finalStyle.left = anchorPos.x.position;
  if (childPos.x.offset)
    finalStyle['marginLeft'] = childPos.x.offset;

  finalStyle.top = anchorPos.y.position;
  if (childPos.y.offset)
    finalStyle['marginTop'] = childPos.y.offset;

  if (childPos.x.transform || childPos.y.transform)
    finalStyle['transform'] = `translate(${childPos.x.transform},${childPos.y.transform})`;

  return {
    anchor: {
      position: anchorPos,
      rect,
      element: anchorElem
    },
    position: childPos,
    side: getSimpleSide(anchorPos, childPos),
    style: finalStyle
  };
}

function defaultPositioner(props, child, _opts) {
  if (!child.anchorElement)
    return;

  return calculateAnchorPosition.call(this, child.anchorElement, props.anchorPosition);
}

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

    onWindowResize() {
      this.forceUpdate();
    }

    onPress(event) {
      var nativeEvent = event && event.nativeEvent,
          rootElement = this.getReference('overlayRoot');

      if (!nativeEvent || !rootElement)
        return;

      if (isDescendantElement(rootElement, nativeEvent.target))
        return;

      this.closeAll();
    }

    onKeyDown(event) {
      var nativeEvent = (event && event.nativeEvent);
      if (nativeEvent && nativeEvent.code === 'Escape')
        this.closeAll();
    }

    componentDidMount() {
      window.addEventListener('resize', this.onWindowResize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.onWindowResize);
    }

    provideContext() {
      return {
        _raOverlay: this
      };
    }

    closeAll() {
      this.setState({ children: this.requestChildrenClose(undefined, undefined, 'closeAll') });
    }

    requestChildrenClose(_children, isException, sourceAction) {
      var children = (_children) ? _children : this.getState('children', []);
      return children.filter((thisChild) => {
        const shouldRemove = () => {
          if (typeof isException === 'function' && isException(childInstance))
            return true;

          var onShouldClose = (childInstance && childInstance.props && childInstance.props.onShouldClose);
          if (typeof onShouldClose === 'function' && !onShouldClose.call(this, { ref: childInstance, child: childInstance, action: sourceAction }))
            return false;

          return false;
        };

        var childInstance = thisChild.instance,
            shouldStay = shouldRemove();

        return shouldStay;
      });
    }

    addChild(child) {
      if (!child)
        return;

      var children = this.getState('children', []),
          index = children.findIndex((thisChild) => (thisChild.instance === child)),
          thisChild = { instance: child };

      if (index < 0)
        children = children.concat(thisChild);
      else
        thisChild = children[index];

      thisChild.anchorElement = findDOMNode(U.get(thisChild, 'instance.props.anchorElement'));

      this.setState({ children: this.requestChildrenClose(children, (childInstance) => (childInstance === child), 'addChild') });
    }

    removeChild(child) {
      var children = this.getState('children', []),
          index = children.findIndex((thisChild) => (thisChild.instance === child));

      if (index >= 0) {
        children.splice(index, 1);
        this.setState({ children: children.slice() });
      }
    }

    _getChildFromStateObject(stateObject) {
      if (!stateObject.element)
        return;

      var element = stateObject.element;
      return (element.props && element.props._child);
    }

    _getChildPropsFromChild(child) {
      if (!child)
        return;

      var childInstance = child.instance;
      return (childInstance && childInstance.props);
    }

    _getChildPosition(child) {
      if (!child)
        return {};

      var childProps = this._getChildPropsFromChild(child),
          position,
          positionFunc = (typeof childProps.position === 'function') ? childProps.position : defaultPositioner;

      if (typeof positionFunc === 'function')
        position = positionFunc.call(this, childProps, child, { defaultPositioner });

      return position || {};
    }

    callProxyToOriginalEvent(eventName, stateObject) {
      var child = this._getChildFromStateObject(stateObject);
      if (!child)
        return;

      var childProps = this._getChildPropsFromChild(child),
          position = this._getChildPosition(child),
          func = child[eventName] || childProps[eventName];

      if (typeof func === 'function') {
        var domElement = (stateObject.instance) ? findDOMNode(stateObject.instance) : null,
            anchor = (position.anchor) ? position.anchor : { element: childProps.anchorElement };

        func.call(this, Object.assign({}, stateObject, { $element: domElement, anchor, position }));
      }
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
          childStyle = this.style(
            'childContainer',
            childProps.style,
            {
              opacity: stateObject.animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1]
              })
            },
            (position.style) ? position.style : this.style('defaultPaperStyle')
          );

      return childStyle;
    }

    render() {
      var children = this.getState('children', []),
          hasChildren = !!(children && children.length);

      return (
        <TouchableOpacity
          className={this.getRootClassName(componentName)}
          style={this.style('container', this.props.style)}
          onPress={this.onPress}
          onKeyDown={this.onKeyDown}
          tabIndex="-1"
        >
          <View className={this.getRootClassName(componentName, 'children')}>{this.props.children}</View>
          <TransitionGroup
            className={this.getRootClassName(componentName, 'overlay')}
            style={this.style('overlay', (hasChildren) ? 'containerHasChildren' : 'containerNoChildren')}
            onAnimationStyle={this.onAnimationStyle}
            onEntering={this.onChildEntering}
            onMounted={this.onChildMounted}
            onEntered={this.onChildEntered}
            onLeaving={this.onChildLeaving}
            onLeft={this.onChildLeft}
            ref={this.captureReference('overlayRoot', findDOMNode)}
          >
            {children.map((child, index) => {
              if (!child)
                return null;

              var childInstance = child.instance,
                  childProps = childInstance.props || {};

              return (
                <View
                  id={(childProps.id || ('' + index))}
                  key={(childProps.id || ('' + index))}
                  style={childProps.style}
                  _child={child}
                >
                  {childProps.children}
                </View>
              );
            })}
          </TransitionGroup>
        </TouchableOpacity>
      );
    }
  };
});

export { styleSheet as overlayStyles };
