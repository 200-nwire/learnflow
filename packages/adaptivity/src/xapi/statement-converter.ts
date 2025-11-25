/**
 * xAPI Statement Converter
 * Converts internal signals to xAPI-compliant statements
 * 
 * xAPI Specification: https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#statement
 */

import type { Signal, VariantSelectedSignal, AnswerSubmittedSignal, PageNavigatedSignal } from "../signals.js";
import type { SessionSnapshot } from "../types.js";

/**
 * xAPI Statement structure (simplified for required fields)
 */
export interface xAPIStatement {
  id?: string; // UUID, generated if not provided
  actor: xAPIActor;
  verb: xAPIVerb;
  object: xAPIObject;
  result?: xAPIResult;
  context?: xAPIContext;
  timestamp?: string; // ISO 8601 timestamp
  stored?: string; // ISO 8601 timestamp (set by LRS)
  authority?: xAPIActor;
  version?: string; // "1.0.3"
}

export interface xAPIActor {
  objectType: "Agent" | "Group";
  name?: string;
  mbox?: string; // mailto:email@example.com
  mbox_sha1sum?: string; // SHA1 hash of email
  openid?: string;
  account?: {
    homePage: string;
    name: string;
  };
}

export interface xAPIVerb {
  id: string; // IRI
  display: {
    [language: string]: string;
  };
}

export interface xAPIObject {
  objectType: "Activity" | "Agent" | "Group" | "StatementRef" | "SubStatement";
  id: string; // IRI
  definition?: {
    name?: {
      [language: string]: string;
    };
    description?: {
      [language: string]: string;
    };
    type?: string; // IRI
    extensions?: {
      [key: string]: any;
    };
  };
}

export interface xAPIResult {
  score?: {
    scaled?: number; // -1.0 to 1.0
    raw?: number;
    min?: number;
    max?: number;
  };
  success?: boolean;
  completion?: boolean;
  response?: string;
  duration?: string; // ISO 8601 duration (PT1H30M)
  extensions?: {
    [key: string]: any;
  };
}

export interface xAPIContext {
  registration?: string; // UUID
  instructor?: xAPIActor;
  team?: xAPIActor;
  contextActivities?: {
    parent?: xAPIObject[];
    grouping?: xAPIObject[];
    category?: xAPIObject[];
    other?: xAPIObject[];
  };
  revision?: string;
  platform?: string;
  language?: string;
  statement?: {
    objectType: "StatementRef";
    id: string;
  };
  extensions?: {
    [key: string]: any;
  };
}

/**
 * xAPI Statement Converter
 */
export class xAPIStatementConverter {
  private baseIRI: string;
  private platformName: string;

  constructor(baseIRI: string = "https://amit.lemida.org/xapi", platformName: string = "AMIT Adaptivity Platform") {
    this.baseIRI = baseIRI;
    this.platformName = platformName;
  }

  /**
   * Convert a signal to an xAPI statement
   */
  convertSignalToStatement(signal: Signal, session: SessionSnapshot): xAPIStatement {
    const actor = this.createActor(session);
    const timestamp = new Date(signal.timestamp).toISOString();

    switch (signal.type) {
      case "variant_selected":
        return this.convertVariantSelected(signal as VariantSelectedSignal, actor, timestamp, session);
      case "answer_submitted":
        return this.convertAnswerSubmitted(signal as AnswerSubmittedSignal, actor, timestamp, session);
      case "page_navigated":
        return this.convertPageNavigated(signal as PageNavigatedSignal, actor, timestamp, session);
      case "session_started":
        return this.convertSessionStarted(signal, actor, timestamp, session);
      case "session_ended":
        return this.convertSessionEnded(signal, actor, timestamp, session);
      case "variant_shown":
        return this.convertVariantShown(signal, actor, timestamp, session);
      case "user_interaction":
        return this.convertUserInteraction(signal, actor, timestamp, session);
      case "preference_changed":
        return this.convertPreferenceChanged(signal, actor, timestamp, session);
      default:
        return this.convertGeneric(signal, actor, timestamp, session);
    }
  }

  /**
   * Create actor from session
   */
  private createActor(session: SessionSnapshot): xAPIActor {
    const userId = session.ids.userId;
    
    // Use account-based identification (most common for LMS)
    return {
      objectType: "Agent",
      account: {
        homePage: this.baseIRI,
        name: userId,
      },
      name: session.user.name || session.user.givenName || userId,
    };
  }

  /**
   * Convert variant_selected signal
   */
  private convertVariantSelected(
    signal: VariantSelectedSignal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    const { slotId, variantId, reason, selectionResult, alternatives } = signal.payload;

    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: `${this.baseIRI}/verbs/selected`,
        display: {
          "en-US": "selected",
          "he": "נבחר",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/variant/${variantId}`,
        definition: {
          name: {
            "en-US": `Variant: ${variantId}`,
          },
          type: `${this.baseIRI}/activity-types/variant`,
          extensions: {
            [`${this.baseIRI}/extensions/slot-id`]: slotId,
            [`${this.baseIRI}/extensions/reason`]: reason,
            [`${this.baseIRI}/extensions/alternatives`]: alternatives.map(a => ({
              variantId: a.variantId,
              score: a.score,
              guardPassed: a.guardPassed,
            })),
          },
        },
      },
      context: this.createContext(session, {
        slotId,
        selectionResult,
      }),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert answer_submitted signal
   */
  private convertAnswerSubmitted(
    signal: AnswerSubmittedSignal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    const { slotId, variantId, questionId, correct, timeTakenMs, attempts, answer } = signal.payload;

    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/answered",
        display: {
          "en-US": "answered",
          "he": "ענה",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/question/${questionId}`,
        definition: {
          name: {
            "en-US": `Question: ${questionId}`,
          },
          type: "http://adlnet.gov/expapi/activities/question",
          extensions: {
            [`${this.baseIRI}/extensions/variant-id`]: variantId,
            [`${this.baseIRI}/extensions/slot-id`]: slotId,
          },
        },
      },
      result: {
        success: correct,
        score: {
          scaled: correct ? 1.0 : 0.0,
          raw: correct ? 1 : 0,
          min: 0,
          max: 1,
        },
        response: typeof answer === "string" ? answer : JSON.stringify(answer),
        duration: this.formatDuration(timeTakenMs),
        extensions: {
          [`${this.baseIRI}/extensions/attempts`]: attempts,
          [`${this.baseIRI}/extensions/time-taken-ms`]: timeTakenMs,
        },
      },
      context: this.createContext(session, {
        slotId,
        variantId,
      }),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert page_navigated signal
   */
  private convertPageNavigated(
    signal: PageNavigatedSignal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    const { fromPageId, toPageId, direction, timeOnPageMs } = signal.payload;

    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/experienced",
        display: {
          "en-US": "experienced",
          "he": "חווה",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/page/${toPageId}`,
        definition: {
          name: {
            "en-US": `Page: ${toPageId}`,
          },
          type: `${this.baseIRI}/activity-types/page`,
          extensions: {
            [`${this.baseIRI}/extensions/navigation-direction`]: direction,
            [`${this.baseIRI}/extensions/from-page-id`]: fromPageId,
            [`${this.baseIRI}/extensions/time-on-page-ms`]: timeOnPageMs,
          },
        },
      },
      result: {
        duration: this.formatDuration(timeOnPageMs),
      },
      context: this.createContext(session, {
        fromPageId,
        toPageId,
        direction,
      }),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert session_started signal
   */
  private convertSessionStarted(
    signal: Signal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/initialized",
        display: {
          "en-US": "initialized",
          "he": "התחיל",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/session/${session.ids.lessonId}`,
        definition: {
          name: {
            "en-US": `Learning Session: ${session.ids.lessonId}`,
          },
          type: `${this.baseIRI}/activity-types/session`,
        },
      },
      context: this.createContext(session),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert session_ended signal
   */
  private convertSessionEnded(
    signal: Signal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/terminated",
        display: {
          "en-US": "terminated",
          "he": "סיים",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/session/${session.ids.lessonId}`,
        definition: {
          name: {
            "en-US": `Learning Session: ${session.ids.lessonId}`,
          },
          type: `${this.baseIRI}/activity-types/session`,
        },
      },
      result: {
        completion: true,
      },
      context: this.createContext(session),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert variant_shown signal
   */
  private convertVariantShown(
    signal: Signal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    const { slotId, variantId } = signal.payload;

    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/experienced",
        display: {
          "en-US": "experienced",
          "he": "חווה",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/variant/${variantId}`,
        definition: {
          name: {
            "en-US": `Variant: ${variantId}`,
          },
          type: `${this.baseIRI}/activity-types/variant`,
          extensions: {
            [`${this.baseIRI}/extensions/slot-id`]: slotId,
          },
        },
      },
      context: this.createContext(session, { slotId, variantId }),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert user_interaction signal
   */
  private convertUserInteraction(
    signal: Signal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    const { action, ...rest } = signal.payload;

    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: `${this.baseIRI}/verbs/interacted`,
        display: {
          "en-US": "interacted",
          "he": "אינטראקציה",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/interaction/${action}`,
        definition: {
          name: {
            "en-US": `Interaction: ${action}`,
          },
          type: `${this.baseIRI}/activity-types/interaction`,
          extensions: {
            [`${this.baseIRI}/extensions/interaction-data`]: rest,
          },
        },
      },
      context: this.createContext(session),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert preference_changed signal
   */
  private convertPreferenceChanged(
    signal: Signal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    const { preference, value } = signal.payload;

    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: `${this.baseIRI}/verbs/changed`,
        display: {
          "en-US": "changed",
          "he": "שינה",
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/preference/${preference}`,
        definition: {
          name: {
            "en-US": `Preference: ${preference}`,
          },
          type: `${this.baseIRI}/activity-types/preference`,
          extensions: {
            [`${this.baseIRI}/extensions/preference-value`]: value,
          },
        },
      },
      context: this.createContext(session),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Convert generic signal
   */
  private convertGeneric(
    signal: Signal,
    actor: xAPIActor,
    timestamp: string,
    session: SessionSnapshot
  ): xAPIStatement {
    return {
      id: this.generateStatementId(),
      actor,
      verb: {
        id: `${this.baseIRI}/verbs/${signal.type}`,
        display: {
          "en-US": signal.type.replace(/_/g, " "),
        },
      },
      object: {
        objectType: "Activity",
        id: `${this.baseIRI}/activities/${signal.type}/${signal.id}`,
        definition: {
          name: {
            "en-US": `Activity: ${signal.type}`,
          },
          type: `${this.baseIRI}/activity-types/${signal.type}`,
          extensions: {
            [`${this.baseIRI}/extensions/signal-payload`]: signal.payload,
          },
        },
      },
      context: this.createContext(session),
      timestamp,
      version: "1.0.3",
    };
  }

  /**
   * Create context for statement
   */
  private createContext(session: SessionSnapshot, extensions?: Record<string, any>): xAPIContext {
    // Convert extension keys to IRI format (must include colon for xAPI compliance)
    const iriExtensions: Record<string, any> = {};
    if (extensions) {
      for (const [key, value] of Object.entries(extensions)) {
        // If key already contains a colon, assume it's already an IRI
        // Otherwise, convert it to IRI format
        const iriKey = key.includes(':') 
          ? key 
          : `${this.baseIRI}/extensions/${key}`;
        iriExtensions[iriKey] = value;
      }
    }

    const context: xAPIContext = {
      platform: this.platformName,
      language: session.user.lang === "he" ? "he-IL" : "en-US",
      extensions: {
        [`${this.baseIRI}/extensions/user-id`]: session.ids.userId,
        [`${this.baseIRI}/extensions/course-id`]: session.ids.courseId,
        [`${this.baseIRI}/extensions/lesson-id`]: session.ids.lessonId,
        [`${this.baseIRI}/extensions/page-id`]: session.ids.pageId,
        [`${this.baseIRI}/extensions/accuracy`]: session.metrics.accEWMA,
        [`${this.baseIRI}/extensions/attempts`]: session.metrics.attempts,
        [`${this.baseIRI}/extensions/streak`]: session.metrics.streak,
        [`${this.baseIRI}/extensions/fatigue`]: session.metrics.fatigue,
        [`${this.baseIRI}/extensions/device`]: session.env.device,
        ...iriExtensions,
      },
    };

    // Add registration if available
    if (session.ids.enrollmentId) {
      context.registration = session.ids.enrollmentId;
    }

    // Add context activities
    context.contextActivities = {
      grouping: [
        {
          objectType: "Activity",
          id: `${this.baseIRI}/activities/course/${session.ids.courseId}`,
        },
        {
          objectType: "Activity",
          id: `${this.baseIRI}/activities/lesson/${session.ids.lessonId}`,
        },
      ],
    };

    if (session.ids.trackId) {
      context.contextActivities.grouping!.push({
        objectType: "Activity",
        id: `${this.baseIRI}/activities/track/${session.ids.trackId}`,
      });
    }

    return context;
  }

  /**
   * Format duration in milliseconds to ISO 8601 duration
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}H`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}M`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60}S`);

    return parts.length > 0 ? `PT${parts.join("")}` : "PT0S";
  }

  /**
   * Generate UUID v4 for statement ID
   */
  private generateStatementId(): string {
    return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

