# Visual regression test runner.
#
# The one and only render environment for this project — baselines and
# comparisons both come out of this image, so engines never vary.
#
# Two modes, same image:
#   compare:     npm run ci:test  (what the pipeline runs)
#     → every *.visual.spec.ts against the deployed prod site (the default).
#   re-baseline: npm run ci:test:update  (dev server must run with --host)
#     → renders the LOCAL code (via BASE_URL=host.docker.internal) with
#       --update-snapshots; ./tests is volume-mounted, so fresh baselines
#       land on the host, ready to commit alongside the change.

# Playwright's official image ships all render engines (Chromium, Firefox,
# WebKit) pre-installed. The tag MUST match @playwright/test in package.json —
# on a mismatch the runner won't find its browsers and aborts.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

# Dependencies first, on their own layer: test/config edits won't bust
# the npm ci cache on rebuilds.
COPY package.json package-lock.json ./
RUN npm ci

# Everything a test run needs — specs, committed baselines, and the config.
COPY playwright.config.ts ./
COPY tests ./tests

# Marks the run as CI for Playwright (stricter defaults, no interactivity).
ENV CI=1

# Compare mode by default; arguments appended to `docker run` replace this.
CMD ["npx", "playwright", "test"]
