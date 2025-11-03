import { ref, Ref } from 'vue';
import { Engine } from 'json-rules-engine';
import type { Rule, RuleEvent } from '../types';

export interface RuleResult {
  success: boolean;
  events: RuleEvent[];
  results: any[];
  facts: Record<string, any>;
  error?: string;
}

export function useRuleEngine() {
  const isRunning = ref(false);
  const lastResult = ref<RuleResult | null>(null);

  const runRule = async (rule: Rule, facts: Record<string, any>): Promise<RuleResult> => {
    isRunning.value = true;
    
    try {
      const engine = new Engine();
      // Convert our rule format to json-rules-engine format
      const engineRule = {
        conditions: rule.conditions as any,
        event: rule.event as any,
        priority: rule.priority,
        name: rule.name,
      };
      engine.addRule(engineRule);

      const { events, results } = await engine.run(facts);

      const result: RuleResult = {
        success: events.length > 0,
        events: events.map(e => ({ type: e.type, params: e.params })),
        results,
        facts,
      };

      lastResult.value = result;
      isRunning.value = false;
      return result;
    } catch (error) {
      const errorResult: RuleResult = {
        success: false,
        events: [],
        results: [],
        facts,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      lastResult.value = errorResult;
      isRunning.value = false;
      return errorResult;
    }
  };

  const runRules = async (rules: Rule[], facts: Record<string, any>): Promise<RuleResult> => {
    isRunning.value = true;
    
    try {
      const engine = new Engine();
      rules.forEach(r => {
        const engineRule = {
          conditions: r.conditions as any,
          event: r.event as any,
          priority: r.priority,
          name: r.name,
        };
        engine.addRule(engineRule);
      });

      const { events, results } = await engine.run(facts);

      const result: RuleResult = {
        success: events.length > 0,
        events: events.map(e => ({ type: e.type, params: e.params })),
        results,
        facts,
      };

      lastResult.value = result;
      isRunning.value = false;
      return result;
    } catch (error) {
      const errorResult: RuleResult = {
        success: false,
        events: [],
        results: [],
        facts,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      lastResult.value = errorResult;
      isRunning.value = false;
      return errorResult;
    }
  };

  const validateRule = (rule: Rule): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    const validateConditions = (group: any, path = 'conditions'): void => {
      if (!group.all && !group.any) {
        errors.push(`${path}: Group must have 'all' or 'any' property`);
        return;
      }

      const children = group.all || group.any;
      if (!Array.isArray(children)) {
        errors.push(`${path}: Children must be an array`);
        return;
      }

      children.forEach((child: any, index: number) => {
        if (!child.id) {
          errors.push(`${path}[${index}]: Missing 'id' property`);
        }

        if (child.all || child.any) {
          // It's a group
          validateConditions(child, `${path}[${index}]`);
        } else {
          // It's a condition
          if (!child.fact) {
            errors.push(`${path}[${index}]: Condition missing 'fact' property`);
          }
          if (!child.operator) {
            errors.push(`${path}[${index}]: Condition missing 'operator' property`);
          }
          if (child.value === undefined || child.value === null) {
            errors.push(`${path}[${index}]: Condition missing 'value' property`);
          }
        }
      });
    };

    if (!rule.conditions) {
      errors.push('Rule missing conditions');
    } else {
      validateConditions(rule.conditions);
    }

    if (!rule.event || !rule.event.type) {
      errors.push('Rule missing event type');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  return {
    isRunning,
    lastResult,
    runRule,
    runRules,
    validateRule,
  };
}

