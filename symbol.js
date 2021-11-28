const registry = new Map();

const nextInt = ((seed) => () => {
  seed += 1;
  return seed;
})(0);

class Symbol {
  constructor(name) {
    this.name = name;
  }

  toString() {
    return this.name;
  }
}

function isSymbol(x) {
  return (x instanceof Symbol);
}

function symbol(name) {
  if (!(typeof name === 'string')) {
    throw Error('name must be a string');
  }

  if (!registry.has(name)) {
    registry.set(name, new Symbol(name));
  }

  return registry.get(name);
}

function gensym(name) {
  return new Symbol(name + '_' + nextInt());
}

module.exports = {
  isSymbol,
  symbol,
  gensym,
}