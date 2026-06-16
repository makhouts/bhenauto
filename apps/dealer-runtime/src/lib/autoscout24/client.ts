import type {
  AutoScoutCustomer,
  AutoScoutListingPayload,
  AutoScoutListing,
  AutoScoutListingSummary,
  AutoScoutMake,
  AutoScoutReference,
} from "./types";

const API_BASE_URL = "https://listing-creation.api.autoscout24.com";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_DELAYS_MS = [250, 750];

export class AutoScoutApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "AutoScoutApiError";
  }
}

export type AutoScoutClientConfig = {
  username: string;
  password: string;
  baseUrl?: string;
  timeoutMs?: number;
  culture?: string;
  marketplace?: string;
};

type RequestOptions = {
  query?: Record<string, string | string[] | undefined>;
  retry?: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number) {
  const spread = Math.max(10, Math.round(ms * 0.2));
  return ms + Math.round((Math.random() * 2 - 1) * spread);
}

function encodeQuery(query?: RequestOptions["query"]) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) params.append(key, entry);
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class AutoScoutClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly authHeader: string;
  readonly culture: string;
  readonly marketplace: string;

  constructor(config: AutoScoutClientConfig) {
    this.baseUrl = config.baseUrl ?? API_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.culture = config.culture ?? "nl-BE";
    this.marketplace = config.marketplace ?? "be";
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<T> {
    const retryDelays = options.retry === false ? [] : DEFAULT_RETRY_DELAYS_MS;
    const url = `${this.baseUrl}${path}${encodeQuery(options.query)}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            Authorization: this.authHeader,
            Accept: "application/json",
            ...init.headers,
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          return await parseBody(response) as T;
        }

        const body = await parseBody(response);
        if (!isRetryableStatus(response.status) || attempt >= retryDelays.length) {
          throw new AutoScoutApiError(
            `AutoScout24 request failed with HTTP ${response.status}`,
            response.status,
            body,
          );
        }
        lastError = new AutoScoutApiError(
          `AutoScout24 request failed with HTTP ${response.status}`,
          response.status,
          body,
        );
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;
        if (error instanceof AutoScoutApiError && !isRetryableStatus(error.status ?? 0)) {
          throw error;
        }
        if (attempt >= retryDelays.length) break;
      }

      await sleep(jitter(retryDelays[attempt] ?? 0));
    }

    if (lastError instanceof Error) throw lastError;
    throw new AutoScoutApiError("AutoScout24 request failed", null, lastError);
  }

  async listCustomers(): Promise<AutoScoutCustomer[]> {
    const response = await this.request<{ customers?: AutoScoutCustomer[] }>("/customers");
    return response.customers ?? [];
  }

  async resolveCustomerId(configuredCustomerId?: string): Promise<string> {
    if (configuredCustomerId) return configuredCustomerId;
    const customers = await this.listCustomers();
    if (customers.length === 0) {
      throw new AutoScoutApiError("No AutoScout24 customers are available for these credentials", 404);
    }
    if (customers.length > 1) {
      const ids = customers.map((customer) => `${customer.id}${customer.companyName ? ` (${customer.companyName})` : ""}`);
      throw new AutoScoutApiError(
        `Multiple AutoScout24 customers are available. Set AUTOSCOUT24_CUSTOMER_ID to one of: ${ids.join(", ")}`,
        400,
        { customers },
      );
    }
    return customers[0].id;
  }

  async listListings(customerId: string): Promise<AutoScoutListingSummary[]> {
    const response = await this.request<{ listings?: AutoScoutListingSummary[] }>(
      `/customers/${encodeURIComponent(customerId)}/listings`,
    );
    return response.listings ?? [];
  }

  async getListing(customerId: string, listingId: string): Promise<AutoScoutListing> {
    return this.request<AutoScoutListing>(
      `/customers/${encodeURIComponent(customerId)}/listings/${encodeURIComponent(listingId)}`,
      {},
      { query: { culture: this.culture } },
    );
  }

  async createListing(customerId: string, payload: AutoScoutListingPayload): Promise<AutoScoutListing> {
    return this.request<AutoScoutListing>(
      `/customers/${encodeURIComponent(customerId)}/listings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { query: { culture: this.culture }, retry: false },
    );
  }

  async updateListing(customerId: string, listingId: string, payload: AutoScoutListingPayload): Promise<AutoScoutListing> {
    return this.request<AutoScoutListing>(
      `/customers/${encodeURIComponent(customerId)}/listings/${encodeURIComponent(listingId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { query: { culture: this.culture } },
    );
  }

  async patchListing(customerId: string, listingId: string, payload: Partial<AutoScoutListingPayload>): Promise<AutoScoutListing> {
    return this.request<AutoScoutListing>(
      `/customers/${encodeURIComponent(customerId)}/listings/${encodeURIComponent(listingId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { query: { culture: this.culture } },
    );
  }

  async deleteListing(customerId: string, listingId: string): Promise<void> {
    await this.request<void>(
      `/customers/${encodeURIComponent(customerId)}/listings/${encodeURIComponent(listingId)}`,
      { method: "DELETE" },
      {},
    );
  }

  async uploadImage(customerId: string, image: Buffer, contentType: "image/jpeg" | "image/png" = "image/jpeg"): Promise<{ id: string; md5?: string }> {
    return this.request<{ id: string; md5?: string }>(
      `/customers/${encodeURIComponent(customerId)}/images`,
      {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: new Uint8Array(image),
      },
      { retry: false },
    );
  }

  async getMakes(): Promise<AutoScoutMake[]> {
    const response = await this.request<{ makes?: AutoScoutMake[] }>(
      "/makes",
      {},
      {
        query: {
          culture: this.culture,
          marketplace: this.marketplace,
        },
      },
    );
    return response.makes ?? [];
  }

  async getReferences(referenceTypes: string[]): Promise<AutoScoutReference[]> {
    const response = await this.request<{ references?: AutoScoutReference[] }>(
      "/references",
      {},
      {
        query: {
          referenceType: referenceTypes,
          culture: this.culture,
          marketplace: this.marketplace,
        },
      },
    );
    return response.references ?? [];
  }
}

export function createAutoScoutClientFromEnv(overrides: Partial<Pick<AutoScoutClientConfig, "culture" | "marketplace">> = {}) {
  const username = process.env.AUTOSCOUT24_USERNAME;
  const password = process.env.AUTOSCOUT24_PASSWORD;

  if (!username || !password) {
    throw new Error("AUTOSCOUT24_USERNAME and AUTOSCOUT24_PASSWORD are required for AutoScout24 imports.");
  }

  return new AutoScoutClient({
    username,
    password,
    culture: overrides.culture ?? process.env.AUTOSCOUT24_CULTURE ?? "nl-BE",
    marketplace: overrides.marketplace ?? process.env.AUTOSCOUT24_MARKETPLACE ?? "be",
  });
}
