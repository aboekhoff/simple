const { MINI_SHOW, LIST } = require('./constants');
const { RT } = require('./runtime');

class List {
  static create(...xs) {
    return List.from(xs);
  }

  static from(arr) {
    let out = new EmptyList();
    for (let i = arr.length-1; i >= 0; i--) {
      out = new FullList(arr[i], out);
    }
    return out;
  }

  static empty() {
    return new EmptyList();
  }

  static cons(x, ls) {
    return ls.cons(x);
  }

  static concat(...xs) { 
    const out = [];
    for (let x of xs) {
      for (let y of x) {
        out.push(y);
      }
    } 
    return List.from(out);
  }

  static partition(n, xs) {
    const out = [];
    let i = 0;
    xs = [...xs];
    while (i < xs.length) {
      const bucket = [];
      for (let j = 0; j < n && i < xs.length; j++, i++) {
        bucket.push(xs[i]);
      }
      out.push(List.from(bucket));
    }
    return List.from(out);
  }

  cons(x) {
    return new FullList(x, this);
  }

  map(f) {
    return List.from(Array.from(this).map(x => f(x)));
  }

  forEach(f) {
    Array.from(this).forEach(f);
  }

  reverse() {
    return List.from(Array.from(this).reverse())
  }

  [Symbol.iterator]() {
    let ls = this;

    return {
      next() {
        if (ls.isEmpty()) { return { done: true } }
        const value = ls.first();
        ls = ls.rest();
        return { value };
      }
    }
  }

  [MINI_SHOW](xs) {
    const buf = [];
    for (let x of xs) {
      buf.push(RT.show(x));
    }
    return '(' + buf.join(' ') + ')';
  }
}

class EmptyList extends List {
  constructor() {
    super();
  }

  isEmpty() { return true }
  first() { return null }
  rest() { return this }
}

class FullList extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }

  isEmpty() { return false }
  first() { return this.head }
  rest() { return this.tail }
}

function list(...xs) {
  return List.from(xs);
}

function isList(xs) {
  return xs instanceof List;
}

module.exports = {
  List, list, isList,
};