import qs from 'qs'
import { StrapiParams } from '../types'
import groupBy from './groupBy'

export default class StrapiClient implements StrapiParams {
  identifier = null

  password = null

  apiHost = null

  auth: { token?: string; expiredDate?: number } = {}

  constructor({ identifier, password, apiHost }) {
    this.identifier = identifier
    this.password = password
    this.apiHost = apiHost
  }

  async login() {
    if (!this.auth.token || this.auth.expiredDate > Date.now()) {
      const data = {
        identifier: this.identifier,
        password: this.password,
      }
      const result = await fetch(`${this.apiHost}/api/auth/local`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })

      const { jwt } = await result.json()

      this.auth.token = jwt
      this.auth.expiredDate = Date.now() + 360000
    }

    return this.auth.token
  }

  async getContentTypes() {
    const token = await this.login()

    const url = `${this.apiHost}/api/content-type-builder/content-types`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Error fetching '${url}': ${msg}`)
    }

    const result = await res.json()

    return result?.data?.filter(ct => ct.schema.visible && !ct.plugin) || []
  }

  async getContentEntries({ entries }) {
    const token = await this.login()
    // entries is an array of objects { id: string (id of entry), contentType: string (id of entry's content type) }
    // group entries by content types
    const idsByContentType = groupBy(entries, 'contentType.schema.pluralName')
    // get content types ids
    const contentTypeIds = Object.entries(idsByContentType)

    // fetch data for each content type separately
    const itemLists = await Promise.all(
      contentTypeIds.map(async ([contentTypeId, items]) => {
        const contentTypeData = items[0]?.contentType

        const query = qs.stringify(
          {
            populate: 'image',
            filters: {
              id: {
                $in: idsByContentType[contentTypeId].map(e => e.id),
              },
            },
          },
          {
            encodeValuesOnly: true,
          }
        )
        const url = `${this.apiHost}/api/${contentTypeId}?${query}`

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const msg = await res.text()
          throw new Error(`Error fetching '${url}': ${msg}`)
        }

        const currentResult = await res.json()
        return (currentResult?.data || []).map(item => ({
          ...item,
          schemaName: contentTypeData?.name,
          schemaId: contentTypeData?.id,
        }))
      })
    )

    // concat arrays of fetched data
    return itemLists.reduce((result, list) => [...result, ...list], [])
  }
}
