const registry = new Map();

class Keyword {
  constructor(name) {
    this.name = name;
    Object.freeze(this);
  }

  toString() {
    return ':' + this.name;
  }
}

function isKeyword(x) {
  return (x instanceof Keyword);
}

function keyword(name) {
  if (!(typeof name === 'string')) {
    throw Error('name must be a string');
  }

  if (!registry.has(name)) {
    registry.set(name, new Keyword(name));
  }

  return registry.get(name);
}

module.exports = {
  isKeyword,
  Keyword,
  keyword,
};