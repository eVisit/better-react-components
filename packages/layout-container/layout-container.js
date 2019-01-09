import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import styleSheet                       from './layout-container-styles';
import { capitalize }                   from '@base/utils';

const LayoutContainer = componentFactory('LayoutContainer', ({ Parent, componentName }) => {
  return class LayoutContainer extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      direction: PropTypes.string,
      spacing: PropTypes.number
    }

    render(_children) {
      var direction = capitalize(this.props.direction || 'horizontal'),
          spacing = this.props.spacing || 0,
          children = this.getValidChildrenAsArray(_children),
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

export { LayoutContainer };
