export const RAC_KEY = 'data-rac';

var contextIDCounter = 1;

export class AmeliorateContext {
  constructor(context) {
    Object.assign(this, context || {});

    Object.defineProperty(this, 'children', {
      writable: false,
      enumerable: true,
      configurable: true,
      value: {}
    });

    //this.children = {};
    this.id = contextIDCounter++;
  }

  onInstantiate(instance) {
    this.instance = instance;

    if (this.parent)
      this.parent.children[this.id] = instance;
    // else
    //   console.warn('NO RAC PARENT!', instance.getComponentName());
  }

  onDestroy(instance) {
    if (this.parent)
      delete this.parent.children[this.id];
  }

  getInstance() {
    return this.instance;
  }

  toString() {
    return ('' + this.id);
  }
}
