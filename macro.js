// I bet you were expecting more

function Macro(symbol) {
  if (!(this instanceof Macro)) {
    return new Macro(symbol);
  }
  this.symbol = symbol;
}

function isMacro(obj) {
  return obj instanceof Macro;
}

module.exports = {
  Macro,
  isMacro,
}