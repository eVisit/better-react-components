module.exports = (function() {
  try {
    var VM = require('vm');
  } catch (e) {}

  function runInSafeContext(source, options) {
    if (VM) {
      return VM.runInNewContext(`(() => {\n${source}\n})();`, {}, options);
    } else {
      return eval(`(function(window, global, undefined, require, document) {
        ${source}
      })(void 0, void 0, void 0, void 0, void 0)();`);
    }
  }

  function collectTemplateChunks(fileName, source, _options) {
    function getLineNo(offset) {
      return srcStr.substring(0, offset).split(/\n/g).length;
    }

    function addOffsetPart(src, offset) {
      var diff = offset - lastOffset;
      if (diff > 0)
        parts.push({ type: 'source', value: src.substring(lastOffset, offset) });
    }

    function throwError(m, offset) {
      throw new Error('Compiler error: ' + fileName + ':' + getLineNo(offset) + ': Did you forget some ### in your preprocessor comment?');
    }

    if (!source)
      return [];

    var options     = _options || {},
        srcStr      = ('' + source),
        lastOffset  = 0,
        parts       = [],
        macros      = options.macros || [];

    //Detect errors
    srcStr.replace(/(?:^[^\n\S]*\/\/|\/\*)#{0,2}[^#][^#]*?#{3}[*\/]\//gm, throwError);
    srcStr.replace(/(?:^[^\n\S]*\/\/|\/\*)#{3}[^#]+?#{0,2}\/\//gm, throwError);

    //Expand custom macros

    // Run custom pre-processor macros on code
    for (var i = 0, il = macros.length; i < il; i++) {
      var macro = macros[i];
      if (typeof macro !== 'function')
        continue;

      srcStr = macro.call(options, srcStr);
    }

    //Capture valid chunks
    srcStr.replace(/(?:^[^\n\S]*\/\/|\/\*)#{3}([^#]*?)#{3}[*\/]\//gm, function (m, chunk, offset, str) {
      addOffsetPart(str, offset);
      var offsetEnd = offset + m.length;
      parts.push({ type: 'template', value: chunk, start: offset, end: offsetEnd, line: getLineNo(offsetEnd) });
      lastOffset = offsetEnd;
    });

    addOffsetPart(('' + srcStr), srcStr.length);

    return parts;
  }

  function raPuildPreprocessorTemplateRunner(fileName, source, optionGetter) {
    function safeEmbedString(src) {
      return JSON.stringify(src);
    }

    function buildTemplateFuncArgs() {
      var args = [];
      for (var i = 0, il = optionKeys.length; i < il; i++)
        args.push(options[optionKeys[i]]);

      return args;
    }

    function writeToOutput() {
      _finalTemplateOutput.push.apply(_finalTemplateOutput, arguments);
    }

    var _finalTemplateOutput = [],
        options = Object.assign({}, {
          _finalTemplateOutput,
          WRITE: writeToOutput,
        }),
        userOptions = (typeof optionGetter === 'function') ? optionGetter.call(this, options, writeToOutput) : {};

    Object.assign(options, userOptions);

    var chunks = collectTemplateChunks(fileName, source, options),
        optionKeys = Object.keys(options),
        parts = ['function ensureLineNumber(parts,line){var currentLineCount=parts.join("").split(/\\n/g).length,linesToAdd=line-currentLineCount;if (linesToAdd > 0)parts.push((new Array(linesToAdd + 1)).join("\\n"));}\nreturn (function(' + optionKeys.join(',') + ') {'];

    for (var i = 0, il = chunks.length; i < il; i++) {
      var chunk = chunks[i];

      if (chunk.type === 'source') {
        parts.push('_finalTemplateOutput.push(' + safeEmbedString(chunk.value) + ');\n');
      } else {
        parts.push(chunk.value.replace(/%%(.*?)%%/g, function (m, code) {
          return ('(function(){_finalTemplateOutput.push("" + ' + code + ');})();\n');
        }));
        parts.push('ensureLineNumber(_finalTemplateOutput, ' + chunk.line + ');');
      }
    }

    parts.push('\nreturn _finalTemplateOutput.join(\'\');});');

    var finalTemplate = parts.join('');
    //console.log('Template: ', finalTemplate);
    try {
      var templateFunc = runInSafeContext(finalTemplate, {
            filename: fileName,
            lineOffset: 0,
            columnOffset: 0,
            displayErrors: true,
            timeout: 1000
          }),
          templateArgs = buildTemplateFuncArgs();

      return function () {
        return templateFunc.apply(this, templateArgs);
      };
    } catch (e) {
      console.error('Error while compiling source file (' + fileName + '): ', e);

      return function () {
        return source;
      };
    }
  }

  return {
    raPuildPreprocessorTemplateRunner
  };
})();
