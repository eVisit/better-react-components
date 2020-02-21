export function Focusable({ Parent, componentName }) {
  return class Focusable extends Parent {
    getParentForm() {
      return this.context.parentForm;
    }

    getFocusableContext() {
    }

    getFocusableReference(_opts) {
    }

    canReceiveFocus() {
      return true;
    }

    defaultOnFocusHandler(event, blurPrevious, callbackArgs) {
      if (this.callProvidedCallback('onFocus', (callbackArgs) ? callbackArgs : [ event, this ]) === false)
        return false;

      this.setCurrentlyFocussedComponent(this, blurPrevious);
      this.setComponentFlagsFromObject({ focussed: true });
    }

    defaultOnBlurHandler(event, callbackArgs, blurDelay) {
      if (this.callProvidedCallback('onBlur', (callbackArgs) ? callbackArgs : [ event, this ]) === false)
        return false;

      if (this.getCurrentlyFocussedComponent() === this)
        this.setCurrentlyFocussedComponent(null);

      if (!blurDelay) {
        this.setComponentFlagsFromObject({ focussed: false });
      } else {
        // Here we have a small delay before we set the blur state
        // so we don't have funky results with fields that blur
        // but still need to capture events related to focus state

        var promise = this.delay(() => {
          this._raBlurDelay = null;
          this.setComponentFlagsFromObject({ focussed: false });
        }, blurDelay);

        Object.defineProperty(this, '_raBlurDelay', {
          writable: true,
          enumerable: false,
          configurable: false,
          value: promise
        });
      }
    }

    focus(reverse) {
      if (this.isFlagFocussed())
        return;

      var focusable = this.getFocusableReference({ reverse, blur: false, focus: true });

      if (this.callProvidedCallback('onRequestFocus', [ focusable, this, reverse ]) === false)
        return false;

      if (this._raBlurDelay) {
        this._raBlurDelay.cancel();
        this._raBlurDelay = null;
      }

      this.setCurrentlyFocussedComponent(this, true);

      if (focusable && typeof focusable.focus === 'function')
        focusable.focus();
      else
        this.defaultOnFocusHandler();
    }

    blur() {
      if (!this.isFlagFocussed())
        return;

      var focusable = this.getFocusableReference({ reverse: false, blur: true, focus: false });

      if (this.callProvidedCallback('onRequestBlur', [ focusable, this ]) === false)
        return false;

      if (focusable && typeof focusable.blur === 'function')
        focusable.blur();
      else
        this.defaultOnBlurHandler();
    }
  };
}
