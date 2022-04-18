import { format as timeAgo } from 'timeago.js'
import React from 'react'
import { ConvertContentEntryToSearchResult, ConvertContentEntryToSearchResultParams } from '../types'

export function convertContentEntryToSearchResultFn({
  entry,
  settings,
  selectedContentType,
  displayName,
}: ConvertContentEntryToSearchResultParams): ConvertContentEntryToSearchResult {
  return {
    id: entry.cmsId,
    contentType: entry.contentTypeId,
    title: entry.data?.[displayName],
    metadata: {
      Type: selectedContentType?.name || 'Unknown',
      Updated: <span>{timeAgo(entry.lastModified)}</span>,
    },
    editLink: `${settings.cmsHost}/${entry.editEndpoint}`,
  }
}

export function getPropertyByKeyPath(targetObj, keyPath) {
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

export function groupBy(entries, field) {
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
