import { mixinFactory } from '@react-ameliorate/core';

export const ChildHandler = mixinFactory('ChildHandler', ({ Parent, componentName }) => {
  const eventFuncMapping = {
    'entering': 'onEntering',
    'entered': 'onEntered',
    'leaving': 'onLeaving',
    'left': 'onLeft'
  };

  return class ChildHandler extends Parent {
    construct() {
      super.construct.apply(this, arguments);

      Object.defineProperty(this, '_childHandlerState', {
        writable: false,
        enumerable: false,
        configurable: true,
        value: this._getNewChildStateObject(null, null)
      });
    }

    _getChild(id) {
      var children = this.getState(this.getChildStateKey());
      return children[id];
    }

    getChildStateKey() {
      return 'children';
    }

    _getChildCount() {
      return Object.keys(this.getState(this.getChildStateKey(), {})).length;
    }

    _getChildEnteredCount() {
      var children = this.getState(this.getChildStateKey(), {});
      return Object.keys(children).filter((childKey) => {
        var child = children[childKey];
        return (child.state === 'entering' || child.state === 'entered');
      }).length;
    }

    _getNewChildStateObject(id, element, state) {
      return {
        id,
        element,
        state
      };
    }

    _doChildTransition(stateObject, eventName) {
      if (!stateObject)
        return;

      var state = stateObject.state,
          doneCallback;

      if (eventName === 'entering') {
        if (state === 'entering' || state === 'entered')
          return;

        doneCallback = this._onChildEntered;
        stateObject.state = 'entering';

        // This is the first child entering... so fade in our main component
        if (stateObject.element && this._getChildEnteredCount() === 0)
          this._doChildTransition(this._childHandlerState, 'entering');
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
        if (stateObject.element && this._getChildEnteredCount() === 0)
          this._doChildTransition(this._childHandlerState, 'leaving');
      } else if (eventName === 'left') {
        if (state === 'left')
          return;

        doneCallback = () => {
          if (stateObject.state === 'left')
            this._removeChild(stateObject);
        };

        stateObject.state = 'left';
      }

      var ret = this.callProvidedCallback(eventFuncMapping[eventName], stateObject);
      return { state: stateObject.state, callbackResult: ret, onFinish: doneCallback };
    }

    _onChildEntering(stateObject) {
      return this._doChildTransition(stateObject, 'entering');
    }

    _onChildMounted(stateObject, instance) {
      if (!instance || stateObject.instance === instance)
        return;

      stateObject.instance = instance;
      var ret = this.callProvidedCallback('onMounted', stateObject);
      return { state: stateObject.state, callbackResult: ret, onFinish: null };
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

    _updateChildren(_newChildren, currentChildren) {
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

        if (!this.isValidElement(child))
          throw new Error('Every child of a TransitionGroup MUST be a valid React element');

        var childID = child.props.id;
        if (typeof childID === 'function')
          childID = childID.call(this, child, i);

        if (!childID || newChildMap.hasOwnProperty(childID))
          throw new Error('Every child of a TransitionGroup must have a unique "id" property');

        allChildMap[childID] = allChildMap[childID];
        newChildMap[childID] = child;
      }

      // Calculate the difference and send out events
      var allChildIDs = Object.keys(allChildMap),
          state;

      for (var i = 0, il = allChildIDs.length; i < il; i++) {
        var newChildID = allChildIDs[i],
            newChild = newChildMap[newChildID],
            currentMatchingChild = allChildMap[newChildID];

        if (currentMatchingChild) {
          state = currentMatchingChild.state;

          if (newChild) {
            if (currentMatchingChild.element !== newChild) {
              hasChange = true;
              currentMatchingChild.element = newChild;
            }

            if (state === 'leaving' || state === 'left') {
              hasChange = true;
              this._onChildEntering(currentMatchingChild);
            }
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

      return { changed: hasChange, childMap: allChildMap };
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

      return { changed: hasChanged, childMap: newChildren };
    }
  };
});
