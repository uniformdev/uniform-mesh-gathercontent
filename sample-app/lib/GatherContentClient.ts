import { Item, Template } from './GatherContentTypes';
import { createLimitPolicy } from '@uniformdev/canvas';

const limitPolicy = createLimitPolicy({
  throttle: {
    interval: 15000,
    limit: 250,
  },
  retry: {
    retries: 2,
  },
});

export class GatherContentClient {
  private credentials = '';
  private projectId = '';

  constructor({
    apiUsername,
    apiKey,
    projectId,
  }: {
    apiUsername: string;
    apiKey: string;
    projectId: string;
  }) {
    const credentials = base64encode(`${apiUsername}:${apiKey}`);
    if (credentials) {
      this.credentials = credentials;
    }

    this.projectId = projectId;
  }

  public async getTemplates() {
    const templates = await this.apiFetch<Template[]>({
      apiPath: `/projects/${this.projectId}/templates`,
    });
    return templates.data;
  }

  public async getItem({
    item_id,
    include_structure = true,
  }: {
    item_id: number;
    include_structure?: boolean;
  }) {
    const item = await this.apiFetch<Item>({
      apiPath: `/items/${item_id}`,
      queryParams: {
        include: include_structure ? 'structure' : undefined,
      },
    });
    return item.data;
  }

  public async getItems({
    template_id,
    name_contains,
    item_id,
    include_content = false,
  }: {
    template_id?: number[];
    name_contains?: string;
    item_id?: number[];
    /** NOTE: including content results in an API call for each item specified in the `item_id` argument -
     * which may result in slow/expensive overall query times.
     */
    include_content?: boolean;
  }): Promise<{ items: Item[]; failedItems: { id: number; reason: string }[] | undefined }> {
    // If `include_content` is not true, then we can use the "List Items" GatherContent API endpoint, which
    // only provides item metadata and not content/template data.
    if (!include_content) {
      const itemsResult = await this.apiFetch<Item[]>({
        apiPath: `/projects/${this.projectId}/items`,
        queryParams: {
          template_id,
          name_contains,
          item_id,
        },
      });
      return {
        items: itemsResult.data,
        failedItems: undefined,
      };
    }

    // Otherwise, `include_content` is true so we need to make an API request for each item in the `item_id` array.
    if (Array.isArray(item_id)) {
      const promises = item_id.map((id) => {
        return this.apiFetch<Item>({
          apiPath: `/items/${id}`,
          queryParams: {
            // Including the `structure` means template data will be returned with the item response.
            include: 'structure',
          },
        });
      });

      // request all the items, use `allSettled` so that one failed fetch doesn't ruin it for everyone else.
      const itemResults = await Promise.allSettled(promises);

      const items: Item[] = [];
      let failedItems: { id: number; reason: string }[] | undefined = undefined;

      itemResults.forEach((itemResult, index) => {
        if (itemResult.status === 'fulfilled') {
          // The GatherContent Item API provides a `content` object with field data, but the fields
          // are indexed by field uuid, which isn't very dev friendly.
          // So we iterate the template (structure) provided in the Item response and create a `mappedContent`
          // object that uses a camel-cased field name as the field index, and then provides field metadata
          // and the field value as well.
          itemResult.value.data.mappedContent = {};
          itemResult.value.data.structure?.groups.forEach((group) => {
            group.fields.forEach((field) => {
              itemResult.value.data.mappedContent[toCamelCase(field.label)] = {
                ...field,
                value: itemResult.value.data.content[field.uuid] || null,
              };
            });
          });
          items.push(itemResult.value.data);
        } else {
          if (!failedItems) {
            failedItems = [];
          }
          // Collect any failed requests and provide them to the caller so they can decide what to do.
          failedItems?.push({ id: item_id[index], reason: itemResult.reason });
        }
      });

      return { items, failedItems };
    }

    return {
      items: [],
      failedItems: undefined,
    };
  }

  public async apiFetch<TResponseData>({
    apiPath,
    requestMethod = 'GET',
    headers,
    queryParams,
  }: {
    apiPath: string;
    requestMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    queryParams?: Record<string, string | number | boolean | string[] | number[] | undefined>;
  }) {
    const formattedApiPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    const querystring = objectToQuerystring(queryParams);

    try {
      const response = await limitPolicy(
        async () =>
          await fetch(`https://api.gathercontent.com${formattedApiPath}${querystring}`, {
            method: requestMethod,
            headers: {
              Accept: 'application/vnd.gathercontent.v2+json',
              Authorization: `Basic ${this.credentials}`,
              ...headers,
            },
          })
      );

      if (!response.ok) {
        const errorMessage = await getErrorMessageFromResponse(response);
        throw new GatherContentError(new Error(errorMessage));
      }
      return (await response.json()) as { data: TResponseData };
    } catch (err) {
      throw new GatherContentError(err);
    }
  }
}

export class GatherContentError extends Error {
  constructor(err: Error) {
    super(err.message);
    this.name = err.name;
    this.stack = err.stack;
  }
}

function base64encode(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64');
  } else if (typeof window !== 'undefined' && typeof window.btoa !== 'undefined') {
    return window.btoa(value);
  }
  return undefined;
}

function objectToQuerystring(
  obj: Record<string, string | number | boolean | undefined | string[] | number[]> | undefined
) {
  if (!obj) {
    return '';
  }

  const queryParams: string[] = [];
  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      queryParams.push(`${key}=${encodeURIComponent(value.join(','))}`);
    } else if (typeof value !== 'undefined' && value !== null && value !== '') {
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  });
  const querystring = queryParams.join('&');

  return querystring ? '?' + querystring : '';
}

async function getErrorMessageFromResponse(
  response: Pick<Response, 'text' | 'status' | 'statusText'>,
  propertyName = 'error'
): Promise<string> {
  if (!response) {
    return 'Response was falsy';
  }

  try {
    const text = await response.text();

    // attempt to parse the response body as JSON.
    const parsed = tryParseJson<Record<string, any>>(text);

    // if an error is thrown while parsing or null is returned, then return the response text.
    if (parsed instanceof Error || !parsed) {
      return text;
    }

    const message = parsed[propertyName] || text;
    if (message) {
      return message;
    }

    return `${response.status} ${response.statusText}`;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Couldn't parse API response for error, using status code instead`, e);
    return `${response.status} ${response.statusText}`;
  }
}

function tryParseJson<T>(jsonString: string): T | Error | null {
  try {
    const json = JSON.parse(jsonString);
    // handle non-exception-throwing cases
    if (json && typeof json === 'object' && json !== null) {
      return json as T;
    }
  } catch (e) {
    return e;
  }

  return null;
}

// Thank you Tim Hobbs: https://gist.github.com/timhobbs/23c891bfea312cf43f31395d2d6660b1
function toCamelCase(str?: string): string {
  if (!str) {
    return '';
  }

  const result = str
    .trim()
    .toLowerCase()
    .replace(/(?:(^.)|([-_\s]+.))/g, function (match) {
      return match.charAt(match.length - 1).toUpperCase();
    })
    .replace(/[^A-Za-z0-9-_]+/g, '');

  return result.charAt(0).toLowerCase() + result.substring(1);
}
