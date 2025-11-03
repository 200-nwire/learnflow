/**
 * Types for the Visual Rule Builder
 * Compatible with json-rules-engine
 */

export type OperatorType = 
  | 'equal'
  | 'notEqual'
  | 'lessThan'
  | 'lessThanInclusive'
  | 'greaterThan'
  | 'greaterThanInclusive'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'doesNotContain';

export interface RuleCondition {
  id: string;
  fact: string;
  operator: OperatorType;
  value: any;
  path?: string;
}

export interface RuleGroup {
  id: string;
  all?: RuleCondition[] | RuleGroup[];
  any?: RuleCondition[] | RuleGroup[];
}

export interface Rule {
  conditions: RuleGroup;
  event: RuleEvent;
  priority?: number;
  name?: string;
}

export interface RuleEvent {
  type: string;
  params?: Record<string, any>;
}

export interface FactDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  path?: string;
  description?: string;
  options?: Array<{ label: string; value: any }>;
}

export interface OperatorDefinition {
  name: OperatorType;
  label: string;
  types: Array<'string' | 'number' | 'boolean' | 'array'>;
}

export interface EventDefinition {
  type: string;
  label: string;
  params?: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean';
    default?: any;
  }>;
}

export interface RuleBuilderConfig {
  facts: FactDefinition[];
  operators?: OperatorDefinition[];
  events: EventDefinition[];
  maxDepth?: number;
  colors?: string[];
}

// UI state types
export interface BuilderNode {
  id: string;
  type: 'group' | 'condition';
  data: RuleGroup | RuleCondition;
  depth: number;
  parentId?: string;
}

