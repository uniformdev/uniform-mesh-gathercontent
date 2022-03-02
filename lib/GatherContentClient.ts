import { Item, Template } from "../types";

export class GatherContentClient {
  private credentials = "";
  private projectId = "";

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

  public async getItem({ item_id }: { item_id: number }) {
    const item = await this.apiFetch<Item>({ apiPath: `/items/${item_id}` });
    return item.data;
  }

  public async getItems({
    template_id,
    name_contains,
    item_id,
  }: {
    template_id?: number[];
    name_contains?: string;
    item_id?: number[];
  }) {
    const items = await this.apiFetch<Item[]>({
      apiPath: `/projects/${this.projectId}/items`,
      queryParams: {
        template_id,
        name_contains,
        item_id,
      },
    });
    return items.data;
  }

  public async apiFetch<TResponseData>({
    apiPath,
    requestMethod = "GET",
    headers,
    queryParams,
  }: {
    apiPath: string;
    requestMethod?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    queryParams?: Record<
      string,
      string | number | boolean | string[] | number[] | undefined
    >;
  }) {
    const formattedApiPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
    const querystring = objectToQuerystring(queryParams);

    try {
      const response = await fetch(
        `https://api.gathercontent.com${formattedApiPath}${querystring}`,
        {
          method: requestMethod,
          headers: {
            Accept: "application/vnd.gathercontent.v2+json",
            Authorization: `Basic ${this.credentials}`,
            ...headers,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await getErrorMessageFromResponse(response);
        throw new GatherContentError(new Error(errorMessage));
      }
      return (await response.json()) as { data: TResponseData };
    } catch (err) {
      throw new GatherContentError(err as Error);
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
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  } else if (
    typeof window !== "undefined" &&
    typeof window.btoa !== "undefined"
  ) {
    return window.btoa(value);
  }
  return undefined;
}

function objectToQuerystring(
  obj:
    | Record<
        string,
        string | number | boolean | undefined | string[] | number[]
      >
    | undefined
) {
  if (!obj) {
    return "";
  }

  const queryParams: string[] = [];
  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      queryParams.push(`${key}=${encodeURIComponent(value.join(","))}`);
    } else if (typeof value !== "undefined" && value !== null && value !== "") {
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  });
  const querystring = queryParams.join("&");

  return querystring ? "?" + querystring : "";
}

async function getErrorMessageFromResponse(
  response: Pick<Response, "text" | "status" | "statusText">,
  propertyName = "error"
): Promise<string> {
  if (!response) {
    return "Response was falsy";
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
    console.warn(
      `Couldn't parse API response for error, using status code instead`,
      e
    );
    return `${response.status} ${response.statusText}`;
  }
}

function tryParseJson<T>(jsonString: string): T | Error | null {
  try {
    const json = JSON.parse(jsonString);
    // handle non-exception-throwing cases
    if (json && typeof json === "object" && json !== null) {
      return json as T;
    }
  } catch (e) {
    return e as Error;
  }

  return null;
}
