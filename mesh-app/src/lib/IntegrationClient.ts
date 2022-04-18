import qs from 'qs'
import {
  ContentEntry,
  ContentType,
  GetContentEntityResponse,
  GetContentTypesResponse,
  LoginResponse,
  Params,
} from '../types'
import { groupBy } from './utils'
import { INTEGRATION_COOKIE_NAME } from './constants'
import { getFromSessionStorage, setToSessionStorage } from './sessionStorage'

const SEARCH_TYPES = ['richtext', 'string']

export default class IntegrationClient implements Params {
  apiUsername = null

  apiKey = null

  projectId = null

  apiHost = null

  constructor({ identifier, password, apiHost }) {
    this.apiUsername = identifier
    this.apiKey = password
    this.projectId = password
    this.apiHost = apiHost
  }

  static mapContentEntity(entry): ContentEntry {
    return {
      id: entry?.id?.toString(),
      cmsId: entry?.id?.toString(),
      lastModified: entry?.updated_at,
      data: entry,
      contentTypeId: entry?.contentTypeId,
      editEndpoint: `item/${entry?.id}`,
    }
  }

  static mapContentType(contentType): ContentType {
    return {
      id: contentType?.id,
      name: contentType?.name,
    }
  }

  static base64encode(value: string) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value).toString('base64')
    }
    if (typeof window !== 'undefined' && typeof window.btoa !== 'undefined') {
      return window.btoa(value)
    }
    return undefined
  }

  async login() {
    const { token, expiredDate } = getFromSessionStorage(INTEGRATION_COOKIE_NAME) || {}

    if (!token || Date.now() > expiredDate) {
      const credentials = IntegrationClient.base64encode(`${this.apiUsername}:${this.apiKey}`)

      const auth = {
        token: credentials,
        expiredDate: Date.now() + 360000,
      }

      setToSessionStorage(INTEGRATION_COOKIE_NAME, auth)

      return credentials
    }

    return token
  }

  async getContentTypes(): Promise<ContentType[]> {
    const token = await this.login()

    const url = `${this.apiHost}/projects/${this.projectId}/templates`
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${token}` },
    })

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Error fetching '${url}': ${msg}`)
    }

    const result: GetContentTypesResponse = await res.json()

    return result?.data?.map(IntegrationClient.mapContentType) || []
  }

  async searchContentEntries({ searchText, contentType }): Promise<ContentEntry[]> {
    const token = await this.login()

    const query = qs.stringify(
      {
        template_id: contentType.id,
        name_contains: searchText,
      },
      {
        encodeValuesOnly: true,
      }
    )

    const url = `${this.apiHost}/projects/${this.projectId}/items?${query}`

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${token}` },
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Error fetching '${url}': ${msg}`)
    }

    const result: GetContentEntityResponse = await res.json()

    return (result?.data || [])
      .map(e => ({ ...e, contentTypeId: contentType.id }))
      .map(IntegrationClient.mapContentEntity)
  }

  async getContentEntries({ entries }): Promise<ContentEntry[]> {
    const token = await this.login()
    // entries is an array of objects { id: string (id of entry), contentType: string (id of entry's content type) }
    // group entries by content types
    const idsByContentType = groupBy(entries, 'contentType.id')
    // get content types ids
    const contentTypeIds = Object.entries(idsByContentType)
    // fetch data for each content type separately
    const itemLists = await Promise.all(
      contentTypeIds.map(async ([contentTypeId, items]) => {
        const contentTypeData = items[0]?.contentType

        const query = qs.stringify(
          {
            template_id: contentTypeId,
            name_contains: idsByContentType[contentTypeId].map(e => e.cmsId),
          },
          {
            encodeValuesOnly: true,
          }
        )

        const url = `${this.apiHost}/projects/${this.projectId}/items?${query}`

        const res = await fetch(url, {
          headers: { Authorization: `Basic ${token}` },
        })
        if (!res.ok) {
          const msg = await res.text()
          throw new Error(`Error fetching '${url}': ${msg}`)
        }

        const currentResult: GetContentEntityResponse = await res.json()

        return (currentResult?.data || []).map(item => ({
          ...item,
          contentTypeId: contentTypeData?.id,
        }))
      })
    )

    // concat arrays of fetched data
    return itemLists.flat().map(IntegrationClient.mapContentEntity)
  }
}
