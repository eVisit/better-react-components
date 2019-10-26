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
      spacing: PropTypes.number,
      spacerStyle: PropTypes.any
    }

    render(_children) {
      const flattenChildren = (children) => {
        return [].concat.apply([], children);
      };

      var direction   = capitalize(this.props.direction || 'horizontal'),
          spacing     = this.props.spacing || 0,
          children    = flattenChildren(this.getChildren(_children, true)),
          isVertical  = (direction !== 'Horizontal');

      return super.render(
        <View className={this.getRootClassName(componentName)} style={this.style('container', this.props.style, `container${direction}`)}>
          {children.map((child, index) => {
            var spacingStyle        = (isVertical) ? { height: spacing } : { width: spacing },
                shouldRenderSpacer  = (index !== 0);

            return (
              <React.Fragment key={('' + index)}>
                {(shouldRenderSpacer) && <View className={this.getClassName(componentName, `${direction}Spacer`)} style={this.style('spacer', this.props.spacerStyle, spacingStyle)}/>}
                {child}
              </React.Fragment>
            );
          })}
        </View>
      );
    }
  };
});

export { styleSheet as layoutContainerStyles };
