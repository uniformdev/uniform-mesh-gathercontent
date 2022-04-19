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
    title: entry.data[displayName],
    metadata: {
      Type: selectedContentType?.name || 'Unknown',
      Updated: <span>{timeAgo(entry.lastModified)}</span>,
    },
    editLink: `${settings.cmsHost}/${entry.editEndpoint}`,
  }
}
