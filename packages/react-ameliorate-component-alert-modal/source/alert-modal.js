import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { Text }                         from '@react-ameliorate/native-shims';
import { GenericModal }                 from '@react-ameliorate/component-generic-modal';
import { formatClientText }             from '@react-ameliorate/utils';
import styleSheet                       from './alert-modal-styles';

export const AlertModal = componentFactory('AlertModal', ({ Parent, componentName }) => {
  return class AlertModal extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      message: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ]),
      contextTextStyle: PropTypes.any,
      denyButtonCaption: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({ term: PropTypes.string })]),
      defaultAction: PropTypes.bool
    };

    static defaultProps = {
      title: '@ra/alert',
      closeButtonProps: {
        testID: 'alertModalClose'
      }
    };

    formatPropValue(name, _value) {
      var value = super.formatPropValue(name, _value);

      if (name === 'message')
        return this.formatVerbiageProp(value);

      return value;
    }

    getButtons(...args) {
      return [
        {
          caption: this.props.denyButtonCaption || this.langTerm('@ra/okay'),
          testID: 'alertModalConfirm',
          onPress: this.resolve.bind(this, null, 0),
          focussed: this.props.defaultAction,
          ...(args[0] || {})
        }
      ];
    }

    renderMessage(args = {}) {
      var message = args.message || this.props.message;
      if (!message)
        return null;

      return (
        <Text key="alert-modal-content-text" style={this.style('contentText', this.props.contextTextStyle)}>
          {formatClientText(message)}
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
