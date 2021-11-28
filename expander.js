const { isSymbol, symbol, gensym } = require('./symbol');
const { List, isList, list } = require('./list');
const { prn, warn, notify, show } = require('./printer');
const { isMacro } = require('./macro');
const { RT } = require('./runtime');
const {
  DO, 
  IF,
  FN,
  CONCAT,
  FN_STAR,
  AGET,
  LET,
  LET_STAR,
  DEFINE,
  DEFINE_STAR,
  QUASIQUOTE,
  LIST,
  QUOTE,
  UNQUOTE,
  UNQUOTE_SPLICING,
  SET_MACRO_BANG,
  REST_SENTINEL,
  ARRAY,
  THROW,
  SET_BANG,
} = require('./constants');

const SPECIAL_FORMS = [
  DO,
  IF,
  QUOTE,
  FN_STAR,
  DEFINE_STAR,
  SET_MACRO_BANG,
  THROW,
  SET_BANG,
];

// built in macros and special-form designations
// any symbol that resolves to a Macro object designates a macro
// any symbol that resolves to a string designates a special form
function defaultEnv() {
  const e = new Map();
  SPECIAL_FORMS.forEach(sf => e.set(sf, sf.name));
  e.set(LET, (t, e) => {
    const [_, bindings, ...body] = t;
    const pairs = List.partition(2, bindings);
    const names = pairs.map(([name, _]) => name);
    const vals = pairs.map(([_, val]) => val);
    const out = list(list(FN_STAR, names, null, ...body), ...vals.map(v => macroexpand(v, e)));
    return out;
  });
  e.set(LET_STAR, ([...t], e) => {
    const [_, bindings, ...body] = t;
    if (bindings.length === 0) {
      return list(DO, ...body);
    }
    const [name, val, ...more] = bindings;
    const out = list(list(FN_STAR, list(name), null, list(LET_STAR, more, ...body)), macroexpand(val, e));
    return out;
  });
  e.set(FN, ([...t], e) => {
    const { params, restparam } = parseFnParams(t[1]);
    return list(FN_STAR, params, restparam, list(DO, ...t.slice(2)));
  });
  e.set(DEFINE, ([...t], e) => {
    if (isList(t[1])) {
      const name = t[1].first();
      const { params, restparam } = parseFnParams(t[1].rest());
      return list(DEFINE_STAR, name, macroexpand(list(FN_STAR, params, restparam, ...t.slice(2))));
    } else {
      return list(DEFINE_STAR, t[1], macroexpand(t[2]));
    }
  });
  e.set(QUASIQUOTE, ([_, t], e) => {
    return quasiquote(t);
  });
  return e;
}

function quasiquote(t) {
  function isUnquote(t) {
    return isList(t) && t.first() === UNQUOTE;
  }

  function isSplice(t) {
    return isList(t) && t.first() === UNQUOTE_SPLICING;
  }

  function qq(t) {
    return list(CONCAT, ...t.map(q))
  }

  function q(t) {
    if (isUnquote(t)) {
      const [, _t] = t;
      return list(LIST, _t);
    }

    if (isSplice(t)) {
      const [, _t] = t;
      return _t;
    }

    if (Array.isArray(t)) {
      return list(ARRAY, qq(t));
    }

    if (isList(t)) {
      return list(LIST, qq(t));
    }

    if (isSymbol(t)) {
      return list(LIST, list(QUOTE, t));
    }

    return list(LIST, t);
  }

  if (isList(t)) {
    return qq(t);
  }

  return q(t);
}

function macroexpand(t, e = RT['*env*']) {
  if (!isList(t)) { return t; }

  const denotation = e.get(t.first());

  if (typeof denotation === 'function') {
    return macroexpand(denotation(t, e));
  }

  if (isMacro(denotation)) {
    const expander = RT[denotation.symbol];
    return macroexpand(expander(t, e));
  }
  
  return t;
}

function expand(t, e = RT['*env*']) {
  t = macroexpand(t, e);
  if (Array.isArray(t)) {
    return t.map(_t => expand(_t, e));
  }

  if (isSymbol(t) && /^[^\.]+(\.[^\.]+)+$/.test(t.name)) {
    const segs = t.name.split('.');
    let root = symbol(segs[0]);
    for (let i = 1; i < segs.length; i++) {
      root = list(AGET, root, segs[i]);
    }
    return root;
  }

  if (!(t instanceof List)) {
    return t;
  }

  const denotation = e.get(t.first());

  if (typeof denotation === 'function') {
    throw Error('this should never happen');
  }

  if (typeof denotation === 'string') {
    return expandSpecialForm(t.first(), t.rest(), e);
  }

  return t.map(x => expand(x, e));
}

function parseFnParams([...params]) {
  const _params = [];
  let restparam = null;
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    if (p === REST_SENTINEL) {
      restparam = params[i+1];
      break;
    } else {
      _params.push(params[i]);
    }
  }
  return {
    params: list(..._params),
    restparam,
  };
}

function expandSpecialForm(specialForm, [...args], e) {
  switch (specialForm) {
    case DO:
      return List.from([DO, ...args.map(x => expand(x, e))]);
    case IF:
      return List.from([IF, expand(args[0], e), expand(args[1], e), expand(args[2], e)]);
    case FN_STAR:
      e = new Map(e);
      args[0].forEach(x => e.set(x, x))
      if (args[1]) { e.set(args[1], args[1]) }
      return List.from([FN_STAR, args[0], args[1], expand(List.from([DO, ...args.slice(2)]), e)]);
    case QUOTE:
      return List.from([QUOTE, args[0]]);
    case THROW:
      return List.from([THROW, args[0]]);
    case SET_BANG:
      return List.from([SET_BANG, args[0], expand(args[1], e)]);
    case DEFINE_STAR:
      return List.from([DEFINE_STAR, args[0], expand(args[1], e)]);
    case SET_MACRO_BANG:
      return List.from([SET_MACRO_BANG, args[0]]);
    default:
      throw Error('invalid special form!');
  }
}

module.exports = {
  defaultEnv,
  expand,
  macroexpand,
  quasiquote,
}