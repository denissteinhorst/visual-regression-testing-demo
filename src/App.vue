<script setup>
/**
 * App shell — owns the viewport-locked layout (header / hero+runner / footer).
 * Intentionally near-stateless: all interactivity lives in the leaf
 * components, which keeps this file a pure composition root.
 */
import AppHeader from './components/AppHeader.vue'
import TestRunner from './components/TestRunner.vue'
import AppFooter from './components/AppFooter.vue'

// Hero key figures — data-driven like every other list on the page.
const heroFacts = [
  { value: '3', label: 'browsers' },
  { value: '0.1s', label: 'avg. spec' },
  { value: '100%', label: 'deterministic' },
]
</script>

<template>
  <div class="app" data-testid="app">
    <AppHeader />

    <main class="app__main">
      <!-- Left column: static marketing copy. Deterministic by design —
           this page doubles as a stable baseline for visual regression tests. -->
      <section class="app__hero hero" data-testid="hero">
        <p class="hero__eyebrow">Visual Regression · Demo</p>

        <h1 class="hero__title">
          Ship <span class="hero__highlight">pixel-perfect</span>,<br />
          every single deploy.
        </h1>

        <p class="hero__lead">
          A tiny Vue&nbsp;3 playground built as a stable target for Playwright
          end-to-end and screenshot tests. No backend, no noise — just
          predictable UI.
        </p>

        <div class="hero__actions">
          <a class="hero__cta" href="#" data-testid="cta-primary">Get started</a>
          <a class="hero__cta hero__cta--ghost" href="#" data-testid="cta-secondary">
            <code>npx playwright test</code>
          </a>
        </div>

        <ul class="hero__facts" data-testid="hero-facts">
          <li v-for="fact in heroFacts" :key="fact.label" class="hero__fact">
            <strong>{{ fact.value }}</strong>
            <span>{{ fact.label }}</span>
          </li>
        </ul>
      </section>

      <!-- Right column: the single interactive component of this demo. -->
      <section class="app__stage">
        <TestRunner />
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  /* dvh keeps mobile browser chrome from causing overflow; vh is the fallback. */
  height: 100vh;
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;

  /* Nuxt-style ambience: faint dot grid + a single sky glow behind the stage. */
  background-image:
    radial-gradient(ellipse 60% 50% at 75% 40%, rgb(14 165 233 / 0.09), transparent 70%),
    radial-gradient(circle, var(--color-border) 1px, transparent 1px);
  background-size: 100% 100%, 28px 28px;

  .app__main {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: center;
    gap: clamp(1.5rem, 4vw, 5rem);
    width: min(1200px, 100%);
    margin-inline: auto;
    padding-inline: clamp(1rem, 4vw, 2.5rem);
    min-height: 0; /* allow the 1fr row to shrink instead of overflowing */

    /* Tablet: stack the columns, center the copy, stay inside 100vh. */
    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      align-content: center;
      gap: 1.5rem;
      text-align: center;
    }
  }

  .app__stage {
    min-width: 0;
  }
}

.hero {
  .hero__eyebrow {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--color-accent-soft);
    border-radius: 999px;
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .hero__title {
    margin-top: 1rem;
    font-size: clamp(1.75rem, 4.5vw, 3.25rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .hero__highlight {
    background: linear-gradient(90deg, var(--color-accent-strong), var(--color-accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .hero__lead {
    margin-top: 1rem;
    max-width: 42ch;
    color: var(--color-text-muted);
    font-size: clamp(0.9rem, 1.4vw, 1.05rem);
    line-height: 1.6;

    @media (max-width: 900px) {
      margin-inline: auto;
    }
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;

    @media (max-width: 900px) {
      justify-content: center;
    }

    /* Phones & short viewports: tighten up to guarantee no scroll. */
    @media (max-width: 600px), (max-height: 700px) and (max-width: 900px) {
      margin-top: 1rem;
    }
  }

  .hero__cta {
    display: inline-flex;
    align-items: center;
    padding: 0.6rem 1.25rem;
    border-radius: var(--radius-md);
    background: var(--color-accent);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    transition: background-color 0.15s ease, transform 0.15s ease;

    &:hover {
      background: var(--color-accent-strong);
      transform: translateY(-1px);
    }

    &.hero__cta--ghost {
      background: var(--color-bg-muted);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      font-family: var(--font-mono);
      font-weight: 500;

      &:hover {
        border-color: var(--color-accent);
        background: var(--color-bg-muted);
      }
    }
  }

  .hero__facts {
    display: flex;
    gap: 2rem;
    margin-top: 2rem;
    padding: 0;
    list-style: none;

    @media (max-width: 900px) {
      justify-content: center;
    }

    /* Phones & short viewports: secondary content yields to the no-scroll rule. */
    @media (max-width: 600px), (max-height: 700px) and (max-width: 900px) {
      display: none;
    }
  }

  .hero__fact {
    display: grid;
    gap: 0.1rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);

    strong {
      font-size: 1.25rem;
      color: var(--color-text);
      letter-spacing: -0.01em;
    }
  }
}
</style>
