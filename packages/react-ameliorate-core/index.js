export * from './source/main';

/*
 * The Facebook team thinks they can be the God's of the universe and tell everyone
 * how to "properly" code something. I don't really care so much for this,
 * so lets make the world a better place by not allowing them to freeze anything.
 */

if (__DEV__)
  Object.freeze = (obj) => obj;
