import { useAsync, useAsyncFn } from 'react-use'
import {
  UseFilteredContentTypesParam,
  UseFilteredContentTypesResult,
  UseGetContentEntriesById,
  UseSearchContentEntriesParams,
  UseSelectedContentEntriesParams,
} from './types'

export function useGetContentEntriesById({ settings, entries, integrationClient }: UseGetContentEntriesById) {
  const { loading, error, value } = useAsync(async () => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return
    }

    return integrationClient.getContentEntries({
      entries,
      withContent: true
    })
  }, [settings.apiKey, entries?.map(entry => entry.id)?.join(',')])

  return { loading, error, value }
}

export function useSelectedContentEntries({
  settings,
  entries,
  convertContentEntryToSearchResult,
  contentTypes,
  displayName,
  integrationClient,
}: UseSelectedContentEntriesParams) {
  const { loading, error, value: contentEntries } = useGetContentEntriesById({ settings, entries, integrationClient })
  const resolveSelectedContentEntries = () => {
    if (!entries) {
      return
    }

    if (loading) {
      return entries.map(entry => ({
        id: entry.id,
        title: `Loading...`,
      }))
    }
    if (contentEntries) {
      return entries.map(selectedContentEntry => {
        const entry = contentEntries.find(e => e.cmsId === selectedContentEntry.id)
        if (entry) {
          const resolvedContentType = contentTypes ? contentTypes[entry.contentTypeId] : undefined
          return convertContentEntryToSearchResult({
            entry,
            displayName,
            selectedContentType: resolvedContentType,
            settings,
          })
        }
        return {
          id: selectedContentEntry.id.toString(),
          title: `Unresolvable (${JSON.stringify(selectedContentEntry.id)})`,
        }
      })
    }
  }

  const selectedContentEntries = resolveSelectedContentEntries()

  return { selectedContentEntries, error }
}

export function useFilteredContentTypes({
  integrationClient,
  allowedContentTypes,
}: UseFilteredContentTypesParam): UseFilteredContentTypesResult {
  return useAsync(async () => {
    const contentTypes = await integrationClient.getContentTypes()
    const filteredContentTypes = {}
    contentTypes?.forEach(contentType => {
      if (allowedContentTypes[contentType.id]) {
        filteredContentTypes[contentType.id] = {
          id: contentType.id,
          name: contentType.name,
        }
      }
    })

    return filteredContentTypes
  })
}

export function useSearchContentEntries({
  contentTypes,
  settings,
  convertContentEntryToSearchResult,
  displayName,
  integrationClient,
}: UseSearchContentEntriesParams) {
  return useAsyncFn(
    async (text, options) => {
      if (!contentTypes || !options?.contentType) {
        return
      }

      const selectedContentType = Object.values(contentTypes).find(
        contentType => contentType?.id.toString() === options.contentType
      )

      if (!selectedContentType) {
        return
      }

      const results = await integrationClient.searchContentEntries({
        contentType: selectedContentType,
        searchText: text?.toString() || '',
        withContent: true
      })

      if (results) {
        return results.map(entry =>
          convertContentEntryToSearchResult({
            entry,
            selectedContentType,
            settings,
            displayName,
          })
        )
      }
      return undefined
    },
    [contentTypes, settings, convertContentEntryToSearchResult]
  )
}
