import { componentFactory } from '@react-ameliorate/core';
import { GenericModal }     from '@react-ameliorate/component-generic-modal';
import styleSheet           from './confirm-modal-styles';

export const ConfirmModal = componentFactory('ConfirmModal', ({ Parent, componentName }) => {
  return class ConfirmModal extends Parent {
    static styleSheet = styleSheet;
    static defaultProps = {
      title: 'Confirm',
      buttons: [
        {
          caption: 'No',
        },
        {
          caption: 'Yes',
          onPress: function(args) {
            return this.callProvidedCallback('onConfirm', args);
          }
        }
      ]
    };

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
        })
      };
    }
  };
}, GenericModal);

export { styleSheet as confirmModalStyles };
