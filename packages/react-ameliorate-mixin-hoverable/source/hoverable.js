export class Hoverable {
  getHoverableProps() {
    return {
      onMouseOver: this._onMouseOver,
      onMouseOut: this._onMouseOut
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

  _onMouseOver(event) {
    return this.onMouseOver({ event });
  }

  _onMouseOut(event) {
    return this.onMouseOut({ event });
  }

  onMouseOver(args = {}) {
    var hoverClearTimeout = this._hoverClearTimeout;
    if (hoverClearTimeout)
      hoverClearTimeout.cancel();

    if (this.isComponentFlag('hovered'))
      return;

    if (this.callProvidedCallback('onMouseOver', args) === false)
      return;

    return this.setComponentFlagsFromObject(Object.assign({ hovered: true }, args.extraState || {}));
  }

  onMouseOut(args = {}) {
    if (!this.isComponentFlag('hovered'))
      return;

    if (this.callProvidedCallback('onMouseOut', args) === false)
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
}
