const RT = {};

function init(kvs) {
  Object.keys(kvs).forEach(k => {
    RT[k] = kvs[k];
  });
};

module.exports = {
  RT,
  init,
};