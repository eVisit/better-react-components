import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Text }                         from '@react-ameliorate/native-shims';
import { GenericModal }                 from '@react-ameliorate/component-generic-modal';
import { formatClientText }             from '@react-ameliorate/utils';
import styleSheet                       from './confirm-modal-styles';

export const ConfirmModal = componentFactory('ConfirmModal', ({ Parent, componentName }) => {
  return class ConfirmModal extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      contextTextStyle: PropTypes.any,
      defaultAction: PropTypes.oneOf(['yes', 'no']),
      onDeny: PropTypes.func,
      onConfirm: PropTypes.func
    };

    static defaultProps = {
      title: '@ra/confirm',
      closeButtonProps: {
        testID: 'confirmModalClose'
      },
      closeButtonEventName: 'onDeny'
    };

    formatPropValue(name, _value) {
      var value = super.formatPropValue(name, _value);

      if (name === 'message')
        return this.formatVerbiageProp(value);

      return value;
    }

    getButtons() {
      if (this.props.buttons)
        return this.props.buttons;

      return [
        {
          caption: this.langTerm('@ra/no'),
          testID: 'confirmModalDeny',
          focussed: (this.props.defaultAction === 'no'),
          onPress: this.resolve.bind(this, 'onDeny', 0)
        },
        {
          caption: this.langTerm('@ra/yes'),
          testID: 'confirmModalConfirm',
          focussed: (this.props.defaultAction === 'yes'),
          onPress: this.resolve.bind(this, 'onConfirm', 1)
        }
      ];
    }

    renderMessage(args = {}) {
      return (
        <Text key="confirm-modal-content-text" style={this.style('contentText', this.props.contextTextStyle)}>
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

export { styleSheet as confirmModalStyles };
