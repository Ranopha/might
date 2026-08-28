import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

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

export default http;
