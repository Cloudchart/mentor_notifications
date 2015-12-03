export default function (string, limit) {
  let trimmedString = string.substr(0, limit)
  trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(' ')))
  return trimmedString + '...'
}
