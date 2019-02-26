import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Text }                         from '@react-ameliorate/native-shims';
import { GenericModal }                 from '@react-ameliorate/component-generic-modal';
import styleSheet                       from './confirm-modal-styles';

export const ConfirmModal = componentFactory('ConfirmModal', ({ Parent, componentName }) => {
  return class ConfirmModal extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      message: PropTypes.string,
      defaultAction: PropTypes.oneOf(['yes', 'no']),
      onDeny: PropTypes.func,
      onConfirm: PropTypes.func
    };

    static defaultProps = {
      title: 'Confirm',
      closeButtonProps: {
        testID: 'confirmModalClose'
      },
      closeButtonEventName: 'onDeny'
    };

    getButtons() {
      async function confirmOrDenyCallback(eventName, result, args) {
        if (closing)
          return false;

        closing = true;

        var callbackResult = await this.callProvidedCallback(eventName, args);
        if (callbackResult === false) {
          closing = false;
          return false;
        }

        this.close({ ...args, result });

        return false;
      }

      if (this.props.buttons)
        return this.props.buttons;

      var closing = false;

      return [
        {
          caption: 'No',
          testID: 'confirmModalDeny',
          focussed: (this.props.defaultAction === 'no'),
          onPress: confirmOrDenyCallback.bind(this, 'onDeny', 0)
        },
        {
          caption: 'Yes',
          testID: 'confirmModalConfirm',
          focussed: (this.props.defaultAction === 'yes'),
          onPress: confirmOrDenyCallback.bind(this, 'onConfirm', 1)
        }
      ];
    }

    getContent(args) {
      var children = super.getContent(args);
      if (!children)
        return (<Text key="confirm-modal-content-text" style={this.style('contentText')}>{(this.props.message || '')}</Text>);

      return children;
    }
  };
}, GenericModal);

export { styleSheet as confirmModalStyles };
