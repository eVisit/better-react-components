import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { Paper }                        from '@react-ameliorate/component-paper';
import styleSheet                       from './modal-styles';

export const Modal = componentFactory('Modal', ({ Parent, componentName }) => {
  return class Modal extends Parent {
    static styleSheet = styleSheet;
    static propTypes = [Paper.propTypes, {
      autoClose: PropTypes.bool
    }];

    static defaultProps = {
      autoClose: true
    };

    requestClose(args) {
      this.callProvidedCallback('onClose', args);
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
        })
      };
    }

    renderModal(children) {
      return (
        <View className={this.getRootClassName(componentName)} style={this.style('container', this.getState('modalPositionStyle'))}>
          {this.getChildren(children)}
        </View>
      );
    }

    render(children) {
      if (this.context._raModalManager)
        return this.renderModal(children);

      return (
        <Paper {...this.props} id={this.props.id} onMounted={this.onMounted} className={this.getRootClassName(componentName)}>
          {this.renderModal(children)}
        </Paper>
      );
    }
  };
});

export { styleSheet as modalStyles };
