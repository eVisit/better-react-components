const utils           = require('evisit-js-utils'),
      PropTypes       = require('./prop-types'),
      Base            = require('./base'),
      StyleSheet      = require('./styles/style-sheet'),
      Theme           = require('./styles/theme'),
      { Dimensions }  = require('./platform-shims');

const U = utils.utils;

const defineROProperty = U.defineROProperty,
      defineRWProperty = U.defineRWProperty;

var componentIDCounter = 1;

function exportFactory(options = {}) {
  function getComponentByID(uid) {
    return globalComponentReferences[uid];
  }

  function getAddressedComponents() {
    return globalComponentReferences;
  }

  function getComponentByProp(matcher) {
    if (typeof matcher !== 'function')
      return;

    var components = getAddressedComponents(),
        keys = Object.keys(components);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          component = components[key],
          componentProps = component.props;

      if (matcher(componentProps, component))
        return component;
    }
  }

  function eventMethodsToProps() {
    var keys = Object.getOwnPropertyNames(this.constructor.prototype),
        props = {};

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          val = this[key];

      if (key in Object.prototype)
        continue;

      if ((val instanceof Function) && key.match(/^on[A-Z]/))
        props[key] = val;
    }

    return props;
  }

  function createReferenceInstantiationHook(id, callback) {
    var ref = globalComponentReferences[id];
    if (ref)
      return callback.call(ref, ref);

    var hooks = referenceHooks[id];
    if (!hooks)
      hooks = referenceHooks[id] = [];

    hooks.push({
      id,
      callback
    });
  }

  function callReferenceInstantiationHooks(id) {
    var hooks = referenceHooks[id];
    if (!hooks)
      return;

    for (var i = 0, il = hooks.length; i < il; i++) {
      var hook = hooks[i];
      hook.callback.call(this, this);
    }

    delete referenceHooks[id];
  }

  function skipProxyMethods(propName, target, proto) {
    defaultSkipProxyMethods.lastIndex = 0;
    if (defaultSkipProxyMethods.test(propName))
      return true;

    if (typeof skipProxyOfComponentMethods === 'function')
      return skipProxyOfComponentMethods.call(this, propName, target, proto);

    return false;
  }

  const React = options.React;
  if (!React)
    throw new Error('Error: "React" key (React library) must be specified for component factory');

  const Component = React.Component,
        baseExports = Base({ React }),
        {
          MOUNT_STATE,
          SharedState,
          cloneComponents,
          connectToStore,
          disconnectFromStore,
          getStyleSheetFromFactory,
          resolveStateWithStore,
          areObjectsEqualShallow
        } = baseExports;

  class GenericComponentBase extends Component {
    constructor(InstanceClass, ReactClass, props, ...args) {
      super(props, ...args);

      // Proxy calls to instance
      defineROProperty(this, 'getChildContext', undefined, () => {
        if (!this._componentInstance)
          return this._componentInstance;

        if (typeof this._componentInstance.getChildContext !== 'function')
          return this._componentInstance.getChildContext;

        return this._componentInstance.getChildContext.bind(this._componentInstance);
      }, () => {});

      var sharedState = props._sharedComponentState;
      if (!sharedState)
        sharedState = new SharedState();

      var domOrder = props._domOrder;
      if (domOrder == null)
        domOrder = 1;

      var componentOrder = componentIDCounter++,
          componentID = props.id;

      if (!componentID)
        componentID = `Component/${('' + componentIDCounter).padStart(13, '0')}`;

      defineROProperty(this, '_domOrder', domOrder);
      defineROProperty(this, '_componentInstanceClass', InstanceClass);
      defineROProperty(this, '_state', sharedState);
      defineRWProperty(this, '_mountState', 0x0);
      defineROProperty(this, 'refs', undefined, () => sharedState._refs, (val) => {});
      defineRWProperty(this, '_propsModificationCounter', 0);
      defineRWProperty(this, '_componentID', componentID);
      defineRWProperty(this, '_componentOrder', componentOrder);
      defineRWProperty(this, '_frozenStateUpdates', []);

      var state = { refs: {} };
      defineRWProperty(this, 'state', undefined, () => state, (val) => {
        sharedState.setCurrentState(val);
        state = val;
        return val;
      });

      var instance = callComponentCreationHook.call(this, new InstanceClass(this), InstanceClass, ReactClass);
      bindPrototypeFuncs.call(this, InstanceClass.prototype);
      bindPrototypeFuncs.call(instance, InstanceClass.prototype);

      defineROProperty(this, '_componentInstance', instance);

      // Only hook the top-level component to the store
      if (domOrder === 1) {
        sharedState.setComponentReference(instance);

        // Update state with instance resolveState
        var store = this._componentInstance.store || this.context.store,
            resolveState = instance.resolveState.bind(instance);

        Object.assign(this.state, resolveStateWithStore.call(instance, resolveState, store, props));
        sharedState.setCurrentState(this.state);

        if (typeof instance.getStore === 'function') {
          // Only hook the top-level component to the store
          instance.getStore(({ store }) => {
            if (!store || typeof store.subscribe !== 'function' || typeof store.getState !== 'function')
              return;

            connectToStore.call(instance, resolveState);
          });
        }
      }
    }

    createReferenceInstantiationHook(id, callback) {
      return createReferenceInstantiationHook(id, callback);
    }

    getMountState() {
      return this._mountState;
    }

    callInstanceClassMethod(name, defaultValue, strictFocus, args) {
      if (strictFocus && !this._componentInstanceClass.prototype.hasOwnProperty(name))
        return defaultValue;

      return this._componentInstanceClass.prototype[name].apply(this._componentInstance, args);
    }

    // callInstanceMethod(name, args) {
    //   return this._componentInstance[name].apply(this._componentInstance, args);
    // }

    // measure(...args) {
    //   return this.callInstanceClassMethod('measure', undefined, args);
    // }

    componentWillMount(...args) {
      this._mountState = MOUNT_STATE.MOUNTING;
      return this.callInstanceClassMethod('componentWillMount', undefined, true, args);
    }

    componentDidMount(...args) {
      this._mountState = MOUNT_STATE.MOUNTED;
      this._state.addComponent(this, this._domOrder);

      if (this._domOrder === 1)
        globalComponentReferences[this._componentID] = this._componentInstance;

      var ret = this.callInstanceClassMethod('componentDidMount', undefined, true, args);

      // Call any listeners who are interested in when this component is instantiated
      if (this._domOrder === 1) {
        if (this._frozenStateUpdates.length > 0)
          this._componentInstance.setState({});

        callReferenceInstantiationHooks.call(this._componentInstance, this._componentID);
      }

      return ret;
    }

    componentWillUnmount(...args) {
      this._mountState = MOUNT_STATE.UNMOUNTING;

      this._state.removeComponent(this, this._domOrder);
      this._componentInstance.finalizeComponent();

      var ret = this.callInstanceClassMethod('componentWillUnmount', undefined, true, args);
      this._mountState = MOUNT_STATE.UNMOUNTED;

      if (this._domOrder === 1)
        delete globalComponentReferences[this._componentID];

      return ret;
    }

    // TODO: Update to fix deprecated usage
    componentWillReceiveProps(...args) {
      var nextProps = args[0];
      if (!areObjectsEqualShallow(nextProps, this.props))
        this._propsModificationCounter++;

      return this.callInstanceClassMethod('componentWillReceiveProps', undefined, true, args);
    }

    shouldComponentUpdate(nextProps, nextState) {
      return this.callInstanceClassMethod('shouldComponentUpdate', true, false, [nextProps, nextState, this._propsModificationCounter]);
    }

    componentWillUpdate(...args) {
      return this.callInstanceClassMethod('componentWillUpdate', undefined, true, args);
    }

    render(...args) {
      if (!global.componentRenderCount)
        global.componentRenderCount = 0;

      global.componentRenderCount++;

      return this.callInstanceClassMethod('render', undefined, true, args);
    }

    componentDidUpdate(...args) {
      return this.callInstanceClassMethod('componentDidUpdate', undefined, true, args);
    }

    /*componentDidCatch() {

    }*/
  }

  GenericComponentBase.contextTypes = {
    applicationContext: PropTypes.any,
    store: PropTypes.any,
    theme: PropTypes.any
  };

  class GenericComponentInstanceBase {
    constructor(reactInstance) {
      defineRWProperty(this, '_stateModificationCounter', 0);
      defineRWProperty(this, '_propsModificationCounter', 0);

      defineROProperty(this, '_reactInstance', reactInstance);

      defineRWProperty(this, 'props', undefined, () => this.getFormattedComponentProps(this._reactInstance.props), () => {});
      defineROProperty(this, '_resolveProps', undefined, () => this._reactInstance.constructor.resolveProps || {}, () => {});

      defineRWProperty(this, '_domOrder', undefined, () => this._reactInstance._domOrder, () => {});
      defineRWProperty(this, 'context', undefined, () => this._reactInstance.context, () => {});
      defineRWProperty(this, 'refs', undefined, () => this._reactInstance.refs, () => {});
      defineRWProperty(this, 'state', undefined, () => this._reactInstance.state, (val) => {
        this._reactInstance.state = {};
        return val;
      });
      defineRWProperty(this, '_state', undefined, () => this._reactInstance._state, () => {});
      defineRWProperty(this, '_componentName', undefined, () => (this.constructor.displayName || this.constructor.name), () => {});
      defineRWProperty(this, '_componentMounted', false);
      defineRWProperty(this, '_componentID', undefined, () => this._reactInstance._componentID, () => {});
      defineRWProperty(this, '_frozenStateUpdates', undefined, () => this._reactInstance._frozenStateUpdates, (val) => {
        this._reactInstance._frozenStateUpdates = val;
        return val;
      });

      defineROProperty(this, 'platform', undefined, () => {
        if (this.props.platform)
          return this.props.platform;

        if (this.context.platform)
          return this.context.platform;

        var theme = this.getTheme();
        if (theme)
          return theme.getPlatform();
      });

      // Setup the styleSheet getter to build style-sheets when requested
      this.defineStyleSheetProperty('styleSheet', this.constructor.styleSheet);

      this.construct();
    }

    getFormattedComponentProps(reactProps) {
      var formattedProps = {},
          keys = Object.keys(reactProps),
          resolveProps = this._resolveProps;

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            value = reactProps[key];

        if (resolveProps && resolveProps[key] && typeof value === 'function')
          value = value.call(this, reactProps);

        formattedProps[key] = value;
      }

      return formattedProps;
    }

    defineStyleSheetProperty(name, styleSheetFactory) {
      Object.defineProperty(this, name, {
        enumerable: false,
        configurable: true,
        get: () => {
          return getStyleSheetFromFactory(this.getTheme(), styleSheetFactory, this.isMobilePlatform);
        },
        set: () => {}
      });
    }

    getComponentOrder() {
      return this._componentOrder;
    }

    getComponentID() {
      return this._componentID;
    }

    // Get top level instance reference
    getComponentReference() {
      return this._state.getComponentReference();
    }

    getComponentReferenceByID(id) {
      if (arguments.length === 0)
        return globalComponentReferences;

      return globalComponentReferences[id];
    }

    createReferenceInstantiationHook(id, callback) {
      createReferenceInstantiationHook(id, callback);
    }

    areStateUpdatesFrozen() {
      var stateUpdateFrozen = this.getSharedProperty('_stateUpdateFrozen');
      return ((this.context && this.context.stateUpdatesFrozen) || stateUpdateFrozen);
    }

    setSharedProperty(propName, propValue) {
      U.set(this._state, `_shared.${propName}`, propValue);
    }

    getSharedProperty(propName) {
      return U.get(this._state, `_shared.${propName}`);
    }

    setReference(name, ref) {
      this.setSharedProperty(`refs.${name}`, ref);
    }

    getReference(name, cb) {
      var ref = this.getSharedProperty(`refs.${name}`);

      if (typeof cb === 'function' && ref)
        return cb.call(this, ref);

      return ref;
    }

    getComponentByID(uid) {
      return getComponentByID(uid);
    }

    getAddressedComponents() {
      return getAddressedComponents();
    }

    getComponentByProp(matcher) {
      return getComponentByProp(matcher);
    }

    getMountState() {
      if (!this._reactInstance)
        return MOUNT_STATE.UNMOUNTED;

      return this._reactInstance.getMountState();
    }

    isSetStateSafe() {
      var state = this.getMountState();
      return (state & MOUNT_STATE.MOUNTING_OR_MOUNTED);
    }

    construct() {}

    // These are required for React to be able to call them
    componentWillMount() {
    }

    finalizeComponent() {
      disconnectFromStore.call(this);
    }

    static getScreenInfo() {
      /* globals _getWindowDimensions */
      if (typeof _getWindowDimensions === 'function')
        return _getWindowDimensions('window');

      return Dimensions.get('window');
    }

    getScreenInfo() {
      return Theme.getScreenInfo();
    }

    getAnimationDuration(_val) {
      var set = parseInt(('' + _val).replace(/[^\d.-]/g, ''), 10);
      if (isNaN(set) || !isFinite(set))
        set = this.styleProp('DEFAULT_ANIMATION_DURATION');

      /* globals _defaultAnimationDurationOverride */
      return (__DEV__ && typeof _defaultAnimationDurationOverride != 'undefined' && _defaultAnimationDurationOverride) ? _defaultAnimationDurationOverride : set;
    }

    componentDidMount() {}
    componentWillReceiveProps() {}
    componentWillUpdate() {}
    componentDidUpdate() {}
    componentStateWillUpdate() {}

    render() {
      return null;
    }

    shouldComponentUpdate(nextProps, nextState, propModificationCounter) {
      var stateModCounter = this._state._stateModificationCounter;

      if (propModificationCounter > this._propsModificationCounter || stateModCounter > this._stateModificationCounter) {
        //console.log('UPDATE HAPPENING!!!', this._componentName, propModificationCounter, this._propsModificationCounter, stateModCounter, this._stateModificationCounter);
        this._propsModificationCounter = propModificationCounter;
        this._stateModificationCounter = stateModCounter;
        return true;
      } else {
        //console.log('NOT HAPPENING!!!', this._componentName, propModificationCounter, this._propsModificationCounter, stateModCounter, this._stateModificationCounter);
      }

      if (!areObjectsEqualShallow(nextProps, this.props))
        return true;

      if (!areObjectsEqualShallow(nextState, this.state))
        return true;

      return false;
    }

    // Empty state resolve
    resolveState({ resolve }) {
      return {
        lastBrandingUpdateTime: resolve('ui.brandingUpdateTime')
      };
    }

    resolveProps(names, _props) {
      var allNames = [].concat.apply([], names),
          resolvedProps = {},
          props = (_props) ? _props : this.props;

      for (var i = 0, il = allNames.length; i < il; i++) {
        var name = allNames[i],
            prop = props[name];

        resolvedProps[name] = (prop instanceof Function) ? prop.call(this) : prop;
      }

      return resolvedProps;
    }

    getParentProps() {
      return this.props;
    }

    forceUpdate(...args) {
      return this._reactInstance.forceUpdate(...args);
    }

    freezeStateUpdates() {
      this.setSharedProperty('_stateUpdateFrozen', true);
    }

    unfreezeStateUpdates() {
      this.setSharedProperty('_stateUpdateFrozen', false);
      this.setState({});
    }

    setState(...args) {
      if (this.areStateUpdatesFrozen() || !this.isSetStateSafe()) {
        this._frozenStateUpdates.push(args);
        return;
      }

      var frozenUpdates = this._frozenStateUpdates;
      if (frozenUpdates.length > 0) {
        for (var i = 0, il = frozenUpdates.length; i < il; i++)
          this._state.updateState(this, ...frozenUpdates[i]);

        this._frozenStateUpdates = [];
      }

      this._state.updateState(this, ...args);
    }

    // Get the current state... this always returns the most current state
    getState(path, defaultValue) {
      var currentState = this._state.getCurrentState();
      if (U.noe(path))
        return currentState;

      if (U.instanceOf(path, 'object')) {
        var keys = Object.keys(path),
            finalState = {};

        for (var i = 0, il = keys.length; i < il; i++) {
          var key = keys[i],
              defaultVal = path[key],
              stateVal = U.get(currentState, key, defaultVal);

          finalState[key.replace(/^.*?(\w+)$/g, '$1')] = (stateVal === undefined) ? defaultVal : stateVal;
        }

        return finalState;
      }

      return U.get(currentState, path, defaultValue);
    }

    pending(func, time, _id) {
      var id = (!_id) ? ('' + func) : _id;
      if (!this._timers)
        this._timers = {};

      if (this._timers[id])
        clearTimeout(this._timers[id]);

      this._timers[id] = setTimeout(() => {
        this._timers[id] = null;
        if (func instanceof Function)
          func.call(this);
      }, time || 250);
    }

    style(...args) {
      // Get any style overrides from the parent page... if any
      // This is used when a page is built inside a modal
      var parentContextComponent = this.getParentContextComponent(),
          helperFunc;

      if (parentContextComponent && parentContextComponent.getStyleOverride instanceof Function)
        helperFunc = parentContextComponent.getStyleOverride.bind(parentContextComponent, this);

      return this.styleSheet.styleWithHelper(helperFunc, ...args);
    }

    styleProp(...args) {
      var styleSheet = this.styleSheet;
      return styleSheet.styleProp(...args);
    }

    getApp() {
      return this.context.applicationContext;
    }

    getStore(cb) {
      var store = this.context.store;

      if (typeof cb === 'function' && store)
        cb.call(this, Object.assign({}, store, { store }));

      return store;
    }

    getTheme(cb) {
      var theme = this.theme || this.context.theme;
      if (!theme)
        theme = new Theme.Theme({}, this.props.platform);

      if (typeof cb === 'function' && theme)
        return cb.call(this, { theme, properties: theme.getThemeProperties() });

      return theme;
    }

    getParentContextComponent(cb) {
      var parentContextComponent = this.context.parentContextComponent;

      if (typeof cb === 'function' && parentContextComponent)
        cb.call(this, { parentContextComponent });

      return parentContextComponent;
    }

    getLayoutContext(contexts) {
      if (!contexts)
        return contexts;

      // Fill up the contexts object
      if (U.instanceOf(contexts, 'string', 'number', 'boolean'))
        return ('' + contexts);

      var platform = this.platform;
      if (contexts.hasOwnProperty(platform))
        return contexts[platform];
    }

    getClassName(...args) {
      function prettify(name) {
        if (!name)
          return name;

        return [('' + name).charAt(0).toUpperCase(), name.substring(1)].join('');
      }

      var componentName = prettify(this.constructor.displayName),
          thisClassName = classNamesPrefix + componentName;

      if (args.length === 0)
        return thisClassName;

      return args.map((elem) => {
        // Magic "myself" class name
        if (elem === '')
          return thisClassName;

        // Filter out bad class names
        if (U.noe(elem))
          return undefined;

        // If class name begins with "applicationContext" then return the raw class name
        if (elem.length >= classNamesPrefix.length && elem.substring(0, classNamesPrefix.length) === classNamesPrefix)
          return elem;

        // Otherwise, prefix "applicationContext" onto every class name
        return classNamesPrefix + prettify(('' + elem));
      }).filter((elem) => !!elem).join(' ');
    }

    getRootClassName(...args) {
      var classNames = this.getClassName('', ...args);

      if (!U.noe(this.props.className))
        classNames = [classNames.trim(), this.props.className.trim()].join(' ');

      return classNames;
    }

    postRender(elements) {
      return elements;
    }

    getChildren(_children) {
      var children = _children || this.props.children;

      if (U.noe(children))
        children = [];

      if (!(children instanceof Array))
        children = [children];

      return children;
    }

    getElementLayoutContext(props, childProps) {
      if (!childProps || !childProps.layoutContext) {
        return {
          definesContext: false,
          context: null,
          removeElement: false
        };
      }

      // Get a context name... or falsy if this element should be stripped
      var thisLayoutContext = this.getLayoutContext(childProps.layoutContext),
          remove;

      if (thisLayoutContext) {
        if (thisLayoutContext.remove === true) {
          remove = true;
          thisLayoutContext = thisLayoutContext.name;
        }

        if (props && props.removeContexts) {
          if (props.removeContexts instanceof Function)
            remove = props.removeContexts.call(this, thisLayoutContext, ...arguments);
          else if (props.removeContexts.hasOwnProperty(thisLayoutContext))
            remove = props.removeContexts[thisLayoutContext];
        }
      }

      return {
        definesContext: true,
        context: thisLayoutContext,
        removeElement: remove
      };
    }

    processElements(_elements, _props) {
      var props = _props || this.props,
          elements = _elements || props.children,
          contexts = {},
          getElementProps = props.getElementProps,
          cloneElement = props.cloneElement,
          cloneHelper = props.cloneHelper,
          finalVal = {
            props,
            elements,
            contexts
          };

      if (U.noe(elements))
        return finalVal;

      elements = cloneComponents(elements, true, getElementProps, (cloneElement instanceof Function) ? cloneElement.bind(this) : (child, childProps, index, depth, isReactElement) => {
        if (!isReactElement)
          return child;

        var contextInfo = this.getElementLayoutContext(props, childProps),
            { definesContext, context, removeElement } = contextInfo;

        if (definesContext && !context)
          return null;

        var child = (cloneHelper instanceof Function) ? cloneHelper.call(this, child, childProps, index, depth, isReactElement, contextInfo) : React.cloneElement(child, childProps, childProps.children);

        context = contextInfo.context;
        removeElement = contextInfo.removeElement;

        if (context !== true && !U.noe(context))
          contexts[('' + context)] = child;

        return (removeElement) ? null : child;
      });

      if (elements instanceof Array)
        elements = elements.filter((c) => (c !== undefined && c !== null && c !== false));

      finalVal.elements = elements;

      return finalVal;
    }

    static componentFactoryHelper(InstanceClass, ComponentClass) {
      return ComponentClass;
    }
  }

  function setComponentCreationHook(callback) {
    if (typeof callback !== 'function')
      throw new Error('Component instantiation hook must be a function');

    _componentCreationHook = callback;
  }

  function bindPrototypeFuncs(obj) {
    var proto = Object.getPrototypeOf(obj);
    if (proto)
      bindPrototypeFuncs.call(this, proto);

    var names = Object.getOwnPropertyNames(obj);
    for (var i = 0, il = names.length; i < il; i++) {
      var propName = names[i],
          prop = this[propName];

      if (typeof prop !== 'function' || propName === 'constructor' || Object.prototype[propName] === prop)
        continue;

      Object.defineProperty(this, propName, {
        writable: true,
        enumerable: false,
        configurable: false,
        value: prop.bind(this)
      });
    }
  }

  function callComponentCreationHook(instance, ...args) {
    if (typeof _componentCreationHook === 'function')
      return _componentCreationHook.call(this, instance, ...args);

    return instance;
  }

  function internalComponentFactory(klassDisplayName, klassName, definitionFactory, _ParentComponent, factoryArgs, componentFactoryHelper) {

    // Proxy any function calls from react instance to target instance
    function copyPrototypeMethods(target, proto) {
      if (!proto)
        return;

      var parentProto = Object.getPrototypeOf(proto);
      if (parentProto)
        copyPrototypeMethods(target, parentProto);

      var names = Object.getOwnPropertyNames(proto);
      for (var i = 0, il = names.length; i < il; i++) {
        var propName = names[i],
            prop = proto[propName];

        if (skipProxyMethods(propName, target, proto) || (Object.prototype[propName] === prop) || propName in Component.prototype)
          continue;

        Object.defineProperty(target, propName, {
          writable: true,
          enumerable: false,
          configurable: true,
          value: (prop instanceof Function) ? (function(func) {
            return function() {
              return func.apply(this._componentInstance, arguments);
            };
          })(prop) : prop
        });
      }
    }

    function copyStaticMethods(instanceClass, target, filterFunc) {
      var keys = Object.getOwnPropertyNames(instanceClass);
      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i];

        if (target.hasOwnProperty(key))
          continue;

        if (typeof filterFunc === 'function' && !filterFunc(key))
          continue;

        Object.defineProperty(target, key, {
          writable: true,
          enumerable: false,
          configurable: true,
          value: instanceClass[key]
        });
      }
    }

    function mergePropTypes(..._types) {
      var types = _types.filter((type) => !!type);
      return PropTypes.mergeTypes(...types);
    }

    function mergeResolveProps(...allProps) {
      var allKeys = allProps.map((props) => {
        var isArray = (props instanceof Array);
        return Object.keys(props || {}).reduce((obj, key) => ((obj[(isArray) ? props[key] : key] = true) && obj), {});
      });

      return Object.assign.apply(this, Array.prototype.concat.apply([{}], allKeys));
    }

    if (!(definitionFactory instanceof Function))
      throw new Error('componentFactory expects second argument to be a function that returns a class');


    var ParentComponent = _ParentComponent,
        ParentClass = componentInstanceBaseClass || GenericComponentInstanceBase,
        ComponentParentClass = componentBaseClass || GenericComponentBase;

    if (ParentComponent && ParentComponent._instanceClass)
      ParentClass = ParentComponent._instanceClass;

    // See if this component (definer + parent) has already been built
    var component = registeredComponents.find((k) => (definitionFactory === k.definitionFactory && k.ParentComponent === ParentComponent));
    if (component)
      return component.ComponentClass;

    // Get instance class
    var parentName = U.get(ParentComponent, 'displayName', U.get(ParentComponent, 'name')),
        InstanceClass = definitionFactory(ParentClass, parentName, ...factoryArgs);

    // Generate a React component class
    // this goes side-by-side with the instance class
    var Klass = class GenericReactComponent extends ComponentParentClass {
      constructor(...args) {
        super(InstanceClass, Klass, ...args);
      }
    };

    Klass.contextTypes = Object.assign(
      {},
      U.get(ParentComponent, 'contextTypes', {}),
      U.get(InstanceClass, 'contextTypes', {}),
      {
        applicationContext: PropTypes.any,
        store: PropTypes.any,
        theme: PropTypes.any,
        parentContextComponent: PropTypes.any,
        stateUpdatesFrozen: PropTypes.bool
      },
      getDefaultContextTypes()
    );

    Klass.propTypes = mergePropTypes(ParentClass.propTypes, InstanceClass.propTypes);
    Klass.defaultProps = Object.assign({}, (ParentClass.defaultProps || {}), (InstanceClass.defaultProps || {}));
    Klass.resolveProps = mergeResolveProps(ParentClass.resolveProps, InstanceClass.resolveProps);

    // Proxy requests to the component to the instance
    copyPrototypeMethods(Klass.prototype, InstanceClass.prototype);

    // Copy static properties / methods from Parent class
    copyStaticMethods(ParentClass, InstanceClass, (name) => !name.match(/^(childContextTypes|styleSheet|propTypes|defaultProps)$/));

    // Copy static properties / methods to Component class
    copyStaticMethods(InstanceClass, Klass);

    if (!InstanceClass.prototype.hasOwnProperty('render')) {
      InstanceClass.prototype.render = function() {
        return this.props.children || null;
      };
    }

    if (_ParentComponent && !InstanceClass.prototype.hasOwnProperty('getParentProps')) {
      InstanceClass.prototype.getParentProps = function() {
        return this.props;
      };
    }

    InstanceClass.prototype.render = (function(originalRenderFunc) {
      return function() {
        // Get children from the original class render function
        var children = originalRenderFunc.call(this) || null,
            postRender = (InstanceClass.prototype.hasOwnProperty('postRender')) ? InstanceClass.prototype.postRender.bind(this) : (c) => c;

        //if (klassName.match(/Page$/))
        //console.log(`Rendering component ${klassName}...`);

        // If there is no parent then just return the children
        if (!ParentComponent)
          return postRender(children, this.props);

        // Render parent and child
        var parentProps = this.getParentProps(),
            allProps = Object.assign({}, parentProps, eventMethodsToProps.call(this), {
              _sharedComponentState: this._state,
              _domOrder: this._domOrder + 1,
              ParentClass: ParentClass.displayName,
              ClassName: klassDisplayName
            });

        // Make a ref to every single object to capture the parent
        ((userRef) => {
          allProps.ref = (elem) => {
            this._parent = elem;
            if (userRef instanceof Function)
              return userRef.call(this, elem);
          };
        })(allProps.ref);

        children = postRender(children, allProps);

        // if (klassName.match(/Page$/))
        //   console.log(`Rendering parent page ${ParentComponent.displayName} children: `, children);

        // Get children from layout engine
        return (
          <ParentComponent {...allProps}>
            {children}
          </ParentComponent>
        );
      };
    })(InstanceClass.prototype.render);

    // We use 'in' here because we WANT to traverse the prototype
    // chain of the child and all parents
    if ('getChildContext' in InstanceClass.prototype) {
      Klass.childContextTypes = Object.assign(
        {},
        (U.get(ParentComponent, 'childContextTypes', {})),
        (U.get(InstanceClass, 'childContextTypes', {}))
      );
    }

    defineROProperty(Klass, 'displayName', klassDisplayName);
    defineROProperty(InstanceClass, 'displayName', klassDisplayName);
    defineROProperty(Klass, 'internalName', klassName);
    defineROProperty(InstanceClass, 'internalName', klassName);
    defineROProperty(InstanceClass, '_parentClass', ParentClass);
    defineROProperty(Klass, '_definer', definitionFactory);
    defineROProperty(Klass, '_instanceClass', InstanceClass);
    defineROProperty(Klass, '_parentComponent', ParentComponent);

    Klass = (typeof componentFactoryHelper === 'function') ? componentFactoryHelper(InstanceClass, Klass) : InstanceClass.componentFactoryHelper(InstanceClass, Klass);

    if (InstanceClass.navigation)
      Klass.navigation = InstanceClass.navigation;

    registeredComponents.push({
      klassName,
      klassDisplayName,
      definitionFactory,
      InstanceClass,
      ComponentClass: Klass,
      ParentComponent
    });

    if (typeof componentFactoryCreateHook === 'function')
      componentFactoryCreateHook.call(this, InstanceClass, Klass);

    return Klass;
  }

  /*
  * componentFactory expects _ParentComponent to be an array of parent info objects
  * in the form { parent: ParentComponent, args: [args, to, pass, to, factory] }.
  * If this isn't the case, it will intelligently convert and coerce as necessary.
  */
  function componentFactory(_klassName, definitionFactory, _ParentComponent, componentFactoryHelper) {
    var parentComponents = _ParentComponent,
        finalComponents = [],
        klassName,
        klassDisplayName;

    if (U.instanceOf(_klassName, 'string', 'number', 'boolean')) {
      klassName = klassDisplayName = ('' + _klassName);
    } else if (_klassName) {
      klassName = _klassName.name;
      klassDisplayName = _klassName.displayName;
    }

    // Setup our iteration for building components
    if (parentComponents) {
      if (!(parentComponents instanceof Array))
        parentComponents = [{ parent: parentComponents, args: [] }];
    } else {
      parentComponents = [{ parent: undefined, args: [] }];
    }

    // Iterate all parents, building each component
    for (var i = 0, il = parentComponents.length; i < il; i++) {
      var info = parentComponents[i];
      if (!info)
        throw new Error(`Parent[${i}] of component ${klassDisplayName} is invalid`);

      var thisParentComponent = (info.hasOwnProperty('parent')) ? info.parent : info,
          args = info.args || [];

      finalComponents.push(internalComponentFactory(klassDisplayName, klassName, definitionFactory, thisParentComponent, args, componentFactoryHelper));
    }

    // If an array wasn't passed in, only one component will have been built, so just return it plain
    // otherwise return the array of generated components
    var generatedComponents = (_ParentComponent instanceof Array) ? finalComponents : finalComponents[0];
    return generatedComponents;
  }

  function displayComponentInheritance(component) {
    function getParent(c, parts) {
      if (!c)
        return parts;

      // Get parent (if any) and walk parent tree
      if (c._parentComponent)
        getParent(c._parentComponent, parts);

      parts.push(c.displayName);

      return parts;
    }

    return getParent(component, []).join(' -> ');
  }

  function componentInheritsFrom(component, name) {
    function getParent(_c) {
      if (!_c)
        return false;

      var c = _c;
      if (c && c.type)
        c = c.type;

      if (c.displayName === name)
        return true;

      // Get parent (if any) and walk parent tree
      if (c._parentComponent)
        return getParent(c._parentComponent);

      return false;
    }

    return getParent(component);
  }

  function rebaseComponent(component, parentClassSelector) {
    function rebaseWithParent(c, _p) {
      // Get parent (if any) and walk parent tree rebasing each (if requested by the callback)
      var p = _p;
      if (p && p._parentComponent)
        p = rebaseWithParent(p, p._parentComponent);

      // Rebase parent class (if callback requests it)
      p = parentClassSelector.call(this, p.displayName, p, c.displayName, c);

      // Construct component with a new parent
      return componentFactory.call(this, c.displayName, c._definer, p);
    }

    var newComponent = rebaseWithParent(component, component._parentComponent);
    return newComponent;
  }

  var registeredComponents = [],
      defaultSkipProxyMethods = /^(componentWillMount|componentDidMount|componentWillUnmount|componentWillReceiveProps|shouldComponentUpdate|componentWillUpdate|render|componentDidUpdate|componentDidCatch|constructor|construct|getChildContext|getMountState|measure)$/,
      globalComponentReferences = {},
      referenceHooks = {};

  var _componentCreationHook = null,
      {
        generateComponentInstanceBaseClass,
        generateComponentBaseClass,
        classNamesPrefix,
        getDefaultContextTypes,
        skipProxyOfComponentMethods,
        componentFactoryCreateHook
      } = options;

  if (!classNamesPrefix)
    classNamesPrefix = 'application';

  if (typeof getDefaultContextTypes !== 'function') {
    getDefaultContextTypes = () => {
      return {};
    };
  }

  var componentInstanceBaseClass,
      componentBaseClass;

  if (typeof generateComponentBaseClass === 'function')
    componentBaseClass = generateComponentBaseClass({ GenericComponentInstanceBase, GenericComponentBase });

  if (typeof generateComponentInstanceBaseClass === 'function')
    componentInstanceBaseClass = generateComponentInstanceBaseClass({ GenericComponentInstanceBase, GenericComponentBase });

  return Object.assign({}, baseExports, StyleSheet, Theme, {
    PropTypes,
    displayComponentInheritance,
    getComponentByID,
    getAddressedComponents,
    getComponentByProp,
    componentFactory,
    componentInheritsFrom,
    rebaseComponent,
    setComponentCreationHook
  });
}

module.exports = exportFactory;
