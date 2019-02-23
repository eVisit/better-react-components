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
      onConfirm: PropTypes.func
    };

    static defaultProps = {
      title: 'Confirm',
      closeButtonProps: {
        testID: 'confirmModalClose'
      }
    };

    getButtons() {
      if (this.props.buttons)
        return this.props.buttons;

      return [
        {
          caption: 'No',
          testID: 'confirmModalDeny',
          focussed: (this.props.defaultAction === 'no'),
          onPress: (args) => {
            this.close({ ...args, result: 0 });
            return false;
          }
        },
        {
          caption: 'Yes',
          testID: 'confirmModalConfirm',
          focussed: (this.props.defaultAction === 'yes'),
          onPress: (args) => {
            if (this.callProvidedCallback('onConfirm', args) === false)
              return false;

            this.close({ ...args, result: 1 });
            return false;
          }
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
