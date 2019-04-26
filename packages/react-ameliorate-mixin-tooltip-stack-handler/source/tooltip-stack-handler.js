export function TooltipStackHandler({ Parent, componentName }) {
  return class TooltipStackHandler extends Parent {
    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          _tooltips: []
        })
      };
    }

    getTooltips() {
      return this.getState('_tooltips', []);
    }

    pushTooltip(props) {
      var tooltips      = this.getTooltips(),
          tooltipIndex  = tooltips.findIndex((t) => (t.anchor === props.anchor || t.id === props.id));

      if (tooltipIndex >= 0) {
        tooltips = tooltips.slice();
        tooltips[tooltipIndex] = props;

        this.setState({
          _tooltips: tooltips
        });

        return;
      }

      this.setState({
        _tooltips: tooltips.concat([props])
      });
    }

    popTooltip({ anchor }) {
      var tooltips = this.getTooltips(),
          index    = tooltips.find((tip) => (tip.anchor === anchor));

      if (index < 0)
        return;

      tooltips = tooltips.slice();
      tooltips.splice(index, 1);

      this.setState({
        _tooltips: tooltips
      });
    }

    popAllTooltips() {
      this.setState({
        _tooltips: []
      });
    }

    isTooltipActive() {
      return !!(this.getTooltips().length);
    }
  };
}
