import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { Field }                        from '@react-ameliorate/component-field';
import styleSheet                       from './form-styles';

export const Form = componentFactory('Form', ({ Parent, componentName }) => {
  return class Form extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
    };

    construct() {
      this._registeredFields = {};
    }

    componentMounted() {
      super.componentMounted();

      var parentForm = this.getParentForm();
      if (parentForm)
        parentForm.registerField(this);
    }

    componentUnmounting() {
      super.componentUnmounting();

      var parentForm = this.getParentForm();
      if (parentForm)
        parentForm.unregisterField(this);
    }

    getParentForm() {
      return this.context._raParentForm;
    }

    getParentField() {
      return this.context._raParentField;
    }

    getFieldID() {
      return this.getComponentID();
    }

    provideContext() {
      return {
        _raParentForm: this
      };
    }

    resolveState({ props }) {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
        })
      };
    }

    registerField(field) {
      if (!field)
        return;

      this._registeredFields[field.getFieldID()] = field;
    }

    unregisterField(field) {
      if (!field)
        return;

      delete this._registeredFields[field.getFieldID()];
    }

    value() {
      var fields = this._registeredFields,
          keys = Object.keys(fields),
          values = {};

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            field = fields[key];

        if (!field)
          continue;

        var fieldName = (field.props && field.getField());
        if (!fieldName)
          continue;

        values[fieldName] = field.value();
      }

      return values;
    }

    async validate() {
      const validateField = async (field) => {
        try {
          var result = await field.validate();
          return { result, field };
        } catch (e) {
          return { result: e, field };
        }
      };

      const addResultsToErrors = (results, errors) => {
        for (var i = 0, il = results.length; i < il; i++) {
          var result = results[i];
          if (!result)
            continue;

          var validationResult  = result.result,
              field             = result.field,
              fieldName         = (field && field.getField());

          if (!fieldName || !validationResult)
            continue;

          if (validationResult instanceof Array) {
            addResultsToErrors(validationResult, errors);
            continue;
          }

          if (validationResult instanceof Error)
            validationResult = { type: 'error', message: validationResult.message };

          errors.push(Object.assign({ field, fieldName }, validationResult));
        }
      };

      var fields    = this._registeredFields,
          keys      = Object.keys(fields),
          promises  = [];

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            field = fields[key];

        if (!field)
          continue;

        promises.push(validateField(field));
      }

      var results = await Promise.all(promises),
          errors  = [];

      addResultsToErrors(results, errors);

      return (errors.length) ? { errors, message: errors.map((error) => (error && error.message)).filter(Boolean).join('. ') } : undefined;
    }

    render(children) {
      return super.render(
        <View
          className={this.getRootClassName(componentName)}
          style={this.style('rootContainer')}
        >
          {this.getChildren(children)}
        </View>
      );
    }
  };
}, Field);

export { styleSheet as formStyles };
