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

export function copyStaticMethods(source, target, filterFunc) {
  function doStaticAssign(source, target, filterFunc, rebindStaticMethod) {
    var keys = Object.getOwnPropertyNames(source);
    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];

      if (target.hasOwnProperty(key))
        continue;

      var val = source[key];
      if (typeof filterFunc === 'function' && !filterFunc(key, val, source, target))
        continue;

      if (typeof rebindStaticMethod === 'function')
        val = rebindStaticMethod(key, val, source, target);

      Object.defineProperty(target, key, {
        writable: true,
        enumerable: false,
        configurable: true,
        value: val
      });
    }
  }

  // Assign from source
  doStaticAssign(source, target, filterFunc, source.rebindStaticMethod);
}
