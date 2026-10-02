import { test as base, expect } from '@playwright/test';

// Single-process Chromium cannot safely reuse a browser after its context closes.
// Normal runners retain Playwright's standard fixtures; constrained runners use
// a fresh browser for each test, with the same viewport and request settings.
export const test =
  process.env.PW_SINGLE_PROCESS === '1'
    ? base.extend({
        context: async (
          {
            playwright,
            browserName,
            launchOptions,
            contextOptions,
            viewport,
            baseURL,
            deviceScaleFactor,
            isMobile,
            hasTouch,
          },
          runFixture,
        ) => {
          const browser = await playwright[browserName].launch(launchOptions);
          const context = await browser.newContext({
            ...contextOptions,
            viewport: viewport ?? undefined,
            baseURL,
            deviceScaleFactor,
            isMobile,
            hasTouch,
          });
          await runFixture(context);
          await browser.close();
        },
      })
    : base;
export { expect };
