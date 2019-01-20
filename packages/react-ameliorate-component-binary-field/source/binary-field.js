import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '@react-ameliorate/native-shims';
import { Field }                        from '@react-ameliorate/component-field';
import styleSheet                       from './binary-field-styles';

export const BinaryField = componentFactory('BinaryField', ({ Parent, componentName }) => {
  return class BinaryField extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      type: PropTypes.string
    }

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments);
      return props;
    }

    renderBinaryNode(value) {
      return (null);
    }

    render(children) {
      var value = !!this.value(undefined, { format: 'format' });

      return super.render(
        <View className={this.getRootClassName(componentName)} style={this.style('container')}>
          <View className={this.getClassName(componentName, 'binaryNodeContainer')} style={this.style('binaryNodeContainer')}>{this.renderBinaryNode(value)}</View>
          {this.getChildren(children)}
        </View>
      );
    }
  };
}, Field);

export { styleSheet as binaryFieldStyles };
