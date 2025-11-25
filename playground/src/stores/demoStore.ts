// demoStore.ts - Mock backend service logic
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Flow {
  id: string;
  title: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  status: 'draft' | 'published';
  created_at: Date;
}

export interface FlowNode {
  id: string;
  type: 'start' | 'lesson' | 'slot' | 'decision' | 'end';
  position: { x: number; y: number };
  label: string;
  data: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Slot {
  id: string;
  name: string;
  type: 'exercise' | 'explanation' | 'assessment';
  variants: Variant[];
  default_variant_id: string;
  selection_strategy: 'ml_bandit' | 'random' | 'rule_based';
}

export interface Variant {
  id: string;
  slot_id: string;
  title: string;
  content: any;
  content_type: 'text' | 'video' | 'interactive';
  difficulty_level: number;
  learning_style: string[];
  impressions: number;
  completions: number;
  success_rate: number;
  avg_time: number;
}

export interface SelectionRecord {
  id: string;
  student_id: string;
  slot_id: string;
  variant_id: string;
  selected_at: Date;
  completed_at?: Date;
  success: boolean;
  time_spent: number;
  score: number;
}

export interface Rule {
  id: string;
  name: string;
  conditions: any[];
  actions: any[];
  enabled: boolean;
}

export const useDemoStore = defineStore('demo', () => {
  // State
  const flows = ref<Flow[]>([]);
  const slots = ref<Slot[]>([]);
  const variants = ref<Variant[]>([]);
  const selectionRecords = ref<SelectionRecord[]>([]);
  const rules = ref<Rule[]>([]);
  const currentStudentId = ref('student_demo_001');
  const studentProfile = ref({
    id: 'student_demo_001',
    name: 'Alex Student',
    mastery: {
      algebra: 0.65,
      geometry: 0.75,
      statistics: 0.55
    },
    learning_style: ['visual', 'kinesthetic'],
    recent_performance: 0.72,
    session_duration: 25,
    items_completed_today: 4
  });

  // Computed
  const stats = computed(() => ({
    flowsCreated: flows.value.length,
    variantsActive: variants.value.filter(v => v.impressions > 0).length,
    studentsEngaged: 1, // Demo has 1 student
    avgSuccessRate: selectionRecords.value.length > 0
      ? selectionRecords.value.reduce((sum, r) => sum + (r.success ? 1 : 0), 0) / selectionRecords.value.length
      : 0
  }));

  // Actions
  function initialize() {
    // Create sample flow
    if (flows.value.length === 0) {
      createSampleFlow();
    }
  }

  function createSampleFlow() {
    const flowId = 'flow_demo_001';
    
    // Create slots
    const slot1: Slot = {
      id: 'slot_intro',
      name: 'Introduction',
      type: 'explanation',
      variants: [],
      default_variant_id: 'var_intro_text',
      selection_strategy: 'ml_bandit'
    };

    const slot2: Slot = {
      id: 'slot_practice',
      name: 'Practice Exercise',
      type: 'exercise',
      variants: [],
      default_variant_id: 'var_practice_basic',
      selection_strategy: 'ml_bandit'
    };

    const slot3: Slot = {
      id: 'slot_assessment',
      name: 'Quick Check',
      type: 'assessment',
      variants: [],
      default_variant_id: 'var_quiz_standard',
      selection_strategy: 'ml_bandit'
    };

    slots.value.push(slot1, slot2, slot3);

    // Create variants for each slot
    // Slot 1 variants (Introduction)
    const introVariants: Variant[] = [
      {
        id: 'var_intro_text',
        slot_id: 'slot_intro',
        title: 'Text Explanation',
        content: {
          type: 'text',
          body: `# Understanding Variables

A **variable** is a symbol (usually a letter) that represents an unknown number.

For example:
- In the equation \`x + 5 = 12\`, the variable is **x**
- We can solve for x by subtracting 5 from both sides
- \`x = 12 - 5 = 7\`

**Key Points:**
- Variables can be any letter (x, y, a, b, etc.)
- They act as placeholders for numbers we need to find
- We can perform operations on variables just like numbers`
        },
        content_type: 'text',
        difficulty_level: 4,
        learning_style: ['reading'],
        impressions: 45,
        completions: 42,
        success_rate: 0.78,
        avg_time: 120
      },
      {
        id: 'var_intro_video',
        slot_id: 'slot_intro',
        title: 'Video Explanation',
        content: {
          type: 'video',
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: 180,
          transcript: 'Animated explanation of variables with visual examples...'
        },
        content_type: 'video',
        difficulty_level: 4,
        learning_style: ['visual', 'auditory'],
        impressions: 52,
        completions: 50,
        success_rate: 0.85,
        avg_time: 185
      },
      {
        id: 'var_intro_interactive',
        slot_id: 'slot_intro',
        title: 'Interactive Demo',
        content: {
          type: 'interactive',
          component: 'VariableBalanceScale',
          props: {
            equation: 'x + 5 = 12',
            interactive: true
          }
        },
        content_type: 'interactive',
        difficulty_level: 5,
        learning_style: ['visual', 'kinesthetic'],
        impressions: 38,
        completions: 36,
        success_rate: 0.92,
        avg_time: 210
      }
    ];

    // Slot 2 variants (Practice)
    const practiceVariants: Variant[] = [
      {
        id: 'var_practice_basic',
        slot_id: 'slot_practice',
        title: 'Basic Practice',
        content: {
          type: 'exercise',
          problems: [
            { question: 'Solve: x + 3 = 10', answer: '7', hint: 'Subtract 3 from both sides' },
            { question: 'Solve: y - 5 = 8', answer: '13', hint: 'Add 5 to both sides' },
            { question: 'Solve: 2a = 14', answer: '7', hint: 'Divide both sides by 2' }
          ]
        },
        content_type: 'interactive',
        difficulty_level: 3,
        learning_style: ['reading', 'kinesthetic'],
        impressions: 60,
        completions: 55,
        success_rate: 0.75,
        avg_time: 180
      },
      {
        id: 'var_practice_visual',
        slot_id: 'slot_practice',
        title: 'Visual Practice',
        content: {
          type: 'interactive',
          component: 'VisualEquationSolver',
          problems: [
            { equation: 'x + 4 = 11', visual: 'balance_scale' },
            { equation: 'y - 3 = 9', visual: 'number_line' },
            { equation: '3b = 15', visual: 'array_model' }
          ]
        },
        content_type: 'interactive',
        difficulty_level: 4,
        learning_style: ['visual', 'kinesthetic'],
        impressions: 42,
        completions: 40,
        success_rate: 0.88,
        avg_time: 220
      }
    ];

    // Slot 3 variants (Assessment)
    const assessmentVariants: Variant[] = [
      {
        id: 'var_quiz_standard',
        slot_id: 'slot_assessment',
        title: 'Standard Quiz',
        content: {
          type: 'quiz',
          questions: [
            {
              question: 'What is the value of x in the equation x + 7 = 15?',
              options: ['6', '7', '8', '22'],
              correct: 0
            },
            {
              question: 'Solve: 3y = 21',
              options: ['3', '6', '7', '18'],
              correct: 2
            },
            {
              question: 'If a - 9 = 5, what is a?',
              options: ['4', '14', '-4', '45'],
              correct: 1
            }
          ]
        },
        content_type: 'interactive',
        difficulty_level: 4,
        learning_style: ['reading'],
        impressions: 58,
        completions: 52,
        success_rate: 0.70,
        avg_time: 240
      }
    ];

    variants.value.push(...introVariants, ...practiceVariants, ...assessmentVariants);

    // Create flow
    const flow: Flow = {
      id: flowId,
      title: 'Introduction to Variables',
      description: 'Learn about variables and how to solve simple equations',
      status: 'published',
      created_at: new Date(),
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 50, y: 200 },
          label: 'Start',
          data: {}
        },
        {
          id: 'lesson_intro',
          type: 'slot',
          position: { x: 250, y: 200 },
          label: 'Introduction',
          data: { slot_id: 'slot_intro' }
        },
        {
          id: 'decision_mastery',
          type: 'decision',
          position: { x: 450, y: 200 },
          label: 'Mastery Check',
          data: {
            rule_id: 'rule_mastery_check',
            condition: 'student.mastery.algebra > 0.7'
          }
        },
        {
          id: 'practice_basic',
          type: 'slot',
          position: { x: 650, y: 300 },
          label: 'Practice',
          data: { slot_id: 'slot_practice' }
        },
        {
          id: 'practice_advanced',
          type: 'slot',
          position: { x: 650, y: 100 },
          label: 'Advanced Practice',
          data: { slot_id: 'slot_practice' }
        },
        {
          id: 'assessment',
          type: 'slot',
          position: { x: 850, y: 200 },
          label: 'Quiz',
          data: { slot_id: 'slot_assessment' }
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 1050, y: 200 },
          label: 'Complete',
          data: {}
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'lesson_intro' },
        { id: 'e2', source: 'lesson_intro', target: 'decision_mastery' },
        { id: 'e3', source: 'decision_mastery', target: 'practice_advanced', label: 'High Mastery' },
        { id: 'e4', source: 'decision_mastery', target: 'practice_basic', label: 'Needs Practice' },
        { id: 'e5', source: 'practice_basic', target: 'assessment' },
        { id: 'e6', source: 'practice_advanced', target: 'assessment' },
        { id: 'e7', source: 'assessment', target: 'end' }
      ]
    };

    flows.value.push(flow);

    // Create sample rule
    rules.value.push({
      id: 'rule_mastery_check',
      name: 'High Performer Fast Track',
      conditions: [
        {
          field: 'student.mastery.algebra',
          operator: 'greater_than',
          value: 0.7
        }
      ],
      actions: [
        {
          type: 'redirect_to_node',
          parameters: { node_id: 'practice_advanced' }
        }
      ],
      enabled: true
    });
  }

  // Variant Selection (Mock ML Bandit)
  function selectVariant(slotId: string): Variant {
    const slot = slots.value.find(s => s.id === slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    const slotVariants = variants.value.filter(v => v.slot_id === slotId);
    if (slotVariants.length === 0) {
      throw new Error(`No variants for slot ${slotId}`);
    }

    // Simple Thompson Sampling simulation
    // Favor variants with high success rate and matching learning style
    const scores = slotVariants.map(variant => {
      // Base score from success rate and completion rate
      const baseScore = variant.success_rate * 0.5 + 
                        (variant.completions / Math.max(variant.impressions, 1)) * 0.3;
      
      // Boost for matching learning style
      const styleMatch = variant.learning_style.some(style => 
        studentProfile.value.learning_style.includes(style)
      ) ? 0.2 : 0;
      
      // Add exploration bonus for undersampled variants
      const explorationBonus = variant.impressions < 30 ? 0.1 : 0;
      
      return baseScore + styleMatch + explorationBonus + Math.random() * 0.1;
    });

    const maxScore = Math.max(...scores);
    const selectedIndex = scores.indexOf(maxScore);
    const selectedVariant = slotVariants[selectedIndex];

    // Update impressions
    selectedVariant.impressions++;

    return selectedVariant;
  }

  // Record Selection Outcome
  function recordOutcome(
    slotId: string,
    variantId: string,
    success: boolean,
    timeSpent: number,
    score: number
  ) {
    const variant = variants.value.find(v => v.id === variantId);
    if (!variant) return;

    // Update variant metrics
    variant.completions++;
    const prevSuccess = variant.success_rate * (variant.completions - 1);
    variant.success_rate = (prevSuccess + (success ? 1 : 0)) / variant.completions;
    
    const prevTime = variant.avg_time * (variant.completions - 1);
    variant.avg_time = (prevTime + timeSpent) / variant.completions;

    // Create selection record
    const record: SelectionRecord = {
      id: `sel_${Date.now()}`,
      student_id: currentStudentId.value,
      slot_id: slotId,
      variant_id: variantId,
      selected_at: new Date(),
      completed_at: new Date(),
      success,
      time_spent: timeSpent,
      score
    };

    selectionRecords.value.push(record);

    // Update student mastery (simple simulation)
    if (success && score > 0.7) {
      studentProfile.value.mastery.algebra = Math.min(
        1.0,
        studentProfile.value.mastery.algebra + 0.05
      );
    }
  }

  // Evaluate Rule
  function evaluateRule(ruleId: string): boolean {
    const rule = rules.value.find(r => r.id === ruleId);
    if (!rule || !rule.enabled) return false;

    // Simple condition evaluation
    return rule.conditions.every(condition => {
      const value = getNestedValue(studentProfile.value, condition.field);
      
      switch (condition.operator) {
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'equals':
          return value === condition.value;
        default:
          return false;
      }
    });
  }

  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  // Get Analytics Data
  function getAnalytics() {
    const variantPerformance = variants.value.map(v => ({
      variant_id: v.id,
      title: v.title,
      slot_id: v.slot_id,
      impressions: v.impressions,
      completions: v.completions,
      completion_rate: v.impressions > 0 ? v.completions / v.impressions : 0,
      success_rate: v.success_rate,
      avg_time: v.avg_time
    }));

    const flowProgress = {
      nodes_visited: selectionRecords.value.length,
      avg_success_rate: stats.value.avgSuccessRate,
      total_time: selectionRecords.value.reduce((sum, r) => sum + r.time_spent, 0)
    };

    return {
      variantPerformance,
      flowProgress,
      studentProfile: studentProfile.value
    };
  }

  // Reset Demo
  function reset() {
    flows.value = [];
    slots.value = [];
    variants.value = [];
    selectionRecords.value = [];
    rules.value = [];
    studentProfile.value.mastery = {
      algebra: 0.65,
      geometry: 0.75,
      statistics: 0.55
    };
    initialize();
  }

  // Export Data
  function exportData() {
    return {
      flows: flows.value,
      slots: slots.value,
      variants: variants.value,
      selectionRecords: selectionRecords.value,
      rules: rules.value,
      studentProfile: studentProfile.value,
      stats: stats.value
    };
  }

  return {
    // State
    flows,
    slots,
    variants,
    selectionRecords,
    rules,
    studentProfile,
    currentStudentId,
    
    // Computed
    stats,
    
    // Actions
    initialize,
    selectVariant,
    recordOutcome,
    evaluateRule,
    getAnalytics,
    reset,
    exportData
  };
});





