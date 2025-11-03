import { describe, it, expect } from 'vitest';
import { useRuleEngine } from '../src/composables/useRuleEngine';
import type { Rule } from '../src/types';

describe('useRuleEngine', () => {
  const simpleRule: Rule = {
    conditions: {
      id: 'root',
      all: [
        {
          id: 'c1',
          fact: 'accuracy',
          operator: 'greaterThan',
          value: 0.7,
        },
      ],
    },
    event: {
      type: 'show_encouragement',
      params: { message: 'Great job!' },
    },
  };

  it('should run a rule successfully when conditions match', async () => {
    const { runRule, lastResult } = useRuleEngine();
    
    const result = await runRule(simpleRule, { accuracy: 0.85 });
    
    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('show_encouragement');
    expect(lastResult.value).toEqual(result);
  });

  it('should not trigger event when conditions do not match', async () => {
    const { runRule } = useRuleEngine();
    
    const result = await runRule(simpleRule, { accuracy: 0.5 });
    
    expect(result.success).toBe(false);
    expect(result.events).toHaveLength(0);
  });

  it('should handle complex rules with nested groups', async () => {
    const complexRule: Rule = {
      conditions: {
        id: 'root',
        all: [
          {
            id: 'g1',
            any: [
              {
                id: 'c1',
                fact: 'accuracy',
                operator: 'lessThan',
                value: 0.5,
              },
              {
                id: 'c2',
                fact: 'streak',
                operator: 'equal',
                value: 0,
              },
            ],
          },
        ],
      },
      event: {
        type: 'show_remediation',
      },
    };

    const { runRule } = useRuleEngine();
    
    // Should trigger because accuracy < 0.5 (one of the 'any' conditions)
    const result1 = await runRule(complexRule, { accuracy: 0.3, streak: 5 });
    expect(result1.success).toBe(true);
    
    // Should trigger because streak === 0 (one of the 'any' conditions)
    const result2 = await runRule(complexRule, { accuracy: 0.8, streak: 0 });
    expect(result2.success).toBe(true);
    
    // Should not trigger because neither condition is met
    const result3 = await runRule(complexRule, { accuracy: 0.8, streak: 5 });
    expect(result3.success).toBe(false);
  });

  it('should run multiple rules and return all triggered events', async () => {
    const rules: Rule[] = [
      {
        conditions: {
          id: 'r1',
          all: [{ id: 'c1', fact: 'accuracy', operator: 'greaterThan', value: 0.8 }],
        },
        event: { type: 'high_performance' },
      },
      {
        conditions: {
          id: 'r2',
          all: [{ id: 'c2', fact: 'streak', operator: 'greaterThanInclusive', value: 3 }],
        },
        event: { type: 'on_streak' },
      },
    ];

    const { runRules } = useRuleEngine();
    
    const result = await runRules(rules, { accuracy: 0.9, streak: 5 });
    
    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(2);
    expect(result.events.map(e => e.type)).toContain('high_performance');
    expect(result.events.map(e => e.type)).toContain('on_streak');
  });

  it('should validate rule structure', () => {
    const { validateRule } = useRuleEngine();
    
    const validRule: Rule = {
      conditions: {
        id: 'root',
        all: [
          { id: 'c1', fact: 'test', operator: 'equal', value: 'yes' },
        ],
      },
      event: { type: 'test_event' },
    };
    
    const validation = validateRule(validRule);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect invalid rule structure', () => {
    const { validateRule } = useRuleEngine();
    
    const invalidRule: any = {
      conditions: {
        id: 'root',
        all: [
          { id: 'c1', fact: 'test' }, // Missing operator and value
        ],
      },
      event: { type: 'test_event' },
    };
    
    const validation = validateRule(invalidRule);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    const { runRule } = useRuleEngine();
    
    const badRule: any = {
      conditions: {
        id: 'root',
        all: [
          { id: 'c1', fact: 'nonexistent', operator: 'invalid', value: null },
        ],
      },
      event: { type: 'test' },
    };
    
    const result = await runRule(badRule, {});
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

