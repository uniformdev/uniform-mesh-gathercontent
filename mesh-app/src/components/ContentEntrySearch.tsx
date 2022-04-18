import { useMountedState } from 'react-use'
import { Callout, EntrySearch, LoadingIndicator } from '@uniformdev/mesh-sdk-react'
import React, { useMemo } from 'react'
import { useFilteredContentTypes, useSearchContentEntries, useSelectedContentEntries } from '../hooks'
import { convertContentEntryToSearchResultFn } from '../lib/utils'
import { ContentType } from '../types'
import LogoIcon from '../../public/gathercontent-badge.svg'

const ContentEntrySearch = ({
  allowedContentTypes,
  settings,
  value,
  setValue,
  multiSelect,
  displayName,
  integrationClient,
}) => {
  const isMounted = useMountedState()
  const {
    loading: filteredContentTypesLoading,
    error: filteredContentTypesError,
    value: filteredContentTypes,
  } = useFilteredContentTypes({ integrationClient, allowedContentTypes })

  const [searchState, handleSearch] = useSearchContentEntries({
    contentTypes: filteredContentTypes,
    convertContentEntryToSearchResult: convertContentEntryToSearchResultFn,
    settings,
    displayName,
    integrationClient,
  })

  const { error: selectedContentEntriesError, selectedContentEntries } = useSelectedContentEntries({
    convertContentEntryToSearchResult: convertContentEntryToSearchResultFn,
    entries: value?.entries,
    settings,
    displayName,
    contentTypes: filteredContentTypes,
    integrationClient,
  })

  const contentTypeOptions = useMemo(
    () =>
      filteredContentTypes
        ? Object.values(filteredContentTypes)
            ?.filter(contentType => Boolean(contentType))
            ?.map((contentType: ContentType) => ({
              id: contentType.id.toString(),
              name: contentType.name,
            }))
        : [],
    [filteredContentTypes]
  )

  if (!isMounted()) {
    return null
  }

  const handleSelect = async (entryIds, contentTypeId) => {
    await setValue({
      entries: entryIds.map(
        id => value?.entries?.find?.(e => e.id === id) || { id, contentType: filteredContentTypes[contentTypeId] }
      ),
    })
  }

  const handleSort = async entryIds => {
    await setValue({
      entries: entryIds.map(id => value?.entries?.find(e => e.id === id)),
    })
  }

  if (searchState.error) {
    return <Callout type="error">{searchState.error.message}</Callout>
  }

  if (selectedContentEntriesError) {
    return <Callout type="error">{selectedContentEntriesError.message}</Callout>
  }

  if (filteredContentTypesError) {
    return <Callout type="error">{filteredContentTypesError.message}</Callout>
  }

  if (filteredContentTypesLoading) {
    return <LoadingIndicator />
  }

  return (
    <EntrySearch
      contentTypes={contentTypeOptions}
      search={handleSearch}
      results={searchState.value}
      logoIcon={LogoIcon.src}
      multiSelect={multiSelect}
      selectedItems={selectedContentEntries}
      select={handleSelect}
      requireContentType
      onSort={handleSort}
    />
  )
}

export default ContentEntrySearch
