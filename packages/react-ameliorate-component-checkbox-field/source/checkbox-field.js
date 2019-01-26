import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text }                   from '@react-ameliorate/native-shims';
import { BinaryField }                  from '@react-ameliorate/component-binary-field';
import { Icon }                         from '@react-ameliorate/component-icon';
import styleSheet                       from './checkbox-field-styles';

export const CheckBoxField = componentFactory('CheckBoxField', ({ Parent, componentName }) => {
  return class CheckBoxField extends Parent {
    static styleSheet = styleSheet;

    static PropTypes = {
      checkedIcon: PropTypes.string,
      uncheckedIcon: PropTypes.string
    };

    renderBinaryNode(value) {
      var checkedIcon = this.props.checkedIcon || 'check',
          uncheckedIcon = this.props.uncheckedIcon,
          icon = (!!value) ? checkedIcon : uncheckedIcon;

      return (
        <View style={this.style('checkbox')}>
          {(!!icon) && <Icon icon={icon} style={this.style('binaryFieldIcon')}/>}
        </View>
      );
    }

    render(_children) {
      var caption = this.getCaption(_children);

      return super.render(
        <View className={this.getClassName(componentName)} style={this.style('captionContainer')}>
          {caption}
        </View>
      );
    }
  };
}, BinaryField);

export { styleSheet as checkboxFieldStyles };
