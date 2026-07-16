<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * TestRunner — a mock Playwright run rendered as a terminal-style card.
 *
 * Everything is deliberately deterministic (fixed outcomes, fixed durations):
 * this page is a screenshot baseline for visual regression tests, and any
 * randomness would flake them. The only "async" behaviour is a paced
 * interval so the run feels alive while replaying identically every time.
 */

/** @type {const} spec fixtures — `passes` scripts the outcome per run */
const SPEC_FIXTURES = [
  { id: 1, name: 'header.spec.ts › shows CI badge', ms: 84, passes: true },
  { id: 2, name: 'nav.spec.ts › highlights active link', ms: 112, passes: true },
  { id: 3, name: 'hero.spec.ts › renders gradient title', ms: 96, passes: true },
  { id: 4, name: 'snapshot.spec.ts › matches baseline', ms: 231, passes: false },
  { id: 5, name: 'footer.spec.ts › links are visible', ms: 67, passes: true },
]

const STEP_MS = 450 // pacing between spec results — slow enough to watch

const specs = ref(SPEC_FIXTURES.map((spec) => ({ ...spec, status: 'idle' })))
const runState = ref('idle') // idle → running → done
const filter = ref('all')

let timer = null

/** Specs currently visible under the active filter. */
const visibleSpecs = computed(() =>
  filter.value === 'all'
    ? specs.value
    : specs.value.filter((spec) => spec.status === filter.value)
)

/** Aggregates for the summary bar — derived, never stored. */
const stats = computed(() => ({
  passed: specs.value.filter((spec) => spec.status === 'passed').length,
  failed: specs.value.filter((spec) => spec.status === 'failed').length,
  totalMs: specs.value
    .filter((spec) => spec.status !== 'idle' && spec.status !== 'running')
    .reduce((sum, spec) => sum + spec.ms, 0),
}))

const progress = computed(() => {
  const settled = stats.value.passed + stats.value.failed
  return Math.round((settled / specs.value.length) * 100)
})

const stopTimer = () => {
  clearInterval(timer)
  timer = null
}

/** Replays the scripted run: one spec settles per tick. */
const runSuite = () => {
  stopTimer()
  specs.value.forEach((spec) => (spec.status = 'idle'))
  filter.value = 'all'
  runState.value = 'running'

  let cursor = 0
  specs.value[cursor].status = 'running'

  timer = setInterval(() => {
    const current = specs.value[cursor]
    current.status = current.passes ? 'passed' : 'failed'

    cursor += 1
    if (cursor < specs.value.length) {
      specs.value[cursor].status = 'running'
    } else {
      stopTimer()
      runState.value = 'done'
    }
  }, STEP_MS)
}

const setFilter = (value) => {
  filter.value = value
}

// Kick off one run on mount so the page never sits empty…
onMounted(runSuite)
// …and never leak the interval if the component unmounts mid-run.
onBeforeUnmount(stopTimer)

/** Presentation lookup — keeps the template free of nested ternaries. */
const STATUS_GLYPHS = { idle: '·', running: '◌', passed: '✓', failed: '✕' }
</script>

<template>
  <div class="runner" data-testid="test-runner">
    <!-- Faux window chrome sells the "terminal" look -->
    <div class="runner__chrome">
      <span class="runner__dot runner__dot--red" aria-hidden="true"></span>
      <span class="runner__dot runner__dot--yellow" aria-hidden="true"></span>
      <span class="runner__dot runner__dot--green" aria-hidden="true"></span>
      <code class="runner__cmd">npx playwright test --project=chromium</code>
      <span
        class="runner__badge"
        title="Scripted replay — no tests are actually executed"
        data-testid="simulated-badge"
      >
        ⚠ simulated
      </span>
    </div>

    <div class="runner__toolbar">
      <div class="runner__filters" role="group" aria-label="Filter specs">
        <button
          v-for="value in ['all', 'passed', 'failed']"
          :key="value"
          class="runner__filter"
          :class="{ 'runner__filter--active': filter === value }"
          :data-testid="`filter-${value}`"
          @click="setFilter(value)"
        >
          {{ value }}
        </button>
      </div>

      <button
        class="runner__run"
        :disabled="runState === 'running'"
        data-testid="run-button"
        @click="runSuite"
      >
        {{ runState === 'running' ? 'Running…' : 'Run tests' }}
      </button>
    </div>

    <div class="runner__progress" aria-hidden="true">
      <div class="runner__progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>

    <ul class="runner__list" data-testid="spec-list">
      <li
        v-for="spec in visibleSpecs"
        :key="spec.id"
        class="runner__spec"
        :class="`runner__spec--${spec.status}`"
        :data-testid="`spec-${spec.id}`"
        :data-status="spec.status"
      >
        <span class="runner__glyph">{{ STATUS_GLYPHS[spec.status] }}</span>
        <span class="runner__name">{{ spec.name }}</span>
        <span class="runner__ms">{{ spec.ms }}ms</span>
      </li>
      <li v-if="!visibleSpecs.length" class="runner__spec runner__spec--empty">
        <span class="runner__name">No specs match this filter — yet.</span>
      </li>
    </ul>

    <div class="runner__summary" data-testid="summary">
      <span class="runner__stat runner__stat--pass">{{ stats.passed }} passed</span>
      <span class="runner__stat runner__stat--fail">{{ stats.failed }} failed</span>
      <span class="runner__stat">{{ stats.totalMs }}ms total</span>
      <span class="runner__stat runner__stat--note" data-testid="summary-note">
        scripted replay — no real browser
      </span>
    </div>
  </div>
</template>

<style scoped>
.runner {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-card);
  font-family: var(--font-mono);
  font-size: 0.8rem;

  .runner__chrome {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.65rem 1rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-muted);
  }

  .runner__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;

    &.runner__dot--red { background: #fca5a5; }
    &.runner__dot--yellow { background: #fcd34d; }
    &.runner__dot--green { background: #86efac; }
  }

  .runner__cmd {
    margin-left: 0.5rem;
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: 0.72rem;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* Amber "not real" flag — deliberately loud so the mock is never mistaken
     for an actual test run. */
  .runner__badge {
    flex-shrink: 0;
    margin-left: auto;
    padding: 0.15rem 0.55rem;
    border: 1px solid #fde68a;
    border-radius: 999px;
    background: #fef3c7;
    color: #b45309;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: help;
  }

  .runner__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .runner__filters {
    display: flex;
    gap: 0.25rem;
    padding: 0.2rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-bg-muted);
  }

  .runner__filter {
    padding: 0.25rem 0.7rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--color-text-muted);
    font-family: inherit;
    font-size: 0.72rem;
    text-transform: capitalize;
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
      color: var(--color-text);
    }

    &.runner__filter--active {
      background: var(--color-bg);
      color: var(--color-accent-strong);
      box-shadow: 0 1px 2px rgb(2 4 32 / 0.08);
    }
  }

  .runner__run {
    padding: 0.4rem 1rem;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-accent);
    color: #fff;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    transition: background-color 0.15s ease;

    &:hover:not(:disabled) {
      background: var(--color-accent-strong);
    }

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }
  }

  .runner__progress {
    height: 2px;
    background: var(--color-border);
  }

  .runner__progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent), var(--color-accent-strong));
    transition: width 0.4s ease;
  }

  .runner__list {
    margin: 0;
    padding: 0.5rem 0;
    list-style: none;
  }

  .runner__spec {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.45rem 1rem;
    transition: background-color 0.15s ease;

    &.runner__spec--running {
      background: var(--color-accent-soft);

      .runner__glyph {
        color: var(--color-accent-strong);
        animation: runner-spin 0.8s linear infinite;
      }
    }

    &.runner__spec--passed .runner__glyph { color: var(--color-pass); }
    &.runner__spec--failed .runner__glyph { color: var(--color-fail); }

    &.runner__spec--failed {
      background: rgb(244 63 94 / 0.06);

      .runner__name { color: var(--color-fail); }
    }

    &.runner__spec--empty {
      color: var(--color-text-muted);
      font-style: italic;
    }
  }

  .runner__glyph {
    display: inline-block;
    width: 1ch;
    color: var(--color-text-muted);
    font-weight: 700;
  }

  .runner__name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .runner__ms {
    margin-left: auto;
    color: var(--color-text-muted);
    font-size: 0.7rem;
  }

  .runner__summary {
    display: flex;
    gap: 1rem;
    padding: 0.65rem 1rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-muted);
    font-size: 0.72rem;
    color: var(--color-text-muted);
  }

  .runner__stat {
    &.runner__stat--pass { color: var(--color-pass); }
    &.runner__stat--fail { color: var(--color-fail); }

    &.runner__stat--note {
      margin-left: auto;
      font-style: italic;
    }
  }
}

@keyframes runner-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Phones: tighten paddings so the card never pushes past the viewport. */
@media (max-width: 600px) {
  .runner .runner__cmd,
  .runner .runner__stat--note {
    display: none;
  }

  .runner .runner__spec {
    padding-block: 0.35rem;
  }
}
</style>
