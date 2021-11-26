const metadata = new WeakMap();

function getMeta(obj) {
  return metadata.get(obj);
}

function withMeta(obj, data) {
  metadata.set(obj, data);
  return obj;
}