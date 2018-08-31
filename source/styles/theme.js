import { utils as U }       from 'evisit-js-utils';
import { Dimensions }       from '../platform-shims';
import { rebuildPallette }  from './colors';

var themeIDCounter = 1;

export class ThemeProperties {
  constructor(themeProps, parentTheme) {
    U.defineROProperty(this, '_theme', parentTheme);

    var palletteProps = rebuildPallette(themeProps, parentTheme && parentTheme.getColorHelperFactory()),
        colorHelpers = palletteProps.colorHelpers,
        keys = Object.keys(colorHelpers);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          colorHelper = colorHelpers[key];

      if (typeof colorHelper === 'function')
        this[key] = colorHelper.bind(this);
      else
        this[key] = colorHelper;
    }

    Object.assign(this, this.getDefaultThemeProps(themeProps, palletteProps), palletteProps.pallette);
  }

  getTheme() {
    return this._theme;
  }

  getPlatform() {
    var theme = this.getTheme();
    if (!theme)
      return;

    return theme.getPlatform();
  }

  getScreenInfo() {
    var theme = this.getTheme();
    if (!theme)
      return {};

    return theme.getScreenInfo();
  }

  getDefaultThemeProps(themeProps = {}, palletteProps) {
    function safeNumber(number, defaultNumber) {
      return (!number || isNaN(number) || !isFinite(number)) ? defaultNumber : number;
    }

    var finalThemeProps = {},
        theme = this.getTheme(),
        screenInfo = this.getScreenInfo(),
        width = safeNumber(themeProps.SCREEN_WIDTH, screenInfo.width),
        height = safeNumber(themeProps.SCREEN_HEIGHT, screenInfo.width);

    if (theme) {
      finalThemeProps = Object.assign(themeProps, {
        SCREEN_WIDTH: width,
        SCREEN_HEIGHT: height,
        SCREEN_RATIO: (height) ? (width / height) : 1,
        PLATFORM: this.getPlatform(),
        ONE_PIXEL: screenInfo.pixelRatio
      }, theme.getThemeProps(themeProps, palletteProps, screenInfo) || {});
    }

    return finalThemeProps;
  }
}


export class Theme {
  constructor(_extraThemeProps, platform) {
    U.defineROProperty(this, 'platform', undefined, () => platform);

    U.defineRWProperty(this, '_cachedTheme', null);
    U.defineRWProperty(this, '_lastRebuildTime', 0);
    U.defineRWProperty(this, '_themeID', themeIDCounter++);

    this.rebuildTheme(_extraThemeProps);
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

  getColorHelperFactory() {
  }

  getPlatform() {
    return this.platform;
  }

  getThemeID() {
    return this._themeID;
  }

  getThemeProperties() {
    if (!this._cachedTheme)
      this.rebuildTheme();

    return this._cachedTheme;
  }

  lastUpdateTime() {
    return this._lastRebuildTime;
  }

  getThemeProps(extraThemeProps = {}, palletteProps = {}) {
    const FADED_LEVELS_MAX = (extraThemeProps.FADED_LEVELS_MAX == null) ? 0.78 : extraThemeProps.FADED_LEVELS_MAX,
          FADED_LEVELS_MIN = (extraThemeProps.FADED_LEVELS_MIN == null) ? 0.30 : extraThemeProps.FADED_LEVELS_MIN,
          FADED_LEVELS_STEPS = extraThemeProps.FADED_LEVELS_STEPS || 4,
          FONT_SCALAR = extraThemeProps.FONT_SCALAR || 1;

    var finalBranding = Object.assign({
      FONT_REGULAR: 'OpenSans, Open Sans, sans-serif',
      FONT_SEMIBOLD: 'OpenSans-Semibold, Open Sans, sans-serif',
      FONT_SCALAR,
      FONT_WEIGHT_LIGHT: '200',
      FONT_WEIGHT_MEDIUM: '400',
      FONT_WEIGHT_BOLD: '800',

      // Font Size
      FONT_SIZE_XTINY: 10 * FONT_SCALAR,
      FONT_SIZE_TINY: 12 * FONT_SCALAR,
      FONT_SIZE_XSMALL: 14 * FONT_SCALAR,
      FONT_SIZE_SMALL: 16 * FONT_SCALAR,
      FONT_SIZE_XMEDIUM: 18 * FONT_SCALAR,
      FONT_SIZE_MEDIUM: 20 * FONT_SCALAR,
      FONT_SIZE_XHUGE: 24 * FONT_SCALAR,
      FONT_SIZE_HUGE: 32 * FONT_SCALAR,
      FONT_SIZE_XMEGA: 42 * FONT_SCALAR,
      FONT_SIZE_MEGA: 64 * FONT_SCALAR,
      FONT_SIZE_EPIC: 128 * FONT_SCALAR,

      DEFAULT_ANIMATION_DURATION: 300,

      DEFAULT_PADDING: 30,
      DEFAULT_BORDER_RADIUS: 4,
      DEFAULT_BUTTON_HEIGHT: 48,
      DEFAULT_FIELD_HEIGHT: 30,

      FADED_LEVELS_MAX,
      FADED_LEVELS_MIN,
      FADED_LEVELS_STEPS
    }, extraThemeProps);

    for (var stepSize = (FADED_LEVELS_MAX - FADED_LEVELS_MIN) / FADED_LEVELS_STEPS, j = 0, jl = FADED_LEVELS_STEPS + 1; j < jl; j++)
      finalBranding[`FADED_LEVEL${j + 1}`] = FADED_LEVELS_MAX - (stepSize * j);

    finalBranding.DEFAULT_FONT_SIZE = finalBranding.FONT_SIZE_SMALL;
    finalBranding.REM = finalBranding.DEFAULT_FONT_SIZE;

    return finalBranding;
  }

  rebuildTheme(_extraThemeProps = {}) {
    var extraThemeProps = {},
        keys = Object.keys(_extraThemeProps);

    keys.forEach((key) => {
      if (!key.match(/^[A-Z]/))
        return;

      var value = _extraThemeProps[key];
      if (value === undefined)
        return;

      extraThemeProps[key] = value;
    });

    var currentTheme = this._cachedTheme = new ThemeProperties(extraThemeProps, this);
    this._lastRebuildTime = (new Date()).valueOf();

    return currentTheme;
  }
}
