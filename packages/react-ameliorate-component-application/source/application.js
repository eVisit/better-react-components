import React                                  from 'react';
import { componentFactory, PropTypes }        from '@react-ameliorate/core';
import { ModalManager }                       from '@react-ameliorate/component-modal-manager';
import { Overlay }                            from '@react-ameliorate/component-overlay';
import { Tooltip }                            from '@react-ameliorate/component-tooltip';
import styleSheet                             from './application-styles';
import { findClosestComponentFromDOMElement } from '@react-ameliorate/utils';
import { ModalStackHandler }                  from '@react-ameliorate/mixin-modal-stack-handler';
import { TooltipStackHandler }                from '@react-ameliorate/mixin-tooltip-stack-handler';

const ANCHOR_POSITION_MAP = {
  'left'    : { left:   'right',  centerV: 'centerV' },
  'right'   : { right:  'left',   centerV: 'centerV' },
  'top'     : { top:    'bottom', centerH: 'centerH' },
  'bottom'  : { bottom: 'top',    centerH: 'centerH' }
};

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

const tooltipIDMap = [];
var tooltipIDCounter = 1;

function getTooltipID(anchor) {
  var tooltipInfo = tooltipIDMap.find((t) => (t.anchor === anchor));
  if (tooltipInfo)
    return tooltipInfo.id;

  tooltipInfo = {
    anchor,
    id: `ra-tooltip-${tooltipIDCounter++}`
  };

  tooltipIDMap.push(tooltipInfo);

  return tooltipInfo.id;
}

function removeTooltipID(anchor) {
  var index = tooltipIDMap.findIndex((t) => (t.anchor === anchor));
  if (index < 0)
    return;

  tooltipIDMap.splice(index, 1);
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

    constructor(...args) {
      super(...args);

      Object.defineProperties(this, {
        'application': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: this
        },
        '_currentlyFocussedField': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: null
        }
      });
    }

    getGlobalEventActionEventNames() {
      return [
        'keydown',
        'keypress',
        'keyup',
        'mousedown',
        'click',
        'mouseup',
        'mouseover',
        'mouseout'
      ];
    }

    globalEventActionListener(event) {
      return this.constructor.triggerGlobalEventActions(this.getGlobalEventActionHooks(), { nativeEvent: event }, this.constructor.specializeEvent);
    }

    getTooltipShowTime() {
      return 250;
    }

    getTooltipHideTime() {
      return 250;
    }

    registerTooltipMouseOverHandler() {
      const tooltipHandlerFactory = (eventType) => {
        return (event) => {
          var nativeEvent = event.nativeEvent,
              target      = (nativeEvent && nativeEvent.target);

          if (!target)
            return;

          var tooltipElement = target.closest('[data-tooltip]:not([data-tooltip=""])');
          if (!tooltipElement)
            return;

          var tooltipComponent = findClosestComponentFromDOMElement(tooltipElement);
          if (!tooltipComponent)
            return;

          var time = (eventType === 'mouseover') ? this.getTooltipShowTime() : this.getTooltipHideTime();
          if (time == null)
            return;

          var tooltipID = getTooltipID(tooltipComponent);

          this.delay(() => {
            if (eventType !== 'mouseover') {
              this.clearDelay(tooltipID);
              removeTooltipID(tooltipComponent);
              this.popTooltip({ anchor: tooltipComponent });

              return;
            }

            if (!tooltipElement.parentElement)
              return;

            var tooltip = tooltipElement.getAttribute('data-tooltip');
            if (!tooltip)
              return;

            var tooltipSide = tooltipElement.getAttribute('data-tooltip-side'),
                anchorPosition = ANCHOR_POSITION_MAP[tooltipSide];

            if (!anchorPosition)
              anchorPosition = ANCHOR_POSITION_MAP['bottom'];

            this.pushTooltip({ id: tooltipID, caption: tooltip, anchorPosition, anchor: tooltipComponent });
          }, time, tooltipID);
        };
      };

      this.unregisterDefaultEventActions();

      this.registerDefaultEventAction('mouseover', tooltipHandlerFactory('mouseover'));
      this.registerDefaultEventAction('mouseout', tooltipHandlerFactory('mouseout'));
    }

    componentMounting() {
      super.componentMounting.apply(this, arguments);

      if (typeof document !== 'undefined') {
        (this.getGlobalEventActionEventNames() || []).forEach((eventName) => {
          document.body.addEventListener(eventName, this.globalEventActionListener);
        });

        this.registerTooltipMouseOverHandler();
      }
    }

    componentUnmounting() {
      super.componentUnmounting.apply(this, arguments);

      if (typeof document !== 'undefined') {
        this.unregisterDefaultEventActions();

        (this.getGlobalEventActionEventNames() || []).forEach((eventName) => {
          document.body.removeEventListener(eventName, this.globalEventActionListener);
        });
      }
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          locale: null
        })
      };
    }

    getLocale() {
      return this.getState('locale');
    }

    setLocale(locale) {
      this.setState({
        locale
      });
    }

    provideContext() {
      return {
        application: this,
        locale: this.getState('locale'),
        modalContext: this
      };
    }

    render(_children) {
      var tooltips = this.getTooltips();

      return super.render(
        <Overlay>
          {this.getChildren(_children)}

          <ModalManager modals={this.getModals()}/>
          {(tooltips && tooltips.length > 0) && (
            tooltips.map((tooltip) => {
              return (<Tooltip key={tooltip.id} {...tooltip}/>);
            })
          )}
        </Overlay>
      );
    }
  };
}, {
  mixins: [ ModalStackHandler, TooltipStackHandler ]
});

export { styleSheet as modalManagerStyles };
