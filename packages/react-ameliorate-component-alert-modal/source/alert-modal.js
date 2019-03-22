import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Text }                         from '@react-ameliorate/native-shims';
import { GenericModal }                 from '@react-ameliorate/component-generic-modal';
import { formatClientText }             from '@react-ameliorate/utils';
import styleSheet                       from './alert-modal-styles';

export const AlertModal = componentFactory('AlertModal', ({ Parent, componentName }) => {
  return class AlertModal extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      message: PropTypes.string,
      contextTextStyle: PropTypes.any
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
          caption: this.langTerm('@ra/okay'),
          testID: 'alertModalConfirm',
          onPress: this.resolve.bind(this, null, 0)
        }
      ];
    }

    renderMessage(args = {}) {
      return (
        <Text key="alert-modal-content-text" style={this.style('contentText', this.props.contextTextStyle)}>
          {formatClientText(args.message || this.props.message || '')}
        </Text>
      );
    }

    getContent(args) {
      var children = super.getContent(args);
      if (!children)
        return (this.renderMessage(args));

      return children;
    }
  };
}, GenericModal);

export { styleSheet as alertModalStyles };
