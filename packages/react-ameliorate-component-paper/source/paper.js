import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import styleSheet                       from './paper-styles';

export const Paper = componentFactory('Paper', ({ Parent, componentName }) => {
  return class Paper extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      position: PropTypes.func,
      anchorElement: PropTypes.any,
      anchorPosition: PropTypes.object,
      onShouldClose: PropTypes.func,
      onEntering: PropTypes.func,
      onMounted: PropTypes.func,
      onEntered: PropTypes.func,
      onLeaving: PropTypes.func,
      onLeft: PropTypes.func
    };

    provideContext() {
      return {
        _raPaper: this
      };
    }

    addToOverlay() {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      overlay.addChild(this);
    }

    removeFromOverlay() {
      var overlay = this.context._raOverlay;
      if (!overlay)
        return;

      overlay.removeChild(this);
    }

    componentMounted() {
      super.componentMounted();
      this.addToOverlay();
    }

    componentUnmounting() {
      this.removeFromOverlay();
      super.componentUnmounting();
    }

    onPropsUpdated(...args) {
      super.onPropsUpdated(...args);

      if (this.mounted())
        this.addToOverlay();
    }

    render() {
      return null;
    }
  };
});

export { styleSheet as paperStyles };
