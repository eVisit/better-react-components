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

    componentDidMount() {
      super.componentDidMount();
      this.addToOverlay();
    }

    componentWillUnmount() {
      this.removeFromOverlay();
      super.componentWillUnmount();
    }

    onPropsUpdated(...args) {
      super.onPropsUpdated(...args);

      if (this.isMounted)
        this.addToOverlay();
    }

    render() {
      return null;
    }
  };
});

export { styleSheet as paperStyles };
