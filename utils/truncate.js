export default function (string, limit) {
  let trimmedString = string.substr(0, limit)
  if (trimmedString === string) { return string }
  trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(' ')))
  trimmedString = trimmedString.split(/\W$/)[0]
  return trimmedString + '...'
}
