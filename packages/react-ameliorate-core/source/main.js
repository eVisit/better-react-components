import {
  CONTEXT_PROVIDER_KEY,
  RAContext,
  copyStaticProperties,
  copyPrototypeFuncs,
  areObjectsEqualShallow,
  getPrototypeKeys,
  isValidComponent,
  calculateObjectDifferences
}                                 from '@react-ameliorate/utils';

import PropTypes                  from '@react-ameliorate/prop-types';

import React                      from 'react';
import ComponentBase              from './component-base';
import ReactComponentBase         from './react-component-base';

export {
  StyleSheetBuilder,
  PLATFORM,
  Color,
  buildPalette,
  ColorConstants,
  Theme,
  ThemeProperties
}                                 from '@react-ameliorate/styles';


// This needs to be smarter and needs to stack classes intelligently so that super properly works
function mixinClasses(args) {
  for (var i = 0, il = args.length; i < il; i++) {
    var arg = args[i];
    if (typeof arg !== 'function')
      continue;

    copyPrototypeFuncs(arg.prototype, this, (propName, prop, source) => {
      return !source.hasOwnProperty('isReactComponent');
    }, false);
  }
}

function propCallbackNameToMethodMap(methodNames) {
  if (!methodNames || !methodNames.length)
    return null;

  return methodNames.map((name) => {
    return {
      name: name.replace(/^(onPropUpdated_|onStateUpdated_)/, ''),
      methodName: name
    };
  });
}

export function componentFactory(_name, definer, _options) {
  function getComponentClass(component) {
    if (!component)
      return ComponentBase;

    if (component && component._raComponentClass)
      return component._raComponentClass;

    return component;
  }

  function getReactComponentClass(component) {
    if (!component)
      return ReactComponentBase;

    if (component && component._raBaseReactComponentClass)
      return component._raBaseReactComponentClass;

    return component;
  }

  function mergePropTypes(..._types) {
    var types = [].concat(...(_types.filter(Boolean)));
    return PropTypes.mergeTypes(...types);
  }

  function mergeResolvableProps(..._props) {
    var props = _props.filter(Boolean);
    return Object.keys(([].concat(...props)).reduce((obj, value) => {
      obj[value] = true;
      return obj;
    }, {}));
  }

  function getPropTypesFromResolvableProps(resolvableProps) {
    return resolvableProps.reduce((obj, value) => {
      obj[value] = PropTypes.func;
      return obj;
    }, {});
  }

  function wrapReactComponentWithContextProviders(ReactComponentClass) {
    // Wrap the component in the context so it can receive the context properly
    var parentReactComponent = ReactComponentClass;
    ReactComponentClass = (function(ReactComponentClass) {
      const ComponentClassContextType = ComponentClass.contextType;

      return React.forwardRef((props, ref) => {
        const renderComponent = (contextsProps) => {
          var finalProps = Object.assign({}, props, contextsProps);
          return (<ReactComponentClass ref={ref} {...finalProps}/>);
        };

        const renderWithContexts = (index, contextCount, contextsProps) => {
          if (index >= contexts.length)
            return renderComponent(contextsProps);

          var thisContext = contexts[index],
              thisConsumer = (thisContext && thisContext.Consumer);

          if (!thisConsumer)
            return renderWithContexts(index + 1, contextCount + 1, contextsProps);

          return (React.createElement(thisConsumer, {}, (context) => {
            contextsProps[`${CONTEXT_PROVIDER_KEY}-${contextCount}`] = context;
            return renderWithContexts(index + 1, contextCount + 1, contextsProps);
          }));
        };

        var contexts = [RAContext];
        if (ComponentClassContextType)
          contexts.push(ComponentClassContextType);

        return renderWithContexts(0, 0, {});
      });
    })(ReactComponentClass);

    Object.defineProperties(ReactComponentClass, Object.assign({}, commonStaticProps, {
      '_raReactComponentClass': {
        writable: false,
        enumerable: false,
        configurable: false,
        value: ReactComponentClass
      }
    }));

    copyStaticProperties(parentReactComponent, ReactComponentClass);

    return ReactComponentClass;
  }

  var name = (_name && _name.name) ? _name.name : _name,
      displayName = (_name && _name.displayName) ? _name.displayName : _name;

  if (!name)
    throw new TypeError('"name" is required to create a component');

  if (typeof definer !== 'function')
    throw new TypeError('"definer" callback is required to create a component');

  var options = (ComponentBase.isValidComponent(_options)) ? { parent: _options } : (_options || {}),
      ReactBaseComponent = getReactComponentClass(options.reactComponentBaseClass),
      Parent = getComponentClass(options.parent || ComponentBase),
      mixins = ([].concat(Parent._raMixins, options.mixins)).filter((mixin) => mixin);

  if (mixins && mixins.length) {
    const MixinParent = class InterstitialMixinClass extends Parent {};
    copyStaticProperties(Parent, MixinParent);
    mixinClasses.call(MixinParent.prototype, mixins);
    Parent = MixinParent;
  }

  if (typeof Parent !== 'function')
    debugger;

  var ComponentClass = definer(Object.assign({}, options, { Parent, componentName: displayName, componentInternalName: name }));

  if (typeof ComponentClass !== 'function')
    throw new TypeError('"definer" callback must return a class or a function');

  class ReactComponentClass extends ReactBaseComponent {
    constructor(...args) {
      super(ComponentClass, ...args);
    }
  }

  // update keys are calculated from the class prototype
  // update keys are used later when the props/state are updated to call the
  // corresponding methods... calculating this up-front is more performant than
  // iterating every key in the props/state and do a method check on every update
  var onPropUpdateKeys = propCallbackNameToMethodMap(getPrototypeKeys(ComponentClass, (key) => key.match(/^onPropUpdated_/))),
      onStateUpdateKeys = propCallbackNameToMethodMap(getPrototypeKeys(ComponentClass, (key) => key.match(/^onStateUpdated_/)));

  var parentComponent = Parent,
      parentReactComponent = getReactComponentClass(Parent);

  var resolvableProps = mergeResolvableProps(parentComponent.resolvableProps, ComponentClass.resolvableProps),
      propTypes = mergePropTypes(parentComponent.propTypes, ComponentClass.propTypes, getPropTypesFromResolvableProps(resolvableProps)),
      defaultProps = Object.assign({}, (parentComponent.defaultProps || {}), (ComponentClass.defaultProps || {}));

  copyStaticProperties(parentComponent, ComponentClass, null, parentComponent._rebindStaticMethod);
  copyStaticProperties(ComponentClass, ReactComponentClass, (name) => {
    return (name !== 'propTypes' && name !== 'defaultProps' && name !== 'contextType');
  });
  copyStaticProperties(parentReactComponent, ReactComponentClass, (name) => {
    return (name !== 'contextType');
  });

  const commonStaticProps = {
    '_raAmeliorateComponent': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: true
    },
    '_raParentComponent': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: parentComponent
    },
    '_raParentReactComponent': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: parentReactComponent
    },
    '_raComponentClass': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: ComponentClass
    },
    '_raBaseReactComponentClass': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: ReactComponentClass
    },
    '_raComponentFactory': {
      writable: true,
      enumerable: false,
      configurable: false,
      value: definer
    },
    '_raInternalName': {
      writable: true,
      enumerable: false,
      configurable: false,
      value: name
    },
    'displayName': {
      writable: true,
      enumerable: false,
      configurable: false,
      value: displayName
    },
    '_raResolvableProps': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: resolvableProps
    },
    '_raMixins': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: mixins
    },
    '_raOnPropUpdateKeys': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: onPropUpdateKeys
    },
    '_raOnStateUpdateKeys': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: onStateUpdateKeys
    },
    'propTypes': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: propTypes
    },
    'defaultProps': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: defaultProps
    },
    'getComponentInternalName': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: () => name
    },
    'getComponentName': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: () => displayName
    },
    'getParentComponent': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: () => parentComponent
    },
    'getFactory': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: () => definer
    }
  };

  Object.defineProperties(ComponentClass, commonStaticProps);
  Object.defineProperties(ReactComponentClass, commonStaticProps);

  ReactComponentClass = wrapReactComponentWithContextProviders(ReactComponentClass);

  var componentFactoryHook = options.componentFactoryHook || ComponentClass._componentFactoryHook;
  if (typeof componentFactoryHook === 'function') {
    var classes = componentFactoryHook(ComponentClass, ReactComponentClass);

    if (ComponentClass !== classes.ComponentClass) {
      ComponentClass = classes.ComponentClass;
      Object.defineProperties(ComponentClass, commonStaticProps);
    }

    if (ReactComponentClass !== classes.ReactComponentClass) {
      ReactComponentClass = classes.ReactComponentClass;
      Object.defineProperties(ReactComponentClass, commonStaticProps);
    }
  }

  if (!global._components)
    global._components = {};

  global._components[name] = ReactComponentClass;

  return ReactComponentClass;
}

export function rebaseComponent(component, parentClassSelector) {
  function rebaseWithParent(component, _parent) {
    // Get parent (if any) and walk parent tree rebasing each (if requested by the callback)
    var parent = _parent,
        parentParent = (parent && parent.getParentComponent());

    if (parentParent)
      parent = rebaseWithParent(parent, parentParent);

    // Rebase parent class (if callback requests it)
    parent = parentClassSelector.call(this, parent.getComponentName(), parent, component.getComponentName(), component);

    // Construct component with a new parent
    return componentFactory({
      name: component.getComponentInternalName(),
      displayName: component.getComponentName()
    }, component.getFactory(), { parent });
  }

  var newComponent = rebaseWithParent(component, component.getParentComponent());
  return newComponent;
}

export {
  RAContext,
  ComponentBase,
  ReactComponentBase,
  copyStaticProperties,
  copyPrototypeFuncs,
  areObjectsEqualShallow,
  isValidComponent,
  PropTypes,
  calculateObjectDifferences
};
