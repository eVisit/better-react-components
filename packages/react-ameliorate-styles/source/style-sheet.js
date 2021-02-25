/* globals __DEV__ */

import { data as D, utils as U }          from 'evisit-js-utils';
import { getPlatform, filterObjectKeys }  from '@react-ameliorate/utils';

//###if(MOBILE) {###//
import { StyleSheet, Platform }   from 'react-native';
//###} else {###//
const Platform = {};

Object.defineProperties(Platform, {
  'OS': {
    enumerable: true,
    configurable: true,
    get: () => getPlatform(),
    set: () => {}
  }
});

//###}###//

var styleSheetID = 1,
    uniqueStyleIDCounter = 1;

const transformAxis = [
  'translateX',
  'translateY',
  'translateZ',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scaleX',
  'scaleY',
  'scaleZ',
  'skewX',
  'skewY',
  'perspective'
];

var singletonStyleSheetBuilder;

export class StyleSheetBuilder {
  constructor({ thisSheetID, styleExports, sheetName, theme, platform, factory, mergeStyles, resolveStyles, onUpdate, styleHelper }) {
    if (!(factory instanceof Function))
      throw new Error('Theme factory must be a function');

    U.defineROProperty(this, 'styleExports', styleExports);
    U.defineROProperty(this, 'sheetName', sheetName);
    U.defineROProperty(this, 'theme', theme);
    U.defineROProperty(this, 'factory', factory);
    U.defineROProperty(this, '_styleSheetID', thisSheetID);
    U.defineROProperty(this, '_mergeStyles', (mergeStyles instanceof Array) ? mergeStyles : [mergeStyles]);
    U.defineROProperty(this, '_resolveStyles', (resolveStyles instanceof Array) ? resolveStyles : [resolveStyles]);
    U.defineROProperty(this, '_onUpdate', onUpdate);
    U.defineRWProperty(this, '_styleHelper', styleHelper);
    U.defineRWProperty(this, '_style', null);
    U.defineRWProperty(this, '_rawStyle', null);
    U.defineRWProperty(this, '_styleCache', {});
    U.defineRWProperty(this, '_lastStyleUpdateTime', 0);
    U.defineRWProperty(this, '_lastRawStyleUpdateTime', 0);

    U.defineROProperty(this, 'platform', undefined, () => {
      if (!U.noe(platform))
        return platform;

      var currentTheme = this.getTheme();
      return (currentTheme) ? currentTheme.getPlatform() : undefined;
    });
  }

  static createStyleSheet(factory, props = {}) {
    function styleSheetName(name) {
      var error = new Error('___TAG___'),
          lines = ('' + error.stack).split(/^\s+at\s+/gm),
          callingFunction = lines[3];

      if (callingFunction == null)
        return `<unknown:${thisSheetID}>`;

      return callingFunction.replace(/^[^(]+\(/, '').replace(/\)[^)]+$/, '');
    }

    var builderClass = props.StyleSheetBuilder || StyleSheetBuilder,
        thisSheetID = styleSheetID++,
        mergeStyles = (props instanceof Array) ? props : props.mergeStyles,
        resolveStyles = props.resolveStyles,
        styleExports = {},
        onUpdate = props.onUpdate;

    if (U.noe(mergeStyles))
      mergeStyles = [];

    if (U.noe(resolveStyles))
      resolveStyles = [];

    var sheetName = (props.name) ? '' + props.name : styleSheetName(),
        styleFunction = function(theme, platform, _opts) {
          var opts = _opts || {},
              thisBuilderClass = (opts.StyleSheetBuilder) ? opts.StyleSheetBuilder : builderClass,
              styleHelper = opts.styleHelper;

          return new thisBuilderClass({
            thisSheetID,
            styleExports,
            sheetName,
            theme,
            platform,
            factory,
            mergeStyles,
            resolveStyles,
            onUpdate,
            styleHelper
          });
        };

    Object.defineProperty(styleFunction, '_raStyleFactory', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: true
    });

    Object.defineProperty(styleFunction, '_raStyleSheetName', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: sheetName
    });

    Object.defineProperty(styleFunction, '_raStyleSheetID', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: thisSheetID
    });

    Object.defineProperty(styleFunction, '_raStyleSheetBuilder', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: builderClass
    });

    return styleFunction;
  }

  invalidateCache() {
    this._styleCache = {};
  }

  getTheme() {
    return this.theme;
  }

  createInternalStyleSheet(styleObj) {
    //###if(MOBILE) {###//
    return StyleSheet.create(styleObj);
    //###} else {###//
    return Object.assign({}, (styleObj || {}));
    //###}###//
  }

  buildCSSFromStyle(style, selector) {
    if (!style) {
      console.warn('Warning: The specified style is empty. Ignoring.');
      return;
    }

    if (!selector) {
      console.warn('Warning: The specified selector is empty. Ignoring.');
      return;
    }

    var flatStyle = this.flattenInternalStyleSheet(style),
        cssStyle = [selector, '{'],
        keys = Object.keys(flatStyle);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          ruleName = this.getCSSRuleName(key),
          ruleValue = this.getCSSRuleValue(ruleName, flatStyle[key], key);

      cssStyle.push(ruleName);
      cssStyle.push(':');
      cssStyle.push(ruleValue);
      cssStyle.push(';');
    }

    cssStyle.push('}');

    return cssStyle.join('');
  }

  buildCSSFromStyles(_styleArray, _uuid) {
    var styleArray = (_styleArray instanceof Array) ? _styleArray : [_styleArray],
        css = [],
        uuid = (_uuid) ? ('.' + _uuid + ' ') : '';

    for (var i = 0, il = styleArray.length; i < il; i++) {
      var style = styleArray[i],
          selector = U.get(style, 'selector', '');

      if ((typeof selector === 'string' || selector instanceof String) && selector.match(/,/))
        selector = selector.split(/\s*,\s*/g).map((s) => s.trim()).filter((s) => !!s);

      if (selector instanceof Array)
        selector = selector.join(',' + uuid);

      css.push(this.buildCSSFromStyle(style.style, uuid + selector));
    }

    return css.join(' ');
  }

  getCSSRuleName(key) {
    if (key === 'textDecorationLine')
      return 'text-decoration';

    return key.replace(/[A-Z]/g, function(m) {
      return '-' + (m.toLowerCase());
    });
  }

  getCSSRuleValue(ruleName, ruleValue, key) {
    if (ruleName === 'text-decoration')
      return ruleValue;
    else if (ruleName === 'content')
      return ruleValue;

    if (ruleName === 'transform') {
      if (typeof ruleValue === 'string')
        return ruleValue;

      var transformParts = [];
      for (var i = 0, il = transformAxis.length; i < il; i++) {
        var currentAxis = transformAxis[i],
            axisVal = ruleValue[currentAxis];

        if (axisVal == null)
          continue;

        if (typeof axisVal.valueOf === 'function')
          axisVal = axisVal.valueOf();

        if (typeof axisVal === 'number')
          axisVal = `${axisVal}px`;

        transformParts.push(`${currentAxis}(${axisVal})`);
      }

      return transformParts.join(' ');
    }

    if (ruleName.match(/^(opacity|z-index|flex)/))
      return ('' + ruleValue);

    if ((ruleValue instanceof Number) || typeof ruleValue === 'number')
      return ruleValue + 'px';

    return ruleValue;
  }

  calculateStyleCacheKey(_styles) {
    var styles = _styles;
    if (!styles)
      return ('' + styles);

    if (typeof styles.valueOf === 'function')
      styles = styles.valueOf();

    var objType = typeof styles;
    if (objType === 'string' || objType === 'number' || objType === 'boolean' || objType === 'bigint')
      return ('' + styles);

    var isArray = (styles instanceof Array);

    // If this isn't a standard object (i.e. Animated.Value)
    // then attempt to give the object a hidden style id
    // if the object is sealed or frozen, then we always
    // just return a new unique id, which will invalidate the cache
    if (!isArray && styles.constructor !== Object.prototype.constructor) {
      if (styles.__raObjStyleID)
        return styles.__raObjStyleID;

      var objID = ('' + (uniqueStyleIDCounter++));
      Object.defineProperty(styles, '__raObjStyleID', {
        writable: false,
        enumerable: false,
        configurable: false,
        value: objID
      });

      return objID;
    }

    var keys        = Object.keys(styles),
        finalArray  = [];

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value = styles[key];

      finalArray.push(`${key}:${this.calculateStyleCacheKey(value)}`);
    }

    if (!isArray)
      finalArray.sort();

    return finalArray.join(',');
  }

  styleWithHelper(helper, ...args) {
    const resolveAllStyles = (styles, finalStyles) => {
      var completeStyle = {};

      for (var i = 0, il = styles.length; i < il; i++) {
        var style = styles[i];

        if (!style || style === true)
          continue;

        if (style && typeof style.valueOf === 'function')
          style = style.valueOf();

        if (typeof style === 'string') {
          var styleName = style;
          style = sheet[styleName];

          if (typeof helper === 'function')
            style = helper({ styleName, style, styles: sheet, sheet: this });
        }

        if (!style || style === true)
          continue;

        if (style instanceof Array) {
          resolveAllStyles(style, finalStyles);
          continue;
        }

        if (typeof style === 'object')
          style = completeStyle = this.sanitizeProps(null, Object.assign({}, completeStyle, style));

        if (completeStyle['borderWidth'] && completeStyle['borderBottomWidth'])
          debugger;

        finalStyles.push(style);
      }
    };

    var cacheKey = this.calculateStyleCacheKey(args),
        cachedStyle = this._styleCache[cacheKey];

    if (cachedStyle)
      return cachedStyle;

    var sheet           = this.getInternalStyleSheet(),
        mergedStyles    = [];

    resolveAllStyles(args, mergedStyles);

    var finalStyle = this._styleCache[cacheKey] = this.flattenInternalStyleSheet(mergedStyles);

    if (__DEV__) {
      var keys = Object.keys(finalStyle);
      for (var i = 0, il = keys.length; i < il; i++) {
        var key   = keys[i],
            value = finalStyle[key];

        if (typeof value === 'number' && (isNaN(value) || !isFinite(value)))
          throw new Error(`Error: Invalid style property detected [${this.sheetName}][${key}]: ${value}`);
      }
    }

    return finalStyle;
  }

  rawStyle(...args) {
    return this.style(...args);
  }

  style(...args) {
    return this.styleWithHelper(this._styleHelper, ...args);
  }

  styleProp(name, defaultProp) {
    var rawStyle = this.getRawStyle();
    return (!U.noe(rawStyle[name])) ? rawStyle[name] : defaultProp;
  }

  resolveDependencies(dependencies) {
    var styles = [],
        currentTheme = this.getTheme();

    // Resolve dependent styles
    for (var i = 0, il = dependencies.length; i < il; i++) {
      var thisStyle = dependencies[i];
      if (thisStyle == null)
        continue;

      if (thisStyle instanceof StyleSheetBuilder) {
        thisStyle = thisStyle.getRawStyle();
      } else if (typeof thisStyle === 'function' && currentTheme) {
        thisStyle = thisStyle(currentTheme, this.platform);
        if (thisStyle instanceof StyleSheetBuilder)
          thisStyle = thisStyle.getRawStyle();
      }

      styles.push(thisStyle);
    }

    return styles;
  }

  invokeFactoryCallback(theme, args) {
    if (typeof this.factory !== 'function')
      return {};

    return (this.factory(theme || {}, ...args) || {});
  }

  getRawStyle() {
    var currentTheme = this.getTheme(),
        lut = (currentTheme) ? currentTheme.lastUpdateTime() : 0;

    if (this._rawStyle && lut <= this._lastRawStyleUpdateTime)
      return this._rawStyle;

    this.invalidateCache();
    this._lastRawStyleUpdateTime = lut;

    var currentTheme = (currentTheme) ? currentTheme.getThemeProperties() : {},
        mergeStyles = this.resolveDependencies(this._mergeStyles || []),
        nonMergeStyles = this.resolveDependencies(this._resolveStyles || []),
        args = mergeStyles.concat(nonMergeStyles),
        rawStyle = this.sanitizeProps(null, this.invokeFactoryCallback(currentTheme, args));

    // Now merge all style sheets
    rawStyle = this._rawStyle = D.extend(true, this.styleExports, ...[currentTheme, ...mergeStyles, rawStyle]);

    Object.defineProperty(rawStyle, '_CONSTANTS', {
      enumerable: false,
      configurable: true,
      get: () => {
        return Object.keys(rawStyle).reduce((obj, key) => {
          if (!key.match(/^[A-Z_0-9]+$/))
            return obj;

          obj[key] = rawStyle[key];
          return obj;
        }, {});
      },
      set: () => {}
    });

    return rawStyle;
  }

  stripUppercasedFields(style) {
    return D.extend(D.extend.FILTER, (key) => !(key.match(/^[A-Z]/)), {}, style);
  }

  getInternalStyleSheet(_theme) {
    var theme = _theme || this.getTheme(),
        lut = (theme) ? theme.lastUpdateTime() : 0;

    if (this._style && lut <= this._lastStyleUpdateTime)
      return this._style;

    this._lastStyleUpdateTime = lut;

    var sheetName = this.sheetName,
        rawStyle = this.getRawStyle();

    if (typeof this._onUpdate === 'function')
      rawStyle = this._onUpdate.call(this, rawStyle);

    if (typeof __DEV__ !== 'undefined' && __DEV__ === true)
      this.veryifySanity(sheetName, rawStyle);

    var sheet = this._style = this.createInternalStyleSheet(this.stripUppercasedFields(rawStyle));
    return sheet;
  }

  // This checks for problems with stylesheets (but only in development mode)
  veryifySanity(styleSheetName, obj, _path) {
    var keys = Object.keys(obj),
        path = _path || [];

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          val = obj[key];

      if (val != null && U.noe(val))
        console.warn('Invalid style property: ' + styleSheetName + ':' + path.concat(key).join('.') + ':' + ((val && U.instanceOf(val, 'object', 'array')) ? JSON.stringify(val) : val));
      else if (val && U.instanceOf(val, 'object'))
        this.veryifySanity(styleSheetName, val, path.concat(key));
    }
  }

  getAllPlatforms() {
    return {
      'tablet': ['mobile'],
      'mobile': ['android', 'ios', 'microsoft', 'mobile_browser'],
      'android': ['mobile'],
      'ios': ['mobile'],
      'mobile_browser': ['mobile'],
      'microsoft': ['mobile'],
      'browser': ['desktop', 'mobile_browser'],
      'desktop': ['browser']
    };
  }

  isPlatform(platform, _allPlatforms) {
    var allPlatforms = _allPlatforms;
    if (!allPlatforms)
      allPlatforms = this.getAllPlatforms();

    if (!allPlatforms)
      return false;

    if (allPlatforms instanceof Array)
      return (allPlatforms.indexOf(platform) >= 0);
    else
      return !!allPlatforms[platform];
  }

  isCurrentPlatform(platform, _allPlatforms) {
    const isAlias = (platform1, platform2) => {
      var alias = allPlatforms[platform1];
      if (!alias)
        return (platform1 === platform2);

      if (alias instanceof Array && alias.indexOf(platform2) >= 0)
        return true;
      else if (alias[platform2])
        return true;
      else if (alias === platform2)
        return true;

      return false;
    };

    if (!platform)
      return false;

    if (platform === this.platform)
      return true;

    var allPlatforms = _allPlatforms;
    if (!allPlatforms)
      allPlatforms = this.getAllPlatforms();

    if (!allPlatforms || allPlatforms instanceof Array)
      return (this.platform === platform);
    else if (isAlias(this.platform, platform) || isAlias(platform, this.platform))
      return true;

    return false;
  }

  _getPlatformTypeProps(parentName, props, alreadyVisited = []) {
    var keys = Object.keys(props),
        finalProps = {},
        platformProps = {},
        allPlatforms = this.getAllPlatforms();

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value = props[key];

      if (value && value.constructor === Object)
        value = this.sanitizeProps((parentName) ? ([parentName, key].join('.')) : key, value, alreadyVisited);

      if (value && (value instanceof Array || value.constructor === Object) && this.isPlatform(key, allPlatforms))
        platformProps[key] = value;
      else
        finalProps[key] = value;
    }

    return Object.keys(platformProps).reduce((obj, key) => {
      if (!this.isCurrentPlatform(key, allPlatforms))
        return obj;

      return Object.assign(obj, platformProps[key]);
    }, finalProps);
  }

  _expandStyleProps(parentName, props) {
    var mutators = this._getStylePropMutators(parentName, props),
        mergeBeforeProps = [],
        mergeAfterProps = [];

    for (var i = 0, il = mutators.length; i < il; i++) {
      var mutator = mutators[i];
      if (typeof mutator !== 'function')
        continue;

      var mutatedProps = mutator.call(this, props);
      if (mutatedProps) {
        if (mutatedProps.before)
          mergeBeforeProps.push(mutatedProps.before);

        if (mutatedProps.after)
          mergeAfterProps.push(mutatedProps.after);
      }
    }

    var finalStyle = filterObjectKeys((key, value) => (value !== undefined), ...mergeBeforeProps, props, ...mergeAfterProps);
    return finalStyle;
  }

  _getStylePropMutators() {
    const mutateFourWay = (testKey, props, keyNameFormatter) => {
      var value = props[testKey];
      if (value == null)
        return;

      var mutatedProps = {};
      for (var i = 0, il = sides.length; i < il; i++) {
        var side = sides[i],
            keyName = (typeof keyNameFormatter === 'function') ? keyNameFormatter(side) : `${testKey}${side}`;

        mutatedProps[keyName] = value;
      }

      return { before: mutatedProps, after: { [testKey]: undefined } };
    };

    const mutateFlex = (props) => {
      var value = props['flex'];
      if (value == null)
        return;

      var mutatedProps  = {},
          flexGrow      = props['flexGrow'],
          flexShrink    = props['flexShrink'],
          flexBasis     = props['flexBasis'],
          preValues     = {};

      if (flexGrow != null)
        preValues['flexGrow'] = flexGrow;

      if (flexShrink != null)
        preValues['flexShrink'] = flexShrink;

      if (flexBasis != null)
        preValues['flexBasis'] = flexBasis;

      if (value === 'inherit') {
        mutatedProps = {
          flexGrow: 'inherit',
          flexShrink: 'inherit',
          flexBasis: 'inherit'
        };
      } else if (value === 'none') {
        mutatedProps = {
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: 'auto'
        };
      } else if (value === 'initial') {
        mutatedProps = {
          flexGrow: 0,
          flexShrink: 1,
          flexBasis: 'auto'
        };
      } else if (value === 'auto') {
        mutatedProps = {
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 'auto'
        };
      } else if (U.instanceOf(value, 'number')) {
        mutatedProps = {
          flexGrow: value,
          flexShrink: 1,
          flexBasis: 'auto'
        };
      } else if (U.instanceOf(value, 'string')) {
        preValues = {};

        var mutatedProps  = {},
            values        = value.split(/\s+/g).map((p) => p.trim()).filter(Boolean);

        for (var i = 0, il = flexKeys.length; i < il; i++) {
          var thisValue = values[i];
          if (thisValue && thisValue.match(/^[\d+.-]$/))
            thisValue = parseFloat(thisValue);

          mutatedProps[flexKeys[i]] = (thisValue == null) ? flexDefaultValues[i] : thisValue;
        }
      }

      return {
        before: Object.assign(mutatedProps, preValues),
        after:  { 'flex': undefined }
      };
    };

    var sides             = [ 'Top', 'Left', 'Right', 'Bottom' ],
        flexKeys          = [ 'flexGrow', 'flexShrink', 'flexBasis' ],
        flexDefaultValues = [ 0, 1, 'auto' ];

    return [
      mutateFourWay.bind(this, 'margin'),
      mutateFourWay.bind(this, 'padding'),
      mutateFourWay.bind(this, 'borderWidth', (side) => `border${side}Width`),
      mutateFourWay.bind(this, 'borderColor', (side) => `border${side}Color`),
      mutateFourWay.bind(this, 'borderStyle', (side) => `border${side}Style`),
      mutateFlex
    ];
  }

  // Here we sanitize the style... meaning we take the platform styles
  // and either strip them on the non-matching platforms, or override with the correct platform
  sanitizeProps(parentName, props, alreadyVisited = []) {
    if (!props)
      return props;

    if (alreadyVisited.indexOf(props) >= 0)
      return props;

    alreadyVisited.push(props);

    var finalStyle = this._getPlatformTypeProps(parentName, props, alreadyVisited);
    return this._expandStyleProps(parentName, finalStyle);
  }

  compileTransformStyleProp(_value) {
    const objectToOperations = (obj) => {
      var keys = Object.keys(obj || {});

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            value = obj[key],
            transform = transformArray.find((t) => (t.type === key));

        if (!transform) {
          transform = { type: key, value: null };
          transformArray.push(transform);
        }

        if (value == null) {
          transform.value = null;
          continue;
        }

        transform.value = (typeof value !== 'string') ? `${value}px` : value;
      }
    };

    var value = _value;
    if (!value)
      return value;

    if (!Array.isArray(value))
      value = [ value ];

    var transformArray = [];
    for (var i = 0, il = value.length; i < il; i++) {
      var part = value[i];
      if (!part)
        return;

      objectToOperations(part);
    }

    return transformArray.filter((t) => (t.value != null)).map((t) => `${t.type}(${t.value})`).join(' ');
  }

  _flattenInternalStyleSheet(style, _finalStyle) {
    var finalStyle = _finalStyle || {};
    if (!(style instanceof Array))
      return Object.assign(finalStyle, (style || {}));

    for (var i = 0, il = style.length; i < il; i++) {
      var thisStyle = style[i];
      if (!thisStyle)
        continue;

      if (thisStyle instanceof Array) {
        finalStyle = this._flattenInternalStyleSheet(thisStyle, finalStyle);
      } else {
        var currentTransform = finalStyle.transform;
        finalStyle = Object.assign(finalStyle, (thisStyle || {}));

        if (currentTransform instanceof Array && finalStyle.transform !== currentTransform && finalStyle.transform instanceof Array)
          finalStyle.transform = currentTransform.concat(finalStyle.transform).filter(Boolean);
      }
    }

    if (finalStyle.flex === 0)
      finalStyle.flex = 'none';

    return finalStyle;
  }

  flattenInternalStyleSheet(...args) {
    //###if(MOBILE) {###//
    return StyleSheet.flatten(...args);
    //###} else {###//
    var finalStyle = this._flattenInternalStyleSheet(args, {});

    if (finalStyle.hasOwnProperty('transform') && typeof finalStyle.transform !== 'string')
      finalStyle.transform = this.compileTransformStyleProp(finalStyle.transform);

    return finalStyle;
    //###}###//
  }

  static flattenInternalStyleSheet() {
    if (!singletonStyleSheetBuilder)
      singletonStyleSheetBuilder = StyleSheetBuilder.createStyleSheet(() => ({}))(null, Platform.OS);

    return singletonStyleSheetBuilder.flattenInternalStyleSheet.apply(singletonStyleSheetBuilder, arguments);
  }

  static getCSSRuleName(...args) {
    if (!singletonStyleSheetBuilder)
      singletonStyleSheetBuilder = StyleSheetBuilder.createStyleSheet(() => ({}))(null, Platform.OS);

    return singletonStyleSheetBuilder.getCSSRuleName.apply(singletonStyleSheetBuilder, arguments);
  }

  static getCSSRuleValue(...args) {
    if (!singletonStyleSheetBuilder)
      singletonStyleSheetBuilder = StyleSheetBuilder.createStyleSheet(() => ({}))(null, Platform.OS);

    return singletonStyleSheetBuilder.getCSSRuleValue.apply(singletonStyleSheetBuilder, arguments);
  }

  static getTransformAxis() {
    return transformAxis;
  }
}

const createStyleSheet = StyleSheetBuilder.createStyleSheet;

export {
  createStyleSheet
};
