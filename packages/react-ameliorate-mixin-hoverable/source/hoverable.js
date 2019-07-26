export function Hoverable({ Parent, componentName }) {
  return class Hoverable extends Parent {
    getHoverableProps() {
      return {
        onMouseEnter: this._onMouseEnter,
        onMouseLeave: this._onMouseLeave
      };
    }

    _hoverableSetClearTime(time) {
      Object.defineProperties(this, {
        '_hoverClearTime': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: time || 0
        }
      });
    }

    _onMouseEnter(event) {
      return this.onMouseEnter({ event });
    }

    _onMouseLeave(event) {
      return this.onMouseLeave({ event });
    }

    onMouseEnter(args = {}) {
      var hoverClearTimeout = this._hoverClearTimeout;
      if (hoverClearTimeout)
        hoverClearTimeout.cancel();

      if (this.isComponentFlag('hovered'))
        return;

      if (this.callProvidedCallback('onMouseEnter', args) === false)
        return;

      return this.setComponentFlagsFromObject(Object.assign({ hovered: true }, args.extraState || {}));
    }

    onMouseLeave(args = {}) {
      if (!this.isComponentFlag('hovered'))
        return;

      if (this.callProvidedCallback('onMouseLeave', args) === false)
        return;

      var delay = this.delay(() => {
        this.setComponentFlagsFromObject(Object.assign({ hovered: false }, args.extraState || {}));
      }, this._hoverClearTime || 0);

      Object.defineProperties(this, {
        '_hoverClearTimeout': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: delay
        }
      });
    }
  };
}
