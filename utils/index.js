import lastTimestamp from './lastTimestamp'

function truncate(string, limit) {
  let trimmedString = string.substr(0, limit)
  if (trimmedString === string) { return string }
  trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(' ')))
  trimmedString = trimmedString.split(/\W$/)[0]
  return trimmedString + '...'
}

function promisify(method) {
  return (...args) => {
    return new Promise((done, fail) => {
      let callback = (error, result) => error ? fail(error) : done(result)
      method(...args.concat(callback))
    })
  }
}

export default {
  lastTimestamp,
  truncate,
  promisify
}
