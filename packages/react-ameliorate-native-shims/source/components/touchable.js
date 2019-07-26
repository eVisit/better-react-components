import { utils as U }             from 'evisit-js-utils';
import { isElementOrDescendant }  from '@react-ameliorate/utils';
import { View }                   from './view';

export default class Touchable extends View {
  getProps(providedProps) {
    var props = super.getProps({ pointerEvents: "auto", ...providedProps });

    return {
      ...props,
      className: this.getClassName('raTouchable', props.className),
      onClick: this.onClick,
      onMouseDown: this.onMouseDown,
      onMouseUp: this.onMouseUp
    };
  }

  getRootElement = () => {
    var rootElement = this.props.rootElement;
    if (typeof rootElement === 'function')
      rootElement = rootElement.call(this);

    if (!rootElement)
      rootElement = this.rootElement;

    return rootElement;
  }

  onClick = (event) => {
    if (this.props.disabled)
      return;

    var target = U.get(event, 'nativeEvent.target'),
        rootElement = this.getRootElement();

    if (!isElementOrDescendant(rootElement, target))
      return;

    if (typeof this.props.onPress === 'function')
      this.props.onPress.call(this, event);
  }

  onMouseDown = (event) => {
    if (this.props.disabled)
      return;

    var target = U.get(event, 'nativeEvent.target'),
        rootElement = this.getRootElement();

    if (!isElementOrDescendant(rootElement, target))
      return;

    if (typeof this.props.onPressStart === 'function')
      this.props.onPressStart.call(this, event);
  }

  onMouseUp = (event) => {
    if (this.props.disabled)
      return;

    var target = U.get(event, 'nativeEvent.target'),
        rootElement = this.getRootElement();

    if (!isElementOrDescendant(rootElement, target))
      return;

    if (typeof this.props.onPressEnd === 'function')
      this.props.onPressEnd.call(this, event);
  }
}
