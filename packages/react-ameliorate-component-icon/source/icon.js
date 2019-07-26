import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text }                   from '@react-ameliorate/native-shims';
import styleSheet                       from './icon-styles';

export const Icon = componentFactory('Icon', ({ Parent, componentName }) => {
  return class Icon extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      icon: PropTypes.string.isRequired,
      container: PropTypes.bool,
      containerStyle: PropTypes.any,
      size: PropTypes.number
    }

    getGlyphStyleMap() {
      var glyphStyleMap = this.iconGlyphStyleMap || this.context.iconGlyphStyleMap;
      if (!glyphStyleMap) {
        glyphStyleMap = this.getApp(({ app }) => {
          if (typeof app.getIconGlyphStyleMap === 'function')
            return app.getIconGlyphStyleMap();
        });
      }

      return glyphStyleMap || {};
    }

    getGlyphMap() {
      var glyphMap = this.iconGlyphMap || this.context.iconGlyphMap;
      if (!glyphMap) {
        glyphMap = this.getApp(({ app }) => {
          if (typeof app.getIconGlyphMap === 'function')
            return app.getIconGlyphMap();
        });
      }

      return glyphMap;
    }

    getDefaultFontFamily() {
      var iconDefaultFontFamily = this.iconDefaultFontFamily || this.context.iconDefaultFontFamily;
      if (!iconDefaultFontFamily) {
        iconDefaultFontFamily = this.getApp(({ app }) => {
          if (typeof app.getIconDefaultFontFamily === 'function')
            return app.getIconDefaultFontFamily();
        });
      }

      return iconDefaultFontFamily;
    }

    getIconGlyphInfo() {
      const getIconGlyph = (glyphMap) => {
        var icons = ('' + this.props.icon).split(/\s*\|\s*/g);
        for (var i = 0, il = icons.length; i < il; i++) {
          var name = ('' + icons[i]).trim(),
              glyph = glyphMap[name];

          if (glyph)
            return { glyph, name };
        }

        return { glyph: null, name: icons[0] };
      };

      var iconGlyphMap = this.getGlyphMap(),
          iconGlyphStyleMap = this.getGlyphStyleMap(),
          rawStyle = this.rawStyle('icon', this.props.style),
          fontFamily = (rawStyle && rawStyle.fontFamily);

      if (!fontFamily)
        fontFamily = this.getDefaultFontFamily();

      if (!fontFamily)
        throw new TypeError('Attempted to use Icon component, but no fontFamily defined (missing "iconDefaultFontFamily" on context?)');

      var glyphMap = (iconGlyphMap && iconGlyphMap[fontFamily]);
      if (!glyphMap)
        throw new TypeError(`Attempted to use Icon component, but found no defined glyph map for fontFamily "${fontFamily}" (missing "iconGlyphMap" on context?)`);

      var { glyph, name } = getIconGlyph(glyphMap),
          glyphStyleMap = (iconGlyphStyleMap && iconGlyphStyleMap[fontFamily]),
          style;

      if (glyphStyleMap)
        style = glyphStyleMap[name];

      return { fontFamily, glyph, style, name };
    }

    _renderIcon(glyphInfo) {
      var extraStyle = { fontFamily: glyphInfo.fontFamily };
      if (typeof this.props.size === 'number' && isFinite(this.props.size))
        extraStyle.fontSize = this.props.size;

      return this.renderIcon({ glyphInfo, extraStyle });
    }

    renderIcon({ glyphInfo, extraStyle }) {
      if (!glyphInfo || !glyphInfo.glyph)
        return null;

      var rawGlyphStyle = this.style('icon', this.props.style, extraStyle),
          glyphStyle = glyphInfo.style;

      if (typeof glyphStyle === 'function')
        glyphStyle = glyphStyle.call(this, { glyphInfo, style: rawGlyphStyle });

      if (glyphStyle)
        glyphStyle = this.style(glyphStyle, rawGlyphStyle, (glyphStyle.hasOwnProperty('fontSize')) ? { fontSize: glyphStyle.fontSize } : null);

      if (!glyphStyle)
        glyphStyle = rawGlyphStyle;

      return (
        <Text
          className={this.getRootClassName(componentName, 'icon')}
          style={glyphStyle}
        >
          {glyphInfo.glyph}
        </Text>
      );
    }

    render(_children) {
      var glyphInfo = this.getIconGlyphInfo();

      if (this.props.container === false)
        return super.render(this.renderIcon(glyphInfo));

      return super.render(
        <View className={this.getRootClassName(componentName, 'container')} style={this.style('container', this.props.containerStyle)}>
          {this._renderIcon(glyphInfo)}
          {this.getChildren(_children)}
        </View>
      );
    }
  };
});

export { styleSheet as iconStyles };
