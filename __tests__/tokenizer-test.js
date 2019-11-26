import { createTokenizer } from '../packages/react-ameliorate-utils/source/tokenizer';

describe("Tokenizer", function() {
  it("should be able to tokenize a string", function() {
    var tokenizer = createTokenizer({
      matchers: [
        {
          type: 'param',
          matcher: function(input, offset) {
            if (input.charAt(offset) !== '{')
              return;

            var lastChar = input.charAt(offset - 1);
            if (lastChar === '\\')
              return;

            var match = [ '{' ],
                name  = [],
                flags = [];

            for (var i = offset + 1, il = input.length; i < il; i++) {
              var c = input.charAt(i),
                  code = (name.length === 0) ? input.charCodeAt(i) : 0;

              if (c === '}' && lastChar !== '\\') {
                match.push(c);
                break;
              }

              lastChar = c;

              match.push(c);

              // If not alphanumeric, add as a flag
              if (code && !(code > 47 && code < 58) && !(code > 64 && code < 91) && !(code > 96 && code < 123))
                flags.push(c);
              else
                name.push(c);
            }

            if (i >= input.length)
              return;

            return [ match.join(''), name.join(''), flags.join('') ];
          },
          onMatch: function(m, name, flags) {
            return { name, flags };
          }
        },
        {
          type: 'chunk',
          matcher: function(input, offset) {
            var lastChar = input.charAt(offset - 1),
                match    = [];

            for (var i = offset, il = input.length; i < il; i++) {
              var c = input.charAt(i);
              if (c === '{' && lastChar !== '\\')
                break;

              lastChar = c;
              match.push(c);
            }

            return [ match.join('') ];
          }
        }
      ]
    });

    var result = tokenizer('Hello {^^name_}, this is a test string! Timestamp is {#date#}');
    console.log(result);
  });
});
