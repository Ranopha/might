import { AgentMail } from "@agentmail/convex";
import { httpRouter } from "convex/server";
import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { saveOpenAiCredential } from "./openAiCredentialHttp";

const http = httpRouter();
const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.agentMailInbound.onMessageReceived,
});

auth.addHttpRoutes(http);

const jsonHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
};

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () =>
    new Response(
      JSON.stringify({
        status: "live",
        service: "might-api",
      }),
      { headers: jsonHeaders },
    ),
  ),
});

http.route({
  path: "/openai/credential",
  method: "POST",
  handler: saveOpenAiCredential,
});

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) =>
    agentmail.handleWebhook(
      ctx as unknown as Parameters<typeof agentmail.handleWebhook>[0],
      request,
    ),
  ),
});

export default http;
