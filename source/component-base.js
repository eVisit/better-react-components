

export default class ComponentBase {
  constructor() {
    Object.defineProperties(this, {
      '_internalState': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_queuedStateUpdates': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: []
      }
    });
  }

  setState(newState, doneCallback) {
    if (newState) {
      var updatedState = newState;
      if (typeof updatedState === 'function')
        updatedState = updatedState.call(this, this._internalState);

      if (updatedState)
        Object.assign(this._internalState, updatedState);
    }

    this.setReactComponentState(newState, () => {

    });
  }

  getState() {

  }

  resolveProps() {

  }

  resolveState() {

  }

  shouldComponentUpdate() {

  }

  render() {

  }
}
