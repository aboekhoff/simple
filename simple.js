const { list, List } = require('./list');
const { gensym, symbol, isSymbol } = require('./symbol');
const { keyword, isKeyword } = require('./keyword');
const { show, notify, warn, pr, prn, print, printstr, println, prstr, str, withStringPort } = require('./printer');
const { Reader } = require('./reader');
const { defaultEnv, expand, macroexpand, quasiquote } = require('./expander');
const { eval } = require('./interpreter');
const { init, RT } = require('./runtime');
const { defineGeneric, extendGeneric, eq } = require('./generic');
const { readFileSync } = require('fs');

init({
  'js/Function': Function,
  '*runtime*': RT,
  '*env*': defaultEnv(),
  '*out*': process.stdout,
  '*loaded-files*': new Set(),
  'expander/expand': expand,
  'expander/macroexpand': macroexpand,
  'expander/quasiquote': quasiquote,
  'with-output-string': withStringPort,
  keyword,
  'keyword?': isKeyword,
  eval,
  show,
  pr,
  prn,
  prstr,
  print,
  println,
  printstr,
  notify,
  warn,
  '<': function(x, y) { return x < y },
  '>': function(x, y) { return x > y },
  '.': function(receiver, method, ...args) {
    return receiver[method](...args);
  },
  'str/join': function(sep, xs) {
    return [...xs].map((x) => prstr(x)).join(sep);
  },
  dict: function(entries = []) {
    const dict = new Map();
    for (entry of entries) {
      const [k, v] = entry;
      dict.set(k, v);
    }
    return dict;
  },
  zip: function([...xs], [...ys]) {
    const len = Math.min(xs.length, ys.length);
    const out = [];
    for (let i = 0; i < len; i++) {
      out.push(list(xs[i], ys[i]));
    }
    return List.from(out);
  },
  interleave: function(xs, ys) {
    const out = [];
    while (!xs.isEmpty() && !ys.isEmpty()) {
      out.push(xs.first());
      out.push(ys.first());
      xs = xs.rest();
      ys = ys.rest();
    }
    return List.from(out);
  },
  'for-each': function (f, xs) {
    if (xs) {
      for (const x of xs) { f(x) }
    }
  },
  reverse: function(xs) { return xs.reverse() },
  '->array': function(xs) { return Array.from(xs); },
  '->list': function(xs) { return List.from(xs); },
  'array?': function(x) { return Array.isArray(x); },
  'list?': function(x) { return x instanceof List; },
  list,
  'empty?': function(x) { return x.isEmpty(); },
  'array': function(...xs) { return xs; },
  'symbol?': function(x) { return isSymbol(x) },
  str,
  cons: function(x, xs) { return xs.cons(x); },
  first: function(xs) { return xs.first(); },
  last: function(xs) { return xs.last(); },
  rest: function(xs) { return xs.rest(); },
  butlast: function(xs) { return xs.butlast(); },
  map: function(f, xs) { return xs.map(f); },
  concat: List.concat,
  partition: List.partition,
  'define-generic*': defineGeneric,
  'extend-generic*': extendGeneric,
  '=': eq,
  apply: function(f, xs) {
    return f(...xs)
  },
  'aset': function(o, k, v) {
    return o[k] = v;
  },
  'aget': function(o, k) {
    return o[k];
  },
  '+': function(...xs) {
    let r = 0;
    for (let i = 0; i < xs.length; i++) { r += xs[i]; }
    return r;
  },
  '*': function(...xs) {
    let r = 1;
    for (let i = 0; i < xs.length; i++) { r *= xs[i]; }
    return r;
  },
  '-': function(...xs) {
    if (xs.length === 0) { throw Error('arity'); }
    let r = xs[0];
    if (xs.length === 1) { return -r; }
    for (let i = 1; i < xs.length; i++) { r -= xs[i]; }
    return r;
  },
  '/': function(...xs) {
    if (xs.length === 0) { throw Error('arity'); }
    let r = xs[0];
    if (xs.length === 1) { return 1/r; }
    for (let i = 1; i < xs.length; i++) { r /= xs[i]; }
    return r;
  },
  '==': function(...xs) {
    if (xs.length < 2) { return true; }
    for (let i = 1; i < xs.length; i++) {
      if (xs[i-1] !== xs[i]) {
        return false;
      }
    }
    return true;
  },
  symbol,
  gensym,
  'load-file': loadFile,
});

//console.log(RT);
function loadFile(file, forceReload=false) {
  if (RT['*loaded-files*'].has(file) && !forceReload) {
    return;
  }
  RT['*loaded-files*'].add(file);
  notify(`loading file: ${file}`);
  const data = readFileSync(file, 'utf8').toString();
  const reader = new Reader(data, file);
  reader.skipWhitespace();
  while (!reader.isEmpty()) {
    const sexp = reader.readSexp();
    const expanded = RT['expander/expand'](sexp);
    const value = RT['eval'](expanded);
  }
}

loadFile('simple/scratch.simple');