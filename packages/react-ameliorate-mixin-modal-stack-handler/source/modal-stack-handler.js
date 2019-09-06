import { PropTypes }    from '@react-ameliorate/core';
import { AlertModal }   from '@react-ameliorate/component-alert-modal';
import { ConfirmModal } from '@react-ameliorate/component-confirm-modal';

export function ModalStackHandler({ Parent, componentName }) {
  return class ModalStackHandler extends Parent {
    static propTypes = {
      onModalStackChanged: PropTypes.func
    };

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          _modals: []
        })
      };
    }

    onStateUpdated__modals(value, oldValue, initial) {
      this.callProvidedCallback('onModalStackChanged', { modals: (value || []).slice(), _modals: (oldValue || []).slice(), initial });
    }

    showAlertModal(props) {
      var children = this.getChildren((props || {}).children);
      return this.pushModal(<AlertModal {...props}>{children}</AlertModal>);
    }

    showConfirmModal(props) {
      var children = this.getChildren((props || {}).children);
      return this.pushModal(<ConfirmModal {...props}>{children}</ConfirmModal>);
    }

    getModals() {
      return this.getState('_modals', []);
    }

    pushModal(_modal) {
      const onClose = async (args) => {
        var result;

        if (typeof userOnCloseFunc === 'function') {
          try {
            result = await userOnCloseFunc.call(this, args);
            if (result === false)
              return false;
          } catch (e) {
            return false;
          }
        }

        this.popModal(modal);

        return result;
      };

      var modal = _modal;
      if (!modal)
        return;

      var modalProps = modal.props,
          userOnCloseFunc = (modalProps && modalProps.onClose),
          modalID = this.generateUniqueComponentID('Modal');

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

      this.setState({ _modals: [] });
    }

    isModalActive() {
      return !!(this.getModals().length);
    }
  };
}
