const { List, isList } = require('./list');
const { RT } = require('./runtime');
const { symbol, isSymbol } = require('./symbol');
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
  ARRAY,
} = require('./constants');
const { prn, warn, notify, show } = require('./printer');
const { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } = require('constants');

function makeFunction([params, restparam, body], env) {
  params = Array.from(params);
  // const checkArity = makeArityChecker(params, restparam);
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

  const _env = Object.create(env);
  let i = 0;
  while (i < params.length) {
    _env[params[i]] = args[i];
    i++;
  }
  if (restparam) {
    _env[restparam] = List.from(args.slice(i));
  }
  return _env;
}

function eval(sexp, env = RT['*runtime*']) {
  try {
    return _eval(sexp, env);
  } catch (e) {
    console.log('ERROR AT:')
    warn(sexp);
    throw(e);
  }
}

function _eval(sexp, env = RT['*runtime*']) {
  loop:for(;;) {
    // quick and dirty keywords based on making
    // symbols that start with ':' evaluate to themselves
    if (isSymbol(sexp) && sexp.name[0] === ':') {
      return sexp;
    }

    if (isSymbol(sexp)) {
      return env[sexp];
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
        env[name] = val;
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
      case QUOTE:
        return tail[0];
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