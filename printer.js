const { isSymbol } = require('./symbol');
const { MINI_NAME, MINI_SHOW } = require('./constants');
const { RT } = require('./runtime');

function getOutputPort() {
  return RT['*out*'];
}

function setOutputPort(port) {
  RT['*out*'] = port;
}

function withStringPort(fn) {
  const oldPort = getOutputPort();
  const buf = [];
  const newPort = { write(str) { buf.push(str) } }
  setOutputPort(newPort);
  try {
    fn();
    return buf.join('');
  } finally {
    setOutputPort(oldPort);
  }
}

function write(...xs) {
  xs.forEach(str => RT['*out*'].write(str));
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

function prstr(...xs) {
  return withStringPort(() => pr(...xs));
}

function pr(...xs) {
  write(...xs.map(show));
}

function print(...xs) {
  for (x of xs) {
    if (typeof x === 'string') {
      write(x)
    } else {
      write(show(x));
    }
  }
}

function printstr(...xs) {
  return withStringPort(() => print(...xs));
}

function prn(...xs) {
  write(...xs.map(show));
  write("\n");
}

function warn(...xs) {
  write("\u001b[31m");
  pr(...xs);
  write("\u001b[0m");
  prn();
}  

function notify(...xs) {
  write("\u001b[32m");
  pr(...xs);
  write("\u001b[0m");
  prn();
}

module.exports = { 
  show, 
  prstr, 
  pr, 
  prn, 
  print, 
  printstr,
  warn, 
  notify, 
  getOutputPort, 
  setOutputPort, 
  withStringPort 
};