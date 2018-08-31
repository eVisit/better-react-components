export function bindPrototypeFuncs(obj) {
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