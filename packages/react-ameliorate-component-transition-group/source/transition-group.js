import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Animated, Easing }             from '@react-ameliorate/native-shims';
import { isPromise }                    from '@react-ameliorate/utils';
import { ChildHandler }                 from '@react-ameliorate/mixin-child-handler';
import styleSheet                       from './transition-group-styles';

export const TransitionGroup = componentFactory('TransitionGroup', ({ Parent, componentName }) => {
  return class TransitionGroup extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
      duration: PropTypes.number,
      useNativeDriver: PropTypes.bool,
      onAnimationStyle: PropTypes.func,
      onEntering: PropTypes.func,
      onMounted: PropTypes.func,
      onEntered: PropTypes.func,
      onLeaving: PropTypes.func,
      onLeft: PropTypes.func,
      onRender: PropTypes.func,
      onRenderChild: PropTypes.func,
      pointerEvents: PropTypes.string,
      childProps: PropTypes.object
    };

    resolveState({ initial, props, _props }) {
      var children = this.getState('children');

      if (initial || props.children !== _props.children) {
        var update = this._updateChildren(props.children, children);
        children = update.childMap;
      }

      return {
        ...super.resolveState.apply(this, arguments),
        children
      };
    }

    _getNewChildStateObject(id, element, state) {
      var stateObject = super._getNewChildStateObject(id, element, state);
      stateObject.animation = new Animated.Value(0);

      return stateObject;
    }

    _removeChild(stateObject) {
      var update = super._removeChild(stateObject);
      if (!update || !update.changed)
        return;

      this.setState({ children: update.childMap });
    }

    _doChildTransition(stateObject, eventName) {
      var transition = super._doChildTransition(stateObject, eventName);
      if (!transition)
        return;

      return this._doChildAnimation(stateObject, transition.onFinish, transition.callbackResult);
    }

    _getAnimationDuration(startTime) {
      var duration = this.getAnimationDuration(this.props.duration);
      if (startTime == null)
        return duration;

      var diff = Date.now() - startTime;
      if (diff > duration)
        return duration;
      else
        return diff;
    }

    _doChildAnimation(stateObject, doneCallback, delayPromise) {
      const doAnimation = () => {
        return new Promise((resolve) => {
          var duration = this._getAnimationDuration(stateObject.animationStartTime);

          stateObject.animationStartTime = Date.now();
          stateObject.animationState = Animated.timing(
            stateObject.animation,
            {
              toValue: (stateObject.state === 'entering' || stateObject.state === 'entered') ? 1 : 0,
              easing: this.props.easing || this.styleProp('DEFAULT_ANIMATION_EASING', Easing.inOut(Easing.quad)),
              duration: duration,
              useNativeDriver: this.props.useNativeDriver
            }
          ).start(({ finished }) => {
            if (finished) {
              stateObject.animationStartTime = null;

              if (typeof doneCallback === 'function')
                doneCallback.call(this, stateObject);
            }

            resolve(finished);
          });
        });
      };

      if (isPromise(delayPromise))
        return delayPromise.then(doAnimation);
      else
        return doAnimation();
    }

    getAnimationStyle(stateObject) {
      return this.callProvidedCallback('onAnimationStyle', stateObject);
    }

    defaultRenderChild({ child }) {
      var childElement = child.element,
          childProps = (childElement && childElement.props);

      return (
        <Animated.View
          pointerEvents="auto"
          {...(this.props.childProps || {})}
          {...(childProps || {})}
          className={this.getClassName(componentName, 'childContainer')}
          key={child.id}
          style={this.style('childContainer', this.props.containerStyle, this.getAnimationStyle(child))}
          ref={this._onChildMounted.bind(this, child)}
        >
          {childElement}
        </Animated.View>
      );
    }

    renderChildren(children) {
      return Object.keys(children || {}).map((childKey, index) => {
        var child = children[childKey];
        child.index = index;
        return this.callProvidedCallback(['onRenderChild', this.defaultRenderChild], { child, index });
      });
    }

    defaultRender({ children }) {
      return (
        <Animated.View
          className={this.getRootClassName(componentName, this.props.className)}
          style={this.style('container', this.props.style, this.getAnimationStyle(this._childHandlerState))}
          pointerEvents={this.props.pointerEvents}
        >
          {children}
        </Animated.View>
      );
    }

    render() {
      var children = this.getState('children'),
          renderedChildren = this.renderChildren(children);

      return super.render(this.callProvidedCallback(['onRender', this.defaultRender], { children: renderedChildren }));
    }
  };
}, { mixins: [ ChildHandler ] });

export { styleSheet as transitionGroupStyles };
