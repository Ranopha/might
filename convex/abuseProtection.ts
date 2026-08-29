import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// Sponsor-backed work is public for the hackathon demo, so every paid path
// consumes a deployment-wide budget before it allocates durable work.
export const abuseProtection = new RateLimiter(components.rateLimiter, {
  anonymousSessionCreation: {
    kind: "fixed window",
    rate: 30,
    period: HOUR,
  },
  talkBurst: {
    kind: "fixed window",
    rate: 20,
    period: MINUTE,
  },
  talkDaily: {
    kind: "fixed window",
    rate: 200,
    period: DAY,
  },
  talkSessionHourly: {
    kind: "fixed window",
    rate: 12,
    period: HOUR,
  },
  manifestationBurst: {
    kind: "fixed window",
    rate: 3,
    period: MINUTE,
  },
  manifestationDaily: {
    kind: "fixed window",
    rate: 12,
    period: DAY,
  },
});
