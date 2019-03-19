import { utils as U }                   from 'evisit-js-utils';
import moment                           from 'moment';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { prefixPad }                    from '@react-ameliorate/utils';
import { TextField }                    from '@react-ameliorate/component-text-field';
import styleSheet                       from './date-field-styles';

function getDateParserFromFormat(format) {
  function convert(_num, min, max, padding, doPadding) {
    if (!_num)
      return;

    var num = parseInt(('' + _num), 10);
    if (isNaN(num))
      num = 0;

    if (num < min)
      num = min;

    if (typeof max === 'function')
      num = max.call(this, num);
    else if (num > max)
      num = max;

    return (doPadding) ? prefixPad(num, padding) : ('' + num);
  }

  function isDatePartKey(key) {
    return VALID_DATE_PART_KEYS.hasOwnProperty(key);
  }

  const VALID_DATE_PART_KEYS = {
    'year': true,
    'month': true,
    'day': true
  };

  if (!format)
    return;

  var letterToDatePart = {
    'Y': {
      key: 'year',
      min: 0,
      max: 9999
    },
    'M': {
      key: 'month',
      min: 1,
      max: 12
    },
    'D': {
      key: 'day',
      min: 1,
      max: function(val) {
        var year = parseInt(('' + this.year), 10);
        if (isNaN(year) || !isFinite(year))
          year = moment().year();

        var month = parseInt(('' + this.month), 10);
        if (isNaN(month) || !isFinite(month))
          month = moment().month() + 1;

        var leap = !(year % 4);
        if (month === 2) {
          if (leap && val > 29)
            return 29;
          else if (val > 28)
            return 28;
        } else if ((month === 4 || month === 6 || month === 9 || month === 11) && val > 30) {
          return 30;
        }

        return (val > 31) ? 31 : val;
      }
    }
  };

  var indexKeys = [],
      re = new RegExp('^\\s*' + ('' + format).replace(/([^YMD]+|Y+|M+|D+)/g, function(m) {
        if (m.match(/[YMD]/)) {
          var datePart = letterToDatePart[m.charAt(0)];
          indexKeys.push(Object.assign({
            value: m,
            length: m.length
          }, datePart));

          return `(\\d{1,${m.length * 2}})?`;
        } else {
          var val = m.replace(/[a-zA-Z]+/g, '');
          if (!val)
            return;

          var last = U.lastOf(indexKeys);
          indexKeys.push({
            key: `${(last) ? last.key : indexKeys.length}_sep`,
            length: m.length,
            value: m
          });

          return `([^YMD0\\d]+)?`;
        }
      }));

  return (value) => {
    if (!value)
      return;

    re.lastIndex = 0;
    var parts = ('' + value).match(re);
    if (!parts)
      return;

    var order = [],
        result = {
          input: value,
          format: {
            order,
            format
          }
        };

    indexKeys.map(({ key, min, max, length, value }, index) => {
      var val = parts[index + 1];

      result.format[key] = value;

      if (isDatePartKey(key)) {
        order.push(key);

        if (val) {
          result[`${key}_parsed`] = val;
          if (val.length >= length)
            result[`${key}_sep`] = '';
        }
      }

      result[key] = val;
    });

    indexKeys.map(({ key, min, max, length }, index) => {
      if (!isDatePartKey(key))
        return;

      var val = result[key];
      if (!val)
        return;

      val = convert.call(result, val, min, max, length, result[`${key}_sep`] !== undefined);
      if (key === 'year' && length === 2 && val.length < 4)
        val = `${(val.length < 2) ? '200' : '20'}${val}`;

      result[key] = val;
    });

    return result;
  };
}

export const DateField = componentFactory('DateField', ({ Parent, componentName }) => {
  return class DateField extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      format: PropTypes.string,
      showFormat: PropTypes.bool,
      minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
      maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
      displayFormat: PropTypes.bool
    };

    static defaultProps = {
      format: 'MM/DD/YYYY',
      displayFormat: false
    };

    getMomentOrString(value) {
      var date = moment(value);
      if (!date.isValid())
        date = moment(value, this.props.format);

      return (date.isValid()) ? date : value;
    }

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments),
          inputFormat = props.format;

      if (U.noe(inputFormat))
        inputFormat = '';

      return {
        ...props,
        keyboardType: 'numeric',
        caption: (props.displayFormat) ? `${props.caption} (${('' + inputFormat).toLowerCase()})` : props.caption,
        maxLength: inputFormat.length
      };
    }

    onPropUpdated_format(format) {
      // Create parser from format
      this.formatParser = getDateParserFromFormat(format || 'MM/DD/YYYY');
    }

    formatValue(currentValue, _value, op, args) {
      const doFormat = () => {
        if (value == null)
          return '';

        var v = ('' + value);

        // If parser is not a function then abort
        if (typeof this.formatParser !== 'function')
          return v;

        // See if backspace was pressed
        var backspace = (oldValue && value && oldValue.length > value.length),
            // Parse old value (date) information
            oldDateParts = this.formatParser(oldValue),
            // Parse new value (date) information
            dateParts = this.formatParser(value);

        // If parsing failed then abort
        if (!dateParts)
          return v;

        // Construct a new formatted value
        var parts = [];
        dateParts.format.order.forEach((key) => {
          // Get parsed date information
          var partValue = dateParts[key], // Corrected value
              partValueParsed = dateParts[`${key}_parsed`], // Raw parsed value
              partSep = dateParts[`${key}_sep`], // Parsed separator
              partFormat = dateParts.format[key], // Format
              partFormatSep = dateParts.format[`${key}_sep`], // Specified format separator
              thisValue = partValueParsed;

          // If part hasn't been parsed than skip
          if (partValueParsed === undefined)
            return;

          // If both parts are the max length, but parsed and corrected are different, prefer partValue.
          // Also prefer partValue (corrected) part if there is a separator already
          if ((partValue.length === partValueParsed.length && partValue.length === partFormat.length) || (partSep && partValueParsed.length !== partFormat.length))
            thisValue = partValue;

          // If backspace, and we just removed the separator, than move back twice
          if (backspace && partSep === undefined && oldDateParts[`${key}_sep`]) {
            parts.push(thisValue.slice(0, -1));
          } else {
            // Push the corrected or parsed value
            parts.push(thisValue);

            // If this is the max length of this part, then push a separator
            if (thisValue.length === partFormat.length)
              parts.push(partFormatSep);
          }
        });

        return parts.join('');
      };

      var value = _value,
          oldValue = currentValue,
          focussed = args.focussed;

      if (op === 'format') {
        if (value && typeof value.format === 'function')
          value = oldValue = value.format(this.props.format);

        if (focussed && value !== oldValue)
          value = doFormat();
      } else if (op === 'unformat') {
        if (!focussed && U.instanceOf(value, 'string'))
          value = this.getMomentOrString(value);
      }

      return super.formatValue(currentValue, value, op, args);
    }

    async validate(_value, ...args) {
      var value = _value;
      if (value && (!value._isAMomentObject || !value.isValid()))
        value = null;

      return await super.validate(value, ...args);
    }
  };
}, TextField);

export {
  styleSheet as dateFieldStyles
};
