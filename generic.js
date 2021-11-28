const { List, isList, isEmpty, EmptyList, FullList } = require('./list');

const symbols = new Map();
const NullPrototype = {};
const UndefinedPrototype = {};

function defineGeneric(name, defaultImpl) {
  const symbol = Symbol('generic:' + name);

  if (!defaultImpl) {
    defaultImpl = function() {
      throw Error('no implementation found for generic function: ' + name);
    }
  }

  const fn = function(x, ...xs) {
    let impl;
    if (x === null) {
      impl = NullPrototype[symbol];
    } else if (x === undefined) {
      impl = UndefinedPrototype[symbol];
    } else {
      impl = x[symbol];
    }
    impl = impl || defaultImpl;
    return impl(x, ...xs);
  }

  symbols.set(fn, symbol);

  return fn;
}

function extendGeneric(gfn, type, impl) {
  const symbol = symbols.get(gfn);
  
  if (!symbol) {
    throw Error(`${gfn} is not registered as a generic function`);
  }

  let prototype;

  if (type === null) {
    prototype = NullPrototype;
  } else if (type === undefined) {
    prototype = UndefinedPrototype;
  } else {
    prototype = type.prototype;
  }

  prototype[symbol] = impl;
}

const eq = defineGeneric('=', (x, y) => x === y);

extendGeneric(eq, Symbol, (x, y) => y instanceof Symbol && x.name === y.name);

extendGeneric(eq, Array, (x, y) => {
  if (x === y) { return true; }
  if (!Array.isArray(y)) { return false; }
  if (!(x.length === y.length)) { return false; }
  for (let i = 0; i < x.length; i++) {
    if (!eq(x[i], y[i])) {
      return false;
    }
  }
  return true;
});

const listEquals = (x, y) => {
  if (x === y) { return true; }
  if (!isList(y)) { return false; }
  const seen = new Set();
  while(true) {
    const a = x.isEmpty();
    const b = y.isEmpty();
    if (a && b) { return true; }
    if (a || b) { return false; }
    if (!eq(x.first(), y.first())) { return false; }
    if (seen.has(x) && seen.has(y)) { return true; }
    seen.add(x);
    seen.add(y);
    x = x.rest();
    y = y.rest();
  }
};

extendGeneric(eq, List, listEquals);

module.exports = {
  defineGeneric,
  extendGeneric,
  eq,
};