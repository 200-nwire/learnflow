/**
 * xAPI LRS Client
 * Sends xAPI statements to a Learning Record Store (LRS)
 * 
 * Supports:
 * - Basic Auth (username/password)
 * - OAuth 2.0 (future)
 * - Batch statement submission
 * - Retry logic with exponential backoff
 */

import type { xAPIStatement } from "./statement-converter.js";
import { encodeBase64 } from "./base64.js";

// LRSConfig is now defined in lrs-client-xapi.ts (single source of truth)
// Re-export for backward compatibility
import type { LRSConfig } from "./lrs-client-xapi.js";
export type { LRSConfig };

export interface LRSResponse {
  success: boolean;
  statementIds?: string[];
  error?: string;
  statusCode?: number;
  response?: any;
}

/**
 * xAPI LRS Client
 */
export class LRSClient {
  private config: Required<LRSConfig>;

  constructor(config: LRSConfig) {
    this.config = {
      endpoint: (config.endpoint || "").replace(/\/$/, ""), // Remove trailing slash
      username: config.username || "",
      password: config.password || "",
      authToken: config.authToken || "",
      version: config.version || "1.0.3",
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    // Validate endpoint
    if (!this.config.endpoint) {
      throw new Error("LRS endpoint is required");
    }
    
    // Note: We don't validate auth in constructor - it will be validated when making requests
    // This allows the client to be created even if auth is not yet configured
  }
  
  /**
   * Validate that authentication is configured
   */
  private validateAuth(): void {
    if (!this.config.authToken && (!this.config.username || !this.config.password)) {
      throw new Error("LRS authentication required (username/password or authToken)");
    }
  }

  /**
   * Send a single statement to LRS
   */
  async sendStatement(statement: xAPIStatement): Promise<LRSResponse> {
    return this.sendStatements([statement]);
  }

  /**
   * Send multiple statements to LRS (batch)
   */
  async sendStatements(statements: xAPIStatement[]): Promise<LRSResponse> {
    if (statements.length === 0) {
      return {
        success: true,
        statementIds: [],
      };
    }

    // Validate auth before making request
    try {
      this.validateAuth();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication required",
      };
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.retryAttempts) {
      try {
        const response = await this.makeRequest(statements);
        
        if (response.success) {
          return response;
        }

        // If it's a client error (4xx), don't retry
        if (response.statusCode && response.statusCode >= 400 && response.statusCode < 500) {
          return response;
        }

        lastError = new Error(response.error || "Unknown error");
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      attempt++;
      
      if (attempt < this.config.retryAttempts) {
        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError?.message || "Failed after retries",
      statementIds: [],
    };
  }

  /**
   * Make HTTP request to LRS
   */
  private async makeRequest(statements: xAPIStatement[]): Promise<LRSResponse> {
    const url = statements.length === 1
      ? `${this.config.endpoint}/statements`
      : `${this.config.endpoint}/statements`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Experience-API-Version": this.config.version,
    };

    // Add authentication
    if (this.config.authToken) {
      headers["Authorization"] = `Bearer ${this.config.authToken}`;
    } else if (this.config.username && this.config.password) {
      const credentials = encodeBase64(`${this.config.username}:${this.config.password}`);
      headers["Authorization"] = `Basic ${credentials}`;
    }

    const body = statements.length === 1 ? statements[0] : statements;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          success: false,
          error: `LRS returned ${response.status}: ${errorText}`,
          statusCode: response.status,
        };
      }

      // xAPI returns statement IDs in response
      const responseData = await response.json().catch(() => null);
      const statementIds = statements.map(s => s.id || "").filter(Boolean);

      return {
        success: true,
        statementIds,
        response: responseData,
        statusCode: response.status,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          error: "Request timeout",
          statusCode: 408,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test LRS connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; statusCode?: number }> {
    try {
      // Validate auth before making request
      try {
        this.validateAuth();
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Authentication required",
        };
      }

      const headers: Record<string, string> = {
        "X-Experience-API-Version": this.config.version,
      };

      if (this.config.authToken) {
        headers["Authorization"] = `Bearer ${this.config.authToken}`;
      } else if (this.config.username && this.config.password) {
        const credentials = encodeBase64(`${this.config.username}:${this.config.password}`);
        headers["Authorization"] = `Basic ${credentials}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.endpoint}/about`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `LRS returned ${response.status}`,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        statusCode: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LRSConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      endpoint: (config.endpoint || this.config.endpoint).replace(/\/$/, ""),
    };
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<LRSConfig, "password" | "authToken"> {
    return {
      endpoint: this.config.endpoint,
      username: this.config.username,
      version: this.config.version,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

