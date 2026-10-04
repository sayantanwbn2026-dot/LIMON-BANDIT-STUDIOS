import { describe, expect, it } from "bun:test";
import { explainNotifyStatus } from "./notify-status";

/**
 * The three states an admin has to be able to tell apart.
 *
 * Every order in the admin reads "Sheet: not synced" until something is
 * configured, and that one line has to mean three different things. The
 * middle case is the one worth a test: webhook set, service key missing, so
 * notifications ARE going out while nothing can record that they did. Read
 * the orders list alone and you would conclude the webhook was broken and go
 * debug a thing that works.
 */
describe("explaining the notification setup", () => {
  it("says nothing was sent when there is no webhook", () => {
    const s = explainNotifyStatus({ webhook: false, secret: false, serviceKey: false });
    expect(s.tone).toBe("bad");
    expect(s.text).toMatch(/not set up/i);
  });

  it("still says nothing was sent when only the service key is present", () => {
    /* A service key without a destination notifies nobody. The missing
     * webhook is the headline, and reporting the lesser problem first would
     * send someone to fix the wrong thing. */
    const s = explainNotifyStatus({ webhook: false, secret: false, serviceKey: true });
    expect(s.tone).toBe("bad");
    expect(s.text).toMatch(/not set up/i);
  });

  it("warns that syncs will look failed when the service key is missing", () => {
    const s = explainNotifyStatus({ webhook: true, secret: true, serviceKey: false });
    expect(s.tone).toBe("warn");
    expect(s.text).toMatch(/not synced/i);
    expect(s.text).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("is happy with a webhook and a service key, secret or not", () => {
    /* The secret is only used by the Google Sheet destination; Slack and
     * Discord webhooks carry their authority in the URL. Demanding it would
     * nag every chat-only setup for ever. */
    for (const secret of [true, false]) {
      const s = explainNotifyStatus({ webhook: true, secret, serviceKey: true });
      expect(s.tone).toBe("ok");
    }
  });

  it("only stays quiet in the ok case", () => {
    /* The banner renders on anything that is not "ok", so this is the
     * contract between the two: every broken combination must be loud. */
    const combos = [
      { webhook: false, secret: false, serviceKey: false },
      { webhook: false, secret: true, serviceKey: true },
      { webhook: true, secret: false, serviceKey: false },
      { webhook: true, secret: true, serviceKey: false },
    ];
    for (const c of combos) expect(explainNotifyStatus(c).tone).not.toBe("ok");
  });
});
