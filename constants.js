const { symbol, gensym } = require('./symbol');
const MINI_SHOW = Symbol('mini=show');
const MINI_FN = Symbol('mini-fn');
const MINI_ENV = Symbol('mini-env');
const MINI_PARAMS = Symbol('mini-params');
const MINI_RESTPARAM = Symbol('mini-restparam');
const MINI_BODY = Symbol('mini-body');
const MINI_NAME = Symbol('mini-name');
const FN = symbol('fn');
const FN_STAR = symbol('fn*');
const DO = symbol('do');
const IF = symbol('if');
const LET = symbol('let');
const LET_STAR = symbol('let*');
const LETREC = symbol('letrec');
const QUASIQUOTE = symbol('quasiquote');
const QUOTE = symbol('quote');
const UNQUOTE = symbol('unquote');
const UNQUOTE_SPLICING = symbol('unquote_splicing');
const DEFINE = symbol('define');
const DEFINE_STAR = symbol('define*');
const SET_MACRO_BANG = symbol('set-macro!');
const AGET = symbol('aget');
const ASET = symbol('aset');
const LIST = symbol('list');
const CONCAT = symbol('concat');
const REST_SENTINEL = symbol(':');
const ARRAY = symbol('->array');
const THROW = symbol('throw');
const DOT = symbol('.');
const SET_BANG = symbol('set!');

module.exports = {
  REST_SENTINEL,
  MINI_PARAMS,
  MINI_RESTPARAM,
  MINI_BODY,
  MINI_ENV,
  MINI_FN,
  MINI_SHOW,
  MINI_NAME,
  DO,
  FN,
  FN_STAR,
  IF,
  LET,
  LET_STAR,
  QUOTE,
  QUASIQUOTE,
  UNQUOTE,
  UNQUOTE_SPLICING,
  DEFINE,
  DEFINE_STAR,
  SET_MACRO_BANG,
  AGET,
  ASET,
  LIST,
  CONCAT,
  ARRAY,
  THROW,
  DOT,
  SET_BANG,
}