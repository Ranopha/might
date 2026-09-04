# Companion identity and user-owned OpenAI boundary v1

## Product decision

Might still opens with the house companion: the warm paper-and-leaf orb named
`Might`. It works immediately through the hackathon sponsor allowance. A
personal OpenAI key is an optional advanced setting, never an onboarding gate
and never a fifth primary surface.

The Settings drawer now supports a real user-owned OpenAI connection. Because
an anonymous browser token is not strong enough to own a paid credential, the
key controls appear only after a Convex Auth account is created or signed in.
This first slice uses the stable email-and-password provider with a 12-character
minimum. It does not claim email verification or password recovery.

## User experience

1. **Meet the house Mighty.** Talk, Me, Might Found, and Connections remain
   available without account setup.
2. **Open AI access in Settings.** Guest mode clearly reports that the
   hackathon OpenAI allowance is active.
3. **Create or sign in to a private Might account.** The current browser room
   is linked to that authenticated account and cannot be claimed by another
   account.
4. **Paste a dedicated OpenAI project key.** The form warns that verification
   makes one small Responses request on the user's OpenAI billing.
5. **Verify and seal.** A same-origin server endpoint verifies the configured
   text model, encrypts the key, and returns only last-four and receipt
   metadata.
6. **Use, rotate, or delete.** OpenAI work begun while that account is signed
   in binds the current credential ID and version. `Verify & replace` rotates
   it in place; `Delete key` removes only the encrypted credential.
7. **Sign out safely.** New work returns to hackathon sponsor mode. A claimed
   anonymous room alone is never enough to spend through the personal key.

## Implemented security boundary

OpenAI keys are secrets and are not placed in source, browser storage, Convex
function arguments, analytics, screenshots, or public build evidence. The
implemented path is:

`password input → same-origin /api HTTP action → tiny OpenAI verification → AES-256-GCM → dedicated Convex credential table`

Controls in this slice:

- authenticated Convex user identity is required before collection;
- the browser input is uncontrolled and cleared after every save attempt;
- production transport is same-origin HTTPS; local Vite and preview proxy only
  `/api` to the configured Convex site;
- the raw key is accepted only by an HTTP action, not a logged Convex action
  argument;
- AES-GCM additional authenticated data binds ciphertext to both user ID and
  credential version;
- the encryption master key lives only in Convex environment configuration;
- the client can read email, last-four, verified model, timestamps, and status,
  but can never read ciphertext or plaintext;
- an internal provider resolver fails closed when the credential, version, or
  encryption key is missing;
- hourly and daily per-account BYOK limits are consumed before an OpenAI job is
  scheduled;
- account ownership is checked again on store, rotate, delete, and room claim;
- another authenticated user cannot claim an already-linked room or overwrite
  its credential;
- deleting a key preserves the companion, messages, memories, matches, and
  connection history.

The stable Convex Auth release was selected for the hackathon path. The
available passkey implementation was alpha/WIP at implementation time and was
not introduced into the critical demo path.

## OpenAI coverage

The bound user credential is used by every current OpenAI seam:

- companion art brief and image generation;
- Talk reply and living-memory extraction;
- Firecrawl result interpretation;
- serendipity match judgment;
- clarification re-judgment;
- contextual outreach draft generation.

Firecrawl crawling and AgentMail delivery continue to use Might's server-side
integration credentials. BYOK does not authorize external outreach, expose a
private memory, or bypass the existing exact-payload consent record.

## Verification and maturity

- AES-GCM round-trip, wrong-user/wrong-version failure, cross-account room
  rejection, credential ownership, signed-in binding, signed-out fallback, and
  delete-with-data-preservation are covered by deterministic tests.
- Convex schema, Auth routes, vault functions, and OpenAI resolver are active in
  development deployment `vibrant-wren-913`.
- Guest Settings UI was visually checked at desktop and 390 px; the browser
  warning/error log was empty.
- The unauthenticated credential endpoint returned `401` without touching
  OpenAI.
- No personal key was supplied and no live BYOK OpenAI verification request was
  made during implementation.
- Production `hushed-stork-401` remains unchanged until the owner explicitly
  approves the backend, auth environment, vault master key, and static release.

Current maturity: **implemented and locally/development verified; personal-key
provider verification and production release await owner action**.

## References

- [Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [OpenAI API authentication](https://platform.openai.com/docs/api-reference/authentication)
- [Create or manage API keys](https://platform.openai.com/api-keys)
