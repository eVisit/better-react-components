import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import { Text }                         from '../text';
import styleSheet                       from './icon-styles';
import fontIconMap                      from './icon-map.json';

const glyphMap = Object.keys(fontIconMap).reduce((map, key) => {
  map[key] = String.fromCharCode(parseInt(fontIconMap[key], 16));
  return map;
}, {});

const Icon = componentFactory('Icon', ({ Parent, componentName }) => {
  return class Icon extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      icon: PropTypes.string.isRequired,
      style: PropTypes.any
    }

    getIconGlyph() {
      var icons = ('' + this.props.icon).split(/\s*\|\s*/g);
      for (var i = 0, il = icons.length; i < il; i++) {
        var icon = icons[i],
            glyph = glyphMap[icon];

        if (glyph)
          return glyph;
      }
    }

    render() {
      var glyph = this.getIconGlyph();

      return (
        <View className={this.getRootClassName(componentName)} style={this.style('container')}>
          <Text style={this.style('icon', this.props.style)} numberOfLines={1}>{glyph}</Text>
        </View>
      );
    }
  };
});

export { Icon };
