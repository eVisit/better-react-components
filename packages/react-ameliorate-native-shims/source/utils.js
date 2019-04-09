"use strict";

import { findDOMNode } from '@react-ameliorate/utils';

export function findNodeHandle(instance) {
  return findDOMNode(instance);
}
