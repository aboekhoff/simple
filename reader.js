const { symbol } = require('./symbol');
const { List, list } = require('./list');
const { LIST, QUOTE, QUASIQUOTE, UNQUOTE, UNQUOTE_SPLICING } = require('./constants');
const NIL = '#nil';
const VOID = '#void';
const TRUE = '#t';
const FALSE = '#f';

const REG_HEX = /^[-+]?0(x|X)([0-9a-fA-F])+$/;
const REG_INT = /^[-+]?(0|([1-9][0-9]*))$/;
const REG_FLOAT = /^[-+]?((0)|[1-9][0-9]*)\.[0-9]+$/;
const REG_BINARY = /^[-+]?0(b|B)[01]+$/;
const TERMINAL = '()[];"\'~`';
const ESCAPE_MAP = {
  't': '\t',
  'n': '\n',
  'b': '\b',
  'f': '\f',
  'r': '\r',
  'v': '\v',
  '\"': '"',
  '\\': '\\',
}

class Reader {
  constructor(input, source) {
    this.source = source || 'unknown';
    this.input = input;
    this.offset = 0;
    this.line = 1;
    this.column = 1;
  }

  isEmpty() {
    return this.offset >= this.input.length;
  }

  peek() {
    return this.input[this.offset];
  }

  pop() {
    if (this.peek() === '\n' || this.peek() === '\r') {
      this.line++;
      this.column = 0;
    } else if (this.peek() !== '\f') {
      this.column++;
    }
    return this.input[this.offset++];
  }

  isTerminal(c) {
    return /\s/.test(c) || TERMINAL.indexOf(c) !== -1;
  }

  getPosition() {
    return {
      line: this.line,
      column: this.column,
      source: this.source,
      toString() {
        return `line ${this.line}, column ${this.column} in ${this.source}`;
      }
    }
  }

  skipComment() {
    while (!this.isEmpty()) {
      const c = this.pop();
      if (c === '\n') {
        break;
      }
    }
  }

  skipWhitespace() {
    while (!this.isEmpty()) {
      const c = this.peek();

      if (c === ';') {
        this.skipComment();
        continue;
      }

      if (/\s/.test(c)) {
        this.pop();
        continue;
      }

      break;
    }
  }

  readSexp() {
    this.skipWhitespace();
    const pos = this.getPosition();
    switch (this.peek()) {
      case '"':
        return this.readString();
      case '(':
        return this.readSequence('(', ')', x => List.from(x));
      case '[':
        return this.readSequence('[', ']', x => x);
      case ')':
        throw Error('unmatched ) at ' + pos);
      case ']':
        throw Error('unmatched ] at ' + pos);
      case '\'':
        return this.readQuote();
      case '`':
        return this.readQuasiquote();
      case '~':
        return this.readUnquote();
      default:
        return this.readSymbol();
    }
  }

  readQuote() {
    this.pop();
    this.skipWhitespace();
    return list(QUOTE, this.readSexp());
  }

  readQuasiquote() {
    this.pop();
    this.skipWhitespace();
    return list(QUASIQUOTE, this.readSexp());
  }

  readUnquote() {
    this.pop();
    let symbol = UNQUOTE;
    if (this.peek() === '@') {
      this.pop();
      symbol = UNQUOTE_SPLICING;
    }
    return list(symbol, this.readSexp());
  }

  readString() {
    const pos = this.getPosition();
    const chars = [];
    this.pop();
    loop: while (!this.isEmpty()) {
      const c = this.pop();
      switch (c) {
        case '"':
          return chars.join('');
        case '\\':
          const d = this.pop();
          chars.push(ESCAPE_MAP[d]);
          continue loop;
        default:
          chars.push(c);
      }
    }
    throw Error();
  }

  readSequence(open, close, transform) {
    const pos = this.getPosition();
    const list = [];
    this.pop();
    while (true) {
      this.skipWhitespace();
      if (this.isEmpty()) {
        throw Error('unclosed opening ' + open + ' at ' + pos);
      }
      if (this.peek() === close) {
        this.pop();
        return transform(list);
      }
      list.push(this.readSexp());
    }
  }

  readSymbol() {
    const chars = [];
    while (!this.isEmpty() && !(this.isTerminal(this.peek()))) {
      chars.push(this.pop());
    }
    const string = chars.join('');

    if (string === TRUE) {
      return true;
    }
    if (string === FALSE) {
      return false;
    }
    if (string === NIL) {
      return null;
    }
    if (string === VOID) {
      return void (0);
    }
    if (REG_FLOAT.test(string)) {
      return parseFloat(string, 10);
    }
    if (REG_HEX.test(string)) {
      return parseInt(string, 16);
    }
    if (REG_INT.test(string)) {
      return parseInt(string, 10);
    }
    if (REG_BINARY.test(string)) {
      return parseInt(string, 2);
    }

    // if (string[0] === ':') {
    //   return keyword(string.substring(1));
    // }

    // if (/[^:]+:[^:]+/.test(string)) {
    //   const [namespace, name] = string.split(':');
    //   return symbol(name, namespace);
    // }

    return symbol(string);
  }
}

exports.Reader = Reader;