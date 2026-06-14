<template>
  <div class="scrim" @click.self="$emit('close')">
    <article class="help">
      <header>
        <div>
          <h1>How this works</h1>
          <p>Designing adaptive learning paths — the why, the what, and the how.</p>
        </div>
        <button class="x" @click="$emit('close')">✕</button>
      </header>

      <section class="lede">
        <p>This is a canvas for building a course that <b>adapts to each learner</b>. You design one
        structure; the tool turns it into a different journey for every student — extra help for those
        who need it, deeper challenges for those who are ready, all converging on the same goals.</p>
        <p class="muted">New here? Read the first three cards and you'll be productive. The rest is the deeper theory.</p>
      </section>

      <h2>The map: four lanes</h2>
      <p>Every section lives in one of four <b>pedagogical lanes</b>. The lane says what role the content plays — not just where it sits.</p>
      <div class="lanes">
        <div v-for="l in laneList" :key="l.id" class="lane" :style="{ '--a': l.accent }">
          <div class="lh"><span class="li">{{ l.icon }}</span><span class="ln">{{ l.label }}</span></div>
          <p>{{ l.blurb }}</p>
        </div>
      </div>

      <h2>The spine &amp; the stages</h2>
      <div class="grid2">
        <div class="card">
          <h3>📘 Core is the spine</h3>
          <p>Core runs top to bottom from <b>Start → End</b> — the path everyone travels. It always has a
          start and an end; the tool enforces that.</p>
        </div>
        <div class="card">
          <h3>▦ Stages are moments</h3>
          <p>Each row is a <b>moment</b> in the journey. A core section and the support/enrichment/advanced
          around it share a row — they're alternatives and companions for the <i>same</i> moment.</p>
        </div>
      </div>

      <h2>Branches that merge back (gravity wiring)</h2>
      <p>You don't draw arrows. You place a section in a lane and stage, and the tool <b>derives</b> the
      connections by "gravity":</p>
      <ul class="bullets">
        <li><b>Support</b> branches <i>in</i> from the previous core step and <i>out</i> to the step it scaffolds — a detour for those who need it.</li>
        <li><b>Enrichment / Advanced</b> branch <i>out</i> of their core step and <i>merge back</i> into the next — a side-trip that always returns to the spine.</li>
        <li>Move or reorder a section and its arrows <b>re-wire automatically</b>. You think in pedagogy; the graph takes care of itself.</li>
      </ul>
      <p class="muted">Why: a branch that never returns to core is a dead-end for the student. Merging back guarantees everyone reaches the end — the editor warns you if one doesn't (the sense-check chip).</p>

      <h2>Adaptivity: conditions &amp; the learner profile</h2>
      <p>A branch can carry a <b>condition</b> — a "show when…" rule evaluated against a <b>learner profile</b>
      (mastery per skill, last score, outcomes, completion). Slide the profile and watch the path change.</p>
      <ul class="bullets">
        <li><b>Variants</b> are just sibling branches with mutually-exclusive conditions — e.g. <i>Worked Example</i> when score &lt; 60, <i>Standard</i> when ≥ 60. The learner sees exactly one.</li>
        <li>The <b>active path</b> (bold, coloured) is what <i>this</i> learner actually gets. Off-path content fades.</li>
        <li><b>Flow ▸</b> shows the <i>resolved journey</i> as a clean list, with the reason each section was included.</li>
      </ul>

      <h2>Reading &amp; trusting the flow</h2>
      <div class="grid2">
        <div class="card"><h3>🌊 The active river</h3><p>The live path is a bold coloured line through the gutters; everything off-path recedes. Hover a section to focus its connections.</p></div>
        <div class="card"><h3>✓ Sense-check</h3><p>A always-on validator: it flags <i>no End</i>, <i>unreachable</i> sections, and <i>dead-end branches</i> that never merge back — so the student path always holds up.</p></div>
      </div>

      <h2>Views</h2>
      <ul class="bullets">
        <li><b>Gutter routing</b> — arrows travel only through the empty gaps between lanes and stages, so they <i>never</i> cross a section. Clarity by construction.</li>
        <li><b>Lanes / Stages / Edges</b> toggles &amp; <b>Flows only</b> — strip the scaffolding to read the bare flow.</li>
        <li><b>DAG view</b> — lift the whole thing out of the grid and see it as one directed graph, ranked by dependency. Great for grasping the overall shape.</li>
      </ul>

      <h2>Why this model — the pedagogy</h2>
      <p>Good teaching is <b>one destination, many routes</b>. Learners differ in prior knowledge, pace, and
      confidence, so a single linear course either bores some or loses others. This editor encodes
      <b>differentiation</b> directly: a stable core for shared goals, support for remediation, enrichment for
      breadth, advanced for depth — each offered <i>only when the learner's profile calls for it</i>. It's
      mastery-aware (branch on what they've actually learned) and keeps every route accountable to the same end.</p>

      <h2>Under the hood — the graph &amp; layout</h2>
      <p>The course is a <b>directed acyclic graph</b> (DAG): branches always flow forward and merge, never loop.
      The swimlane is one <i>layout</i> of that graph (lanes × stages); the DAG view is another (layered by
      longest-path). Edges are routed orthogonally through guaranteed-empty gutters; layout runs in a Web
      Worker so it stays smooth as the graph grows.</p>

      <h2>Quick start</h2>
      <ol class="steps">
        <li>Hover a lane header and hit <b>＋</b> to add a section (or use the ghost “+ add” cells).</li>
        <li>Select it → give it a <b>condition</b> in the inspector (“show when score &lt; 60”).</li>
        <li><b>Drag</b> it across lanes/stages — the arrows re-wire themselves.</li>
        <li>Slide the <b>profile</b> sliders and open <b>Flow ▸</b> to see how a real learner travels it.</li>
        <li>Watch the <b>sense-check</b> chip — green means the student path makes sense.</li>
      </ol>

      <footer>You can reopen this anytime from the <b>?</b> button.</footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { LANES, LANE_ORDER } from '../model/types';
defineEmits<{ close: [] }>();
const laneList = LANE_ORDER.map(id => LANES[id]);
</script>

<style scoped>
.scrim { position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(2px); z-index: 100; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; overflow-y: auto; }
.help { width: 100%; max-width: 680px; background: #fff; border-radius: 18px; box-shadow: 0 30px 80px rgba(2,6,23,.4); padding: 28px 32px 36px; }
header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }
h1 { font-size: 24px; margin: 0; color: #0f172a; }
header p { margin: 4px 0 0; color: #64748b; font-size: 13.5px; }
.x { border: none; background: #f1f5f9; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; color: #475569; font-size: 14px; flex: 0 0 auto; }
.lede { margin: 14px 0 6px; }
.lede p { font-size: 14.5px; line-height: 1.6; color: #1e293b; }
.muted { color: #94a3b8 !important; font-size: 12.5px !important; }
h2 { font-size: 15px; margin: 26px 0 8px; color: #0f172a; padding-bottom: 6px; border-bottom: 1px solid #eef2f7; }
h3 { font-size: 13.5px; margin: 0 0 5px; color: #0f172a; }
p { font-size: 13.5px; line-height: 1.6; color: #334155; margin: 8px 0; }
.lanes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
.lane { border: 1px solid #eef2f7; border-left: 4px solid var(--a); border-radius: 10px; padding: 10px 12px; }
.lane .lh { display: flex; align-items: center; gap: 7px; }
.lane .li { font-size: 15px; } .lane .ln { font-weight: 700; color: #0f172a; font-size: 13px; }
.lane p { margin: 5px 0 0; font-size: 12px; color: #64748b; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
.card { border: 1px solid #eef2f7; border-radius: 10px; padding: 12px 14px; background: #fbfcfe; }
.card p { margin: 4px 0 0; font-size: 12.5px; color: #475569; }
.bullets { margin: 8px 0; padding-left: 20px; } .bullets li { font-size: 13.5px; line-height: 1.6; color: #334155; margin: 6px 0; }
.steps { margin: 8px 0; padding-left: 22px; } .steps li { font-size: 13.5px; line-height: 1.7; color: #334155; margin: 5px 0; }
footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #eef2f7; font-size: 12.5px; color: #94a3b8; }
@media (max-width: 560px) { .lanes, .grid2 { grid-template-columns: 1fr; } }
</style>
