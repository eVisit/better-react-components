import React                              from 'react';
import { componentFactory, PropTypes }    from '@react-ameliorate/core';
import { View, TouchableWithoutFeedback } from '@react-ameliorate/native-shims';
import { Field }                          from '@react-ameliorate/component-field';
import styleSheet                         from './binary-field-styles';

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

    onPress(event) {
      if (this.callProvidedCallback('onPress', { event }) === false)
        return false;

      var value = this.value();
      this.value(!value, { userInitiated: true });
    }

    render(_children) {
      var value = !!this.value();

      return super.render(
        <TouchableWithoutFeedback
          className={this.getRootClassName(componentName)}
          onPress={this.onPress}
        >
          <View className={this.getRootClassName(componentName, 'container')} style={this.style('container')}>
            <View className={this.getClassName(componentName, 'binaryNodeContainer')} style={this.style('binaryNodeContainer')}>{this.renderBinaryNode(value)}</View>
            {this.getChildren(_children)}
          </View>
        </TouchableWithoutFeedback>
      );
    }
  };
}, Field);

export { styleSheet as binaryFieldStyles };
