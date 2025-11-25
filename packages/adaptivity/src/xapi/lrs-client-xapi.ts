/**
 * xAPI LRS Client using official @xapi/xapi library
 * Wrapper around the official xAPI library for easier integration
 */

import XAPI from "@xapi/xapi";
import type { Statement } from "@xapi/xapi";
import type { xAPIStatement } from "./statement-converter.js";

export interface LRSConfig {
  endpoint: string; // e.g., "https://lrs.example.com/xapi"
  username?: string; // For Basic Auth
  password?: string; // For Basic Auth
  authToken?: string; // For Bearer token auth
  version?: string; // xAPI version (default: "1.0.3")
  timeout?: number; // Request timeout in ms (default: 10000)
  retryAttempts?: number; // Max retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
}

export interface LRSResponse {
  success: boolean;
  statementIds?: string[];
  error?: string;
  statusCode?: number;
  response?: any;
}

/**
 * xAPI LRS Client using official @xapi/xapi library
 */
export class LRSClientXAPI {
  private xapi: XAPI | null = null;
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

    // Initialize XAPI client
    this.initializeXAPI();
  }

  private initializeXAPI(): void {
    try {
      // Build auth using XAPI.toBasicAuth helper or direct string
      let auth: string | undefined;
      if (this.config.authToken) {
        // For bearer token, use the token directly
        auth = this.config.authToken;
      } else if (this.config.username && this.config.password) {
        // Use XAPI helper to create Basic Auth string
        auth = XAPI.toBasicAuth(this.config.username, this.config.password);
      }

      if (!auth) {
        console.warn("No authentication provided for LRS");
        this.xapi = null;
        return;
      }

      // Create XAPI instance
      // According to @xapi/xapi docs, constructor takes: { endpoint, auth }
      this.xapi = new XAPI({
        endpoint: this.config.endpoint,
        auth: auth,
      });
    } catch (error) {
      console.error("Failed to initialize XAPI client:", error);
      this.xapi = null;
    }
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
   * Convert our xAPIStatement format to @xapi/xapi Statement format
   */
  private convertStatement(stmt: xAPIStatement): Statement {
    // The @xapi/xapi library expects Statement objects
    // Our xAPIStatement should be compatible, but we'll ensure it matches
    return stmt as unknown as Statement;
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

    if (!this.xapi) {
      return {
        success: false,
        error: "XAPI client not initialized",
      };
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.retryAttempts) {
      try {
        // Convert statements to @xapi/xapi format
        const xapiStatements = statements.map(s => this.convertStatement(s));

        // Send statements using official library
        // @xapi/xapi uses sendStatement for single or batch
        // For batch, send array; for single, send object
        if (xapiStatements.length === 1) {
          const result = await this.xapi.sendStatement({
            statement: xapiStatements[0],
          });
          // Extract statement ID from result
          const statementIds = result ? [xapiStatements[0].id || ""] : [];
          return {
            success: !!result,
            statementIds: statementIds.filter(Boolean),
            response: result,
          };
        } else {
          // Batch send - @xapi/xapi may handle arrays differently
          // Try sending as array or iterate
          const results = await Promise.all(
            xapiStatements.map(stmt => 
              this.xapi!.sendStatement({ statement: stmt })
            )
          );
          const statementIds = xapiStatements.map(s => s.id || "").filter(Boolean);
          return {
            success: results.every(r => !!r),
            statementIds,
            response: results,
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If it's a client error (4xx), don't retry
        if (error instanceof Error && error.message.includes("4")) {
          return {
            success: false,
            error: lastError.message,
            statusCode: 400,
          };
        }
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
   * Test LRS connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; statusCode?: number; response?: any }> {
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

      if (!this.xapi) {
        return {
          success: false,
          error: "XAPI client not initialized",
        };
      }

      // Use the about endpoint to test connection
      // @xapi/xapi uses getAbout() method
      const about = await this.xapi.getAbout();

      return {
        success: true,
        statusCode: 200,
        response: about,
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
    this.initializeXAPI();
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

