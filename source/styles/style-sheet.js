/* globals __DEV__ */

import { data as D, utils as U }  from 'evisit-js-utils';

var styleSheetID = 1;

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

export class StyleSheetBuilder {
  constructor({ thisSheetID, styleExports, sheetName, theme, platform, factory, mergeStyles, resolveStyles, onUpdate }) {
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
    U.defineRWProperty(this, '_style', null);
    U.defineRWProperty(this, '_rawStyle', null);
    U.defineRWProperty(this, '_cachedBaseStyles', null);
    U.defineRWProperty(this, '_lastStyleUpdateTime', 0);
    U.defineRWProperty(this, '_lastRawStyleUpdateTime', 0);

    U.defineROProperty(this, 'platform', undefined, () => {
      if (!U.noe(platform))
        return platform;

      return (this.theme) ? this.theme.getPlatform() : undefined;
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
        styleFunction = function(theme, platform) {
          return new builderClass({ thisSheetID, styleExports, sheetName, theme, platform, factory, mergeStyles, resolveStyles, onUpdate });
        };

    Object.defineProperty(styleFunction, '_styleFactory', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: true
    });

    Object.defineProperty(styleFunction, '_styleSheetName', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: sheetName
    });

    Object.defineProperty(styleFunction, '_styleSheetID', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: thisSheetID
    });

    return styleFunction;
  }

  createInternalStyleSheet(styleObj) {
    return Object.assign({}, (styleObj || {}));
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

  styleWithHelper(helper, ...args) {
    function resolveAllStyles(styles, finalStyles) {
      for (var i = 0, il = styles.length; i < il; i++) {
        var style = styles[i];

        if (!style || typeof style === 'boolean')
          continue;

        if (style instanceof Object && typeof style.valueOf === 'function')
          style = style.valueOf();

        if (typeof style === 'string') {
          var styleName = style;
          style = sheet[style];

          if (typeof helper === 'function')
            style = helper(this, styleName, style, sheet);
        }

        if (!style || typeof style === 'boolean')
          continue;

        if (style instanceof Array) {
          resolveAllStyles.call(this, style, finalStyles);
        } else if (style) {
          if (typeof style === 'object')
            style = this.sanitizeProps(null, style);

          finalStyles.push(style);
        }
      }
    }

    var sheet = this.getInternalStyleSheet(),
        mergedStyles = [];

    resolveAllStyles.call(this, args, mergedStyles);

    if (mergedStyles.length < 2)
      return mergedStyles[0];

    return this.flattenInternalStyleSheet(mergedStyles);
  }

  style(...args) {
    return this.styleWithHelper(null, ...args);
  }

  styleProp(name, defaultProp) {
    var rawStyle = this.getRawStyle();
    return (!U.noe(rawStyle[name])) ? rawStyle[name] : defaultProp;
  }

  resolveDependencies(dependencies) {
    var styles = [];

    // Resolve dependent styles
    for (var i = 0, il = dependencies.length; i < il; i++) {
      var thisStyle = dependencies[i];
      if (thisStyle == null)
        continue;

      if (thisStyle instanceof StyleSheetBuilder) {
        thisStyle = thisStyle.getRawStyle();
      } else if (typeof thisStyle === 'function' && this.theme) {
        thisStyle = thisStyle(this.theme, this.platform);
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
    var lut = (this.theme) ? this.theme.lastUpdateTime() : 0;
    if (this._rawStyle && lut <= this._lastRawStyleUpdateTime)
      return this._rawStyle;

    this._lastRawStyleUpdateTime = lut;

    var currentTheme = (this.theme) ? this.theme.getThemeProperties() : {},
        mergeStyles = this.resolveDependencies(this._mergeStyles || []),
        nonMergeStyles = this.resolveDependencies(this._resolveStyles || []),
        args = mergeStyles.concat(nonMergeStyles),
        rawStyle = this.sanitizeProps(null, this.invokeFactoryCallback(currentTheme, args));

    // Now merge all style sheets
    rawStyle = this._rawStyle = D.extend(true, this.styleExports, ...[currentTheme, ...mergeStyles, rawStyle]);

    return rawStyle;
  }

  stripUppercasedFields(style) {
    return D.extend(D.extend.FILTER, (key) => !(key.match(/^[A-Z]/)), {}, style);
  }

  getInternalStyleSheet(_theme) {
    var theme = _theme || this.theme,
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
      'mobile': ['android', 'ios', 'microsoft'],
      'android': ['mobile'],
      'ios': ['mobile'],
      'microsoft': ['mobile'],
      'browser': ['browser']
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
    var finalProps = Object.assign({}, props || {}),
        mutators = this._getStylePropMutators(parentName, props, finalProps);

    for (var i = 0, il = mutators.length; i < il; i++) {
      var mutator = mutators[i];
      if (typeof mutator !== 'function')
        continue;

      mutator.call(this, props, finalProps);
    }

    return finalProps;
  }

  _getStylePropMutators() {
    const mutateFourWay = (testKey, props, finalProps) => {
      var value = props[testKey];

      if (finalProps.hasOwnProperty(testKey))
        delete finalProps[testKey];

      if (value == null)
        return;

      for (var i = 0, il = sides.length; i < il; i++) {
        var side = sides[i],
            keyName = (testKey === 'borderWidth') ? `border${side}Width` : `${testKey}${side}`;

        finalProps[keyName] = value;
      }
    };

    var sides = ['Top', 'Left', 'Right', 'Bottom'];
    return [
      mutateFourWay.bind(this, 'margin'),
      mutateFourWay.bind(this, 'padding'),
      mutateFourWay.bind(this, 'borderWidth')
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

  flattenInternalStyleSheet(style, _finalStyle) {
    var finalStyle = _finalStyle || {};
    if (!(style instanceof Array))
      return Object.assign(finalStyle, (style || {}));

    for (var i = 0, il = style.length; i < il; i++) {
      var thisStyle = style[i];
      if (!thisStyle)
        continue;

      if (thisStyle instanceof Array)
        finalStyle = this.flattenInternalStyleSheet(thisStyle, finalStyle);
      else
        finalStyle = Object.assign(finalStyle, (thisStyle || {}));
    }

    if (finalStyle.flex === 0)
      finalStyle.flex = 'none';

    return finalStyle;
  }

  static getTransformAxis() {
    return transformAxis;
  }
}
