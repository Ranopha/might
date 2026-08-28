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
  },
});
app.use(staticHosting, { httpPrefix: "/" });

export default app;
