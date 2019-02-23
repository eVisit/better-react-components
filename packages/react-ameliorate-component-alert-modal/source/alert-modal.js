import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Text }                         from '@react-ameliorate/native-shims';
import { GenericModal }                 from '@react-ameliorate/component-generic-modal';
import styleSheet                       from './alert-modal-styles';

export const AlertModal = componentFactory('AlertModal', ({ Parent, componentName }) => {
  return class AlertModal extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      message: PropTypes.string
    };

    static defaultProps = {
      title: 'Alert',
      closeButtonProps: {
        testID: 'alertModalClose'
      }
    };

    getButtons() {
      if (this.props.buttons)
        return this.props.buttons;

      return [
        {
          caption: 'Okay',
          testID: 'alertModalConfirm',
          onPress: (args) => {
            this.close({ ...args, result: 0 });
            return false;
          }
        }
      ];
    }

    getContent(args) {
      var children = super.getContent(args);
      if (!children)
        return (<Text key="alert-modal-content-text" style={this.style('contentText')}>{(this.props.message || '')}</Text>);

      return children;
    }
  };
}, GenericModal);

export { styleSheet as alertModalStyles };
