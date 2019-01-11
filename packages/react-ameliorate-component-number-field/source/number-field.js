import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { TextField }                    from '../text-field';
import styleSheet                       from './number-field-styles';

const NumberField = componentFactory('NumberField', ({ Parent, componentName }) => {
  return class NumberField extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      unit: PropTypes.string,
      min: PropTypes.number,
      max: PropTypes.number,
      precision: PropTypes.number
    };

    static defaultProps = {
      type: 'number',
      precision: 2
    };

    formatValue(currentValue, newValue, op, args) {
      const doFormat = () => {
        const constrictToRange = (_num) => {
          var num = _num,
              { min, max } = this.props;

          if ((typeof min === 'number' && isFinite(min)) && (typeof max === 'number' && isFinite(max)) && min > max) {
            var temp = min;
            min = max;
            max = temp;
          }

          if (typeof min === 'number' && isFinite(min) && num < min)
            num = min;

          if (typeof max === 'number' && isFinite(max) && num > max)
            num = max;

          return num;
        };

        if (args.focus) {
          console.log('Focussed!');
          return newValue;
        }

        var precision = this.props.precision,
            num = parseFloat(('' + newValue).trim().replace(/(\S+).*/g, '$1').replace(/[^\d.-]+/g, ''));

        if (!isFinite(num))
          num = 0;

        if (typeof precision === 'number' && isFinite(precision)) {
          var scalar = Math.pow(10, Math.round(precision));
          num = Math.round(num * scalar) / scalar;
        }

        if (op === 'unformat') {
          num = constrictToRange(num);
          return num;
        } else if (op === 'format') {
          var unit = this.props.unit;
          if (!unit)
            unit = '';

          return `${num} ${unit}`;
        }
      };

      return super.formatValue(currentValue, doFormat(), op, args);
    }
  };
}, TextField);

export { NumberField };
