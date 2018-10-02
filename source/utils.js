import React from 'react';

export function bindPrototypeFuncs(source, target, filterFunc) {
  if (!source)
    return;

  var proto = Object.getPrototypeOf(source);
  if (proto)
    bindPrototypeFuncs.call(this, proto, target, filterFunc);

  var names = Object.getOwnPropertyNames(source);
  for (var i = 0, il = names.length; i < il; i++) {
    var propName = names[i],
        prop = this[propName];

    if (typeof prop !== 'function' || propName === 'constructor' || Object.prototype[propName] === prop)
      continue;

    if (typeof filterFunc === 'function' && !filterFunc(propName, prop, source))
      continue;

    Object.defineProperty(target, propName, {
      writable: true,
      enumerable: false,
      configurable: false,
      value: prop.bind(this)
    });
  }
}

export function areObjectsEqualShallow(props, oldProps) {
  if (props === oldProps)
    return true;

  if (!props || !oldProps)
    return (props === oldProps);

  var keys = Object.keys(props);
  if (keys.length !== Object.keys(oldProps).length)
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

export function cloneElement(child, childProps) {
  return React.cloneElement(child, childProps, childProps.children);
}

export function cloneComponents(children, propsHelper, cloneHelper, recurseHelper, _depth) {
  const cloneChild = (child, index) => {
    if (!child)
      return child;

    var key = ('' + index),
        childProps = { key };

    if (React.isValidElement(child)) {
      childProps = Object.assign(childProps, ((child && child.props) || {}));

      var extraProps = (typeof propsHelper === 'function') ? propsHelper.call(this, { child, childProps, index, depth }) : {};
      if (extraProps)
        childProps = Object.assign(childProps, extraProps);

      if (childProps.children) {
        var shouldRecurse = recurseHelper;
        if (typeof shouldRecurse === 'function')
          shouldRecurse = recurseHelper.call(this, { child, childProps, index, depth });

        if (shouldRecurse)
          childProps.children = cloneComponents.call(this, childProps.children, propsHelper, cloneHelper, recurseHelper, depth + 1);
      }

      return (typeof cloneHelper === 'function') ? cloneHelper.call(this, { child, childProps, index, depth, validElement: true, defaultCloneElement: React.cloneElement }) : React.cloneElement(child, childProps, childProps.children);
    }

    return (typeof cloneHelper === 'function') ? cloneHelper.call(this, { child, childProps, index, depth, validElement: false, defaultCloneElement: React.cloneElement }) : child;
  };

  var depth = _depth || 0;
  if (!(children instanceof Array))
    return cloneChild(children, 0);

  return children.map(cloneChild).filter((c) => (c != null && c !== false));
}