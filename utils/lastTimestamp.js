let lastTimestamp

function get() { return lastTimestamp || new Date }
function set() { return lastTimestamp = new Date }

export default {
  get: get,
  set: set
}
