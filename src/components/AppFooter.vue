<script setup>
/**
 * Slim footer — static on purpose. The build year is hardcoded rather than
 * `new Date()` so screenshots taken in January don't diff against December.
 */
const links = ['GitHub', 'Changelog', 'License']
</script>

<template>
  <footer class="footer" data-testid="footer">
    <div class="footer__inner">
      <p class="footer__copy">© 2026 SpecTrail — built for testing, not for production.</p>

      <nav class="footer__nav" aria-label="Footer">
        <a
          v-for="link in links"
          :key="link"
          class="footer__link"
          href="#"
          :data-testid="`footer-${link.toLowerCase()}`"
        >
          {{ link }}
        </a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  background: rgb(255 255 255 / 0.8);

  .footer__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: min(1200px, 100%);
    margin-inline: auto;
    padding: 0.75rem clamp(1rem, 4vw, 2.5rem);
  }

  .footer__copy {
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  .footer__nav {
    display: flex;
    gap: 1.25rem;
  }

  .footer__link {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 500;
    transition: color 0.15s ease;

    &:hover {
      color: var(--color-accent-strong);
    }
  }
}

/* Phones: keep the footer to a single unobtrusive line. */
@media (max-width: 600px) {
  .footer .footer__copy {
    display: none;
  }

  .footer .footer__inner {
    justify-content: center;
  }
}
</style>
