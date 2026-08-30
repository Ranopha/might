/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abuseProtection from "../abuseProtection.js";
import type * as agentMailInbound from "../agentMailInbound.js";
import type * as agentMailOutbound from "../agentMailOutbound.js";
import type * as connectionPitchOpenai from "../connectionPitchOpenai.js";
import type * as connections from "../connections.js";
import type * as http from "../http.js";
import type * as manifestation from "../manifestation.js";
import type * as manifestationOpenai from "../manifestationOpenai.js";
import type * as matchClarificationJudge from "../matchClarificationJudge.js";
import type * as matchClarifications from "../matchClarifications.js";
import type * as matchJudge from "../matchJudge.js";
import type * as matches from "../matches.js";
import type * as memories from "../memories.js";
import type * as talk from "../talk.js";
import type * as talkOpenai from "../talkOpenai.js";
import type * as worldSensor from "../worldSensor.js";
import type * as worldSignals from "../worldSignals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  abuseProtection: typeof abuseProtection;
  agentMailInbound: typeof agentMailInbound;
  agentMailOutbound: typeof agentMailOutbound;
  connectionPitchOpenai: typeof connectionPitchOpenai;
  connections: typeof connections;
  http: typeof http;
  manifestation: typeof manifestation;
  manifestationOpenai: typeof manifestationOpenai;
  matchClarificationJudge: typeof matchClarificationJudge;
  matchClarifications: typeof matchClarifications;
  matchJudge: typeof matchJudge;
  matches: typeof matches;
  memories: typeof memories;
  talk: typeof talk;
  talkOpenai: typeof talkOpenai;
  worldSensor: typeof worldSensor;
  worldSignals: typeof worldSignals;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
