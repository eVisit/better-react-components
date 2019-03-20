import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { ModalManager }                 from '@react-ameliorate/component-modal-manager';
import { Overlay }                      from '@react-ameliorate/component-overlay';
import { AlertModal }                   from '@react-ameliorate/component-alert-modal';
import { ConfirmModal }                 from '@react-ameliorate/component-confirm-modal';
import styleSheet                       from './application-styles';

function specializeEvent(event) {
  event.propagationStopped = false;
  event.immediatePropagationStopped = false;

  event.stopImmediatePropagation = (function(func) {
    return function() {
      event.propagationStopped = true;
      event.immediatePropagationStopped = true;

      return func.call(event);
    };
  })(event.stopImmediatePropagation);

  event.stopPropagation = (function(func) {
    return function() {
      event.propagationStopped = true;

      return func.call(event);
    };
  })(event.stopPropagation);

  return event;
}

function triggerGlobalEventActions(hooks, event, specializeEvent) {
  var componentIDs = Object.keys(hooks).sort((a, b) => {
        var x = hooks[a],
            y = hooks[b];

        return (y._order - x._order);
      }),
      nativeEvent = specializeEvent(event.nativeEvent),
      newEvent = { nativeEvent },
      eventName = nativeEvent.type;

  //console.log('Handling global event', eventName, componentIDs);
  for (var i = 0, il = componentIDs.length; i < il; i++) {
    if (nativeEvent.propagationStopped)
      break;

    var componentID = componentIDs[i],
        componentHooks = hooks[componentID],
        actions = componentHooks[eventName];

    if (!actions || !actions.length)
      continue;

    for (var j = 0, jl = actions.length; j < jl; j++) {
      var action = actions[j];
      if (!action || typeof action.callback !== 'function')
        continue;

      action.callback(newEvent);

      if (nativeEvent.immediatePropagationStopped || nativeEvent.propagationStopped) {
        //console.log(`Event ${eventName} handled by ${componentID}`);
        break;
      }
    }
  }
}

export const Application = componentFactory('Application', ({ Parent, componentName }) => {
  return class Application extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
    };

    static specializeEvent(...args) {
      return specializeEvent.call(this, ...args);
    }

    static triggerGlobalEventActions(hooks, event, _specializeEvent) {
      return triggerGlobalEventActions.call(this, hooks, event, _specializeEvent || specializeEvent);
    }

    getGlobalEventActionEventNames() {
      return [
        'keydown',
        'keypress',
        'keyup',
        'mousedown',
        'click',
        'mouseup'
      ];
    }

    globalEventActionListener(event) {
      return this.constructor.triggerGlobalEventActions(this.getGlobalEventActionHooks(), { nativeEvent: event }, this.constructor.specializeEvent);
    }

    componentMounting() {
      super.componentMounting.apply(this, arguments);

      if (typeof document !== 'undefined') {
        (this.getGlobalEventActionEventNames() || []).forEach((eventName) => {
          document.body.addEventListener(eventName, this.globalEventActionListener);
        });
      }
    }

    componentUnmounting() {
      super.componentUnmounting.apply(this, arguments);

      if (typeof document !== 'undefined') {
        (this.getGlobalEventActionEventNames() || []).forEach((eventName) => {
          document.body.removeEventListener(eventName, this.globalEventActionListener);
        });
      }
    }

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
