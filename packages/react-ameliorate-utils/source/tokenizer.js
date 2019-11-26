import { utils as U } from 'evisit-js-utils';

function convertMatchers(matchers) {
  if (!matchers || !U.instanceOf(matchers, 'array', 'object'))
    throw new TypeError('Tokenizer: nothing to tokenize. No valid matchers provided.');

  const verifyMatcher = (key, matcher) => {
    if (!matcher)
        throw new TypeError(`Tokenizer: matcher at config.matchers[${key}] is invalid: ${matcher}`);

      if (!matcher.type)
        throw new TypeError(`Tokenizer: matcher at config.matchers[${key}] is invalid: No 'type' specified.`);

      if (!matcher.matcher)
        throw new TypeError(`Tokenizer: matcher at config.matchers[${key}] is invalid: No 'matcher' specified.`);

      if (typeof matcher.matcher !== 'function' && !(matcher.matcher instanceof RegExp))
        throw new TypeError(`Tokenizer: matcher at config.matchers[${key}] is invalid: 'matcher' must be a function or an instance of RegExp.`);
  };

  if (matchers instanceof Array) {
    for (var i = 0, il = matchers.length; i < il; i++)
      verifyMatcher(matchers[i]);

    return matchers;
  } else {
    var keys = Object.keys(matchers),
        convertedMatchers = [];

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          thisMatcher = matchers[key];

      if (typeof thisMatcher !== 'function' && !(thisMatcher instanceof RegExp)) {
        verifyMatcher(key, thisMatcher);

        convertedMatchers.push(Object.assign({
          type: key
        }, thisMatcher));
      } else {
        convertedMatchers.push({
          type: key,
          matcher: thisMatcher
        });
      }
    }

    return convertedMatchers;
  }
}

export function tokenize(_config, _input) {
  const parseNext = (config, input, offset) => {
    if (offset >= input.length)
      return null;

    var matchers = config.matchers;
    for (var i = 0, il = matchers.length; i < il; i++) {
      var parserToken = matchers[i],
          value;

      if (parserToken.matcher instanceof RegExp) {
        parserToken.matcher.lastIndex = offset;
        value = parserToken.matcher.exec(input);

        if (!value || value.index !== offset)
          continue;
      } else if (typeof parserToken.matcher === 'function') {
        value = parserToken.matcher.call(this, input, offset, config);
      }

      if (value) {
        var tokens;

        if (typeof parserToken.onMatch === 'function')
          tokens = parserToken.onMatch.apply(this, value.concat(offset, input, config));
        else
          tokens = [{}];

        if (tokens) {
          if (!(tokens instanceof Array))
            tokens = [ tokens ];

          return tokens.filter(Boolean).map((token) => Object.assign({}, {
            type: parserToken.type,
            source: input.substring(offset, offset + value[0].length),
            position: {
              start: offset,
              end: offset + value[0].length
            }
          }, token));
        }
      }
    }

    throw new Error(`Tokenizer: input parse error: unexpected token at offset: ${offset}`);
  };

  var config = Object.assign({}, _config, { matchers: convertMatchers(_config.matchers) }),
      input  = _input,
      tokens = [];

  for (var token = parseNext(context, input, 0); token != null; token = parseNext(config, input, token.position.end))
    tokens = tokens.concat(token);

  return {
    input,
    tokens
  };
}
