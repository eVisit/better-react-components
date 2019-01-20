export class Application {
  construct() {
  }

  pushModal(_modal) {
    const onClose = (args) => {
      var modalProps = _modal.props,
          func = (modalProps && modalProps.onClose);

      if (typeof func === 'function' && func.call(this, args) === false)
        return;

      this.popModal(modal);
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

    var modals = this.getState('_modals', []).slice();
    modals.push(modal);
    this.setState({ _modals: modals });

    return () => onClose({});
  }

  popModal(modal) {
    var modals = this.getState('_modals', []),
        index = modals.indexOf(modal);

    if (index >= 0) {
      modals = modals.slice();
      modals.splice(index, 1);
      this.setState({ _modals: modals });
    }
  }
}
