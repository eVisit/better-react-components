import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text }                   from '@react-ameliorate/native-shims';
import styleSheet                       from './captioned-container-styles';

export const CaptionedContainer = componentFactory('CaptionedContainer', ({ Parent, componentName }) => {
  return class CaptionedContainer extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      caption: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      captionContainerStyle: PropTypes.any,
      captionStyle: PropTypes.any,
      contentContainerStyle: PropTypes.any
    };

    formatPropValue(name, _value) {
      var value = super.formatPropValue(name, _value);

      if (name === 'caption')
        return this.formatVerbiageProp(value);

      return value;
    }

    render(_children) {
      var caption = this.props.caption || '';

      return super.render(
        <View className={this.getRootClassName(componentName)} style={this.style('container', this.props.style)}>
          <View className={this.getClassName(componentName, 'title')} style={this.style('captionContainer', this.props.captionContainerStyle)}>
            <Text style={this.style('caption', this.props.captionStyle)}>{caption}</Text>
          </View>

          <View className={this.getClassName(componentName, 'container')} style={this.style('contentContainer', this.props.contentContainerStyle)}>
            {this.getChildren(_children)}
          </View>
        </View>
      );
    }
  };
});

export { styleSheet as captionedContainerStyles };

