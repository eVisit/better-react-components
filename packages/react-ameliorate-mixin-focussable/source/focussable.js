import { preventEventDefault, stopEventImmediatePropagation } from '@react-ameliorate/utils';

export function Focussable({ Parent, componentName }) {
  return class Focussable extends Parent {
    getParentField() {
      return this.context.parentField;
    }

    getParentForm() {
      return this.context.parentForm;
    }

    provideContext() {
      return {
        parentField: this
      };
    }

    registerDefaultFocussedAction() {
      this.registerDefaultEventAction('keydown', (event) => {

        var nativeEvent = event && event.nativeEvent;
        if (nativeEvent.defaultPrevented)
          return;

        var keyCode       = ('' + (nativeEvent.code || nativeEvent.key)),
            focussedField = this.getCurrentlyFocussedField();

        if (keyCode === 'Tab') {
          if (!focussedField || focussedField !== this)
            return;

          var form = this.getParentForm();

          if (form && typeof form.focusNext === 'function') {
            preventEventDefault(event);
            stopEventImmediatePropagation(event);
            form.focusNext(this, nativeEvent.shiftKey)
          }
        } else if (keyCode === 'Enter') {
          if (!this.props.actionable)
            return;

          if (focussedField && typeof focussedField.onSubmitEditing === 'function')
            return;

          if (typeof this.onPress === 'function') {
            preventEventDefault(event);
            stopEventImmediatePropagation(event);
            this.onPress(event);
          }
        }
      });
    }

    getFieldUUID() {
      return this.getComponentID();
    }

    compare(field) {
      return (field && typeof field.getFieldUUID === 'function' && field.getFieldUUID() === this.getFieldUUID());
    }

    getFieldReference() {
      return this.getReference('_fieldInstance');
    }

    defaultOnFocus(event, blurLastField) {
      var field = this.getFieldReference(),
          value = this.value();

      this._focussedFieldValue = value;
      this.triggerAnalyticsEvent({ action: 'focussed', 'actionTarget': this.props.field, targetType: 'field' });

      if (this.callProvidedCallback('onFocus', [event, value, field, this]) === false)
        return false;

      if (!this.props.skipFormRegistration) {
        var currentlyFocussedField = this.getCurrentlyFocussedField();
        if (currentlyFocussedField && !this.compare(currentlyFocussedField))
          currentlyFocussedField.blur();

        this.setCurrentlyFocussedField(this, blurLastField);
      }

      this.setComponentFlagsFromObject({ focussed: true });
    }

    defaultOnBlur(event) {
      var field = this.getFieldReference(),
          value = this.value();

      if (value !== this._focussedFieldValue) {
        this._focussedFieldValue = value;
        this.triggerAnalyticsEvent({ action: 'changed', 'actionTarget': this.props.field, targetType: 'field' });
      }

      this.triggerAnalyticsEvent({ action: 'blurred', 'actionTarget': this.props.field, targetType: 'field' });

      if (this.callProvidedCallback('onBlur', [event, value, field, this]) === false)
        return false;

      if (this.compare(this.getCurrentlyFocussedField()))
        this.setCurrentlyFocussedField(null);

      this.setComponentFlagsFromObject({ focussed: false });

      this.value(this.value(undefined, { format: 'format' }));
    }

    focus(reverse) {
      this.setCurrentlyFocussedField(this, true);
      var field = this.getFieldReference();

      if (this.callProvidedCallback('onRequestFocus', [field, this]) === false)
        return false;

      this.setComponentFlagsFromObject({ focussed: true });

      if (field && typeof field.focus === 'function')
        field.focus();
    }

    blur() {
      var field = this.getFieldReference();

      if (this.getCurrentlyFocussedField() !== field)
        return;

      if (this.callProvidedCallback('onRequestBlur', [field, this]) === false)
        return false;

      this.setComponentFlagsFromObject({ focussed: false });

      if (field && typeof field.blur === 'function')
        field.blur();
    }

    getFieldName() {
      return this.props.field;
    }

    componentMounting() {
      this.registerDefaultFocussedAction();
      super.componentMounting.apply(this, arguments);

      if (this.props.skipFormRegistration)
        return;

      var parentForm = this.getParentForm();

      if (parentForm && typeof parentForm.registerFormField === 'function')
        parentForm.registerFormField(this);
    }

    componentUnmounting() {
      this.unregisterDefaultEventActions();
      super.componentUnmounting.apply(this, arguments);

      var parentForm = this.getParentForm();
      if (parentForm && typeof parentForm.unregisterFormField === 'function')
        parentForm.unregisterFormField(this);
    }
  };
}
