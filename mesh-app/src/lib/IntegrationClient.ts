import qs from 'qs'
import {
  ContentEntity,
  ContentEntry,
  ContentType,
  GetContentEntityResponse,
  GetContentTypesResponse,
  Params,
} from '../types'
import { INTEGRATION_COOKIE_NAME } from './constants'
import { getFromSessionStorage, setToSessionStorage } from './sessionStorage'

export default class IntegrationClient implements Params {
  apiUsername = null

  apiKey = null

  projectId = null

  apiHost = null

  constructor({ apiUsername, apiKey, projectId, apiHost }) {
    this.apiUsername = apiUsername
    this.apiKey = apiKey
    this.projectId = projectId
    this.apiHost = apiHost
  }

  static mapContentEntity(entry): ContentEntry {
    return {
      id: entry?.id?.toString(),
      cmsId: entry?.id?.toString(),
      lastModified: entry?.updated_at,
      data: { name: entry?.name, id: entry?.id?.toString(), ...(entry.content || {}) },
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
      headers: { Authorization: `Basic ${token}`, Accept: 'application/vnd.gathercontent.v2+json' },
    })

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Error fetching '${url}': ${msg}`)
    }

    const result: GetContentTypesResponse = await res.json()

    return result?.data?.map(IntegrationClient.mapContentType) || []
  }

  async searchContentEntries({ searchText, contentType, withContent = false }): Promise<ContentEntry[]> {
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
      headers: { Authorization: `Basic ${token}`, Accept: 'application/vnd.gathercontent.v2+json' },
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Error fetching '${url}': ${msg}`)
    }

    const result: GetContentEntityResponse = await res.json()

    let cmsEntries = result?.data || []

    if (withContent) {
      cmsEntries = await this.updateContentEntriesWithContent({ entries: cmsEntries })
    }

    return cmsEntries.map(e => ({ ...e, contentTypeId: contentType.id })).map(IntegrationClient.mapContentEntity)
  }

  async getContentEntries({ entries, withContent = false }): Promise<ContentEntry[]> {
    const token = await this.login()
    const query = qs.stringify(
      {
          item_id: entries.map(e => e.id),
      },
      {
        encodeValuesOnly: true,
      }
    )

    const url = `${this.apiHost}/projects/${this.projectId}/items?${query}`

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${token}`, Accept: 'application/vnd.gathercontent.v2+json' },
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Error fetching '${url}': ${msg}`)
    }

    const result: GetContentEntityResponse = await res.json()

    let cmsEntries = result?.data || []



    return cmsEntries
      .map(item => ({
        ...item,
        contentTypeId: item?.template_id,
      }))
      .map(IntegrationClient.mapContentEntity)
  }

  async updateContentEntriesWithContent({ entries }): Promise<ContentEntity[]> {
    const token = await this.login()

    return Promise.all(
      entries.map(async entry => {
        const url = `${this.apiHost}/items/${entry.id}?include=structure`

        const res = await fetch(url, {
          headers: { Authorization: `Basic ${token}`, Accept: 'application/vnd.gathercontent.v2+json' },
        })
        if (!res.ok) {
          const msg = await res.text()
          throw new Error(`Error fetching '${url}': ${msg}`)
        }

        const result = await res.json()

        const { fields } = result.data?.structure?.groups?.[0] || {}

        return {
          ...entry,
          content: Object.keys(result.data.content).reduce(
            (content, key) => ({
              ...content,
              [fields.find(f => f.uuid === key).label]: result.data.content[key],
            }),
            {}
          ),
        }
      })
    )
  }
}
