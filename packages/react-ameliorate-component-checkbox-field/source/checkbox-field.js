import React                            from 'react';
import { componentFactory }             from '@base';
import { View }                         from '@react-ameliorate/native-shims';
import { BinaryField }                  from '@react-ameliorate/component-binary-field';
import styleSheet                       from './checkbox-field-styles';

export const CheckBoxField = componentFactory('CheckBoxField', ({ Parent, componentName }) => {
  return class CheckBoxField extends Parent {
    static styleSheet = styleSheet;

    renderBinaryNode(value) {
      return (
        <View style={this.style('checkContainer')}>
        </View>
      );
    }
  };
}, BinaryField);

export { styleSheet as checkboxFieldStyles };
