import { GatherContentClient } from './GatherContentClient';

export interface AddClientArgs {
  /**
   * The GatherContent source public ID that this client maps to in the composition data.
   * This is used to enable multiple GatherContent projects as data sources.
   * If unspecified, the client will be the default source that is used when no source public ID
   * is in the data, or the source ID is 'default'.
   */
  source?: string;
  /** The GatherContent client instance to use when fetching published data */
  client: GatherContentClient;
  /**
   * The GatherContent client instance to use when fetching preview data.
   * If the preview client is not passed, it defaults to the client.
   */
  previewClient?: GatherContentClient;
}

export class GatherContentClientList {
  private _clients: Record<
    string,
    {
      client: GatherContentClient;
      previewClient: GatherContentClient;
    }
  >;

  constructor(clients?: AddClientArgs[] | AddClientArgs) {
    this._clients = {};

    if (Array.isArray(clients)) {
      clients.forEach((client) => this.addClient(client));
    } else if (clients) {
      this.addClient(clients);
    }
  }

  public addClient({ source = 'default', client, previewClient }: AddClientArgs) {
    if (this._clients[source]) {
      throw new Error(`The source '${source}' is already registered`);
    }

    if (!client) {
      throw new Error('You must provide a GatherContent client for the GatherContentClientList');
    }

    this._clients[source] = {
      client,
      previewClient: previewClient || client,
    };
  }

  public getClient({
    source = 'default',
    isPreviewClient,
  }: {
    source?: string;
    isPreviewClient?: boolean;
  }): GatherContentClient | undefined {
    const found = this._clients[source];

    if (!found) {
      return undefined;
    }

    return isPreviewClient ? found.previewClient : found.client;
  }
}
