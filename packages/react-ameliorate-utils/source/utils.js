import React          from 'react';
import { utils as U } from 'evisit-js-utils';

//###if(!MOBILE) {###//
import { findDOMNode as reactFindDOMNode } from 'react-dom';
//###}###//

const componentReferenceMap = {};
var componentIDCounter = 1,
    draggedItems = [];

export const RAContext = React.createContext({});
export const CONTEXT_PROVIDER_KEY  = 'data-ra-provider';

export function prefixPad(_str, size = 0, char = '0') {
  var str = ('' + _str);
  if (str.length >= size)
    return str;

  return (new Array((size - str.length) + 1).join(char)) + str;
}

export function getUniqueComponentID(prefix = '') {
  return `${prefix}Component_${prefixPad('' + (componentIDCounter++), 13)}`;
}

export function getComponentReferenceMap() {
  return componentReferenceMap;
}

export function addComponentReference(instance) {
  var componentID = instance.getComponentID();
  if (!componentID)
    throw new TypeError('getComponentID returned an empty component ID');

  componentReferenceMap[componentID] = instance;
}

export function removeComponentReference(instance) {
  var componentID = instance.getComponentID();
  delete componentReferenceMap[componentID];
}

export function getComponentReference(componentID) {
  return componentReferenceMap[componentID];
}

function iteratePrototype(klass, func) {
  if (!klass)
    return;

  if (typeof func !== 'function')
    throw new TypeError('Expected callback function for iteratePrototype method');

  var proto = Object.getPrototypeOf(klass);
  if (proto)
    iteratePrototype.call(this, proto, func);
  else
    return;

  var objProto = Object.prototype,
      names = Object.getOwnPropertyNames(klass);

  for (var i = 0, il = names.length; i < il; i++) {
    var propName = names[i];
    if (propName.match(/^(constructor|caller|callee|arguments)$/) || objProto.hasOwnProperty(propName))
      continue;

    var prop = klass[propName];
    func.call(this, propName, prop);
  }
}

export function copyPrototypeFuncs(source, target, filterFunc, doBind) {
  if (!source)
    return;

  var proto = Object.getPrototypeOf(source);
  if (proto)
    copyPrototypeFuncs.call(this, proto, target, filterFunc, doBind);

  var names = Object.getOwnPropertyNames(source);
  for (var i = 0, il = names.length; i < il; i++) {
    var propName = names[i],
        prop = source[propName];

    if (typeof prop !== 'function' || propName === 'constructor' || Object.prototype[propName] === prop)
      continue;

    if (typeof filterFunc === 'function' && !filterFunc(propName, prop, source))
      continue;

    Object.defineProperty(target, propName, {
      writable: true,
      enumerable: false,
      configurable: true,
      value: (doBind) ? prop.bind(this) : prop
    });
  }
}

export function areObjectsEqualShallow(props, oldProps, checkKeyCount) {
  if (props === oldProps)
    return true;

  if (!props || !oldProps)
    return false;

  var keys = Object.keys(props),
      oldKeys = Object.keys(oldProps);

  if (checkKeyCount !== false && keys.length !== oldKeys.length)
    return false;

  for (var i = 0, il = keys.length; i < il; i++) {
    var key = keys[i];

    if (!oldProps.hasOwnProperty(key))
      return false;

    if (props[key] !== oldProps[key])
      return false;
  }

  return true;
}

export function capitalize(name) {
  if (!name)
    return name;

  return [('' + name).charAt(0).toUpperCase(), name.substring(1)].join('');
}

export function copyStaticProperties(source, target, filterFunc, rebindStaticMethod) {
  var keys = Object.getOwnPropertyNames(source);
  for (var i = 0, il = keys.length; i < il; i++) {
    var key = keys[i];
    if (key === 'arguments' || key === 'callee' || key === 'caller')
      continue;

    if (key === 'prototype' || key === 'constructor' && Object.prototype.hasOwnProperty(key))
      continue;

    if (target.hasOwnProperty(key))
      continue;

    var val = source[key];
    if (typeof filterFunc === 'function' && !filterFunc(key, val, source, target))
      continue;

    if (typeof val === 'function' && typeof rebindStaticMethod === 'function')
      val = rebindStaticMethod(key, val, source, target);

    Object.defineProperty(target, key, {
      writable: true,
      enumerable: false,
      configurable: true,
      value: val
    });
  }
}

export function cloneComponents(children, propsHelper, cloneHelper, recurseHelper, _parent, _context, _depth) {
  const cloneChild = (child, index) => {
    const shouldRecurse = () => {
      var thisShouldRecurse = recurseHelper;
      if (typeof thisShouldRecurse === 'function')
        thisShouldRecurse = recurseHelper.call(this, { child, childProps, index, parent, context, depth });

      return thisShouldRecurse;
    };

    if (child === false || child === true || child == null)
      return child;

    var clonedChild = child,
        getThisParent = () => clonedChild;

    if (React.isValidElement(child)) {
      var childProps = (child && child.props);

      if (!childProps)
        childProps = {};

      if (typeof propsHelper === 'function')
        childProps = propsHelper.call(this, { child, childProps, index, parent, context, depth });

      if (childProps.children && shouldRecurse())
        childProps.children = cloneComponents.call(this, childProps.children, propsHelper, cloneHelper, recurseHelper, getThisParent, context, depth + 1);

      var thisChildren = (childProps.children instanceof Array) ? childProps.children : [childProps.children];
      clonedChild = (typeof cloneHelper === 'function') ? cloneHelper.call(this, { child, childProps, index, parent, context, depth, validElement: true, defaultCloneElement: React.cloneElement }) : React.cloneElement(child, childProps, ...thisChildren);

      return clonedChild;
    } else if (child instanceof Array && shouldRecurse()) {
      return cloneComponents.call(this, child, propsHelper, cloneHelper, recurseHelper, getThisParent, context, depth + 1);
    }

    clonedChild = (typeof cloneHelper === 'function') ? cloneHelper.call(this, { child, childProps: null, index, parent: getThisParent, context, depth, validElement: false, defaultCloneElement: React.cloneElement }) : child;
    return clonedChild;
  };

  var depth = _depth || 0,
      context = _context || {},
      parent = _parent || (() => null);

  if (!(children instanceof Array))
    return cloneChild(children, 0);

  return children.map(cloneChild);
}

export function filterObjectKeys(filter, ...args) {
  var newProps = {},
      filterIsRE = (filter instanceof RegExp),
      filterIsFunc = (typeof filter === 'function'),
      tempObj = Object.assign({}, ...(args.filter(Boolean)));

  var keys = Object.keys(tempObj);
  for (var j = 0, jl = keys.length; j < jl; j++) {
    var key = keys[j],
        value = tempObj[key];

    if (filterIsRE) {
      filter.lastIndex = 0;
      if (filter.test(key))
        continue;
    } else if (filterIsFunc) {
      if (!filter(key, value))
        continue;
    }

    newProps[key] = value;
  }

  return newProps;
}

const acceptableElementProps = [
  'className',
  'style',
  'ref',
  'children',
  'draggable'
];

export function filterToNativeElementProps(props, elementType) {
  const isEventSupported = (eventName) => {
    /* Some of this code borrowed from Facebook's react-dom package */

    if (eventName in document)
      return true;

    var specialEvents = [
      'onchange',
      'onreset',
      'onload',
      'onerror',
      'onselect'
    ];

    if (specialEvents.indexOf(eventName) >= 0)
      return true;

    var element = document.createElement(elementType || 'div');
    element.setAttribute(eventName, 'return;');
    return (typeof element[eventName] === 'function');
  };

  return filterObjectKeys((key, value) => {
    // Whitelist
    if (acceptableElementProps.indexOf(key) >= 0)
      return (value !== null);

    // Blacklist
    if ((/^on(Press|Layout$|dangerouslySetInnerHTML$)/).test(key))
      return false;

    // Events
    if ((/^on[A-Z]/).test(key))
      return isEventSupported(key.toLowerCase());

    // var allowed = (/^[^A-Z]+$/g).test(key);
    // if (allowed)
    //   console.log('ALLOWING PROP: ', key);

    // return allowed;
    return (/^(data-|aria-)/).test(key);
  }, props);
}

export function removeDuplicateStrings(thisArray) {
  if (!thisArray || !thisArray.length)
    return thisArray;

  var keys = {},
      finalArray = [];

  for (var i = 0, il = thisArray.length; i < il; i++) {
    var item = thisArray[i];
    if (item == null)
      continue;

    item = ('' + item);
    if (keys.hasOwnProperty(item))
      continue;

    keys[item] = true;
    finalArray.push(item);
  }

  return finalArray;
}

export function removeEmpty(array) {
  return (array || []).filter((item) => !U.noe(item));
}

function getElementLayoutContext({ parent, child, childProps, context }) {
  var getLayoutContextName = (typeof this._getLayoutContextName === 'function') ? this._getLayoutContextName : (layoutContext) => layoutContext;
  return (this._filterProps || filterObjectKeys).call(this, (key, _value) => {
    var value = _value;
    if (key === 'layoutContext') {
      value = getLayoutContextName.call(this, value);
      if (!value)
        return false;

      var layout = context.layout;
      if (!layout)
        layout = context.layout = {};

      var namedLayout = layout[value];
      if (!namedLayout)
        namedLayout = layout[value] = [];

      // WIP: Add to layouts for layout engine
      // needs to be able to fetch a layout
      // and remove a fetched layout
      Object.defineProperty(child, 'removeFromCurrentLayout', {
        writable: true,
        enumerable: false,
        configurable: true,
        value: () => {
          var thisParent = parent(),
              props = (thisParent && thisParent.props);

          if (props.children instanceof Array) {
            var index = props.children.indexOf(child);
            if (index >= 0)
              props.children.splice(index, 1);
          } else if (props.children === child) {
            props.children = null;
          }

          return child;
        }
      });

      namedLayout.push(child);
    }

    return true;
  }, childProps);
}

export function postRenderProcessChildProps({ childProps }) {
  return childProps;
}

export function postRenderProcessChild(args) {
  var { child, childProps, validElement, defaultCloneElement } = args;
  if (!validElement)
    return child;

  if (!child)
    return child;

  var thisChildren = (childProps.children instanceof Array) ? childProps.children : [childProps.children],
      clonedChild = defaultCloneElement.call(this, child, childProps, ...thisChildren);

  getElementLayoutContext.call(this, Object.assign({}, args, { child: clonedChild }));

  return clonedChild;
}

export function postRenderShouldProcessChildren({ child }) {
  if (child instanceof Array)
    return true;

  if (!child || !child.props)
    return false;

  return true;
}

export function processElements({ elements, onProps, onProcess, onShouldProcess }) {
  var contexts = {};

  if (elements == null || elements === false)
    return { contexts, elements: null };

  if (typeof onProps !== 'function')
    onProps = () => {};

  var newChildren = cloneComponents.call(this, elements, onProps, onProcess, onShouldProcess, undefined, contexts);
  return { contexts, elements: newChildren };
}

export function processRenderedElements(elements, _opts) {
  var opts = _opts,
      defaultOpts = {
        elements,
        onProps: this._postRenderProcessChildProps || postRenderProcessChildProps,
        onProcess: this._postRenderProcessChild || postRenderProcessChild,
        onShouldProcess: this._postRenderShouldProcessChildren || postRenderShouldProcessChildren
      };

  if (opts === true)
    opts = { onShouldProcess: true, onProcess: null };

  return (this._processElements || processElements).call(this, (opts) ? Object.assign(defaultOpts, opts) : defaultOpts);
}

export function isValidComponent(value, ComponentBase) {
  if (!value)
    return false;

  if (value._raAmeliorateComponent)
    return true;

  if (value instanceof React.Component || value instanceof React.PureComponent || value instanceof ComponentBase)
    return true;

  if (typeof value === 'function')
    return true;

  if (value.hasOwnProperty('$$typeof'))
    return true;

  if (typeof value.render === 'function')
    return true;

  return false;
}

export function getPrototypeKeys(klass, filterFunc) {
  var keys = [];

  iteratePrototype.call(this, klass.prototype, (propName, prop) => {
    if (typeof filterFunc === 'function' && filterFunc(propName, prop))
      keys.push(propName);
  });

  return keys;
}

export function findDOMNode(elem) {
  if (!elem)
    return elem;

  //###if(MOBILE) {###//
  return elem;
  //###} else {###//
  return reactFindDOMNode(elem);
  //###}###//
}

export function nextTick(callback) {
  if (typeof process !== 'undefined' && process.nextTick) {
    return new Promise((resolve) => {
      process.nextTick(() => {
        callback();
        resolve();
      });
    });
  } else {
    return Promise.resolve().then(callback);
  }
}

export function toNumber(value, defaultValue) {
  if ((typeof value === 'number' || (value instanceof Number))) {
    if (isFinite(value))
      return value.valueOf();
    else
      return defaultValue;
  }

  var number = parseFloat(('' + value).replace(/[^\d.-]/g, ''));
  if (isNaN(number) || !isFinite(number))
    return defaultValue || 0;

  return number;
}

export function sendOnLayoutEvent(onLayout, elem) {
  if (typeof onLayout !== 'function' || !elem)
    return;

  var cachedRect = this._cachedLayout || {},
      rect = elem.getBoundingClientRect();

  if (rect.width === cachedRect.width &&
      rect.height === cachedRect.height &&
      rect.top === cachedRect.top &&
      rect.bottom === cachedRect.bottom &&
      rect.left === cachedRect.left &&
      rect.right === cachedRect.right)
    return;

  rect.elem = elem;
  this._cachedLayout = rect;

  requestAnimationFrame(() => {
    onLayout({
      nativeEvent: {
        layout: rect
      }
    });
  });
}

export function isElementOrDescendant(elem, target) {
  if (!elem || !target)
    return false;

  if (elem === target)
    return true;

  return elem.contains(target);
}

export function isDescendantElement(elem, target) {
  if (!elem || !target)
    return false;

  if (elem === target)
    return false;

  return elem.contains(target);
}

export function preventEventDefault(event) {
  if (event && typeof event.preventDefault === 'function')
    return event.preventDefault();

  if (event && event.nativeEvent && typeof event.nativeEvent.preventDefault === 'function')
    return event.nativeEvent.preventDefault();
}

export function stopEventPropagation(event) {
  if (event && typeof event.stopPropagation === 'function')
    return event.stopPropagation();

  if (event && event.nativeEvent && typeof event.nativeEvent.stopPropagation === 'function')
    return event.nativeEvent.stopPropagation();
}

export function stopEventImmediatePropagation(event) {
  if (event && typeof event.stopImmediatePropagation === 'function')
    return event.stopImmediatePropagation();

  if (event && event.nativeEvent && typeof event.nativeEvent.stopImmediatePropagation === 'function')
    return event.nativeEvent.stopImmediatePropagation();
}

//###if(!MOBILE) {###//
function insertStyleSheet(id, content) {
  var styleElement = document.querySelector(`head > style#${id}`);
  if (styleElement) {
    styleElement.innerHTML = content;
    return;
  }

  styleElement = document.createElement('style');
  styleElement.setAttribute('id', id);
  document.head.appendChild(styleElement);

  styleElement.innerHTML = content;
}
//###} else {###//
function insertStyleSheet() {}
//###}###//

export function getLargestFlag(flags) {
  var keys = Object.keys(flags || {}),
      largest = 0;

  for (var i = 0, il = keys.length; i < il; i++) {
    var key = keys[i],
        value = flags[key];

    if (value > largest)
      largest = value;
  }

  return largest;
}

export function getDraggedItems() {
  return draggedItems;
}

export function setDraggedItems(_items) {
  var items = (_items instanceof Array) ? _items : [_items];
  draggedItems = items.filter((item) => item);
  return draggedItems;
}

export function isPromise(obj) {
  return (obj && ((obj instanceof Promise) || typeof obj.then === 'function'));
}

export function calculateObjectDifferences(_obj1, _obj2, filter, maxDepth, _currentDepth) {
  const isPrimative = (obj) => {
    if (obj == null)
      return true;

    var type = typeof obj;
    if (['string', 'number', 'boolean'].indexOf(type) >= 0)
      return true;

    return false;
  };

  const convertToPrimative = (obj) => {
    if (obj instanceof String || obj instanceof Number || obj instanceof Boolean)
      return obj.valueOf();

    return obj;
  };

  var currentDepth = _currentDepth || 0,
      obj1 = convertToPrimative(_obj1),
      obj2 = convertToPrimative(_obj2);

  if (obj1 === obj2)
    return;

  if (!obj1 || !obj2)
    return [ obj1, obj2 ];

  if (isPrimative(obj1) || isPrimative(obj2))
    return (obj1 !== obj2) ? [ obj1, obj2 ] : undefined;

  if (obj1.constructor !== obj2.constructor)
    return [ obj1, obj2 ];

  if (maxDepth != null && currentDepth >= maxDepth)
    return (obj1 !== obj2) ? [ obj1, obj2 ] : undefined;

  var allKeys = Object.keys([].concat(Object.keys(obj1), Object.keys(obj2)).reduce((obj, keyName) => {
        obj[keyName] = true;
        return obj;
      }, {})),
      isArray = (obj1 instanceof Array),
      diffObj = (isArray) ? new Array(allKeys.length) : {},
      isDiff = false,
      filterIsRE = (filter instanceof RegExp),
      filterIsFunc = (typeof filter === 'function'),
      matchesFilter = (key) => {
        if (filterIsRE) {
          filter.lastIndex = 0;
          if (!filter.test(key))
            return false;
        } else if (filterIsFunc) {
          if (!filter(key))
            return false;
        }

        return true;
      };

  for (var i = 0, il = allKeys.length; i < il; i++) {
    if (isArray)
      diffObj[i] = undefined;

    var key = allKeys[i],
        prop1 = obj1[key],
        prop2 = obj2[key];

    if (prop1 !== prop2) {
      if (!isPrimative(prop1) && !isPrimative(prop2)) {
        var ret = calculateObjectDifferences(prop1, prop2, filter, maxDepth, currentDepth + 1);
        if (ret !== undefined && matchesFilter(key)) {
          isDiff = true;
          diffObj[key] = ret;
        }
      } else if (matchesFilter(key)) {
        isDiff = true;
        diffObj[key] = [ prop1, prop2 ];
      }
    }
  }

  return (isDiff) ? diffObj : undefined;
}

export function compileLanguageTerm(args) {
  var term = args.term;
  return (typeof term === 'function') ? term.call(this, args) : term;
}

export {
  insertStyleSheet
};
