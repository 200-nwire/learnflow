import { defineComponent, ref } from 'vue';
import { createSnapshot, selectVariant, type Slot, type Policy } from '@amit/adaptivity';

export default { title: 'Adaptivity/Selector' };

export const Basic = () => defineComponent({
  setup() {
    const ctx = ref(createSnapshot({
      ids: { userId:'u1', courseId:'c1', lessonId:'L1', pageId:'P1' },
      user: { lang: 'he' },
      env: { device: 'desktop', online: true }
    }));
    const slot: Slot = {
      id: 'slot_intro',
      variants: [
        { id: 'vA', meta: { theme:'soccer', deviceFit:['desktop','mobile'] }, guard:'ctx.metrics.accEWMA <= 0.8' },
        { id: 'vB', meta: { theme:'music', deviceFit:['desktop'] } }
      ]
    };
    const policy: Policy = { version: 'demo' };
    const result = ref(selectVariant(slot, ctx.value, policy, { trace: true }));
    return () => (
      <div>
        <div>Chosen: <b>{result.value.variantId}</b></div>
        <pre>{JSON.stringify(result.value.why, null, 2)}</pre>
      </div>
    );
  }
});
