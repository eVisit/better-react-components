import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { GenericModal }                 from '@react-ameliorate/component-generic-modal';
import { DynamicForm }                  from '@react-ameliorate/component-dynamic-form';
import styleSheet                       from './prompt-modal-styles';

export const PromptModal = componentFactory('PromptModal', ({ Parent, componentName }) => {
  return class PromptModal extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      columns: PropTypes.number,
      fields: PropTypes.array,
      horizontalSpacing: PropTypes.number,
      verticalSpacing: PropTypes.number,
      defaultAction: PropTypes.oneOf(['yes', 'no']),
      onDeny: PropTypes.func,
      onConfirm: PropTypes.func,
      data: PropTypes.oneOfType([ PropTypes.object, PropTypes.array ])
    };

    static defaultProps = {
      title: '@ra/prompt',
      closeButtonProps: {
        testID: 'promptModalClose'
      },
      closeButtonEventName: 'onDeny'
    };

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments);

      return {
        ...props,
        contentContainerStyle: this.style('formContainer')
      };
    }

    async getFormData() {
      try {
        var form = this.getReference('form');
        var errors = await form.validate();
        if (errors)
          throw errors;

        var formData = await form.value();
        return formData;
      } catch (e) {
        throw e;
      }
    }

    async resolve(eventName, result, _args) {
      this.closing = true;

      var args = _args;
      if (eventName === 'onConfirm') {
        try {
          var data = await this.getFormData();
          args = Object.assign({}, args, { data });
        } catch (e) {
          this.closing = false;
          throw e;
        }
      }

      return super.resolve(eventName, result, { ...args, data }, true);
    }

    getButtons() {
      if (this.props.buttons)
        return this.props.buttons;

      return [
        {
          caption: this.langTerm('@ra/cancel'),
          testID: 'promptModalDeny',
          focussed: (this.props.defaultAction === 'no'),
          onPress: this.resolve.bind(this, 'onDeny', 0)
        },
        {
          caption: this.langTerm('@ra/okay'),
          testID: 'promptModalConfirm',
          focussed: (this.props.defaultAction === 'yes'),
          onPress: this.resolve.bind(this, 'onConfirm', 1)
        }
      ];
    }

    getContent(args) {
      var children = super.getContent(args);
      if (children)
        return children;

      var spacing = this.styleProp('DEFAULT_CONTENT_PADDING');

      return (
        <DynamicForm
          ref={this.captureReference('form')}
          columns={this.props.columns || 2}
          horizontalSpacing={(this.props.horizontalSpacing != null) ? this.props.horizontalSpacing : spacing}
          verticalSpacing={(this.props.verticalSpacing != null) ? this.props.verticalSpacing : spacing}
          fields={this.props.fields}
          style={this.style('form')}
          data={this.props.data}
        />
      );
    }
  };
}, GenericModal);

export { styleSheet as promptModalStyles };
