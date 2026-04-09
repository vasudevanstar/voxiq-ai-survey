/**
 * Advanced API request utilities with interceptors and middleware
 */

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  validateStatus?: (status: number) => boolean;
}

export interface ResponseInterceptor {
  onSuccess?: (response: Response) => Promise<Response>;
  onError?: (error: Error) => Promise<void>;
}

export class APIClient {
  private baseURL: string;
  private timeout: number = 30000;
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const options: RequestInit = {
      method: config.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    if (config.body) {
      options.body = JSON.stringify(config.body);
    }

    const timeoutMs = config.timeout || this.timeout;
    const retries = config.retries || 3;

    return this.makeRequestWithRetry<T>(url, options, retries, timeoutMs);
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * Make request with retry logic
   */
  private async makeRequestWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number,
    timeout: number
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onSuccess) {
          response = await interceptor.onSuccess(response);
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Apply error interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onError) {
          await interceptor.onError(error as Error);
        }
      }

      if (retries > 0) {
        console.warn(`Request failed, retrying... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.makeRequestWithRetry<T>(url, options, retries - 1, timeout);
      }

      throw error;
    }
  }
}

/**
 * Create API client instance
 */
export const createAPIClient = (baseURL: string = '') => {
  return new APIClient(baseURL);
};

/**
 * Cache for API requests
 */
export class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number; // Time to live in milliseconds

  constructor(ttl = 5 * 60 * 1000) {
    // 5 minutes default
    this.ttl = ttl;
  }

  /**
   * Get cached value
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache value
   */
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Request queue for batch operations
 */
export class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;
  private concurrency: number;

  constructor(concurrency = 5) {
    this.concurrency = concurrency;
  }

  /**
   * Add request to queue
   */
  add(request: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  /**
   * Process queue
   */
  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.concurrency);

    try {
      await Promise.all(batch.map(request => request()));
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }
}

/**
 * GraphQL client
 */
export class GraphQLClient {
  private client: APIClient;

  constructor(endpoint: string) {
    this.client = new APIClient(endpoint);
  }

  /**
   * Execute GraphQL query
   */
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.client.post<{ data: T; errors?: any[] }>('/graphql', {
      query,
      variables,
    });

    if (response.errors) {
      throw new Error(`GraphQL error: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data;
  }

  /**
   * Execute GraphQL mutation
   */
  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
    return this.query<T>(mutation, variables);
  }
}
