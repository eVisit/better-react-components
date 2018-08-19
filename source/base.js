import { utils as U }       from 'evisit-js-utils';

const defineROProperty = U.defineROProperty,
      defineRWProperty = U.defineRWProperty;

const MOUNT_STATE = {
  MOUNTING: 0x01,
  MOUNTED: 0x02,
  UNMOUNTING: 0x04,
  UNMOUNTED: 0x08
};

MOUNT_STATE.MOUNTING_OR_MOUNTED = MOUNT_STATE.MOUNTING | MOUNT_STATE.MOUNTED;
MOUNT_STATE.UNMOUNTING_OR_UNMOUNTED = MOUNT_STATE.UNMOUNTING | MOUNT_STATE.UNMOUNTED;

function areObjectsEqualShallow(props, oldProps) {
  if (props === oldProps)
    return true;

  if (!props || !oldProps)
    return (props === oldProps);

  var keys = Object.keys(props);
  for (var i = 0, il = keys.length; i < il; i++) {
    var key = keys[i];

    if (!oldProps.hasOwnProperty(key))
      return false;

    if (props[key] !== oldProps[key])
      return false;
  }

  return true;
}

function factory(options = {}) {
  class SharedState {
    constructor() {
      defineROProperty(this, '_components', []);
      defineRWProperty(this, '_oldState', {});
      defineRWProperty(this, '_currentState', {});
      defineRWProperty(this, '_stateModificationCounter', 0);
      defineROProperty(this, '_refs', {});
      defineROProperty(this, '_shared', {});
    }

    getComponentReference() {
      return this._refs.__toplevel;
    }

    setComponentReference(ref) {
      this._refs.__toplevel = ref;
    }

    getStaleState() {
      return this._oldState;
    }

    setCurrentState(state) {
      if (!state)
        return;

      Object.assign(this._currentState, state);
    }

    getCurrentState() {
      return this._currentState;
    }

    updateState(componentInstance, newState, finishedCB) {
      if (newState) {
        var updatedState = newState;
        if (typeof updatedState === 'function')
          updatedState = updatedState.call(componentInstance, this.getCurrentState(), componentInstance.props);

        if (updatedState)
          this.setCurrentState(updatedState);
      }

      var mountState = componentInstance.getMountState();
      if (!(mountState & MOUNT_STATE.MOUNTING_OR_MOUNTED))
        return;

      this._stateModificationCounter++;

      var components = this._components,
          self = this;

      for (var i = 0, il = components.length; i < il; i++) {
        var component = components[i],
            reactInstance = component.instance,
            shared = this._shared;

        Component.prototype.setState.call(reactInstance, function(prevState, props) {
          var thisState = (typeof newState === 'function') ? newState.call(this, prevState, props) : newState;
          return Object.assign({}, shared, thisState || {});
        }, function() {
          self.setCurrentState(this.state);

          if (typeof finishedCB === 'function')
            return finishedCB.apply(this, arguments);
        });
      }
    }

    addComponent(instance, order) {
      this._components.push({
        instance,
        order
      });

      this._components.sort((a, b) => {
        return (a.order - b.order);
      });
    }

    removeComponent(instance, order) {
      var index = this._components.findIndex((component) => (component.instance === instance));
      if (index >= 0)
        this._components.splice(index, 1);
    }
  }

  function stateResolver(path, defaultValue) {
    if (arguments.length === 0)
      return this;

    return U.get(this, path, defaultValue);
  }

  function overloadFunction(func, cb) {
    return function(...args) {
      var ret = func.apply(this, args);
      return cb.call(this, ret, ...args);
    };
  }

  function resolveStateWithStore(componentStateResolver, store, nextProps) {
    var state = (store) ? store.getState() : {};
    return componentStateResolver({ resolve: stateResolver.bind(state), state, selectors: (store) ? store.selectors : undefined, props: (nextProps) ? nextProps : this.props, store });
  }

  function connectToStore(propsSelector) {
    function storePropsSelector(nextState, nextProps) {
      // Is component still mounted?
      if (!this._disconnectFromStore)
        return {};

      //Store has changed... let's fetch the data and see if it really has changed
      var newProps = resolveStateWithStore.call(this, propsSelector, this.getStore(), nextProps);

      //When we get an event from the store, see if we have actually changed
      if (areObjectsEqualShallow(newProps, this.state))
        return;

      //Yep, it really has changed, call setState to trigger a re-render
      if (this.componentStateWillUpdate instanceof Function) {
        var ret = this.componentStateWillUpdate(newProps);

        // If we return false, don't update the component
        if (ret === false)
          return;
      }

      this.setState(newProps);
    }

    if (!propsSelector || this._disconnectFromStore)
      return;

    var store = this.getStore();
    if (!store)
      return;

    if (this.componentStateWillUpdate instanceof Function)
      this.componentStateWillUpdate(this.state);

    if (this.componentWillReceiveProps instanceof Function) {
      this.componentWillReceiveProps = overloadFunction.call(this, this.componentWillReceiveProps.bind(this), (ret, nextProps) => {
        storePropsSelector.call(this, undefined, nextProps);
      }).bind(this);

      this.componentWillReceiveProps(this.props, this.context, true);
    }

    defineRWProperty(this, '_pendingStoreUpdate', null);
    defineRWProperty(this, '_disconnectFromStore', store.subscribe(storePropsSelector.bind(this)));
  }

  function disconnectFromStore() {
    if (typeof this._disconnectFromStore === 'function') {
      this._disconnectFromStore();
      this._disconnectFromStore = null;
    }
  }

  function cloneComponents(children, recursive, propsHelper, cloneHelper, _depth) {
    function cloneChild(child, index) {
      if (!child)
        return child;

      var key = ('' + index),
          childProps = { key };

      if (React.isValidElement(child)) {
        childProps = Object.assign(childProps, child.props || {});

        var extraProps = (propsHelper instanceof Function) ? propsHelper(child, childProps, index, depth) : {};

        if (extraProps)
          childProps = Object.assign(childProps, extraProps);

        if (recursive && childProps.children)
          childProps.children = cloneComponents(childProps.children, recursive, propsHelper, cloneHelper, depth + 1);

        return (cloneHelper instanceof Function) ? cloneHelper(child, childProps, index, depth, true) : React.cloneElement(child, childProps, childProps.children);
      }

      return (cloneHelper instanceof Function) ? cloneHelper(child, childProps, index, depth, false) : child;
    }

    var depth = _depth || 0;

    if (!children)
      return children;

    if (!(children instanceof Array))
      return cloneChild.call(this, children, 0);

    return children.map(cloneChild.bind(this)).filter((c) => (c !== undefined && c !== null));
  }

  function getStyleSheetFromFactory(theme, _styleSheetFactory, _platform) {
    if (!theme)
      return;

    var styleCache = theme._cachedStyles;

    if (!styleCache) {
      defineRWProperty(theme, '_cachedStyles', {});
      styleCache = theme._cachedStyles;
    }

    var styleSheetFactory = _styleSheetFactory;
    if (typeof styleSheetFactory !== 'function') {
      console.warn('static styleSheet for component is not a proper styleSheet');
      return;
    }

    var styleID = styleSheetFactory._styleSheetID,
        cachedStyle = styleCache[styleID];

    if (!cachedStyle) {
      cachedStyle = styleSheetFactory(theme, _platform);
      styleCache[styleID] = cachedStyle;
    }

    return cachedStyle;
  }

  const { React } = options;
  if (!React)
    throw new Error('Error: "React" key (React library) must be specified for component factory');

  const Component = React.Component;

  return {
    MOUNT_STATE,
    areObjectsEqualShallow,
    SharedState,
    cloneComponents,
    stateResolver,
    resolveStateWithStore,
    connectToStore,
    disconnectFromStore,
    getStyleSheetFromFactory
  };
}

module.exports = factory;