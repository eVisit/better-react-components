import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Form }                         from '@react-ameliorate/component-form';
import { TextField }                    from '@react-ameliorate/component-text-field';
import { CheckBoxField }                from '@react-ameliorate/component-checkbox-field';
import { NumberField }                  from '@react-ameliorate/component-number-field';
import { DateField }                    from '@react-ameliorate/component-date-field';
import { SelectField }                  from '@react-ameliorate/component-select-field';
import styleSheet                       from './dynamic-form-styles';

export const DynamicForm = componentFactory('DynamicForm', ({ Parent, componentName }) => {
  return class DynamicForm extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      fields: PropTypes.arrayOf(PropTypes.object)
    };

    resolveState({ props }) {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
        })
      };
    }

    getChildColSpan(args) {
      var { index } = args,
          fields    = this.props.fields,
          colSpan;

      if (index < fields.length) {
        var field = fields[index];
        if (field)
          colSpan = field.colSpan;
      }

      if (colSpan === null)
        colSpan = super.getChildColSpan(args);

      return colSpan || 1;
    }

    getChildKey(args) {
      var { index } = args,
          fields    = this.props.fields,
          key;

      if (index < fields.length) {
        var field = fields[index];
        if (field)
          key = field.key || field.id || field.field;
      }

      if (key === null)
        key = super.getChildKey(args);

      return (key || `child-${index}`);
    }

    getFieldComponentFromType({ field, type }) {
      var typeMap = {
        'text': {
          component: TextField
        },
        'string': {
          component: TextField
        },
        'number': {
          component: NumberField
        },
        'integer': {
          component: NumberField,
          props: {
            precision: 0
          }
        },
        'float': {
          component: NumberField,
          props: {
            precision: 2
          }
        },
        'double': {
          component: NumberField,
          props: {
            precision: 4
          }
        },
        'date': {
          component: DateField
        },
        'checkbox': {
          component: CheckBoxField
        },
        'list': {
          component: SelectField
        }
      };

      var component = typeMap[type];
      if (!component) {
        console.warn('Unknown field type: ', type);
        component = { component: TextField };
      }

      return component;
    }

    getFieldComponentFromFieldDefinition({ field }) {
      var type            = field.type,
          component       = this.getFieldComponentFromType({ type, field }),
          FieldComponent  = component.component,
          extraProps      = component.props || {};

      return (<FieldComponent {...this.passProps(/^(type|colSpan)$/, extraProps, field)}/>);
    }

    generateFieldComponents({ children, fields }) {
      return fields.map((field, index) => {
        return this.getFieldComponentFromFieldDefinition({ field, index, fields });
      });
    }

    render(_children) {
      var children = this.getChildren(_children, true),
          fields   = this.props.fields || [];

      return super.render(
        this.generateFieldComponents({ children, fields })
      );
    }
  };
}, Form);

export { styleSheet as dynamicFormStyles };
