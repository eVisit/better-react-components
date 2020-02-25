import React                                  from 'react';
import { componentFactory, PropTypes }        from '@react-ameliorate/core';
import { ModalManager }                       from '@react-ameliorate/component-modal-manager';
import { Overlay }                            from '@react-ameliorate/component-overlay';
import { Tooltip }                            from '@react-ameliorate/component-tooltip';
import styleSheet                             from './application-styles';
import {
  addDocumentEventListener,
  findClosestComponentFromDOMElement,
  findAllComponentReferences,
  preventEventDefault,
  removeDocumentEventListener,
  removeDuplicateStrings,
  specializeEvent,
  stopEventImmediatePropagation,
  prefixPad
}                                             from '@react-ameliorate/utils';
import { ModalStackHandler }                  from '@react-ameliorate/mixin-modal-stack-handler';
import { TooltipStackHandler }                from '@react-ameliorate/mixin-tooltip-stack-handler';

const ANCHOR_POSITION_MAP = {
  'left'    : { left:   'right',  centerV: 'centerV' },
  'right'   : { right:  'left',   centerV: 'centerV' },
  'top'     : { top:    'bottom', centerH: 'centerH' },
  'bottom'  : { bottom: 'top',    centerH: 'centerH' }
};

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

    constructor(...args) {
      super(...args);

      Object.defineProperties(this, {
        'application': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: this
        },
        '_currentlyFocussedComponent': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: null
        }
      });
    }

    triggerGlobalEventActions(hooks, event, _specializeEvent) {
      const doSpecializeEvent = _specializeEvent || specializeEvent;

      var componentIDs = Object.keys(hooks).sort((a, b) => {
            var x = hooks[a],
                y = hooks[b],
                o1 = x._order,
                o2 = y._order;

            if (o1 == o2)
              return 0;

            return (o1 < o2) ? 1 : -1;
          }),
          nativeEvent = doSpecializeEvent(event.nativeEvent),
          newEvent = { nativeEvent },
          eventName = nativeEvent.type,
          devMessageHappened = false;

      //console.log('Handling global event', eventName, componentIDs);
      for (var i = 0, il = componentIDs.length; i < il; i++) {
        if (nativeEvent.propagationStopped) {
          if (__DEV__ && global.raDebug && !devMessageHappened) {
            devMessageHappened = true;
            console.log(`Event ${eventName} handled/captured by ${componentID}`, document.querySelector('.eVisitApp' + componentID));
          }

          break;
        }

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

          if (nativeEvent.immediatePropagationStopped) {
            if (__DEV__ && global.raDebug && !devMessageHappened) {
              devMessageHappened = true;
              console.log(`Event ${eventName} handled/captured by ${componentID}`, document.querySelector('.eVisitApp' + componentID));
            }

            break;
          }
        }
      }

      if (nativeEvent.defaultPrevented)
        return false;
    }

    globalEventActionListener(eventName, event) {
      return this.triggerGlobalEventActions(this.getGlobalEventActionHooks(), { nativeEvent: event }, this.specializeEvent);
    }

    getTooltipShowTime() {
      return 500;
    }

    getTooltipHideTime() {
      return 250;
    }

    getTooltipPropsFromType(type) {
      return {
        internalContainerStyle: this.style(this.generateStyleNames('tooltip', 'container', type)),
        captionStyle: this.style(this.generateStyleNames('tooltip', 'caption', type))
      };
    }

    getTooltipAnchorPositionFromSide(side) {
      if (ANCHOR_POSITION_MAP.hasOwnProperty(side))
        return ANCHOR_POSITION_MAP[side];

      var position, sidePart, offsetPart;
      side.trim().replace(/(\w+)([+-].+)?/g, (m, p1, p2) => {
        sidePart = p1.toLowerCase();
        if (p2)
          offsetPart = p2;
      });

      if (sidePart) {
        position = ANCHOR_POSITION_MAP[sidePart];
        if (position)
          return Object.assign({}, position, { [sidePart]: `${position[sidePart]}${(offsetPart) ? offsetPart : ''}` });
      }

      return ANCHOR_POSITION_MAP['bottom'];
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
                tooltipType = tooltipElement.getAttribute('data-tooltip-type') || 'default',
                tooltipStyleProps = this.getTooltipPropsFromType(tooltipType),
                anchorPosition = this.getTooltipAnchorPositionFromSide(tooltipSide);

            if (!anchorPosition)
              anchorPosition = ANCHOR_POSITION_MAP['bottom'];

            this.pushTooltip({
              ...(tooltipStyleProps || {}),
              id: tooltipID,
              caption: tooltip,
              anchorPosition,
              anchor: tooltipComponent
            });

          }, time, tooltipID);
        };
      };

      this.unregisterDefaultEventActions();

      this.registerDefaultEventAction('mouseover', tooltipHandlerFactory('mouseover'));
      this.registerDefaultEventAction('mouseout', tooltipHandlerFactory('mouseout'));
      this.registerDefaultEventAction('mousedown', tooltipHandlerFactory('mouseout'));
    }

    _sortComponentsForFocus(_components) {
      var components = _components.filter(Boolean);

      components = components.sort((a, b) => {
        var xo = (a.props && a.props['data-tabindex']) || 0,
            yo = (b.props && b.props['data-tabindex']) || 0,
            x = `${prefixPad(('' + xo), 4)}:${a.getComponentID()}`,
            y = `${prefixPad(('' + yo), 4)}:${b.getComponentID()}`;

        if (x === y)
          return 0;

        return (x < y) ? -1 : 1;
      });

      return components;
    }

    _findNextFocusableComponent(focussedComponent, reverseOrder, _subset) {
      var focusableComponents = this._sortComponentsForFocus(findAllComponentReferences('canReceiveFocus', true, _subset), reverseOrder),
          currentFocusedIndex = focusableComponents.findIndex((component) => (component === focussedComponent));

      if (currentFocusedIndex < 0)
        return focusableComponents[(reverseOrder) ? focusableComponents.length - 1 : 0];

      currentFocusedIndex += (reverseOrder) ? -1 : 1;
      if (currentFocusedIndex < 0)
        currentFocusedIndex = focusableComponents.length - 1;
      else if (currentFocusedIndex >= focusableComponents.length)
        currentFocusedIndex = 0;

      return focusableComponents[currentFocusedIndex];

    }

    focusNextComponent({ event, reverseOrder, focussedComponent, components }) {
      var focusableContext = components;
      if (!focusableContext && focussedComponent && typeof focussedComponent.getFocusableContext === 'function')
        focusableContext = focussedComponent.getFocusableContext.call(focussedComponent, { event, reverseOrder, focussedComponent });

      if (focussedComponent && typeof focussedComponent.blur === 'function')
        focussedComponent.blur.call(focussedComponent);

      var nextFocusComponent = this._findNextFocusableComponent(focussedComponent, reverseOrder, focusableContext);
      if (nextFocusComponent) {
        preventEventDefault(event);
        stopEventImmediatePropagation(event);

        if (typeof nextFocusComponent.focus === 'function')
          nextFocusComponent.focus.call(nextFocusComponent, reverseOrder);
      }
    }

    registerKeyboardNavigationHandler() {
      this.registerDefaultEventAction('keydown', (event) => {
        var nativeEvent = event && event.nativeEvent;
        if (nativeEvent.defaultPrevented)
          return;

        var keyCode           = ('' + (nativeEvent.code || nativeEvent.key));
        if (keyCode !== 'Tab' && keyCode !== 'Enter' && keyCode !== 'Space')
          return;

        var reverseOrder      = nativeEvent.shiftKey,
            focussedComponent = this.getCurrentlyFocussedComponent(),
            callArgs          = {
              event,
              reverseOrder,
              focussedComponent,
              keyCode,
              ref: this
            };

        if (focussedComponent) {
          if (typeof focussedComponent.onKeyboardNavigation === 'function' && focussedComponent.onKeyboardNavigation.call(focussedComponent, callArgs) === false)
            return false;
        } else {
          if (this.onKeyboardNavigation.call(this, callArgs) === false)
            return false;
        }

        if (keyCode === 'Tab') {
          this.focusNextComponent(callArgs);
        } else if (keyCode === 'Enter' || keyCode === 'Space') {
          if (focussedComponent && typeof focussedComponent.onAction === 'function') {
            preventEventDefault(event);
            stopEventImmediatePropagation(event);

            focussedComponent.onAction.call(focussedComponent, { event, ref: this });
          }
        }
      });
    }

    onKeyboardNavigation() {

    }

    componentMounting() {
      super.componentMounting.apply(this, arguments);

      if (typeof document !== 'undefined') {
        addDocumentEventListener('*', this.globalEventActionListener);
        this.registerTooltipMouseOverHandler();
        this.registerKeyboardNavigationHandler();
      }
    }

    componentUnmounting() {
      super.componentUnmounting.apply(this, arguments);

      if (typeof document !== 'undefined') {
        this.unregisterDefaultEventActions();

        removeDocumentEventListener('*', this.globalEventActionListener);
      }

      // Clear style cache
      var theme = this.getTheme();
      if (theme)
        theme.invalidateCache();
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          locale: null,
          _extraClasses: []
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

    addExtraClass(...args) {
      var extraClasses = this.getState('_extraClasses', []);

      this.setState({
        _extraClasses: removeDuplicateStrings(extraClasses.concat(args.filter(Boolean)))
      });
    }

    removeExtraClass(...args) {
      var extraClasses = this.getState('_extraClasses', []).filter((className) => {
        return (args.indexOf(className) < 0);
      });

      this.setState({
        _extraClasses: extraClasses
      });
    }

    render(_children) {
      var tooltips = this.getTooltips(),
          extraClasses = this.getState('_extraClasses', []);

      return super.render(
        <Overlay className={extraClasses.join(' ')}>
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
