export class Hoverable {
  construct() {
    Object.defineProperties(this, {
      '_hoverClearTime': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      }
    });
  }

  getHoverableProps() {
    return {
      onMouseOver: this._onMouseOver,
      onMouseOut: this._onMouseOut
    };
  }

  _hoverableSetClearTimeout(time) {
    this._hoverClearTime = time || 0;
  }

  _onMouseOver(event) {
    return this.onMouseOver({ event });
  }

  _onMouseOut(event) {
    return this.onMouseOut({ event });
  }

  onMouseOver(args = {}) {
    if (this.isComponentFlag('hovered'))
      return;

    if (this._hoverClearTimeout)
      this._hoverClearTimeout.cancel();

    if (this.callProvidedCallback('onMouseOver', args) === false)
      return;

    return this.setComponentFlagsFromObject(Object.assign({ hovered: true }, args.extraState || {}));
  }

  onMouseOut(args = {}) {
    if (!this.isComponentFlag('hovered'))
      return;

    if (this.callProvidedCallback('onMouseOut', args) === false)
      return;

    this._hoverClearTimeout = this.delay(() => {
      this.setComponentFlagsFromObject(Object.assign({ hovered: false }, args.extraState || {}));
    }, this._hoverClearTime);
  }
}
