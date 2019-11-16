import { utils as U } from 'evisit-js-utils';
import fastDiff       from 'fast-diff';

const CARET_CODE = '\u200B';

const PARSER_TOKENS = [
  {
    matcher: /([^{]+)/g,
    onMatch: function(m, part) {
      return {
        type: 'template',
        template: part
      };
    }
  },
  {
    matcher: /\{([^}]+)\}/g,
    onMatch: function(m, name) {
      return {
        type: 'capture',
        name,
        config: (this.config[name] || {})
      };
    }
  }
];

const EMPTY_TEMPLATE = {
  type: 'template',
  template: null,
  source: ''
};

export class FormatterEngine {
  constructor(componentInstance) {
    var config = this.getConfig();

    Object.defineProperties(this, {
      '_component': {
        writable: false,
        enumerable: false,
        configurable: false,
        value: componentInstance
      },
      '_definition': {
        writable: true,
        enumerable: false,
        configurable: false,
        value: this.parseTemplate(config, config.template)
      },
      '_state': {
        writable: true,
        enumerable: false,
        configurable: false,
        value: {}
      },
      '_internalState': {
        writable: true,
        enumerable: false,
        configurable: false,
        value: {
          previousValue: '',
          lastCaptureIndex: -1
        }
      }
    });
  }

  unsetCaretPos(strValue) {
    if (strValue === '' || !(typeof strValue === 'string' || strValue instanceof String))
      return strValue;

    return strValue.replace(/[\u200B]+/g, '');
  }

  setCaretPos(_strValue, pos) {
    // Strip all magic carret characters before we start
    var strValue = this.unsetCaretPos(_strValue);
    if (!strValue)
      return strValue;

    var caretPos = pos;
    if (!(caretPos instanceof Array))
      caretPos = [ pos ];

    if (caretPos instanceof Array) {
      caretPos = caretPos.filter((num) => ((typeof num === 'number' || num instanceof Number) && isFinite(num)));
      if (caretPos.length === 0)
        return strValue;

      var parts = [],
          min = caretPos[0],
          max = caretPos[1];

      if ((caretPos[0] === caretPos[1]) || caretPos.length === 1) {
        if (min < 0)
          min = (strValue.length + 1) + min;
        parts.push(strValue.substring(0, min), strValue.substring(min));
      } else if (caretPos.length > 1) {
        if (min < 0)
          min = (strValue.length + 1) + min;

        if (max < 0)
          max = (strValue.length + 1) + max;

        if (min > max) {
          max = min;
          min = caretPos[1];
        }

        parts.push(strValue.substring(0, min), strValue.substring(min, max), strValue.substring(max));
      }

      // Replace sequential carret characters with a single carret character
      return parts.join(CARET_CODE).replace(/\u200B+/g, CARET_CODE);
    }

    return strValue;
  }

  parseTemplate(config, _template) {
    const parseNext = (context, template, offset) => {
      if (offset >= template.length)
        return null;

      for (var i = 0, il = PARSER_TOKENS.length; i < il; i++) {
        var parserToken = PARSER_TOKENS[i],
            value;

        if (parserToken.matcher instanceof RegExp) {
          parserToken.matcher.lastIndex = offset;
          value = parserToken.matcher.exec(template);

          if (!value || value.index !== offset)
            continue;
        } else if (typeof parserToken.matcher === 'function') {
          value = parserToken.matcher.call(context, template, offset);
        }

        if (value) {
          var token = parserToken.onMatch.apply(context, value.concat(offset, template));
          if (token) {
            return Object.assign({}, token, {
              source: template.substring(offset, offset + value[0].length),
              position: {
                start: offset,
                end: offset + value[0].length
              }
            });
          }
        }
      }

      throw new Error(`FormatterEngine: template parse error: unexpected token at offset: ${offset}`);
    };

    var template  = _template,
        parts     = [
                      Object.assign({}, EMPTY_TEMPLATE, {
                        position: {
                          start: 0,
                          end: 0
                        }
                      })
                    ],
        context   = Object.create(this, {
          'config': {
            writable: false,
            enumerable: false,
            configurable: false,
            value: config
          }
        });

    for (var part = parseNext(context, template, 0); part != null; part = parseNext(context, template, part.position.end)) {
      parts.push(part);
    }

    parts.push(Object.assign({}, EMPTY_TEMPLATE, {
      position: {
        start: template.length,
        end: template.length
      }
    }));

    return {
      template,
      parts
    };
  }

  getConfig() {
    return this.constructor.config;
  }

  getValueDiff(value1, value2) {
    return fastDiff(value1, value2);
  }

  getCaretPosition(value1, value2) {
    var diff = this.getValueDiff(this.unsetCaretPos(value2) || '', this.unsetCaretPos(value1) || ''),
        offset = 0;

    if (!diff.length || (diff.length === 1 && diff[0][0] === 0))
      return;

    for (var i = 0, il = diff.length; i < il; i++) {
      var thisDiff = diff[i];

      if (thisDiff[0] < 0)
        break;

      offset += thisDiff[1].length;

      if (thisDiff[0] > 0)
        break;
    }

    return offset;
  }

  parseAndFormat(value, args, caretPos) {
    var definition          = this._definition,
        parts               = definition.parts,
        offset              = 0,
        lastCaptureIndex    = this._internalState.lastCaptureIndex,
        firstCaptureIndex   = parts.findIndex((part) => part.type === 'capture'),
        currentCaptureIndex = firstCaptureIndex,
        indexMap            = [];

    for (var i = 0, il = parts.length; i < il; i++) {
      var part = parts[i];
      if (part.type !== 'capture') {
        var index = (part.template) ? value.indexOf(part.template, offset) : -1;
        if (index >= 0) {
          indexMap.push(value.substring(offset, index));
          indexMap.push(part.template);

          if (caretPos < index)
            currentCaptureIndex = i - 1;
          else
            currentCaptureIndex = i + 1;

          offset = index + part.template.length;
        } else {
          if (i > 0 && parts[i - 1].type === 'capture') {
            indexMap.push(value.substring(offset, value.length));
            break;
          } else {
            indexMap.push((part.template && part.template.length) ? part.template : '');
          }
        }
      }
    }

    if (currentCaptureIndex < firstCaptureIndex)
      currentCaptureIndex = firstCaptureIndex;

    if (lastCaptureIndex !== currentCaptureIndex) {
      capturePart = parts[lastCaptureIndex];
      if (capturePart && capturePart.type === 'capture' && typeof capturePart.config.onNext === 'function') {
        var ret = capturePart.config.onNext.call(this, this._state[capturePart.name]);

        if (ret === false) {
          currentCaptureIndex = lastCaptureIndex;
        } else {
          this._internalState.lastCaptureIndex = lastCaptureIndex = currentCaptureIndex;
          this._state[capturePart.name] = ret;
        }
      } else {
        this._internalState.lastCaptureIndex = lastCaptureIndex = currentCaptureIndex;
      }
    }

    var capturePart = parts[currentCaptureIndex];
    if (capturePart && capturePart.type === 'capture') {
      this._state[capturePart.name] = indexMap[currentCaptureIndex] || '';
      console.log(' >>>> STATE: ', this._state, indexMap, currentCaptureIndex);
    }

    var templateBuilder = [];
    for (var i = 0, il = parts.length; i < il; i++) {
      var part = parts[i];
      if (part.type !== 'capture') {
        if (!part.template)
          continue;

        if (currentCaptureIndex === (i + 1) || parts[i + 1] && this._state[parts[i + 1].name]) {
          templateBuilder.push(part.template);
          if (currentCaptureIndex === (i + 1)) {
            var len = templateBuilder.join('').length;
            if (caretPos < len)
              caretPos = len;
          }
        }
      } else {
        if (this._state[part.name])
          templateBuilder.push(this._state[part.name]);
      }
    }

    return this.setCaretPos(templateBuilder.join(''), caretPos);
  }

  format(value, args) {
    if (!(typeof value === 'string' || value instanceof String))
      return value;

    var caretPos = this.getCaretPosition(value, this._internalState.previousValue);

    // If there is no difference, return
    if (caretPos == null)
      return value;

    this._internalState.previousValue = value;

    return this.parseAndFormat(value, args, caretPos);
  }

  unformat(value, args) {
    return value;
  }

  execute(value, op, _args) {
    var args = _args || {};

    if (op === 'format') {
      return this.format(value, args);
    } else if (op === 'unformat') {
      return this.unformat(value, args);
    }
  }
}

export function generateFormatter(config, callback) {
  var klass;

  if (typeof callback === 'function') {
    klass = callback({ Parent: FormatterEngine });
  } else {
    klass = class GenericFormatterEngine extends FormatterEngine {};
  }

  klass.config = config;
  klass.create = function(componentInstance) {
    return new klass(componentInstance);
  };

  return klass;
}
