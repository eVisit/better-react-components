import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import Chartist                         from 'chartist';
import ChartistPluginToolTip            from 'chartist-plugin-tooltips-updated';
import ChartistPluginLegend             from 'chartist-plugin-legend';
import {
  toNumber,
  findDOMNode,
  capitalize
}                                       from '@react-ameliorate/utils';
import styleSheet                       from './chart-styles';

export const Chart = componentFactory('Chart', ({ Parent, componentName }) => {
  return class Chart extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      type: PropTypes.string.isRequired,
      labels: PropTypes.arrayOf(PropTypes.string),
      data: PropTypes.array.isRequired
    };

    getRawChartStyle() {
      // This is to get props for margin/padding/border/etc...
      // for example, it expands properties such that "padding: 10",
      // and "paddingRight: 15" will properly be handle
      // for all four padding keys
      function getExpandedDimensionProps(name) {
        var extra = (name === 'border') ? 'Width' : '',
            topKey = `${name}Top${extra}`,
            leftKey = `${name}Left${extra}`,
            rightKey = `${name}Right${extra}`,
            bottomKey = `${name}Bottom${extra}`,
            finalStyle = {};

        return [topKey, leftKey, rightKey, bottomKey].reduce((finalStyle, key) => {
          finalStyle[key] = style[name] || 0;
          if (style.hasOwnProperty(key))
            finalStyle[key] = style[key];
          return finalStyle;
        }, finalStyle);
      }

      var style = this.rawStyle('chartStyle', this.props.chartStyle),
          padding = getExpandedDimensionProps('padding');

      return {
        grow: (style.flex || style.flexGrow),
        padding
      };
    }

    buildChart(viewElement) {
      const buildSeriesFromData = () => {
        const getLineSmooth = (thisData) => {
          if (!thisData.smooth)
            return;

          var parts = thisData.smooth.split(':');
          if (parts.length !== 2)
            return;

          var smoothTypeName = capitalize(parts[0]),
              smoothTypeType = parts[1],
              smoothType = Chartist[smoothTypeName];

          if (!smoothType || typeof smoothType[smoothTypeType] !== 'function')
            return;

          return smoothType[smoothTypeType]();
        };

        var series = {};

        data.forEach((thisData) => {
          if (thisData instanceof Array)
            return;

          series[thisData.name] = {
            lineSmooth: getLineSmooth(thisData)
          };
        });

        return series;
      };

      var { type, labels, data } = this.props,
          chartStyle = this.getRawChartStyle(),
          chartStylePadding = chartStyle.padding,
          plugins = Chartist.plugins,
          series = buildSeriesFromData(),
          labelOffset = this.styleProp('DEFAULT_PADDING') || 0;

      if (!labels)
        labels = [];

      type = capitalize(('' + type).toLowerCase());

      //cleanupChildren(viewElement);
      //console.log('series data: ', data, series);

      var chart = this._chart = new Chartist[type](viewElement, {
        labels: labels,
        series: data
      }, {
        showPoint: !!this.props.showPoints,
        fullWidth: chartStyle.grow,
        chartPadding: {
          top: chartStylePadding.paddingTop,
          left: chartStylePadding.paddingLeft,
          right: chartStylePadding.paddingRight,
          bottom: chartStylePadding.paddingBottom
        },
        series,
        axisX: { offset: labelOffset, ...(this.props.axisX || {}) },
        axisY: { offset: labelOffset, ...(this.props.axisY || {}) },
        plugins: [
          plugins.tooltip({
            tooltipFnc: (meta, _value) => {
              var value = toNumber(_value),
                  valueTransform = this.props.tooltipValueTransformer;

              if (typeof valueTransform === 'function')
                value = valueTransform(value, meta);

              var index = data.findIndex((info) => (info.name === meta));
              return `<div class="chartist-tooltip-inner chartist-color-${index}"><span class="chartist-tooltip-meta">${meta}</span><br><span class="chartist-tooltip-value">${value}</span></div>`;
            }
          }),
          plugins.legend()
        ]
      });

      chart.on('draw', function(data) {
        // If the draw event was triggered from drawing a point on the line chart
        if (data.type === 'point') {
          // We are creating a new path SVG element that draws a triangle around the point coordinates

          var circle = new Chartist.Svg('circle', {
            'cx':       [data.x],
            'cy':       [data.y],
            'r':        [1],
            'ct:value': data.value.y,
            'ct:meta':  data.meta,
            'class':    'ct-point',
          }, 'ct-area');

          // With data.element we get the Chartist SVG wrapper and we can replace the original point drawn by Chartist with our newly created triangle
          data.element.replace(circle);
        }
      });
    }

    viewRef(elem) {
      var viewElement = this._viewElement = findDOMNode(elem);

      if (viewElement)
        this.buildChart(viewElement);
    }

    render() {
      if (this._viewElement)
        this.buildChart(this._viewElement);

      return super.render(<View ref={this.viewRef} className={this.getRootClassName(componentName)} style={this.style('container', this.props.style)}/>);
    }
  };
});

export { styleSheet as chartStyles };
