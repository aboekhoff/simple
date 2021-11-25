const { isSymbol } = require('./symbol');
const { MINI_NAME, MINI_SHOW } = require('./constants');

function write(...xs) {
  console.log(xs.join(' '));
}

function show(x) {
  if (x == null) { return '#nil'; }
  if (x === true) { return '#t'; }
  if (x === false) { return '#f'; }
  if (isSymbol(x)) {
    return x.name;
  }
  if (x instanceof Function) {
    const name = x[MINI_NAME] || x.name || '';
    return `#<fn${name ? ' ' + name : name}>`;
  }
  if (typeof x !== 'object') {
    return JSON.stringify(x);
  }
  if (x[MINI_SHOW]) {
    return x[MINI_SHOW](x);
  }
  if (Array.isArray(x)) {
    return '[' + x.map(show).join(' ') + ']';
  }
  const type = (x.constructor && x.constructor.name) || 'Object';
  const kvs = Object.keys(x).map(k => [show(k), show(x[k])]);
  return `#<${type}${kvs.length ? ' ' + kvs.map(show).join(' ') : ''}>`;
};

function prn(...xs) {
  write(...xs.map(show));
}

function warn(...xs) {
  write("\u001b[31m");
  prn(...xs);
  write("\u001b[0m");
}  

function notify(...xs) {
  write("\u001b[32m");
  prn(...xs)
  write("\u001b[0m");
}

module.exports = { show, prn, warn, notify };