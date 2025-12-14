/**
 * Shared constants and injection keys for chatbot components
 */

// Injection key for currentPage (can be provided by parent)
export const currentPageInjectionKey = Symbol('currentPage');

// Type for bot connection options
export interface BotConnectOptions {
  courseId?: string;
  lessonId?: string;
  pageId?: string;
  sttLang?: string;
}



