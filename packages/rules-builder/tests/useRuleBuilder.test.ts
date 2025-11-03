import { describe, it, expect } from 'vitest';
import { useRuleBuilder } from '../src/composables/useRuleBuilder';
import type { RuleBuilderConfig } from '../src/types';

describe('useRuleBuilder', () => {
  const mockConfig: RuleBuilderConfig = {
    facts: [
      { name: 'accuracy', label: 'Accuracy', type: 'number' },
      { name: 'streak', label: 'Streak', type: 'number' },
    ],
    events: [
      { type: 'show_hint', label: 'Show Hint' },
    ],
    maxDepth: 3,
  };

  it('should initialize with empty rule', () => {
    const { rule } = useRuleBuilder(mockConfig);
    
    expect(rule.value.conditions).toBeDefined();
    expect(rule.value.conditions.id).toBe('root');
    expect(rule.value.conditions.all).toEqual([]);
    expect(rule.value.event.type).toBe('show_hint');
  });

  it('should add a condition to root group', () => {
    const { rule, addCondition } = useRuleBuilder(mockConfig);
    
    addCondition('root');
    
    expect(rule.value.conditions.all).toHaveLength(1);
    expect(rule.value.conditions.all![0]).toHaveProperty('fact', 'accuracy');
    expect(rule.value.conditions.all![0]).toHaveProperty('operator', 'equal');
  });

  it('should add a nested group', () => {
    const { rule, addGroup } = useRuleBuilder(mockConfig);
    
    addGroup('root', 'any');
    
    expect(rule.value.conditions.all).toHaveLength(1);
    const nestedGroup = rule.value.conditions.all![0] as any;
    expect(nestedGroup).toHaveProperty('any');
    expect(nestedGroup.any).toEqual([]);
  });

  it('should update a condition', () => {
    const { rule, addCondition, updateCondition } = useRuleBuilder(mockConfig);
    
    addCondition('root');
    const conditionId = (rule.value.conditions.all![0] as any).id;
    
    updateCondition(conditionId, { 
      fact: 'streak',
      operator: 'greaterThan',
      value: 5,
    });
    
    const condition = rule.value.conditions.all![0] as any;
    expect(condition.fact).toBe('streak');
    expect(condition.operator).toBe('greaterThan');
    expect(condition.value).toBe(5);
  });

  it('should remove a condition', () => {
    const { rule, addCondition, removeNode } = useRuleBuilder(mockConfig);
    
    addCondition('root');
    const conditionId = (rule.value.conditions.all![0] as any).id;
    
    removeNode(conditionId);
    
    expect(rule.value.conditions.all).toHaveLength(0);
  });

  it('should toggle group operator', () => {
    const { rule, toggleGroupOperator } = useRuleBuilder(mockConfig);
    
    expect(rule.value.conditions.all).toBeDefined();
    
    toggleGroupOperator('root');
    
    expect(rule.value.conditions.all).toBeUndefined();
    expect(rule.value.conditions.any).toBeDefined();
    
    toggleGroupOperator('root');
    
    expect(rule.value.conditions.any).toBeUndefined();
    expect(rule.value.conditions.all).toBeDefined();
  });

  it('should respect maxDepth when adding groups', () => {
    const { addGroup, addCondition, rule } = useRuleBuilder({ ...mockConfig, maxDepth: 2 });
    
    // Add first level group
    addGroup('root');
    const level1Id = (rule.value.conditions.all![0] as any).id;
    
    // Add second level group (should work - depth 2)
    addGroup(level1Id);
    
    // Try to add third level (should be blocked)
    const level2Id = (rule.value.conditions.all![0] as any).all[0].id;
    const beforeLength = (rule.value.conditions.all![0] as any).all.length;
    
    addGroup(level2Id); // Should be blocked by maxDepth
    
    // Length should not change
    expect((rule.value.conditions.all![0] as any).all.length).toBe(beforeLength);
  });

  it('should export to JSON correctly', () => {
    const { rule, addCondition, updateCondition, toJSON } = useRuleBuilder(mockConfig);
    
    addCondition('root');
    const conditionId = (rule.value.conditions.all![0] as any).id;
    updateCondition(conditionId, { fact: 'accuracy', operator: 'greaterThan', value: 0.7 });
    
    const json = toJSON();
    
    expect(json.conditions.all).toHaveLength(1);
    expect(json.conditions.all[0].fact).toBe('accuracy');
    expect(json.conditions.all[0].operator).toBe('greaterThan');
    expect(json.conditions.all[0].value).toBe(0.7);
  });

  it('should import from JSON correctly', () => {
    const { rule, fromJSON } = useRuleBuilder(mockConfig);
    
    const importedRule = {
      conditions: {
        all: [
          { fact: 'accuracy', operator: 'greaterThan' as const, value: 0.8 },
          { fact: 'streak', operator: 'equal' as const, value: 3 },
        ],
      },
      event: {
        type: 'show_hint',
      },
    };
    
    fromJSON(importedRule as any);
    
    expect(rule.value.conditions.all).toHaveLength(2);
    expect((rule.value.conditions.all![0] as any).fact).toBe('accuracy');
    expect((rule.value.conditions.all![1] as any).fact).toBe('streak');
  });

  it('should flatten nodes for rendering', () => {
    const { nodes, addCondition, addGroup } = useRuleBuilder(mockConfig);
    
    addCondition('root');
    addGroup('root');
    
    const flatNodes = nodes.value;
    
    // Should have: root group + 1 condition + 1 nested group
    expect(flatNodes).toHaveLength(3);
    expect(flatNodes[0].type).toBe('group');
    expect(flatNodes[0].id).toBe('root');
  });
});

