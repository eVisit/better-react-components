import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { ModalManager }                 from '@react-ameliorate/component-modal-manager';
import { Overlay }                      from '@react-ameliorate/component-overlay';
import { AlertModal }                   from '@react-ameliorate/component-alert-modal';
import { ConfirmModal }                 from '@react-ameliorate/component-confirm-modal';
import styleSheet                       from './application-styles';

export const Application = componentFactory('Application', ({ Parent, componentName }) => {
  return class Application extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
    };

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          _modals: []
        })
      };
    }

    showAlertModal(props) {
      return this.pushModal(<AlertModal {...props}/>);
    }

    showConfirmModal(props) {
      return this.pushModal(<ConfirmModal {...props}/>);
    }

    getModals() {
      return this.getState('_modals', []);
    }

    pushModal(_modal) {
      const onClose = async (args) => {
        var modalProps = _modal.props,
            func = (modalProps && modalProps.onClose);

        if (typeof func === 'function') {
          var result = await func.call(this, args);
          if (result === false)
            return false;
        }

        this.popModal(modal);

        return result;
      };

      var modal = _modal;
      if (!modal)
        return;

      var modalID = this.generateUniqueComponentID('Modal');

      modal = this.cloneComponents(modal, ({ childProps }) => {
        return Object.assign({}, childProps, {
          id: modalID,
          key: modalID,
          onClose
        });
      });

      var modals = this.getModals().slice();
      modals.push(modal);
      this.setState({ _modals: modals });

      return async () => await onClose({ event: null, result: -2 });
    }

    popModal(modal) {
      var modals = this.getModals(),
          index = modals.indexOf(modal);

      if (index >= 0) {
        modals = modals.slice();
        modals.splice(index, 1);
        this.setState({ _modals: modals });
      }
    }

    popAllModals() {
      if (!this.getState('_modals', []).length)
        return;

      this.setState('_modals', []);
    }

    isModalActive() {
      return !!(this.getModals().length);
    }

    render(_children) {
      console.log('THESE MODALS: ', this.getModals());
      return super.render(
        <Overlay>
          {this.getChildren(_children)}

          <ModalManager modals={this.getModals()}/>
        </Overlay>
      );
    }
  };
});

export { styleSheet as modalManagerStyles };
