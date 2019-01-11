import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import { Text }                         from '../text';
import styleSheet                       from './captioned-container-styles';

const CaptionedContainer = componentFactory('CaptionedContainer', ({ Parent, componentName }) => {
  return class CaptionedContainer extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      caption: PropTypes.string,
      captionContainerStyle: PropTypes.any,
      captionStyle: PropTypes.any,
      contentContainerStyle: PropTypes.any
    };

    render(_children) {
      var caption = this.props.caption || '';

      return (
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

export { CaptionedContainer };
