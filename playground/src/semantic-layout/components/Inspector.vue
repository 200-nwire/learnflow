<template>
  <aside class="insp" :class="{ open: !!(node || link) }">
    <div v-if="node" class="panel">
      <header>
        <span class="kind" :style="{ color: accentFor(node) }">{{ node.kind === 'decision' ? '◆ Decision' : '▦ Section' }}</span>
        <button class="x" @click="course.clearSelection()">✕</button>
      </header>

      <template v-if="node.kind === 'section'">
        <label>Title</label>
        <input :value="node.label" @input="set('label', ($event.target as HTMLInputElement).value)" />
        <label>Description</label>
        <textarea rows="2" :value="node.description" @input="set('description', ($event.target as HTMLInputElement).value)" />
        <div class="row">
          <div><label>Pages</label><input type="number" min="0" :value="node.pages" @input="set('pages', +($event.target as HTMLInputElement).value)" /></div>
          <div><label>Skill</label>
            <select :value="node.skill ?? ''" @change="set('skill', ($event.target as HTMLSelectElement).value || undefined)">
              <option value="">—</option>
              <option v-for="s in skills" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>
        </div>
        <label class="chk"><input type="checkbox" :checked="node.optional" @change="set('optional', ($event.target as HTMLInputElement).checked)" /> Optional (not required for everyone)</label>

        <div class="rule-block">
          <label>Show when (entry rule)</label>
          <ConditionRow :model="node.entryRule" @update="r => course.setEntryRule(node!.id, r)" />
        </div>
      </template>

      <template v-else>
        <label>Prompt</label>
        <input :value="node.prompt" @input="set('prompt', ($event.target as HTMLInputElement).value)" />
        <p class="muted">A decision routes via its outgoing links — select a link to give it a condition.</p>
      </template>

      <div class="row">
        <div><label>Lane</label>
          <select :value="node.lane" @change="set('lane', ($event.target as HTMLSelectElement).value)">
            <option v-for="l in LANE_ORDER" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <div><label>Stage</label><input type="number" min="1" :value="node.stage" @input="set('stage', +($event.target as HTMLInputElement).value)" /></div>
      </div>

      <button class="del" @click="course.deleteNode(node.id)">Delete</button>
    </div>

    <div v-else-if="link" class="panel">
      <header>
        <span class="kind branch">→ Link</span>
        <button class="x" @click="course.clearSelection()">✕</button>
      </header>
      <p class="lnk">{{ srcLabel }} <b>→</b> {{ tgtLabel }}</p>
      <label>Kind</label>
      <select :value="link.kind" @change="setLink('kind', ($event.target as HTMLSelectElement).value)">
        <option v-for="k in ['core','support','enrichment','advanced','branch']" :key="k" :value="k">{{ k }}</option>
      </select>
      <div class="rule-block">
        <label>Take this path when (guard)</label>
        <ConditionRow :model="link.guard" @update="r => course.updateLink(link!.id, { guard: r, label: r ? describe(r) : undefined })" />
        <p class="muted">No condition = always / default (the “else”). Sibling guards are tried in order; first match wins.</p>
      </div>
      <button class="del" @click="course.deleteLink(link.id)">Delete link</button>
    </div>

    <div v-else class="empty">
      <p>Select a section, decision, or link to edit it.</p>
      <p class="muted">Tip: drag from a node’s handle to another to create a link, then add a condition here.</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, h, defineComponent, ref, watch } from 'vue';
import { useCourse } from '../store/useCourse';
import { useLearner } from '../store/useLearner';
import { LANE_ORDER, LANES, type Condition, type CourseNode, type Field } from '../model/types';
import { describe } from '../model/rules';

const course = useCourse();
const { skills } = useLearner();
const node = computed(() => course.selectedNode.value as CourseNode | undefined);
const link = computed(() => course.selectedLink.value);

const accentFor = (n: CourseNode) => n.kind === 'section' ? LANES[n.lane].accent : '#6366f1';
const set = (k: string, v: any) => node.value && course.updateNode(node.value.id, { [k]: v } as any);
const setLink = (k: string, v: any) => link.value && course.updateLink(link.value.id, { [k]: v } as any);
const labelOf = (id?: string) => {
  const n = course.getNode(id ?? null);
  return n ? (n.kind === 'section' ? n.label : '◆ ' + n.prompt) : id;
};
const srcLabel = computed(() => labelOf(link.value?.source));
const tgtLabel = computed(() => labelOf(link.value?.target));

/* ── inline condition editor (always | single comparison) ──────────────────*/
const fieldOptions = computed(() => [
  { key: 'score', label: 'Score' },
  ...skills.map(s => ({ key: 'mastery:' + s.id, label: 'Mastery · ' + s.label })),
]);
function keyToField(key: string): Field {
  if (key === 'score') return { kind: 'score' };
  const [, skill] = key.split(':');
  return { kind: 'mastery', skill };
}
function fieldToKey(f: Field): string {
  return f.kind === 'mastery' ? 'mastery:' + f.skill : 'score';
}

const ConditionRow = defineComponent({
  props: { model: { type: Object as () => Condition | undefined, default: undefined } },
  emits: ['update'],
  setup(props, { emit }) {
    const enabled = ref(!!props.model && props.model.type === 'cmp');
    const key = ref('score');
    const op = ref<'<' | '<=' | '>' | '>=' | '==' | '!='>('<');
    const val = ref(0.6);
    watch(() => props.model, (m) => {
      if (m && m.type === 'cmp') {
        enabled.value = true; key.value = fieldToKey(m.field);
        op.value = m.op as any; val.value = Number(m.value);
      } else enabled.value = false;
    }, { immediate: true });
    function emitNow() {
      if (!enabled.value) return emit('update', undefined);
      emit('update', { type: 'cmp', field: keyToField(key.value), op: op.value, value: val.value } as Condition);
    }
    return () => h('div', { class: 'cond' }, [
      h('label', { class: 'chk' }, [
        h('input', { type: 'checkbox', checked: enabled.value, onChange: (e: any) => { enabled.value = e.target.checked; emitNow(); } }),
        ' conditional',
      ]),
      enabled.value ? h('div', { class: 'cond-row' }, [
        h('select', { value: key.value, onChange: (e: any) => { key.value = e.target.value; emitNow(); } },
          fieldOptions.value.map(o => h('option', { value: o.key }, o.label))),
        h('select', { value: op.value, onChange: (e: any) => { op.value = e.target.value; emitNow(); } },
          ['<', '<=', '>', '>=', '==', '!='].map(o => h('option', { value: o }, o))),
        h('input', { type: 'number', step: '0.05', value: val.value, onInput: (e: any) => { val.value = +e.target.value; emitNow(); } }),
      ]) : null,
    ]);
  },
});
</script>

<style scoped>
.insp {
  width: 0; flex: 0 0 0; background: #fff; border-left: 1px solid #e7eaf0; overflow: hidden;
  transition: width .22s cubic-bezier(.22,1,.36,1), flex-basis .22s; display: flex; flex-direction: column;
}
.insp.open { width: 320px; flex-basis: 320px; }
.panel, .empty { padding: 16px; overflow-y: auto; }
.empty { color: #98a2b3; font-size: 13px; }
header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.kind { font-size: 13px; font-weight: 800; letter-spacing: .02em; }
.kind.branch { color: #475569; }
.x { border: none; background: #f3f4f6; border-radius: 6px; width: 24px; height: 24px; cursor: pointer; color: #6b7280; }
label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #8a94a6; margin: 10px 0 4px; }
label.chk { display: flex; align-items: center; gap: 7px; text-transform: none; letter-spacing: 0; font-weight: 500; color: #374151; font-size: 12.5px; }
input, textarea, select { width: 100%; border: 1px solid #d6dbe5; border-radius: 8px; padding: 7px 9px; font-size: 13px; color: #111827; background: #fff; }
input[type=checkbox] { width: auto; }
.row { display: flex; gap: 10px; } .row > div { flex: 1; }
.muted { color: #98a2b3; font-size: 11px; margin: 6px 0 0; line-height: 1.4; }
.lnk { font-size: 13px; color: #374151; background: #f8fafc; border-radius: 8px; padding: 8px 10px; }
.rule-block { margin-top: 6px; padding: 10px; background: #faf9ff; border: 1px solid #ede9fe; border-radius: 10px; }
.del { margin-top: 16px; width: 100%; border: 1px solid #fecaca; color: #b91c1c; background: #fff; border-radius: 8px; padding: 8px; font-weight: 600; cursor: pointer; }
.del:hover { background: #fef2f2; }
:deep(.cond-row) { display: flex; gap: 6px; margin-top: 8px; }
:deep(.cond-row select), :deep(.cond-row input) { padding: 5px 7px; font-size: 12px; }
</style>
