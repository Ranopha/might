import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { abuseProtection } from "./abuseProtection";

export type OpenAiCredentialBinding =
  | {
      openAiCredentialSource: "hackathon_demo";
      openAiCredentialId?: undefined;
      openAiCredentialVersion?: undefined;
    }
  | {
      openAiCredentialSource: "user_supplied";
      openAiCredentialId: Id<"openAiCredentials">;
      openAiCredentialVersion: number;
    };

export async function selectOpenAiCredential(
  ctx: MutationCtx,
  session: Pick<Doc<"anonymousSessions">, "_id" | "ownerUserId">,
): Promise<OpenAiCredentialBinding> {
  const userId = await getAuthUserId(ctx);
  if (userId === null || session.ownerUserId !== userId) {
    return { openAiCredentialSource: "hackathon_demo" };
  }

  const credential = await ctx.db
    .query("openAiCredentials")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (credential === null) {
    return { openAiCredentialSource: "hackathon_demo" };
  }

  const hourly = await abuseProtection.limit(ctx, "openAiByokHourly", {
    key: userId,
  });
  const daily = await abuseProtection.limit(ctx, "openAiByokDaily", {
    key: userId,
  });
  if (!hourly.ok || !daily.ok) {
    throw new ConvexError(
      "Your personal OpenAI usage limit is resting. Try again after the limit resets.",
    );
  }

  return {
    openAiCredentialSource: "user_supplied",
    openAiCredentialId: credential._id,
    openAiCredentialVersion: credential.version,
  };
}
