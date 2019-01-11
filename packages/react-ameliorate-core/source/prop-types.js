/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Original source: https://github.com/facebook/prop-types
 * Heavily modified by eVisit, LLC
 */

const REACT_ELEMENT_TYPE = (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) || 0xeac7;
function isValidElement(object) {
  return (object !== null && typeof object === 'object' && object.$$typeof === REACT_ELEMENT_TYPE);
}

/* global Symbol */

function factory(isValidElement, throwOnDirectAccess) {
  const IS_DEVELOPMENT = (typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV !== 'production'),
        REACT_CREATIVE_SECRET = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED',
        ITERATOR_SYMBOL = (typeof Symbol === 'function' && Symbol.iterator),
        FAUX_ITERATOR_SYMBOL = '@@iterator', // Before Symbol spec,
        ANONYMOUS = '<<anonymous>>',
        loggedTypeFailures = {};

  var printWarning = function() {};

  if (IS_DEVELOPMENT && typeof console !== 'undefined') {
    printWarning = function(text) {
      var message = 'Warning: ' + text;
      if (typeof console !== 'undefined')
        console.error(message);

      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };
  }

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFunction = getIteratorFunction(myIterable);
   *     if (iteratorFunction) {
   *       var iterator = iteratorFunction.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFunction(maybeIterable) {
    var iteratorFunction = (maybeIterable && ((ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL]) || maybeIterable[FAUX_ITERATOR_SYMBOL]));
    if (typeof iteratorFunction === 'function')
      return iteratorFunction;
  }

  function isSymbol(propType, propValue) {
    return (propType === 'symbol' || propValue['@@toStringTag'] === 'Symbol' || (typeof Symbol === 'function' && propValue instanceof Symbol));
  }

  function getPropType(propValue) {
    if (propValue == null)
      return ('' + propValue);

    if (Array.isArray(propValue) || (propValue instanceof Array))
      return 'array';

    if (propValue instanceof RegExp)
      return 'regexp';

    if (propValue instanceof Date)
      return 'date';

    var propType = typeof ((typeof propValue.valueOf === 'function') ? propValue.valueOf() : propValue);
    if (isSymbol(propType, propValue))
      return 'symbol';

    return propType;
  }

  function getClassName(propValue) {
    if (propValue == null || !propValue.constructor || !propValue.constructor.name)
      return ANONYMOUS;

    return propValue.constructor.name;
  }

  function getPostfixForTypeWarning(value) {
    var type = getPropType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  function allElementsAreValid(typeChecker, failOnInteratorError, props, propName, componentName, location, propFullName, secret, opts) {
    var propValue = props[propName], ret;
    if (propValue == null)
      return;

    // Is this just an array?
    if (Array.isArray(propValue) || (propValue instanceof Array)) {
      for (var i = 0, il = propValue.length; i < il; i++) {
        ret = typeChecker(propValue, i, componentName, location, propFullName + ('[' + i + ']'), secret, opts);
        if (ret)
          return ret;
      }

      return;
    }

    // Is it iteratable?
    var iteratorFunction = getIteratorFunction(propValue);
    if (!iteratorFunction)
      return failOnInteratorError;

    var iterator = iteratorFunction.call(propValue),
        step,
        tuples = (iteratorFunction === propValue.entries),
        index = 0,
        valueArray = [0];

    while (!(step = iterator.next()).done) {
      var value = step.value;
      if (tuples)
        value = value[1];

      valueArray[0] = value;
      ret = typeChecker(valueArray, 0, componentName, location, propFullName + ('[' + index + ']'), secret, opts);
      if (ret)
        return ret;

      index++;
    }

    return;
  }

  function isNodeInvalid(props, propName, ...args) {
    var propValue = props[propName],
        propType = getPropType(propValue);

    switch (propType) {
      case 'number':
      case 'string':
      case 'undefined':
      case 'null':
        return false;
      case 'boolean':
        return !!propValue;
      case 'array':
        return allElementsAreValid(isNodeInvalid, true, props, propName, ...args);
      case 'object':
        if (isValidElement(propValue))
          return false;

        return allElementsAreValid(isNodeInvalid, true, props, propName, ...args);
      default:
        return true;
    }
  }

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function areSame(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return (x !== 0 || (1 / x) === (1 / y));
    } else {
      // Step 6.a: NaN == NaN
      return (x !== x && y !== y);
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message) {
    this.message = message;
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function mergeTypeContextArgs(_currentType, _newType) {
    function hasItem(value) {
      for (var i = 0, il = finalArray.length; i < il; i++) {
        var item = finalArray[i];
        if (areSame(value, item))
          return true;
      }

      return false;
    }

    var currentTypeArgs = (_currentType instanceof Array) ? _currentType : _currentType._context.args[0],
        newTypeArgs = (_newType instanceof Array) ? _newType : _newType._context.args[0],
        finalArray = [],
        allItems = currentTypeArgs.concat(newTypeArgs);

    for (var i = 0, il = allItems.length; i < il; i++) {
      var thisItem = allItems[i];
      if (hasItem(thisItem))
        continue;

      finalArray.push(thisItem);
    }

    return finalArray;
  }

  function mergeOneOfTypes(propName, currentType, newType) {
    // If they aren't both a oneOfType, then merge the current type into oneOfTypes
    if (!currentType._context || currentType._context.type !== 'oneOfType')
      return oneOfType(mergeTypeContextArgs([currentType], newType));

    // They are both oneOfTypes, so merge them
    return oneOfType(mergeTypeContextArgs(currentType, newType));
  }

  function defaultTypeMerge(propName, currentType, newType) {
    // Are types exactly the same?
    if (currentType._context && newType._context && currentType._context.type === newType._context.type && newType._context.primitive)
      return newType;

    // If the current type is a oneOfType, then just merge newType into its types
    if (currentType._context && currentType._context.type === 'oneOfType')
      return oneOfType(mergeTypeContextArgs(currentType, [newType]));

    return oneOfType([currentType, newType]);
  }

  function createValidator(type, validator, _args, _mergeHelper, _extraContextProps) {
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret, _opts) {
      var opts = _opts || {};

      if (secret !== REACT_CREATIVE_SECRET) {
        if (throwOnDirectAccess !== false) {
          var err = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );

          err.name = 'Invariant Violation';
          throw err;
        }

        if (!IS_DEVELOPMENT && opts.forceRun !== true)
          return null;

        var cacheKey = componentName + ':' + propName;
        if (manualPropTypeCallCache[cacheKey] || manualPropTypeWarningCount >= 3)
          return;

        printWarning([
          'You are manually calling a React.PropTypes validation ',
          'function for the `', propFullName, '` prop on `', componentName, '`. This is deprecated ',
          'and will throw in the standalone `prop-types` package. ',
          'You may be seeing this warning due to a third-party PropTypes ',
          'library. See https://fb.me/react-warning-dont-call-proptypes ', 'for details.'
        ].join(''));

        manualPropTypeCallCache[cacheKey] = true;
        manualPropTypeWarningCount++;
      }

      if (!IS_DEVELOPMENT && opts.forceRun !== true)
        return null;

      var fullPropName = propFullName || propName,
          propValue = props[propName];

      if (propValue == null) {
        if (isRequired)
          return new PropTypeError(['The ', location, ' `', fullPropName, '` is marked as required ', 'in `', componentName, '`, but its value is `', propValue, '`.'].join(''));
        else
          return;
      }

      var ret = validator.call(this, props, propName, componentName, location, fullPropName, secret, opts);
      return (ret === undefined) ? null : ret;
    }

    var manualPropTypeCallCache = {},
        manualPropTypeWarningCount = 0,
        args = (_args) ? _args : [],
        mergeHelper = _mergeHelper;

    if (!mergeHelper)
      mergeHelper = defaultTypeMerge;

    var context = Object.assign({ type: type, args: args, validator: validator, required: false, mergeHelper }, _extraContextProps || {}),
        contextRequired = Object.assign({}, context, { required: true });

    var checker = checkType.bind(context, false);
    checker.isRequired = checkType.bind(context, true);

    Object.defineProperty(checker, '_context', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: context
    });

    Object.defineProperty(checker.isRequired, '_context', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: contextRequired
    });

    return checker;
  }

  function createValidatorWithArguments(type, validator, argumentValidator, mergeHelper) {
    return function(..._args) {
      var args = _args;
      if (!args.length)
        throw new Error('Arguments required for PropTypes.' + type);

      if (args[args.length - 1] === REACT_CREATIVE_SECRET)
        throw new Error('Arguments required for PropTypes.' + type + ', yet PropTypes.' + type + ' was never called with any arguments');

      if (typeof argumentValidator === 'function')
        args = argumentValidator(type, args);

      return createValidator(type, validator, args, mergeHelper);
    };
  }

  function createPrimitiveTypeValidator(type, expectedType, _exptectedTypeMessage) {
    var isExpectedTypeArray = (expectedType instanceof Array),
        expectedTypeMessage = (_exptectedTypeMessage) ? _exptectedTypeMessage : expectedType;

    return createValidator(type, function(props, propName, componentName, location, propFullName, secret, _opts) {
      var opts = _opts || {};
      if (opts.alwaysPass && opts.alwaysPass.indexOf(expectedType))
        return;

      var propValue = props[propName],
          propType = getPropType(propValue);

      if (isExpectedTypeArray && expectedType.indexOf(propType) >= 0)
        return;
      else if (propType === expectedType)
        return;

      return new PropTypeError(['Invalid ', location, ' `', propFullName, '` of type ', '`', propType, '` supplied to `', componentName, '`, expected ', '`', expectedTypeMessage, '`.'].join(''));
    }, undefined, undefined, { primitive: true });
  }

  function shapeArgumentChecker(type, args) {
    var propType = getPropType(args[0]);
    if (propType !== 'object') {
      printWarning([
        'Invalid argument supplied to ' + type + '. Expected an object of check functions, but ',
        'received ', getPostfixForTypeWarning(args[0]), ' instead.'
      ].join(''));
    }

    return args;
  }

  function shapeMerger(propName, currentType, newType) {
    if (!currentType._context || (currentType._context.type !== 'exact' && currentType._context.type !== 'shape'))
      return defaultTypeMerge(propName, currentType, newType);

    return shape(mergeTypes(currentType._context.args[0], newType._context.args[0]));
  }

  const any = createValidator('any', () => undefined, undefined, undefined, { primitive: true }),
        bool = createPrimitiveTypeValidator('bool', 'boolean'),
        number = createPrimitiveTypeValidator('number', 'number'),
        string = createPrimitiveTypeValidator('string', 'string'),
        symbol = createPrimitiveTypeValidator('symbol', 'symbol'),
        func = createPrimitiveTypeValidator('func', 'function'),
        array = createPrimitiveTypeValidator('array', 'array'),
        object = createPrimitiveTypeValidator('object', ['object', 'date', 'regexp', 'array'], 'object'),
        node = createValidator('node', function(props, propName, componentName, location, propFullName) {
          if (isNodeInvalid(props, propName, componentName, location, propFullName))
            return new PropTypeError(['Invalid ', location, ' `', propFullName, '` supplied to ', '`', componentName, '`, expected a ReactNode.'].join(''));
        }),
        element = createValidator('element', function(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          if (isValidElement(propValue))
            return;

          var propType = getPropType(propValue);
          return new PropTypeError(['Invalid ', location, ' `', propFullName, '` of type ', '`', propType, '` supplied to `', componentName, '`, expected a single ReactElement.'].join(''));
        }),
        instanceOf = createValidatorWithArguments('instanceOf', function(props, propName, componentName, location, propFullName) {
          var propValue = props[propName],
              instanceType = this.args[0];

          if (propValue !== null && (propValue instanceof instanceType))
            return;

          return new PropTypeError(['Invalid ', location, ' `', propFullName, '` of type ', '`', getClassName(propValue), '` supplied to `', componentName, '`, expected instance of `', (instanceType.displayName || instanceType.name), '`.'].join(''));
        }),
        oneOf = createValidatorWithArguments('oneOf', function(props, propName, componentName, location, propFullName) {
          var values = (this.args[0] || []);
          if (!values || !values.length)
            return;

          var propValue = props[propName];
          for (var i = 0, il = values.length; i < il; i++) {
            var value = values[i];
            if (areSame(value, propValue))
              return;
          }

          return new PropTypeError(['Invalid ', location, ' `', propFullName, '` of value ', '`', propValue, '` supplied to `', componentName, '`, expected one of ', JSON.stringify(values), '.'].join(''));
        }, (type, args) => {
          if (!(args[0] instanceof Array) && !Array.isArray(args[0])) {
            printWarning('Invalid argument supplied to oneOf, expected an instance of array.');
            return [];
          }

          return args;
        }, (propName, currentType, newType) => {
          if (!currentType._context || currentType._context.type !== 'oneOf')
            return defaultTypeMerge(propName, currentType, newType);

          return oneOf(mergeTypeContextArgs(currentType, newType));
        }),
        oneOfType = createValidatorWithArguments('oneOfType', function(props, propName, componentName, location, propFullName, secret, _opts) {
          var opts = _opts || {},
              checkers = this.args[0];

          if (!checkers || !checkers.length)
            return;

          for (var i = 0, il = checkers.length; i < il; i++) {
            var checker = checkers[i];
            if (checker(props, propName, componentName, location, propFullName, secret, opts) == null)
              return;
          }

          return new PropTypeError(['Invalid ', location, ' `', propFullName, '` supplied to ', '`', componentName, '`.'].join(''));
        }, (type, args) => {
          if (!args || getPropType(args[0]) !== 'array') {
            printWarning('Invalid argument supplied to oneOfType, expected an instance of array.');
            return [];
          }

          // Argument checker (ensure all arguments are type checkers)

          var params = args[0];
          for (var i = 0, il = params.length; i < il; i++) {
            var checker = params[i];
            if (typeof checker !== 'function') {
              printWarning([
                'Invalid argument supplied to oneOfType',
                '. Expected an array of check functions, but ',
                'received ',
                getPostfixForTypeWarning(checker),
                ' at index ',
                i,
                '.'
              ].join(''));

              return [];
            }
          }

          return args;
        }, mergeOneOfTypes),
        arrayOf = createValidatorWithArguments('arrayOf', function(props, propName, componentName, location, propFullName, secret, opts) {
          var propValue = props[propName],
              typeChecker = this.args[0];

          if (typeof typeChecker !== 'function')
            return new PropTypeError(['Property `', propFullName, '` of component `', componentName, '` has invalid PropType notation inside arrayOf.'].join(''));

          if (Array.isArray(propValue) || (propValue instanceof Array)) {
            var error = allElementsAreValid(typeChecker, undefined, props, propName, componentName, location, propFullName, secret, opts);

            if (error)
              return error;
            else
              return;
          } else {
            var propType = getPropType(propValue);
            return new PropTypeError(['Invalid ', location, ' `', propFullName, '` of type ', '`', propType, '` supplied to `', componentName, '`, expected an array.'].join(''));
          }
        }),
        objectOf = createValidatorWithArguments('objectOf', function(props, propName, componentName, location, propFullName, secret, opts) {
          var propValue = props[propName],
              propType = getPropType(propValue),
              typeChecker = this.args[0];

          if (typeof typeChecker !== 'function')
            return new PropTypeError(['Property `', propFullName, '` of component `', componentName, '` has invalid PropType notation inside objectOf.'].join(''));

          if (propType !== 'object')
            return new PropTypeError(['Invalid ', location, ' `', propFullName, '` of type ', '`', propType, '` supplied to `', componentName, '`, expected an object.'].join(''));

          var keys = Object.keys(propValue);
          for (var i = 0, il = keys.length; i < il; i++) {
            var key = keys[i],
                error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, secret, opts);

            if (error)
              return error;
          }
        }),
        exact = createValidatorWithArguments('exact', function(props, propName, componentName, location, propFullName, secret, opts) {
          var propValue = props[propName],
              propType = getPropType(propValue),
              shapeObj = this.args[0],
              mustBeExact = this.args[1];

          if (propType !== 'object')
            return new PropTypeError(['Invalid ', location, ' `', propFullName, '` of type `', propType, '` ', 'supplied to `', componentName, '`, expected `object`.'].join(''));

          var keys = Object.keys(Object.assign({}, propValue, shapeObj));
          for (var i = 0, il = keys.length; i < il; i++) {
            var key = keys[i],
                checker = shapeObj[key];

            if (!checker) {
              if (mustBeExact !== false) {
                return new PropTypeError([
                  'Invalid ', location, ' `', propFullName, '` key `', key, '` supplied to `', componentName, '`.',
                  '\nBad object: ', JSON.stringify(props[propName], null, '  '),
                  '\nValid keys: ', JSON.stringify(Object.keys(shapeObj), null, '  ')
                ].join(''));
              } else {
                continue;
              }
            }

            var error = checker(propValue, key, componentName, location, propFullName + '.' + key, secret, opts);
            if (error)
              return error;
          }
        }, shapeArgumentChecker, shapeMerger),
        shape = createValidatorWithArguments('shape', function(props, propName, componentName, location, propFullName, secret, opts) {
          var exactChecker = exact(this.args[0], false);
          return exactChecker(props, propName, componentName, location, propFullName, secret, opts);
        }, shapeArgumentChecker, shapeMerger),
        mergeTypes = function(...types) {
          function mergeType(key) {
            var type, mergedType;
            for (var i = 0, il = allTypes.length; i < il; i++) {
              var propType = allTypes[i];
              if (!propType.hasOwnProperty(key))
                continue;

              type = propType[key];
              if (!type)
                continue;

              if (mergedType) {
                var mergeHelper = (type._context) ? type._context.mergeHelper : defaultTypeMerge;
                mergedType = mergeHelper(key, mergedType, type);
              } else {
                mergedType = type;
              }
            }

            return mergedType;
          }

          var allTypes = types.filter((type) => !!type),
              allKeys = Object.keys(Object.assign({}, ...allTypes)),
              propTypes = {};

          for (var i = 0, il = allKeys.length; i < il; i++) {
            var key = allKeys[i];
            propTypes[key] = mergeType(key);
          }

          return propTypes;
        },
        checkPropType = function(typeSpec, props, propName, componentName, location, getStack, _opts) {
          var opts = _opts || {},
              error;

          // Prop type validation may throw. In case they do, we don't want to
          // fail the render phase where it didn't fail before. So we log it.
          // After these have been cleaned up, we'll let them throw.
          try {
            // This is intentionally an invariant that gets caught. It's the same
            // behavior as without this statement except with a better message.
            if (typeof typeSpec !== 'function') {
              var err = Error([
                (componentName || 'React class'), ': ', location, ' type `', propName, '` is invalid; ',
                'it must be a function, usually from the `prop-types` package, but received `', typeof typeSpec, '`.'
              ].join(''));

              err.name = 'Invariant Violation';
              throw err;
            }

            error = typeSpec(props, propName, componentName, location, null, REACT_CREATIVE_SECRET, opts);
          } catch (ex) {
            error = ex;
          }

          if (opts.forceRun)
            return error;

          if (error && !(error instanceof Error)) {
            printWarning([
              (componentName || 'React class'),
              ': type specification of ', location, ' `',
              propName, '` is invalid; the type checker ',
              'function must return `null` or an `Error` but returned a ', typeof error, '. ',
              'You may have forgotten to pass an argument to the type checker ',
              'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ',
              'shape all require an argument).'
            ].join(''));
          }

          if ((error instanceof Error) && !loggedTypeFailures.hasOwnProperty(error.message)) {
            // Only monitor this failure once because there tends to be a lot of the
            // same error.
            loggedTypeFailures[error.message] = true;

            var stack = getStack ? getStack() : '';
            printWarning(['Failed ', location, ' type: ', error.message, (stack != null) ? stack : ''].join(''));

            return error;
          }
        },
        checkPropTypes = function(propTypes, props, location, componentName, getStack, _opts) {
          var opts = _opts || {};
          if (opts.forceRun !== true && !IS_DEVELOPMENT)
            return;

          var keys = Object.keys(propTypes);
          for (var i = 0, il = keys.length; i < il; i++) {
            var propName = keys[i],
                typeSpec = propTypes[propName];

            checkPropType(typeSpec, props, propName, componentName, location, getStack, opts);
          }
        };

  return {
    any,
    bool,
    number,
    string,
    symbol,
    func,
    array,
    object,
    node,
    element,
    instanceOf,
    oneOf,
    oneOfType,
    arrayOf,
    objectOf,
    shape,
    exact,
    mergeTypes,
    checkPropType,
    checkPropTypes
  };
}

// Add default PropTypes properties for the factory function for use with direct import
Object.assign(factory, factory(isValidElement));

export default factory;
