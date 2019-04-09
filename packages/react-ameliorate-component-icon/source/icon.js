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

    getGlyphMap() {
      var glyphMap = this.iconGlyphMap || this.context.iconGlyphMap;
      if (!glyphMap)
        glyphMap = this.getApp(({ app }) => app.getIconGlyphMap());

      return glyphMap;
    }

    getDefaultFontFamily() {
      var iconDefaultFontFamily = this.iconDefaultFontFamily || this.context.iconDefaultFontFamily;
      if (!iconDefaultFontFamily)
        iconDefaultFontFamily = this.getApp(({ app }) => app.getIconDefaultFontFamily());

      return iconDefaultFontFamily;
    }

    getIconGlyphInfo() {
      const getIconGlyph = (glyphMap) => {
        var icons = ('' + this.props.icon).split(/\s*\|\s*/g);
        for (var i = 0, il = icons.length; i < il; i++) {
          var icon = icons[i],
              glyph = glyphMap[icon];

          if (glyph)
            return glyph;
        }

        return null;
      };

      var iconGlyphMap = this.getGlyphMap(),
          rawStyle = this.rawStyle('icon', this.props.style),
          fontFamily = (rawStyle && rawStyle.fontFamily);

      if (!fontFamily)
        fontFamily = this.getDefaultFontFamily();

      if (!fontFamily)
        throw new TypeError('Attempted to use Icon component, but no fontFamily defined (missing "iconDefaultFontFamily" on context?)');

      var glyphMap = (iconGlyphMap && iconGlyphMap[fontFamily]);
      if (!glyphMap)
        throw new TypeError(`Attempted to use Icon component, but found no defined glyph map for fontFamily "${fontFamily}" (missing "iconGlyphMap" on context?)`);

      var glyph = getIconGlyph(glyphMap);
      return { fontFamily, glyph };
    }

    _renderIcon(glyphInfo) {
      var extraStyle = { fontFamily: glyphInfo.fontFamily };
      if (typeof this.props.size === 'number' && isFinite(this.props.size))
        extraStyle.fontSize = this.props.size;

      return this.renderIcon({ glyphInfo, extraStyle });
    }

    renderIcon({ glyphInfo, extraStyle }) {
      return (
        <Text
          className={this.getRootClassName(componentName, 'icon')}
          style={this.style('icon', this.props.style, extraStyle)}
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
