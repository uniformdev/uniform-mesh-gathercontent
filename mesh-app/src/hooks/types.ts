import {
  ContentEntry,
  ContentType,
  ConvertContentEntryToSearchResult,
  ConvertContentEntryToSearchResultParams,
  EditorSettings,
} from '../types'

interface Entry {
  id: string
  contentTypeId: string
}

interface IntegrationClient {
  searchContentEntries: (data) => Promise<ContentEntry[]>
  getContentTypes: () => Promise<ContentType[]>
  getContentEntries: (data) => Promise<ContentEntry[]>
}

export interface UseSearchContentEntriesParams {
  displayName: string
  settings: EditorSettings
  contentTypes: {
    [name: string]: ContentType
  }
  convertContentEntryToSearchResult: (
    param: ConvertContentEntryToSearchResultParams
  ) => ConvertContentEntryToSearchResult
  integrationClient: IntegrationClient
}

export interface UseFilteredContentTypesParam {
  allowedContentTypes: {
    [name: string]: ContentType
  }
  integrationClient: IntegrationClient
}

export interface UseFilteredContentTypesResult {
  loading: boolean
  error?: Error
  value?: {
    [name: string]: ContentType
  }
}

export interface UseSelectedContentEntriesParams {
  settings: EditorSettings
  entries: Entry[]
  contentTypes: {
    [name: string]: ContentType
  }
  displayName
  convertContentEntryToSearchResult: (
    param: ConvertContentEntryToSearchResultParams
  ) => ConvertContentEntryToSearchResult
  integrationClient: IntegrationClient
}

export interface UseGetContentEntriesById {
  settings: EditorSettings
  entries: Entry[]
  integrationClient: IntegrationClient
}

export interface UseGetAppNamesParams {
  clientId?: string
  clientSecret?: string
}
