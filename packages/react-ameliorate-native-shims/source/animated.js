/* global Quad */

//###if(MOBILE) {###//
import { Animated, Easing }           from 'react-native';
//###} else {###//
import React                          from 'react';
import { utils as U }                 from 'evisit-js-utils';
import { TweenMax }                   from 'gsap';
import { View as _View }              from './components/view';
import { Text as _Text }              from './components/text';
import { ScrollView as _ScrollView }  from './components/scroll-view';
import {
  toNumber,
  capitalize,
  findDOMNode,
  nextTick,
  filterObjectKeys
}                                     from '@react-ameliorate/utils';
import { StyleSheetBuilder }          from '@react-ameliorate/styles';

var uuidCounter = 1;

function interoplateValue(_currentVal, _opts) {
  var currentVal = _currentVal || 0,
      opts = _opts || {},
      inputRange = opts.inputRange,
      outputRange = opts.outputRange,
      is = inputRange[0],
      ie = inputRange[1],
      os = outputRange[0],
      oe = outputRange[1],
      osUnit = ('' + os).replace(/^[\s\d.-]+/g, ''),
      oeUnit = ('' + oe).replace(/^[\s\d.-]+/g, '');

  if (osUnit !== oeUnit)
    throw new Error('output value unit must match for start and end values');

  os = toNumber(os);
  oe = toNumber(oe);

  var id = ie - is,
      tr = (!currentVal) ? 0 : ((currentVal - is) / id),
      od = oe - os,
      ov = os + (od * tr);

  return (osUnit) ? `${ov}${osUnit}` : ov;
}

function getUniqueID() {
  return ('' + (uuidCounter++));
}

class Animation {
  constructor(value, opts) {
    Object.defineProperties(this, {
      'value': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: value
      },
      'toValue': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: opts.toValue || 0
      },
      'duration': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: opts.duration || 0
      },
      'easing': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: opts.easing || 0
      },
      'delay': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: opts.delay || 0
      },
      '_finished': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: true
      },
      '_animationHandle': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
      '_animationStartTime': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
      '_onEnd': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
    });
  }

  _stopAnimation(finished) {
    if (this._finished)
      return;

    this._finished = true;

    if (this._animationHandle)
      this._animationHandle.kill();

    this._animationHandle = null;

    if (typeof this._onEnd === 'function')
      this._onEnd.call(this, { finished });
  }

  _startAnimation(callback) {
    this._animationStartTime = Date.now();
    this._onEnd = callback;

    // This is just used for callbacks
    this.value.timeRatio = 0;

    return TweenMax.to(this.value, (this.duration / 1000), {
      value: this.toValue,
      timeRatio: 1,
      delay: this.delay / 1000,
      easing: this.easing,
      onStart: () => this.value.callTrackers(),
      onUpdate: () => this.value.callTrackers(),
      onComplete: () => this._stopAnimation(true),
      immediateRender: true
    });
  }

  start(callback) {
    this.stop();

    this._finished = false;
    this._animationHandle = this._startAnimation(callback);

    return this;
  }

  stop() {
    if (this._finished)
      return;

    this._stopAnimation(false);
  }
}

class Value {
  constructor(value) {
    Object.defineProperties(this, {
      'value': {
        writable: true,
        enumerable: true,
        configurable: true,
        value: value || 0
      },
      'timeRatio': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      'listeners': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: []
      },
      'trackers': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: []
      },
      '_isAnimatedValue': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: true
      }
    });
  }

  interpolate(opts) {
    var val = new Value(interoplateValue(this.value, opts));

    this.addTracker((currentValue) => {
      val.setValue(interoplateValue(currentValue.value, opts));
    }, val);

    return val;
  }

  setValue(newValue) {
    this.value = newValue;
    this.callTrackers();
  }

  getValue() {
    return this.value;
  }

  addListener(callback) {
    if (typeof callback !== 'function')
      return;

    var id = getUniqueID();

    this.listeners.push({
      id,
      callback
    });

    return id;
  }

  removeListener(id) {
    var index = this.listeners.findIndex((listener) => (listener.id === id));
    if (index >= 0)
      this.listeners.splice(index, 1);
  }

  removeAllListeners() {
    this.listeners = [];
  }

  callTrackers() {
    var trackers = this.trackers;
    for (var i = 0, il = trackers.length; i < il; i++) {
      var tracker = trackers[i];
      tracker.callback(this, tracker.ref);
    }
  }

  addTracker(callback, ref) {
    if (typeof callback !== 'function')
      return;

    var id = getUniqueID();
    this.trackers.push({
      id,
      ref,
      callback
    });

    callback(this, ref);

    return id;
  }

  removeTracker(id) {
    var index = this.trackers.findIndex((tracker) => (tracker.id === id || tracker.callback === id));
    if (index >= 0)
      this.trackers.splice(index, 1);
  }

  removeAllTrackers() {
    this.trackers = [];
  }
}

const Animated = new (class AnimatedPolyfill {
  constructor() {}

  timing(value, _opts) {
    return new Animation(value, _opts || {});
  }
})();

const Easing = (function() {
  if (typeof Quad === 'undefined')
    var Quad = {};

    return class Easing {
      constructor() {}

      static getContextKey(context, key) {
        return context && context[`ease${capitalize(key)}`];
      }

      static getEasing(easing, defaultEasing) {
        return (!easing) ? defaultEasing : easing;
      }

      static out(context) {
        return Easing.getEasing(this.getContextKey(context, 'out'), Quad.easeOut);
      }

      static in(context) {
        return Easing.getEasing(this.getContextKey(context, 'in'), Quad.easeIn);
      }

      static inOut(context) {
        return Easing.getEasing(this.getContextKey(context, 'inOut'), Quad.easeInOut);
      }
    };
})();

function trackStyleValues(style, _newStyle, _trackedValues, _alreadyTracked, _parentKeys) {
  const addToTrackedValues = (value) => {
    if (!trackedValues)
      return;

    if (trackedValues.indexOf(value) >= 0)
      return;

    trackedValues.push(value);
  };

  const trackTransform = (transform) => {
    const enqueueTransformUpdate = (axisName, val) => {
      if (!transformContext.promise) {
        // Call at the end of this event frame... at which point all transform properties should have been updated
        transformContext.promise = nextTick(() => {
          transformContext.promise = null;
          var elem = this._componentElement;

          if (elem)
            elem.style['transform'] = StyleSheetBuilder.getCSSRuleValue('transform', transformContext.axis);
        });
      }

      // Update current transform property within this event frame
      transformContext.axis[axisName] = val;
    };

    function trackTransformPart(part) {
      var transformAxis = StyleSheetBuilder.getTransformAxis();
      for (var j = 0, jl = transformAxis.length; j < jl; j++) {
        var axis = transformAxis[j];
        if (!part.hasOwnProperty(axis))
          continue;

        ((axis, axisValue) => {
          addToTrackedValues(axisValue);

          axisValue.addTracker((currentValue) => {
            enqueueTransformUpdate(axis, currentValue.getValue());
          }, this);
        })(axis, part[axis]);

        break;
      }
    }

    var transformContext = { axis: {} };
    for (var i = 0, il = transform.length; i < il; i++) {
      var part = transform[i];
      trackTransformPart.call(this, part);
    }
  };

  if (!style)
    return;

  var keys = Object.keys(style);
  if (keys.length === 0)
    return;

  // Don't do cyclic lookups
  if (_alreadyTracked && _alreadyTracked.indexOf(style) >= 0)
    return;

  // Array to protect against cyclic lookups
  var alreadyTracked = (_alreadyTracked || []),
      newStyle = _newStyle || {},
      trackedValues = _trackedValues,
      parentKeys = (_parentKeys || []);

  alreadyTracked.push(style);

  for (var i = 0, il = keys.length; i < il; i++) {
    var key = keys[i],
        value = style[key];

    if (key === 'transform' && value && !(typeof value === 'string' || value instanceof String)) {
      trackTransform(value);
    } else if (value && value._isAnimatedValue) {
      newStyle[key] = value.getValue();
      addToTrackedValues(value);

      value.addTracker(((key) => {
        var fullKey = [ ...parentKeys, key ].join('.');
        return (currentValue) => {
          var elem = this._componentElement;
          if (!elem)
            return;

          var val = currentValue.getValue();
          elem.style[key] = StyleSheetBuilder.getCSSRuleValue(fullKey, val);
        };
      })(key), this);
    } else {
      newStyle[key] = value;
      if (value && U.instanceOf(value, 'object', 'array'))
        trackStyleValues.call(this, value, newStyle, trackedValues, alreadyTracked, [ ...parentKeys, key ]);
    }
  }

  return newStyle;
}

Animated.createAnimatedComponent = function(Klass) {
  class AnimatedComponent extends Klass {
    cleanStyleValueTrackers(style) {
      var trackedValues = this._trackedValues;
      if (!trackedValues)
        return;

      for (var i = 0, il = trackedValues.length; i < il; i++) {
        var trackedValue = trackedValues[i];
        trackedValue.removeAllTrackers();
      }
    }

    trackStyleValues(style) {
      Object.defineProperty(this, '_trackedValues', {
        writable: true,
        enumerable: false,
        configurable: true,
        value: []
      });

      return trackStyleValues.call(this, style, {}, this._trackedValues);
    }

    render(children) {
      this.cleanStyleValueTrackers();

      var style = StyleSheetBuilder.flattenInternalStyleSheet(this.props.style),
          trackedStyle = this.trackStyleValues(style),
          self = this;

      return (
        <React.Fragment>
          <Klass
            {...filterObjectKeys(/^(id$|ref$|key$|_|_internalref$)/, this.props)}
            ref={function(elem) {
              self._componentElement = findDOMNode(elem);
              if (typeof self.props._internalref === 'function')
                self.props._internalref.apply(this, arguments);
            }}
            style={trackedStyle}
          >
            {(typeof this.getChildren === 'function') ? this.getChildren(children) : (children || this.props.children || null)}
          </Klass>
        </React.Fragment>
      );
    }
  }

  return React.forwardRef((props, ref) => {
    return (<AnimatedComponent {...props} _internalref={ref}>{props.children}</AnimatedComponent>);
  });
};

Animated.Value = Value;

Animated.Text = Animated.createAnimatedComponent(_Text);
Animated.View = Animated.createAnimatedComponent(_View);
Animated.ScrollView = Animated.createAnimatedComponent(_ScrollView);
//###}###//

export {
  Easing,
  Animated
};
