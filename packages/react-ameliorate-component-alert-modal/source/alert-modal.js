import { componentFactory }             from '@react-ameliorate/core';
import { GenericModal }                 from '@react-ameliorate/component-generic-modal';
import styleSheet                       from './alert-modal-styles';

export const AlertModal = componentFactory('AlertModal', ({ Parent, componentName }) => {
  return class AlertModal extends Parent {
    static styleSheet = styleSheet;
    static defaultProps = {
      title: 'Alert',
      buttons: [
        {
          caption: 'Okay'
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

export { styleSheet as alertModalStyles };
