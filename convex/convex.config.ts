import staticHosting from "@convex-dev/static-hosting/convex.config";
import { defineApp } from "convex/server";

// Keep the public app at the root while reserving /api for app-owned HTTP
// routes such as the future AgentMail webhook.
const app = defineApp({ httpPrefix: "/api" });
app.use(staticHosting, { httpPrefix: "/" });

export default app;
