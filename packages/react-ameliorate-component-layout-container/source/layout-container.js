import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { capitalize }                   from '@react-ameliorate/utils';
import styleSheet                       from './layout-container-styles';

export const LayoutContainer = componentFactory('LayoutContainer', ({ Parent, componentName }) => {
  return class LayoutContainer extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      direction: PropTypes.string,
      spacing: PropTypes.number
    }

    render(_children) {
      var direction = capitalize(this.props.direction || 'horizontal'),
          spacing = this.props.spacing || 0,
          children = this.getChildren(_children, true),
          isVertical = (direction !== 'Horizontal');

      return (
        <View className={this.getRootClassName(componentName)} style={this.style('container', this.props.style, `container${direction}`)}>
          {children.map((child, index) => {
            var isLastChild = !((index + 1) < children.length),
                spacingStyle = (isVertical) ? { paddingBottom: spacing } : { paddingRight: spacing };

            return (
              <View className={this.getClassName(componentName, 'childWrapper')} key={('' + index)} style={this.style('childContainer', (isLastChild) ? null : spacingStyle)}>
                {child}
              </View>
            );
          })}
        </View>
      );
    }
  };
});

export { styleSheet as layoutContainerStyles };
