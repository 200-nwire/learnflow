import type { OperatorDefinition } from './types';

export const defaultOperators: OperatorDefinition[] = [
  {
    name: 'equal',
    label: 'equals',
    types: ['string', 'number', 'boolean'],
  },
  {
    name: 'notEqual',
    label: 'does not equal',
    types: ['string', 'number', 'boolean'],
  },
  {
    name: 'lessThan',
    label: 'is less than',
    types: ['number'],
  },
  {
    name: 'lessThanInclusive',
    label: 'is less than or equal to',
    types: ['number'],
  },
  {
    name: 'greaterThan',
    label: 'is greater than',
    types: ['number'],
  },
  {
    name: 'greaterThanInclusive',
    label: 'is greater than or equal to',
    types: ['number'],
  },
  {
    name: 'in',
    label: 'is in',
    types: ['string', 'number', 'array'],
  },
  {
    name: 'notIn',
    label: 'is not in',
    types: ['string', 'number', 'array'],
  },
  {
    name: 'contains',
    label: 'contains',
    types: ['string', 'array'],
  },
  {
    name: 'doesNotContain',
    label: 'does not contain',
    types: ['string', 'array'],
  },
];

export function getOperatorsForType(type: string, operators: OperatorDefinition[] = defaultOperators): OperatorDefinition[] {
  return operators.filter(op => op.types.includes(type as any));
}

