import { ref, computed, Ref } from 'vue';
import type { Rule, RuleGroup, RuleCondition, RuleBuilderConfig, BuilderNode } from '../types';

export function useRuleBuilder(config: RuleBuilderConfig) {
  const rule = ref<Rule>({
    conditions: {
      id: 'root',
      all: [],
    },
    event: {
      type: config.events[0]?.type || 'default',
    },
  });

  const selectedNodeId = ref<string | null>(null);

  // Generate unique IDs
  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get node by ID (recursive search)
  const findNode = (nodeId: string, group: RuleGroup = rule.value.conditions): RuleCondition | RuleGroup | null => {
    if (group.id === nodeId) return group;

    const children = group.all || group.any || [];
    for (const child of children) {
      if ('id' in child) {
        if (child.id === nodeId) return child;
        if ('all' in child || 'any' in child) {
          const found = findNode(nodeId, child as RuleGroup);
          if (found) return found;
        }
      }
    }
    return null;
  };

  // Get parent group of a node
  const findParent = (nodeId: string, group: RuleGroup = rule.value.conditions): RuleGroup | null => {
    const children = group.all || group.any || [];
    
    for (const child of children) {
      if ('id' in child && child.id === nodeId) {
        return group;
      }
      if ('all' in child || 'any' in child) {
        const found = findParent(nodeId, child as RuleGroup);
        if (found) return found;
      }
    }
    return null;
  };

  // Calculate depth of a node
  const getDepth = (nodeId: string, currentDepth = 0, group: RuleGroup = rule.value.conditions): number => {
    if (group.id === nodeId) return currentDepth;

    const children = group.all || group.any || [];
    for (const child of children) {
      if ('id' in child) {
        if (child.id === nodeId) return currentDepth + 1;
        if ('all' in child || 'any' in child) {
          const depth = getDepth(nodeId, currentDepth + 1, child as RuleGroup);
          if (depth > 0) return depth;
        }
      }
    }
    return 0;
  };

  // Add a condition to a group
  const addCondition = (groupId: string) => {
    const group = findNode(groupId) as RuleGroup;
    if (!group) return;

    const newCondition: RuleCondition = {
      id: generateId(),
      fact: config.facts[0]?.name || '',
      operator: 'equal',
      value: '',
    };

    const children = group.all || group.any || [];
    children.push(newCondition);
  };

  // Add a nested group
  const addGroup = (parentId: string, operator: 'all' | 'any' = 'all') => {
    const parent = findNode(parentId) as RuleGroup;
    if (!parent) return;

    const depth = getDepth(parentId);
    if (config.maxDepth && depth >= config.maxDepth) {
      console.warn('Maximum depth reached');
      return;
    }

    const newGroup: RuleGroup = {
      id: generateId(),
      [operator]: [],
    };

    const children = (parent.all || parent.any || []) as Array<RuleCondition | RuleGroup>;
    children.push(newGroup);
  };

  // Remove a node
  const removeNode = (nodeId: string) => {
    const parent = findParent(nodeId);
    if (!parent) return;

    const children = parent.all || parent.any || [];
    const index = children.findIndex((child: any) => child.id === nodeId);
    if (index > -1) {
      children.splice(index, 1);
    }
  };

  // Update a condition
  const updateCondition = (conditionId: string, updates: Partial<RuleCondition>) => {
    const condition = findNode(conditionId) as RuleCondition;
    if (condition && 'fact' in condition) {
      Object.assign(condition, updates);
    }
  };

  // Toggle group operator (all <-> any)
  const toggleGroupOperator = (groupId: string) => {
    const group = findNode(groupId) as RuleGroup;
    if (!group) return;

    if (group.all) {
      group.any = group.all;
      delete group.all;
    } else if (group.any) {
      group.all = group.any;
      delete group.any;
    }
  };

  // Get flat list of all nodes for rendering
  const flattenNodes = (group: RuleGroup = rule.value.conditions, depth = 0, parentId?: string): BuilderNode[] => {
    const nodes: BuilderNode[] = [];
    
    // Add the group itself
    nodes.push({
      id: group.id,
      type: 'group',
      data: group,
      depth,
      parentId,
    });

    const children = group.all || group.any || [];
    children.forEach((child: any) => {
      if ('all' in child || 'any' in child) {
        // It's a group
        nodes.push(...flattenNodes(child, depth + 1, group.id));
      } else {
        // It's a condition
        nodes.push({
          id: child.id,
          type: 'condition',
          data: child,
          depth: depth + 1,
          parentId: group.id,
        });
      }
    });

    return nodes;
  };

  const nodes = computed(() => flattenNodes());

  // Export rule as JSON (compatible with json-rules-engine)
  const toJSON = () => {
    return JSON.parse(JSON.stringify(rule.value));
  };

  // Import rule from JSON
  const fromJSON = (ruleData: Rule) => {
    // Ensure all nodes have IDs
    const addIds = (node: any): any => {
      if (!node.id) {
        node.id = generateId();
      }
      
      if (node.all) {
        node.all = node.all.map(addIds);
      }
      if (node.any) {
        node.any = node.any.map(addIds);
      }
      
      return node;
    };

    rule.value = addIds(JSON.parse(JSON.stringify(ruleData)));
  };

  return {
    rule,
    selectedNodeId,
    nodes,
    addCondition,
    addGroup,
    removeNode,
    updateCondition,
    toggleGroupOperator,
    findNode,
    findParent,
    getDepth,
    toJSON,
    fromJSON,
  };
}

