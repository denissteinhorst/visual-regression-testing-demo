<script setup>
import { ref } from 'vue'

/**
 * Top navigation. The links are decorative (single-page demo), but the
 * active state is real so tests can assert class changes on interaction.
 */
const navItems = ['Suites', 'Snapshots', 'CI Runs', 'Docs']
const activeItem = ref('Suites')

const selectItem = (item) => {
  activeItem.value = item
}
</script>

<template>
  <header class="header" data-testid="header">
    <div class="header__inner">
      <a class="header__brand" href="#" data-testid="brand">
        <!-- Crosshair mark: a nod to pixel-diffing. Inline SVG keeps us dependency-free. -->
        <svg class="header__logo" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M12 1v6M12 17v6M1 12h6M17 12h6" stroke="currentColor" stroke-width="2" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
        <span class="header__name">SpecTrail</span>
        <span class="header__version">v1.0</span>
      </a>

      <nav class="header__nav" aria-label="Main" data-testid="main-nav">
        <button
          v-for="item in navItems"
          :key="item"
          class="header__link"
          :class="{ 'header__link--active': item === activeItem }"
          :data-testid="`nav-${item.toLowerCase().replace(' ', '-')}`"
          @click="selectItem(item)"
        >
          {{ item }}
        </button>
      </nav>

      <a class="header__action" href="#" data-testid="header-action">
        <span class="header__action-dot" aria-hidden="true"></span>
        CI passing
      </a>
    </div>
  </header>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--color-border);
  background: rgb(255 255 255 / 0.8);
  backdrop-filter: blur(8px);

  .header__inner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    width: min(1200px, 100%);
    margin-inline: auto;
    padding: 0.75rem clamp(1rem, 4vw, 2.5rem);
  }

  .header__brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .header__logo {
    width: 22px;
    height: 22px;
    color: var(--color-accent);
  }

  .header__version {
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 600;
  }

  .header__nav {
    display: flex;
    gap: 0.25rem;
    margin-inline: auto;
  }

  .header__link {
    padding: 0.4rem 0.85rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
      color: var(--color-text);
    }

    &.header__link--active {
      background: var(--color-accent-soft);
      color: var(--color-accent-strong);
    }
  }

  .header__action {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 600;
    transition: border-color 0.15s ease;

    &:hover {
      border-color: var(--color-accent);
    }
  }

  .header__action-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-pass);
    box-shadow: 0 0 0 3px rgb(16 185 129 / 0.15);
  }
}

/* Tablet & below: nav collapses first, then the CI badge label. */
@media (max-width: 900px) {
  .header .header__nav {
    display: none;
  }

  .header .header__action {
    margin-left: auto;
  }
}

@media (max-width: 600px) {
  .header .header__version {
    display: none;
  }
}
</style>
