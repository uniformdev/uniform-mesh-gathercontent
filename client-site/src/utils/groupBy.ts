function getPropertyByKeyPath(targetObj, keyPath) {
  let keys = keyPath.split('.')
  if (keys.length === 0) return undefined
  keys = keys.reverse()
  let subObject = targetObj
  while (keys.length) {
    let k = keys.pop()
    // eslint-disable-next-line no-prototype-builtins
    if (!subObject.hasOwnProperty(k)) {
      return undefined
    }
    subObject = subObject[k]
  }
  return subObject
}

export default function (entries, field) {
  const grouped = {}

  entries.forEach(entry => {
    const fieldName = getPropertyByKeyPath(entry, field)

    if (!grouped[fieldName]) {
      grouped[fieldName] = []
    }
    grouped[fieldName].push(entry)
  })

  return grouped
}
