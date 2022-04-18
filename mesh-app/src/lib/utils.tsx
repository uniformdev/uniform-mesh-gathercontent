import { format as timeAgo } from 'timeago.js'
import React from 'react'
import { ConvertContentEntryToSearchResult, ConvertContentEntryToSearchResultParams } from '../types'

export function convertContentEntryToSearchResultFn({
  entry,
  settings,
  selectedContentType,
}: ConvertContentEntryToSearchResultParams): ConvertContentEntryToSearchResult {
  return {
    id: entry.cmsId,
    contentType: entry.contentTypeId,
    title: entry.data?.name,
    metadata: {
      Type: selectedContentType?.name || 'Unknown',
      Updated: <span>{timeAgo(entry.lastModified)}</span>,
    },
    editLink: `${settings.cmsHost}/${entry.editEndpoint}`,
  }
}
