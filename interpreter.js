const { List, isList } = require('./list');
const { RT } = require('./runtime');
const { isSymbol } = require('./symbol');
const { isKeyword } = require('./keyword');
const { Macro } = require('./macro');
const {
  MINI_FN,
  MINI_NAME,
  MINI_BODY,
  MINI_ENV,
  MINI_PARAMS,
  MINI_RESTPARAM,
  DO,
  FN_STAR, 
  IF, 
  QUOTE,
  DEFINE_STAR,
  SET_MACRO_BANG,
  THROW,
  SET_BANG,
} = require('./constants');

class Env {
  static create(root) {
    return new Env([root]);
  }

  constructor(ribs) {
    this.ribs = ribs;
  }

  bind(sym, val) {
    this.ribs[0][sym] = val;
  }

  extend() {
    return new Env([{}, ...this.ribs]);
  }

  get(key) {
    for (let i = 0; i < this.ribs.length; i++) {
      const rib = this.ribs[i];
      const _key = key.toString();
      if (_key in rib) {
        return rib[_key];
      }
    }
  }

  set(key, val) {
    for (let i = 0; i < this.ribs.length; i++) {
      const rib = this.ribs[i];
      const _key = key.toString();
      if (_key in rib) {
        rib[_key] = val;
        return;
      }
    }
    throw Error('cannot set undefined symbol \'' + _key);
  }
}

function defaultEnv() {
  return Env.create(RT['*runtime*']);
}

const { prn, warn, notify, show } = require('./printer');

function makeFunction([params, restparam, body], env) {
  params = Array.from(params);
  const minifn = function(...args) {
    const _env = bindArgs(env, params, restparam, args);
    return eval(body, _env);
  }
  minifn[MINI_FN] = true;
  minifn[MINI_BODY] = body;
  minifn[MINI_PARAMS] = params;
  minifn[MINI_RESTPARAM] = restparam;
  minifn[MINI_ENV] = env;
  return minifn;
}

function bindArgs(env, params, restparam, args) {
  if (args.length < params.length) {
    throw Error(`required ${params.length} args but got ${args.length}`);
  }

  const _env = env.extend()
  let i = 0;
  while (i < params.length) {
    _env.bind(params[i], args[i]);
    i++;
  }
  if (restparam) {
    _env.bind(restparam, List.from(args.slice(i)));
  }
  return _env;
}

function eval(sexp, env = defaultEnv()) {
  try {
    return _eval(sexp, env);
  } catch (e) {
    console.log('ERROR AT:')
    warn(sexp);
    throw(e);
  }
}

function _eval(sexp, env = defaultEnv()) {
  loop:for(;;) {
    if (isKeyword(sexp) && sexp.name[0] === ':') {
      return sexp;
    }

    if (isSymbol(sexp)) {
      return env.get(sexp);
    }

    if (Array.isArray(sexp)) {
      return sexp.map(x => eval(x, env));
    }

    if (!isList(sexp)) {
      return sexp;
    }

    const [head, ...tail] = sexp;
    switch (head) {
      case DEFINE_STAR:
        const name = tail[0];
        const val = eval(tail[1], env);
        if (typeof val == 'function') {
          val[MINI_NAME] = name;
        }
        env.bind(name, val);
        return val;
      case DO:
        const len = tail.length - 1;
        for (let i = 0; i < len; i++) {
          eval(tail[i], env);
        }
        sexp = tail[len];
        continue loop;
      case IF:
        const test = eval(tail[0], env);
        if (test != null && test !== false) {
          sexp = tail[1];
        } else {
          sexp = tail[2];
        }
        continue loop;
      case FN_STAR:
        return makeFunction(tail, env);
      case SET_MACRO_BANG:
        RT['*env*'].set(tail[0], Macro(tail[0]));
        return null;
      case QUOTE:
        return tail[0];
      case THROW:
        throw tail[0];
      case SET_BANG:
        const key = tail[0];
        const _val = eval(tail[1], env);
        env.set(key, _val);
        return;
      default:
        if (sexp.isEmpty()) {
          return sexp;
        }
        const [callee, ...args] = sexp.map(_sexp => eval(_sexp, env));
        if (!(typeof callee === 'function')) {
          warn(`'${show(sexp.first())} is not a function`);
          prn(callee);
          prn(args);
          throw Error(`${show(callee)} is not callable`);
        }
        if (callee[MINI_FN]) {
          env = bindArgs(callee[MINI_ENV], callee[MINI_PARAMS], callee[MINI_RESTPARAM], args);
          sexp = callee[MINI_BODY];
          continue;
        }
        return callee.apply(null, args);
    }
  }
}

module.exports = {
  _eval,
  eval,
};