import { ReactElement } from 'react'

export interface MeshError {
  message?: string
}

export interface LoginResponse {
  jwt: string
}

export interface CMCContentType {
  id: number
  name: string
  number_of_items_using: number
  structure_uuid: string
  project_id: number
  updated_at: string
  updated_by: number
}

export interface GetContentTypesResponse {
  data: CMCContentType[]
}

export interface ContentEntity {
  id: number
  attributes?: {
    [name: string]: any
  }
}

export interface GetContentEntityResponse {
  data: ContentEntity[]
}

export interface AuthState {
  token?: string
  expiredDate?: number
}

export interface AuthContext {
  authState: AuthState
  setAuthState: (state: AuthState) => void
}

export interface Params {
  apiUsername?: string
  apiKey?: string
  projectId?: string
  apiHost?: string
  cmsHost?: string
}

export interface ContentType {
  id: number
  name: string
}

export interface SetAllowedContentTypesPayload {
  [name: string]: ContentType
}

export interface UniformParams {
  apiKey?: string
  projectId?: string
}

export interface CmsParams {
  allowedContentTypes: {
    [name: string]: ContentType
  }
  multiSelect: boolean
  displayName: string
}

interface Entry {
  id: string
  contentTypeId: string
}

export interface CmsValueParams {
  entries: Entry[]
}

export interface EditorMetadata {
  parameterConfiguration: {
    maxFlairCount: number
    allowedContentTypes: string
    multiSelect: boolean
    displayName: string
  }
  settings: Params
}

export interface EditorSettings extends UniformParams, Params {}

export interface ContentEntry {
  id: string
  cmsId: string
  contentTypeId: string
  editEndpoint: string
  lastModified: string
  data: {
    [name: string]: any
  }
}

export interface ConvertContentEntryToSearchResultParams {
  entry: ContentEntry
  displayName: string
  settings?: Params
  selectedContentType: ContentType
}

export interface ConvertContentEntryToSearchResult {
  id: string
  title: string
  contentType: string
  metadata: {
    Type: string
    Updated: ReactElement
  }
  editLink: string
}
