import React          from 'react';
import {
  componentFactory,
  PropTypes,
  Animated,
  Easing
}                     from '@base';
import styleSheet     from './transition-group-styles';
import { isPromise }  from '@base/utils';
import { utils as U } from 'evisit-js-utils';

const eventFuncMapping = {
  'entering': 'onEntering',
  'entered': 'onEntered',
  'leaving': 'onLeaving',
  'left': 'onLeft'
};

const TransitionGroup = componentFactory('TransitionGroup', ({ Parent, componentName }) => {
  return class TransitionGroup extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
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
    };

    construct(...args) {
      super.construct(...args);

      Object.defineProperty(this, '_componentState', this._getNewChildStateObject(null, null));
    }

    _getNewChildStateObject(id, element, animation, state) {
      return {
        id,
        element,
        animation: new Animated.Value(0),
        state
      };
    }

    _getAnimationDuration(startTime) {
      var duration = this.getAnimationDuration(this.props.duration);
      if (!startTime)
        return duration;

      var diff = U.now() - startTime;
      if (diff > duration)
        return duration;
      else
        return diff;
    }

    _getChildEnteredCount() {
      var children = this.getState('children', {});
      return Object.keys(children).filter((childKey) => {
        var child = children[childKey];
        return (child.state === 'entering' || child.state === 'entered');
      }).length;
    }

    _removeChild(stateObject) {
      var children = this.getState('children', {}),
          newChildren = {},
          childKeys = Object.keys(children),
          thisChildID = stateObject.id,
          hasChanged = false;

      for (var i = 0, il = childKeys.length; i < il; i++) {
        var childKey = childKeys[i];
        if (childKey === thisChildID) {
          hasChanged = true;
          continue;
        }

        newChildren[childKey] = children[childKey];
      }

      if (!hasChanged)
        return;

      this.setState({ children: newChildren });
    }

    _doChildAnimation(stateObject, doneCallback, delayPromise) {
      const doAnimation = () => {
        return new Promise((resolve) => {
          var duration = this._getAnimationDuration(stateObject.animationStartTime);

          // If no duration, or this is the entered or left states, finalize the callback immediately
          if (!duration || stateObject.state === 'entered' || stateObject.state === 'left') {
            if (typeof doneCallback === 'function')
              doneCallback.call(this, stateObject);

            resolve(true);
            return;
          }

          stateObject.animationStartTime = U.now();
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

    _doChildTransition(stateObject, eventName) {
      if (!stateObject)
        return;

      var state = stateObject.state,
          doneCallback;

      if (eventName === 'entering') {
        if (state === 'entering' || state === 'entered')
          return;

        var enteredCount = this._getChildEnteredCount();
        doneCallback = this._onChildEntered;
        stateObject.state = 'entering';

        // This is the first child entering... so fade in our main component
        if (enteredCount === 0)
          this._doChildTransition(this._componentState, 'entering');
      } else if (eventName === 'entered') {
        if (state === 'entered')
          return;

        stateObject.state = 'entered';
      } else if (eventName === 'leaving') {
        if (state === 'leaving' || state === 'left')
          return;

        doneCallback = this._onChildLeft;
        stateObject.state = 'leaving';

        // This is the last child leaving... so fade out our main component
        if (this._getChildEnteredCount() === 0)
          this._doChildTransition(this._componentState, 'leaving');
      } else if (eventName === 'left') {
        if (state === 'left')
          return;

        doneCallback = this._removeChild;
        stateObject.state = 'left';
      }

      //console.log('CHILD STATE CHANGE!', eventName, stateObject.state, stateObject);

      var ret = this.callProvidedCallback(eventFuncMapping[eventName], stateObject);
      return this._doChildAnimation(stateObject, doneCallback, ret);
    }

    _onChildEntering(stateObject) {
      return this._doChildTransition(stateObject, 'entering');
    }

    _onChildMounted(stateObject, instance) {
      if (!instance || stateObject.instance === instance)
        return;

      stateObject.instance = instance;
      this.callProvidedCallback('onMounted', stateObject);
    }

    _onChildEntered(stateObject) {
      return this._doChildTransition(stateObject, 'entered');
    }

    _onChildLeaving(stateObject) {
      return this._doChildTransition(stateObject, 'leaving');
    }

    _onChildLeft(stateObject) {
      var ret = this._doChildTransition(stateObject, 'left');
      stateObject.instance = null;
      return ret;
    }

    updateChildren(_newChildren, currentChildren) {
      var newChildMap = {},
          hasChange = false,
          // Build current children map
          allChildMap = Object.assign({}, currentChildren || {});

      // Build new children map
      var newChildren = ((_newChildren instanceof Array) ? _newChildren : [_newChildren]);
      for (var i = 0, il = newChildren.length; i < il; i++) {
        var child = newChildren[i];
        if (child == null || child === false)
          continue;

        if (!React.isValidElement(child))
          throw new Error('Every child of a TransitionGroup MUST be a valid React element');

        var childID = child.props.id;
        if (typeof childID === 'function')
          childID = childID.call(this, child, i);

        if (!childID || newChildMap.hasOwnProperty(childID))
          throw new Error('Every child of a TransitionGroup must have a unique "id" property');

        allChildMap[childID] = allChildMap[childID];
        newChildMap[childID] = child;
      }

      // Calculate the difference and sound out events
      var allChildIDs = Object.keys(allChildMap),
          state;

      for (var i = 0, il = allChildIDs.length; i < il; i++) {
        var newChildID = allChildIDs[i],
            newChild = newChildMap[newChildID],
            currentMatchingChild = allChildMap[newChildID];

        if (currentMatchingChild) {
          if (newChild) {
            // Same child
            if (currentMatchingChild.element === newChild)
              continue;

            hasChange = true;
            currentMatchingChild.element = newChild;
            state = currentMatchingChild.state;

            if (state === 'entering' || state === 'entered')
              this._onChildEntering(currentMatchingChild);
          } else {
            // Removal
            hasChange = true;
            if (state !== 'leaving' && state !== 'left')
              this._onChildLeaving(currentMatchingChild);
          }
        } else {
          // Addition
          hasChange = true;
          var thisChild = allChildMap[newChildID] = this._getNewChildStateObject(newChildID, newChild, null);
          this._onChildEntering(thisChild);
        }
      }

      //console.log('CHILDREN UPDATE: ', newChildren, currentChildren, allChildMap, hasChange);

      return (hasChange) ? allChildMap : currentChildren;
    }

    resolveState({ initial, props, _props }) {
      var children = this.getState('children');

      if (initial || props.children !== _props.children)
        children = this.updateChildren(props.children, children);

      return {
        ...super.resolveState.apply(this, arguments),
        children
      };
    }

    getAnimationStyle(stateObject) {
      return this.callProvidedCallback('onAnimationStyle', stateObject);
    }

    defaultRenderChild({ child }) {
      return (
        <Animated.View
          key={child.id}
          style={this.style('childContainer', this.props.containerStyle, this.getAnimationStyle(child))}
          ref={this._onChildMounted.bind(this, child)}
        >
          {child.element}
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
          style={this.style('container', this.props.style, this.getAnimationStyle(this._componentState))}
        >
          {children}
        </Animated.View>
      );
    }

    render() {
      var children = this.getState('children'),
          renderedChildren = this.renderChildren(children);

      return this.callProvidedCallback(['onRender', this.defaultRender], { children: renderedChildren });
    }
  };
});

export { TransitionGroup };
