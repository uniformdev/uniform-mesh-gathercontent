import qs from 'qs'
import { Params } from '../types'

export default class GatherContentClient implements Params {
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

  static mapContentEntity(entry) {
    return {
      id: entry?.id?.toString(),
      cmsId: entry?.id?.toString(),
      lastModified: entry?.updated_at,
      data: { name: entry?.name, id: entry?.id?.toString(), ...(entry.content || {}) },
      contentTypeId: entry?.contentTypeId,
      editEndpoint: `item/${entry?.id}`,
    }
  }

  static mapContentType(contentType) {
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
    return GatherContentClient.base64encode(`${this.apiUsername}:${this.apiKey}`)
  }

  async getContentEntries({ entries, withContent = true }) {
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

    const result = await res.json()

    let cmsEntries = result?.data || []

    if (withContent) {
      cmsEntries = await this.updateContentEntriesWithContent({ entries: cmsEntries })
    }

    return cmsEntries
      .map(item => ({
        ...item,
        contentTypeId: item?.template_id,
      }))
      .map(GatherContentClient.mapContentEntity)
  }

  async updateContentEntriesWithContent({ entries }) {
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
