/**
 * Telemetry Types
 * Core types for the telemetry system
 */

export type SignalSource = 
  | "adaptivity"
  | "user_interaction"
  | "system"
  | "analytics"
  | "custom";

export type SignalPriority = "low" | "normal" | "high" | "critical";

export interface TelemetrySignal {
  id: string;
  type: string;
  source: SignalSource;
  priority: SignalPriority;
  timestamp: number;
  payload: Record<string, any>;
  metadata?: {
    userId?: string;
    sessionId?: string;
    pageId?: string;
    lessonId?: string;
    courseId?: string;
    [key: string]: any;
  };
  tags?: string[];
}

export interface SignalSubscription {
  id: string;
  callback: (signal: TelemetrySignal) => void;
  filters?: {
    type?: string | string[];
    source?: SignalSource | SignalSource[];
    priority?: SignalPriority | SignalPriority[];
    tags?: string[];
  };
}

export interface TelemetryConfig {
  enabled: boolean;
  batchSize?: number;
  flushInterval?: number; // ms
  maxQueueSize?: number;
  lrs?: {
    enabled: boolean;
    endpoint?: string;
    username?: string;
    password?: string;
    authToken?: string;
  };
}

