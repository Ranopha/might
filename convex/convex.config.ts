import agent from "@convex-dev/agent/convex.config";
import agentmail from "@agentmail/convex/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

// Keep the public app at the root while reserving /api for app-owned HTTP
// routes such as the future AgentMail webhook.
const app = defineApp({
  httpPrefix: "/api",
  env: {
    OPENAI_API_KEY: v.optional(v.string()),
    OPENAI_TEXT_MODEL: v.optional(v.string()),
    OPENAI_IMAGE_MODEL: v.optional(v.string()),
    FIRECRAWL_API_KEY: v.string(),
    AGENTMAIL_INBOX_ID: v.optional(v.string()),
    AGENTMAIL_ALLOWED_RECIPIENTS: v.optional(v.string()),
  },
});
app.use(agent);
app.use(agentmail);
app.use(rateLimiter);
app.use(firecrawl, {
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
  },
});
app.use(staticHosting, { httpPrefix: "/" });

export default app;
