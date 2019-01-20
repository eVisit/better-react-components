import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { TouchableOpacity }             from '@react-ameliorate/native-shims';
import { ContextProvider }              from '@react-ameliorate/component-context-provider';
import { Paper }                        from '@react-ameliorate/component-paper';
import { TransitionGroup }              from '@react-ameliorate/component-transition-group';
import {
  stopEventPropagation,
  isDescendantElement,
  findDOMNode
}                                       from '@react-ameliorate/utils';
import styleSheet                       from './modal-manager-styles';

export const ModalManager = componentFactory('ModalManager', ({ Parent, componentName }) => {
  return class ModalManager extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
      modals: PropTypes.array
    };

    getContext() {
      return {
        _raModalManager: this
      };
    }

    getID() {
      return (this.props.id || this.getComponentID());
    }

    getAllModals() {
      return (this.props.modals || []);
    }

    getCurrentModal() {
      var modals = this.getAllModals(),
          lastModal = (modals && modals[modals.length - 1]);

      return lastModal;
    }

    onAnimationStyle({ element }) {
      if (!element)
        return;

      var lastModal = this.getCurrentModal(),
          props = element.props,
          lastModalID = (lastModal && lastModal.props && lastModal.props.id),
          thisModalID = (props && props.id);

      return (thisModalID === lastModalID) ? null : {
        display: 'none'
      };
    }

    onShouldClose(event) {
      stopEventPropagation(event);

      var rootElement = this.getReference('rootElement'),
          nativeEvent = (event && event.nativeEvent);

      if (!nativeEvent || !rootElement)
        return;

      if (isDescendantElement(rootElement, nativeEvent.target))
        return;

      var modals = this.getAllModals(),
          lastModal = this.getCurrentModal(),
          lastModalProps = (lastModal && lastModal.props),
          autoClose = (lastModalProps && lastModalProps.autoClose);

      if (autoClose && modals.length > 0) {
        this.getApp(({ app }) => {
          app.popModal(lastModal);
        });
      }
    }

    render(children) {
      var modals = this.getAllModals();
      if (!(modals instanceof Array) || !modals.length)
        return null;

      return (
        <Paper
          {...this.props}
          id={this.getID()}
          className={this.getRootClassName(componentName)}
          style={this.style('fullSize', this.props.style)}
          onShouldClose={this.onShouldClose}
        >
          <TouchableOpacity
            className={this.getRootClassName(componentName, 'overlay')}
            style={this.style('fullSize', 'overlay')}
            onPress={this.onShouldClose}
            onKeyDown={this.onKeyDown}
            tabIndex="-1"
          >
            <ContextProvider context={this.getContext} style={this.style('fullSize')}>
              <TransitionGroup
                ref={this.captureReference('rootElement', findDOMNode)}
                style={this.style('fullSize')}
                onAnimationStyle={this.onAnimationStyle}
              >
                {modals}
              </TransitionGroup>
              {this.getChildren(children)}
            </ContextProvider>
          </TouchableOpacity>
        </Paper>
      );
    }
  };
});

export { styleSheet as modalManagerStyles };
