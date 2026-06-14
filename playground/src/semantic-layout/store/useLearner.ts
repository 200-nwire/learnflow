/**
 * Learner profile store + live active-path derivation.
 * Moving a slider here re-derives which sections are eligible and which links
 * fire — so the author *sees* their pedagogy adapt in real time.
 */
import { reactive, computed } from 'vue';
import { emptyProfile, type LearnerProfile } from '../model/types';
import { deriveActivePath } from '../model/rules';
import { sampleCourse } from '../model/sampleCourse';
import { useCourse } from './useCourse';

const profile = reactive<LearnerProfile>(seed());

function seed(): LearnerProfile {
  const p = emptyProfile();
  const s = sampleCourse.profile ?? {};
  Object.assign(p.mastery, s.mastery ?? {});
  p.score = s.score ?? 0;
  Object.assign(p.outcomes, s.outcomes ?? {});
  Object.assign(p.completed, s.completed ?? {});
  Object.assign(p.attempts, s.attempts ?? {});
  Object.assign(p.vars, s.vars ?? {});
  // ensure every catalog skill has a value
  for (const sk of sampleCourse.skills ?? []) if (!(sk.id in p.mastery)) p.mastery[sk.id] = 0.5;
  return p;
}

export function useLearner() {
  const { state } = useCourse();
  const active = computed(() => deriveActivePath(state, profile));

  function setMastery(skill: string, v: number) { profile.mastery[skill] = v; }
  function setScore(v: number) { profile.score = v; }
  function reset() {
    const s = seed();
    profile.mastery = s.mastery; profile.score = s.score;
    profile.outcomes = s.outcomes; profile.completed = s.completed;
    profile.attempts = s.attempts; profile.vars = s.vars;
  }

  return { profile, active, setMastery, setScore, reset, skills: sampleCourse.skills ?? [] };
}
