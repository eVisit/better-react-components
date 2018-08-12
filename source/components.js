import { utils as U }         from 'evisit-js-utils';
import PropTypes              from 'prop-types';
import { findDOMNode }        from 'react-dom';
import { InteractionManager } from 'react-native';
import React, { Component }   from 'react';
import { getErrorMessage }    from '@api';
import Base, {
  MOUNT_STATE,
  SharedState,
  cloneComponents,
  connectToStore,
  disconnectFromStore,
  getStyleSheetFromFactory,
  resolveStateWithStore,
  areObjectsEqualShallow
}                             from './base';
import Theme                  from './theme';
import {
  isDesktop,
  triggerAnalyticsEvent,
  triggerFieldChangeAnalyticsEvents
}                             from './utils';

const defineROProperty = U.defineROProperty,
      defineRWProperty = U.defineRWProperty,
      registeredComponents = [],
      skipProxyMethods = /^(componentWillMount|componentDidMount|componentWillUnmount|componentWillReceiveProps|shouldComponentUpdate|componentWillUpdate|render|componentDidUpdate|componentDidCatch|constructor|construct|getChildContext|getMountState|measure)$/;

var componentIDCounter = 1,
    globalComponentReferences = {},
    referenceHooks = {},
    totalRenderCount = 0;

if (__DEV__) {
  global._eVisitComponentAddressMap = globalComponentReferences;
  global._eVisitGetRenderCount = () => totalRenderCount;
}

function getComponentByID(uid) {
  return globalComponentReferences[uid];
}

function getAddressedComponents() {
  return globalComponentReferences;
}

function getComponentByHintID(hintID) {
  var components = getAddressedComponents(),
      keys = Object.keys(components);

  for (var i = 0, il = keys.length; i < il; i++) {
    var key = keys[i],
        component = components[key],
        componentProps = component.props;

    if (!componentProps.eventID && !componentProps.hintID)
      continue;

    if (componentProps.hintID === hintID || componentProps.eventID === hintID)
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

class GenericReactComponentBase extends Component {
  static contextTypes = {
    eVisitApp: PropTypes.any,
    store: PropTypes.any,
    theme: PropTypes.any,
    navigationService: PropTypes.any,
    navigator: PropTypes.any
  };

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

    defineROProperty(this, '_domOrder', domOrder);
    defineROProperty(this, '_componentInstanceClass', InstanceClass);
    defineROProperty(this, '_state', sharedState);
    defineRWProperty(this, '_mountState', 0x0);
    defineROProperty(this, 'refs', undefined, () => sharedState._refs, (val) => {});
    defineRWProperty(this, '_propsModificationCounter', 0);
    defineRWProperty(this, '_componentID', props.id || null);
    defineRWProperty(this, '_frozenStateUpdates', []);

    defineROProperty(this, '_eVisitLayout', undefined, () => this._componentInstance._eVisitLayout, () => {});

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

    // Update state with instance resolveState
    var store = this._componentInstance.store || this.context.store,
        instance = this._componentInstance,
        resolveState = instance.resolveState.bind(instance);

    Object.assign(this.state, resolveStateWithStore.call(instance, resolveState, store, props));
    sharedState.setCurrentState(this.state);

    // Only hook the top-level component to the store
    if (domOrder === 1)
      connectToStore.call(instance, resolveState);
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

    if (!this._componentID)
      this._componentID = `Component/${componentIDCounter++}`;

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

    this._componentID = null;

    return ret;
  }

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

class GenericComponentBase {
  constructor(reactInstance) {
    defineRWProperty(this, '_stateModificationCounter', 0);
    defineRWProperty(this, '_propsModificationCounter', 0);

    defineROProperty(this, '_reactInstance', reactInstance);

    defineRWProperty(this, 'props', undefined, this.getFormattedComponentProps.bind(this), () => {});

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

    defineROProperty(this, 'isMobilePlatform', undefined, () => {
      if (this.props.isMobilePlatform === false)
        return false;

      if (this.props.isMobilePlatform === true)
        return true;

      return !isDesktop();
    });

    // Setup the styleSheet getter to build style-sheets when requested
    this.defineStyleSheetProperty('styleSheet', this.constructor.styleSheet);

    this.construct();
  }

  getFormattedComponentProps() {
    var reactProps = this._reactInstance.props,
        formattedProps = {},
        keys = Object.keys(reactProps);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value = reactProps[key];

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

  setFormReference = (elem) => {
    this.setReference('form', elem);
  }

  getComponentByID(uid) {
    return getComponentByID(uid);
  }

  getAddressedComponents() {
    return getAddressedComponents();
  }

  getComponentByHintID(hintID) {
    return getComponentByHintID(hintID);
  }

  inheritsFrom(name) {
    function walkConstructors(constructor) {
      if (constructor.displayName === name)
        return true;

      if (constructor._parentClass)
        return walkConstructors(constructor._parentClass);

      if (constructor._parentComponent)
        return walkConstructors(constructor._parentComponent);

      return false;
    }

    return walkConstructors(this.constructor);
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

  measure() {
    var screenDimensions = global._eVisitScreenDimensions || { width: 0, height: 0 };

    //###if(RN) {###//
    return new Promise((resolve) => {
      this._reactInstance.measure.call(this._reactInstance, (x, y, width, height, pageX, pageY) => {
        resolve({
          x,
          y,
          top: y,
          left: x,
          right: x + width,
          bottom: y + height,
          width,
          height,
          pageX,
          pageY,
          screenWidth: screenDimensions.width,
          screenHeight: screenDimensions.height
        });
      });
    });

    //###} else {###//
    var element = findDOMNode(this._reactInstance);
    if (!element)
      return Promise.resolve(null);

    var rect = element.getBoundingClientRect();
    return Promise.resolve({
      x: rect.x,
      y: rect.y,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      pageX: rect.x,
      pageY: rect.y,
      screenWidth: screenDimensions.width,
      screenHeight: screenDimensions.height
    });
    //###}###//

  }

  getAnimationDuration(_val) {
    var set = parseInt(('' + _val).replace(/[^\d.-]/g, ''), 10);
    if (isNaN(set) || !isFinite(set))
      set = this.styleProp('DEFAULT_ANIMATION_DURATION');

    return (__DEV__ && global._defaultAnimationDurationOverride != null) ? global._defaultAnimationDurationOverride : set;
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
  resolveState(resolve) {
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

  themeName(...args) {
    return this.styleSheet.themeName(...args);
  }

  themeGroup(...args) {
    return this.styleSheet.themeGroup(...args);
  }

  generateThemeStyleHelpers() {
    var baseStyles = this.styleSheet.getThemeBaseStyles();
    for (var i = 0, il = baseStyles.length; i < il; i++) {
      var baseName = baseStyles[i];

      //Generate helper function for theme style
      ((styleName) => {
        var helperName = 'get' + (baseName.charAt(0).toUpperCase() + baseName.substring(1)) + 'Style';
        //console.log('Generating helper name: ', helperName);
        this[helperName] = () => {
          var themeProps = this.styleSheet.getThemeProps(),
              args = new Array(themeProps.length + 1);

          args[args.length - 1] = styleName;

          //Get arguments based on component "props" and theme props "names"
          for (var j = 0, jl = themeProps.length; j < jl; j++) {
            var themeProp = themeProps[j];
            args[j] = this.props[themeProp.name];
          }

          //Return theme group
          return this.style(this.styleSheet.themeGroup(...args), this.props[styleName + 'Style']);
        };
      })(baseName);
    }
  }

  style(...args) {
    // Get any style overrides from the parent page... if any
    // This is used when a page is built inside a modal
    var page = this.getParentPage(),
        helperFunc;

    if (page && page.getStyleOverride instanceof Function)
      helperFunc = page.getStyleOverride.bind(page, this);

    return this.styleSheet.styleWithHelper(helperFunc, ...args);
  }

  styleProp(...args) {
    var styleSheet = this.styleSheet;
    return styleSheet.styleProp(...args);
  }

  rootContainerStyle(...args) {
    return this.style(...args);
  }

  getApp() {
    return this.context.eVisitApp;
  }

  getAPI(cb) {
    var app = this.getApp();
    if (!app)
      return;

    return app.getAPI(cb);
  }

  getStore(cb) {
    var app = this.getApp();
    if (!app)
      return;

    return app.getStore(cb);
  }

  getNavigationService(cb) {
    var app = this.getApp();
    if (!app)
      return;

    return app.getNavigationService(cb);
  }

  getNavigator(cb) {
    var navigator = this.context.navigator;

    if (cb instanceof Function && navigator)
      return cb.call(navigator);

    return navigator;
  }

  getDeveloperSessionProp(key, defaultValue) {
    var app = this.getApp();
    if (!app)
      return defaultValue;

    return app.getDeveloperSessionProp(key, defaultValue);
  }

  getCurrentScene() {
    var nav = this.getNavigator();
    if (!nav)
      return;

    return nav.currentScene;
  }

  getTheme(cb) {
    var theme = this.context.theme;
    if (!theme)
      theme = new Theme.Theme({ isMobilePlatform: this.isMobilePlatform });

    if (cb instanceof Function && theme)
      return cb.call(theme, theme, theme.getThemeProperties());

    return theme;
  }

  getConfigManager(cb) {
    var app = this.getApp();
    if (!app)
      return;

    return app.getConfigManager(cb);
  }

  getCurrentlyFocussedField() {
    var app = this.getApp();
    if (!app)
      return null;

    return app._currentlyFocussedField;
  }

  setCurrentlyFocussedField(field) {
    var app = this.getApp();
    if (!app)
      return null;

    app._currentlyFocussedField = field;
  }

  getParentPage(cb) {
    var page = this.context.page;

    if (cb instanceof Function && page)
      cb.call(page, page);

    return page;
  }

  getLayoutContext(contexts) {
    if (!contexts)
      return contexts;

    // Fill up the contexts object
    if (U.instanceOf(contexts, 'string', 'number', 'boolean'))
      return ('' + contexts);

    var platform = (this.isMobilePlatform) ? 'mobile' : 'browser';
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
        classNamesPrefix = 'eVisitApp',
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

      // If class name begins with "eVisitApp" then return the raw class name
      if (elem.length >= classNamesPrefix.length && elem.substring(0, classNamesPrefix.length) === classNamesPrefix)
        return elem;

      // Otherwise, prefix "eVisitApp" onto every class name
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

  closeAllModals() {
    var app = this.getApp();
    if (app)
      app.closeAllModals();
  }

  async doNavigation(type, navigationData) {
    try {
      //this.setState({ awaitingTransition: true });
      this.closeAllModals();

      var ret = await this.getNavigationService()[type](navigationData);
      return ret;
    } catch (e) {
      throw e;
    } finally {
      // setTimeout(() => {
      //   this.setState({ awaitingTransition: false });
      // }, 50);
    }
  }

  navigateBack(routeExtra) {
    return this.doNavigation('navigateBack', routeExtra);
  }

  navigateNext(routeExtra) {
    return this.doNavigation('navigateNext', routeExtra);
  }

  navigateTo(route) {
    return this.doNavigation('navigateTo', route);
  }

  showModal(modalObj) {
    var app = this.getApp();
    if (!app)
      return;

    return app.showModal(modalObj);
  }

  showToast(data) {
    var app = this.getApp();
    if (!app)
      return;

    app.pushToast(data);
  }

  clearToast() {
    var app = this.getApp();
    if (!app)
      return;

    app.popToast();
  }

  getErrorMessage(error) {
    var formattedError = getErrorMessage(error);
    console.log('An error happened!', error, formattedError);
    return formattedError;
  }

  showToastError(_message, link, overlay) {
    var message = this.getErrorMessage(_message);
    this.showToast((U.instanceOf(message, 'string')) ? { message: message, type: 'error', overlay } : { ...message, overlay });
  }

  showToastSuccess(message, link, overlay) {
    this.showToast((U.instanceOf(message, 'string')) ? { message: message, type: 'success', overlay } : { ...message, overlay });
  }

  async runAction(action, ...args) {
    var actionName = U.get(action, 'name', action),
        resolvedAction = U.get(this, actionName + 'Action'),
        awaitingAction = U.get(action, 'awaiting');

    if (!resolvedAction) {
      console.warn('Action [' + actionName + '] does not exist. Ignoring.');
      return Promise.reject();
    }

    return await new Promise((resolve, reject) => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          this.setState({ [awaitingAction]: true });
          var response = await resolvedAction.apply(this, args);
          // trigger analytics event for success
          this.triggerAnalyticsEvent({ action: 'succeeded', actionTarget: actionName, targetType: 'API' });
          resolve(response);
        } catch (e) {
          this.showToastError(getErrorMessage(e));
          //trigger analytics event for failure
          this.triggerAnalyticsEvent({ action: 'failed', actionTarget: actionName, targetType: 'API' });
          reject(e);
        } finally {
          setTimeout(() => {
            this.setState({ [awaitingAction]: false });
          }, 50);
        }
      });
    });
  }

  runDataAction(name, ...args) {
    return this.runAction({ name: name, awaiting: 'awaitingData' }, ...args);
  }

  runTransitionAction(name, ...args) {
    return this.runAction({ name: name, awaiting: 'awaitingTransition' }, ...args);
  }

  triggerAnalyticsEvent(data) {
    return triggerAnalyticsEvent(this.getNavigationService(), this.getStore(), data);
  }

  triggerFieldChangeAnalyticsEvents(oldFormData, newFormData) {
    return triggerFieldChangeAnalyticsEvents(this.getNavigationService(), this.getStore(), oldFormData, newFormData);
  }

  static componentFactoryHelper(InstanceClass, ComponentClass) {
    return ComponentClass;
  }
}

var _componentCreationHook = null;

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

    if (!(prop instanceof Function) || propName === 'constructor' || Object.prototype[propName] === prop)
      continue;

    Object.defineProperty(this, propName, {
      writable: true,
      enumerable: false,
      configurable: false,
      value: prop.bind(this)
    });
  }
};

function callComponentCreationHook(instance, ...args) {
  if (typeof _componentCreationHook === 'function')
    return _componentCreationHook.call(this, instance, ...args);

  return instance;
}

function internalReactComponentFactory(klassDisplayName, klassName, definitionFactory, _ParentComponent, factoryArgs, componentFactoryHelper) {

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

      if (skipProxyMethods.test(propName) || (Object.prototype[propName] === prop) || propName in Component.prototype)
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

  function mergePropTypes(...types) {
    function mergeType(key) {
      var finalType;
      for (var i = 0, il = allTypes.length; i < il; i++) {
        var propType = allTypes[i];
        if (!propType.hasOwnProperty(key))
          continue;

        finalType = propType[key];
      }

      return finalType;
    }

    var allTypes = types.filter((type) => !!type),
        allKeys = Object.keys(Object.assign({}, ...allTypes)),
        propTypes = {};

    const thisPropTypes = PropTypes;

    for (var i = 0, il = allKeys.length; i < il; i++) {
      var key = allKeys[i];
      propTypes[key] = mergeType(key);
    }

    return propTypes;
  }

  if (!(definitionFactory instanceof Function))
    throw new Error('reactComponentFactory expects second argument to be a function that returns a class');


  var ParentComponent = _ParentComponent,
      ParentClass = GenericComponentBase;

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
  var Klass = class GenericReactComponent extends GenericReactComponentBase {
    static contextTypes = {
      ...(U.get(ParentComponent, 'contextTypes', {})),
      ...(U.get(InstanceClass, 'contextTypes', {})),
      eVisitApp: PropTypes.any,
      store: PropTypes.any,
      theme: PropTypes.any,
      navigationService: PropTypes.any,
      navigator: PropTypes.any,
      page: PropTypes.any,
      stateUpdatesFrozen: PropTypes.bool
    };

    constructor(...args) {
      super(InstanceClass, Klass, ...args);
    }

    static propTypes = mergePropTypes(ParentClass.propTypes, InstanceClass.propTypes);
    static defaultProps = { ...(ParentClass.defaultProps || {}), ...(InstanceClass.defaultProps || {}) };
  };

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
      totalRenderCount++;

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
          allProps = {
            ...parentProps,
            ...eventMethodsToProps.call(this),
            _sharedComponentState: this._state,
            _domOrder: this._domOrder + 1,
            ParentClass: ParentClass.displayName,
            ClassName: klassDisplayName
          };

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
    Klass.childContextTypes = {
      ...(U.get(ParentComponent, 'childContextTypes', {})),
      ...(U.get(InstanceClass, 'childContextTypes', {}))
    };
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

  //###if(DEV_MODE) {###//
  if (!global.components)
    global.components = {};

  global.components[klassName] = Klass;
  //###}###//

  return Klass;
}

/*
 * reactComponentFactory expects _ParentComponent to be an array of parent info objects
 * in the form { parent: ParentComponent, args: [args, to, pass, to, factory] }.
 * If this isn't the case, it will intelligently convert and coerce as necessary.
 */
function reactComponentFactory(_klassName, definitionFactory, _ParentComponent, componentFactoryHelper) {
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

    finalComponents.push(internalReactComponentFactory(klassDisplayName, klassName, definitionFactory, thisParentComponent, args, componentFactoryHelper));
  }

  // If an array wasn't passed in, only one component will have been built, so just return it plain
  // otherwise return the array of generated components
  var generatedComponents = (_ParentComponent instanceof Array) ? finalComponents : finalComponents[0];
  return generatedComponents;
}

function debugComponentInheritance(component) {
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

function rebaseReactComponent(component, parentClassSelector) {
  function rebaseWithParent(c, _p) {
    // Get parent (if any) and walk parent tree rebasing each (if requested by the callback)
    var p = _p;
    if (p && p._parentComponent)
      p = rebaseWithParent(p, p._parentComponent);

    // Rebase parent class (if callback requests it)
    p = parentClassSelector.call(this, p.displayName, p, c.displayName, c);

    // Construct component with a new parent
    return reactComponentFactory.call(this, c.displayName, c._definer, p);
  }

  var newComponent = rebaseWithParent(component, component._parentComponent);
  return newComponent;
}

/*
 * This factory function assists in the building of complex routes / flows
 * If callback is a function it will call this function for each flow, passing
 * in all user arguments. The return value will be used as the route. If there
 * is no return value, the route will not be added to the page.
 * If callback is a normal object, it will be treated as a parent object
 * that will be merged into all flows.
 */
function routeBuilder(navigationObject, callback, ...args) {
  if (!callback)
    return navigationObject;

  var finalObj = {},
      keys = Object.keys(navigationObject);

  for (var i = 0, il = keys.length; i < il; i++) {
    var key = keys[i],
        route = navigationObject[key];

    if (callback instanceof Function)
      route = callback(key, route, ...args);
    else
      route = Object.assign({}, callback, ...[ ...args, navigationObject ]);

    if (!route)
      continue;

    finalObj[key] = route;
  }

  return finalObj;
}

module.exports = Object.assign(module.exports, Base, {
  getComponentByID,
  getAddressedComponents,
  getComponentByHintID,
  cloneComponents,
  reactComponentFactory,
  componentInheritsFrom,
  rebaseReactComponent,
  routeBuilder,
  setComponentCreationHook
});
