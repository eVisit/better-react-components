import { utils as U } from 'evisit-js-utils';

// '{first_name} {last_name} {email}'
// {
//   first_name: {
//     validator: 'required',

//   },
//   email: {
//     optional: true,
//     formatter: 'email',
//     validator: 'email',
//     format: '({email})',
//     placeholder: 'Email'
//   }
// }

export class FormatterEngine {
  constructor(componentInstance) {
    Object.defineProperties(this, {
      '_component': {
        writable: false,
        enumerable: false,
        configurable: false,
        value: componentInstance
      }
    });
  }

  getConfig() {
    return this.constructor.config;
  }

  format(value, op, _args) {
    var args = _args || {};

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
