import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import {
  findDOMNode,
  layoutToBoundingClientRect,
  calculateObjectDifferences
}                                       from '@react-ameliorate/utils';
import styleSheet                       from './paper-styles';

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

function getSideAndOffset(key) {
  if (!key)
    return;

  var offset = '',
      side;

  ('' + key).trim().replace(/^(left|bottom|right|top|centerV?|centerH?)([+-].*)?$/i, (m, _side, _offset) => {
    side = _side.toLowerCase();

    if (side === 'centerv' || side === 'centerh')
      side = 'center';

    if (_offset) {
      offset = _offset.trim().replace(/^\++/g, '');
      if (offset && !offset.match(/[^\d.-]/))
        offset = `${offset}px`;
    }
  });

  if (!side)
    return;

  return { side, offset };
}

function getPositionInfo(anchorPosition) {
  if (!anchorPosition)
    return;

  var anchorXSide,
      anchorYSide,
      childXSide,
      childYSide,
      keys = Object.keys(anchorPosition);

  for (var i = 0, il = keys.length; i < il; i++) {
    var anchorKey   = keys[i],
        targetKey   = anchorPosition[anchorKey],
        anchorSide  = getSideAndOffset(anchorKey),
        targetSide  = getSideAndOffset(targetKey);

    if (!anchorSide || !targetSide)
      return;

    var isHorizontal = anchorKey.match(/^left|right|centerH/i);
    if (isHorizontal)
      anchorXSide = anchorSide;
    else
      anchorYSide = anchorSide;

    if (targetKey.match(/^left|right|centerH/i) || (targetKey.match(/^center\b/i) && isHorizontal))
      childXSide = targetSide;
    else
      childYSide = targetSide;
  }

  return {
    anchor: {
      x: anchorXSide,
      y: anchorYSide
    },
    target: {
      x: childXSide,
      y: childYSide
    }
  };
}

function getPositionQuadrant(positionInfo) {
  if (!positionInfo) {
    return {
      x: null,
      y: null,
      values: null
    };
  }

  var anchorSideX = getSideValue(positionInfo.anchor.x.side),
      anchorSideY = getSideValue(positionInfo.anchor.y.side),
      targetSideX = getSideValue(positionInfo.target.x.side, true),
      targetSideY = getSideValue(positionInfo.target.y.side, true),
      horizontal  = anchorSideX + targetSideX,
      vertical    = anchorSideY + targetSideY,
      sideX       = 'inside',
      sideY       = 'inside',
      values      = {
        horizontal,
        vertical,
        targetSideX,
        targetSideY,
        anchorSideX,
        anchorSideY
      };

  if (horizontal === -2 || horizontal === 2)
    sideX = (horizontal === 2) ? 'right' : 'left';

  if (vertical === -2 || vertical === 2)
    sideY = (vertical === 2) ? 'bottom' : 'top';

  return {
    x: sideX,
    y: sideY,
    values
  };
}

function calculateTargetPosition(anchorRect, targetRect, positionInfo) {
  const getX = (anchorInfo, targetInfo) => {
    var anchorSide  = anchorInfo.x.side,
        targetSide  = targetInfo.x.side,
        position   = (anchorSide === 'center') ? (anchorRect.left + (anchorRect.width * 0.5)) : anchorRect[anchorSide];

    if (targetSide === 'right')
      position -= targetRect.width;
    else if (targetSide === 'center')
      position -= (targetRect.width * 0.5);

    var positionEnd = position + targetRect.width;

    if (position < 0)
      position += targetRect.width;
    else if (positionEnd > window.innerWidth)
      position -= (targetRect.width + anchorRect.width);

    return {
      position: Math.round(position),
      offset: targetInfo.x.offset,
      side: targetSide
    };
  };

  const getY = (anchorInfo, targetInfo) => {
    var anchorSide = anchorInfo.y.side,
        targetSide = targetInfo.y.side,
        position = (anchorSide === 'center') ? (anchorRect.top + (anchorRect.height * 0.5)) : anchorRect[anchorSide];

    if (targetSide === 'bottom')
      position -= targetRect.height;
    else if (targetSide === 'center')
      position -= (targetRect.height * 0.5);

    var positionEnd = position + targetRect.height;

    if (position < 0)
      position += targetRect.height;
    else if (positionEnd > window.innerHeight)
      position -= (targetRect.height + anchorRect.height);

    return {
      position: Math.round(position),
      offset: targetInfo.y.offset,
      side: targetSide
    };
  };

  return {
    x: getX(positionInfo.anchor, positionInfo.target),
    y: getY(positionInfo.anchor, positionInfo.target)
  };
}

function calculateAnchorPosition({ anchorRef, anchorLayout, ref, layout, anchorPosition }) {
  var anchorPositionKeys = Object.keys(anchorPosition);
  if (anchorPositionKeys.length !== 2) {
    anchorPosition = {
      'bottom': 'top',
      'left': 'left'
    };
  }

  var anchorRect      = anchorLayout,
      targetRect      = layout,
      positionInfo    = getPositionInfo(anchorPosition);

  if (!positionInfo)
    return;

  var targetPosition  = calculateTargetPosition(anchorRect, targetRect, positionInfo),
      finalStyle      = {};

  if (!targetPosition || !targetPosition.x || !targetPosition.y)
    return;

  finalStyle.left = targetPosition.x.position;
  if (targetPosition.x.offset)
    finalStyle['marginLeft'] = targetPosition.x.offset;

  finalStyle.top = targetPosition.y.position;
  if (targetPosition.y.offset)
    finalStyle['marginTop'] = targetPosition.y.offset;

  return {
    anchorPosition,
    anchor: {
      positionInfo: positionInfo.anchor,
      rect: anchorRect,
    },
    target: {
      positionInfo: positionInfo.target,
      rect: targetRect,
    },
    position: targetPosition,
    quadrant: getPositionQuadrant(positionInfo),
    style: finalStyle
  };
}

function defaultPositioner(args) {
  return calculateAnchorPosition.call(this, args);
}

export const Paper = componentFactory('Paper', ({ Parent, componentName }) => {
  return class Paper extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      anchor: PropTypes.any,
      anchorPosition: PropTypes.oneOfType([ PropTypes.object, PropTypes.func ]),
      autoClose: PropTypes.bool,
      requiresLayout: PropTypes.bool,
      calculateStyle: PropTypes.func,
      id: PropTypes.string,
      onEntered: PropTypes.func,
      onEntering: PropTypes.func,
      onLeaving: PropTypes.func,
      onLeft: PropTypes.func,
      onMounted: PropTypes.func,
      onPositionUpdated: PropTypes.func,
      onShouldClose: PropTypes.func,
      pointerEvents: PropTypes.string,
      position: PropTypes.func,
      visible: PropTypes.bool,
      contentRef: PropTypes.func
    };

    provideContext() {
      return {
        _raPaper: this
      };
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          anchorLayout: null,
          layout: null,
          position: null
        })
      };
    }

    doUpdatePosition() {
      this.updateAnchorLayout();
      this.updateLayout();
    }

    componentMounted() {
      this._updateInterval = setInterval(this.doUpdatePosition, 50);
    }

    componentUnmounting() {
      clearInterval(this._updateInterval);

      this.removeFromOverlay({ props: { id: this.props.id } });
      super.componentUnmounting();
    }


    findAnchor(_anchor) {
      var anchor = _anchor;
      if (U.instanceOf(anchor, 'string', 'number', 'boolean')) {
        anchor = this._findComponentReference(('' + anchor));
        if (anchor && anchor._raComponent)
          anchor = anchor._getReactComponent();
      }

      if (anchor && typeof anchor.getRootViewNode === 'function')
        anchor = anchor.getRootViewNode();

      return anchor;
    }

    onStateUpdated_anchorLayout() {
      this.updatePosition();
    }

    onStateUpdated_layout() {
      this.updatePosition();
    }

    calculatePosition(args) {
      return defaultPositioner.call(this, args);
    }

    updatePosition() {
      this.delay(() => {
        var { anchorLayout, layout } = this.getState();
        if (!anchorLayout || !layout)
          return;

        var anchorRef = this.findAnchor(this.props.anchor),
            ref       = this.getReference('_rootView'),
            args      = {
              anchorRef,
              anchorLayout,
              ref,
              layout
            };

        var anchorPosition = this.props.anchorPosition;
        if (typeof anchorPosition === 'function')
          anchorPosition = anchorPosition.call(this, args);

        args.anchorPosition = anchorPosition;
        var position = this.calculatePosition(args) || null,
            currentPosition = this.getState('position'),
            diff = (position && currentPosition) ? calculateObjectDifferences(position.position, currentPosition.position) : true;

        if (diff) {
          args.position = position;
          args._position = currentPosition;

          this.callProvidedCallback('onPositionUpdated', args);
          this.setState({ position });
        }
      }, 10, 'positionUpdateDelay');
    }

    updateAnchorLayout(time) {
      this.delay(() => {
        if (!this.mounted())
          return this.updateAnchorLayout(250);

        var anchorRef = this.findAnchor(this.props.anchor);
        if (!anchorRef)
          return;

        var paperContext = this.props.raPaperContext || this.context._raPaperContext,
            node = findDOMNode(paperContext);

        if (!node)
          return this.updateLayout();

        anchorRef.measureLayout(node, (x, y, width, height) => {
          var anchorLayout = layoutToBoundingClientRect({ x, y, width, height }),
              currentLayout = this.getState('anchorLayout');

          if (calculateObjectDifferences(anchorLayout, currentLayout, null, 1))
            this.setState({ anchorLayout });
        });
      }, (time || 10), 'anchorLayoutUpdateDelay');
    }

    updateLayout(event, time) {
      this.delay(() => {
        if (!this.mounted())
          return this.updateLayout();

        var rootView = this.getReference('_rootView');
        if (!rootView)
          return this.updateLayout(null, 100);

        var paperContext = this.props.raPaperContext || this.context._raPaperContext,
            node = findDOMNode(paperContext);

        if (!node)
          return this.updateLayout();

        rootView.measureLayout(node, (x, y, width, height) => {
          var layout = layoutToBoundingClientRect({ x, y, width, height }),
              currentLayout = this.getState('layout');

          if (calculateObjectDifferences(layout, currentLayout, null, 1))
            this.setState({ layout });
        });
      }, (time || 10), 'layoutUpdateDelay');
    }

    addToOverlay(child) {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      overlay.addChild(child);

      this.delay(() => {
        this.doUpdatePosition();
      }, 5);
    }

    removeFromOverlay(child) {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      overlay.removeChild(child);
    }

    onPropsUpdated(oldProps, newProps, initial) {
      if (initial || oldProps.anchor !== newProps.anchor)
        this.updateAnchorLayout();

      if (calculateObjectDifferences(oldProps.anchorPosition, newProps.anchorPosition, null, 1))
        this.updateAnchorLayout();
    }

    shouldComponentUpdate(oldProps, oldState) {
      var { anchorLayout, layout, position } = this.getState();
      if (this.props.requiresLayout !== false && (!anchorLayout || !layout || !position))
        return false;
    }

    render(_children) {
      var children = this.getChildren(_children);
      if (!this.props.id)
        throw new TypeError('Paper component child must have a valid unique "id" prop');

      var { layout, anchorLayout, position } = this.getState();

      this.addToOverlay(
        <View
          {...this.passProps(this.props)}
          key={this.props.id}
          className={this.getClassName(componentName)}
          ref={this.captureReference('_rootView', (ref) => {
            if (typeof this.props.contentRef === 'function')
              this.props.contentRef(ref);

            return ref;
          })}
          onLayout={this.updateLayout}
          style={[ { flex: 0, alignSelf: 'flex-start' }, this.props.style ]}
          ra-layout={layout}
          ra-anchor-layout={anchorLayout}
          ra-position={position}
          pointerEvents={(this.props.visible) ? 'auto' : 'box-none'}
        >
          {children}
        </View>
      );

      return super.render(null);
    }
  };
});

export { styleSheet as paperStyles };
