import { preventEventDefault } from '@react-ameliorate/utils';

export function Droppable({ Parent, componentName }) {
  return class Droppable extends Parent {
    getDroppableProps(...args) {
      return {
        onDragEnter: this.onDragEnter.bind(this, ...args),
        onDragLeave: this.onDragLeave.bind(this, ...args),
        onDragOver: this.onDragOver.bind(this, ...args),
        onDrop: this.onDrop.bind(this, ...args)
      };
    }

    onDragEnter(args = {}) {
      if (this.isComponentFlag('dropping'))
        return;

      if (this.callProvidedCallback('onDragEnter', args) === false)
        return;

      preventEventDefault(args.event);
      this.setComponentFlagsFromObject(Object.assign({ dropping: true }, args.extraState || {}));
    }

    onDragLeave(args = {}) {
      if (!this.isComponentFlag('dropping'))
        return;

      if (this.callProvidedCallback('onDragLeave', args) === false)
        return;

      preventEventDefault(args.event);
      this.setComponentFlagsFromObject(Object.assign({ dropping: false }, args.extraState || {}));
    }

    onDragOver(args = {}) {
      if (this.callProvidedCallback('onDragOver', args) === false)
        return;

      preventEventDefault(args.event);
    }

    onDrop(args = {}) {
      if (this.callProvidedCallback('onDrop', args) === false)
        return;

      preventEventDefault(args.event);
    }
  };
}