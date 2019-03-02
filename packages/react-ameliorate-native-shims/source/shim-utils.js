// Flatten the style object
export function flattenStyle(style, _finalStyle) {
  var finalStyle = _finalStyle || {};
  if (!(style instanceof Array))
    return { ...finalStyle, ...(style || {}) };

  for (var i = 0, il = style.length; i < il; i++) {
    var thisStyle = style[i];
    if (!thisStyle)
      continue;

    if (thisStyle instanceof Array)
      finalStyle = flattenStyle(thisStyle, finalStyle);
    else
      finalStyle = { ...finalStyle, ...thisStyle };
  }

  // if (finalStyle.flex === 0)
  //   finalStyle.flex = 'none';

  return finalStyle;
}
