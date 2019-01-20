export class Draggable {
  construct() {
  }

  getDraggableProps(...args) {
    return {
      onDragStart: this.onDragStart.bind(this, ...args),
      onDragEnd: this.onDragEnd.bind(this, ...args)
    };
  }

  onDragStart(args = {}) {
    if (this.isComponentFlag('dragging'))
      return;

    if (this.callProvidedCallback('onDragStart', args) === false)
      return;

    //preventEventDefault(args.event);
    this.setComponentFlagsFromObject(Object.assign({ dragging: true }, args.extraState || {}));
  }

  onDragEnd(args) {
    if (!this.isComponentFlag('dragging'))
      return;

    if (this.callProvidedCallback('onDragEnd', args) === false)
      return;

    //preventEventDefault(args.event);
    this.setComponentFlagsFromObject(Object.assign({ dragging: false }, args.extraState || {}));
  }
}
