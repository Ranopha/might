# Companion identity and user-owned OpenAI boundary v1

## Product decision

Might opens with the house companion: the warm paper-and-leaf orb named
`Might`. It works immediately. A person may then shape an original companion
and give it a name without leaving Talk or entering a settings dashboard.

For the hackathon and first-value experience, OpenAI work continues through
Might's server-side project key, existing anonymous-spend limits, and the
one-success-per-session manifestation guard. A personal API key is not a gate
before the user has met the companion, understood the value, or created an
account.

Long-term personal use may offer a user-owned OpenAI connection, but only as
an explicit advanced option after onboarding. The current anonymous web app
must not collect or persist a pasted secret.

## Intended first-run sequence

1. **Meet the house Mighty.** The default orb and name make the room usable
   without setup.
2. **Choose, do not configure.** `Keep this form` starts the private Talk flow.
   `Shape my form` asks for a companion name and a vibe-based visual
   description.
3. **Deliver first value.** The user sees one real OpenAI-generated original
   manifestation saved to Convex.
4. **Explain ownership later.** After the first useful conversation, a quiet
   `Make this Mighty yours` entry may explain usage, cost, privacy, and the
   optional user-owned connection.
5. **Connect or keep the house mode.** Declining the connection never blocks
   Talk, Me, Found, or Connections. The original orb remains a complete
   fallback.

The API guide should therefore feel like a small illustrated handoff, not a
developer console embedded in onboarding:

- why an OpenAI key may be useful;
- what Might will use it for;
- what it will not use it for;
- an official link to create or manage a key;
- a reminder that the key has its own billing and usage;
- a visible disconnect, rotate, and delete path.

## Safety boundary

OpenAI's current guidance says API keys are secrets, should not be exposed in
browser or mobile client code, and should be loaded only on a server from an
environment variable or key-management service:

- [Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [OpenAI API authentication](https://platform.openai.com/docs/api-reference/authentication)
- [Create or manage API keys](https://platform.openai.com/api-keys)

That means Might must not put a personal key in `localStorage`,
`sessionStorage`, a client-side Convex argument, application logs, analytics,
screenshots, source control, or a normal Convex document. A generic anonymous
key-paste form would contradict the intended consumer experience and create a
credential-theft surface.

If user-owned credentials become necessary before OpenAI provides a suitable
delegated connection flow, the minimum acceptable implementation is:

- authenticated user identity before collection;
- an explicit warning that the user is granting Might access to their API
  account and should use a dedicated, revocable project/key;
- TLS transport into a server-only exchange;
- immediate envelope encryption in a dedicated secret vault or KMS;
- no secret value returned to the browser after submission;
- server-side provider calls only;
- redaction from Convex logs, traces, errors, support exports, and hackathon
  evidence;
- a test-connection receipt that stores only key fingerprint/last-four,
  project label, created time, last-used time, and status;
- user-visible rotate, revoke, and delete controls;
- budget/usage guidance and a fail-closed spend cap;
- deletion that removes the credential without deleting the user's companion,
  memories, or connection history.

Until those controls exist, the correct implementation is the current
server-owned demo allowance plus a non-interactive explanation of the future
option. Do not simulate a secure BYOK flow with a decorative input.

## Scope boundary

A user-owned OpenAI key would cover only the OpenAI calls that Might clearly
discloses. It does not silently authorize Firecrawl, AgentMail outreach, or any
release of private memory. The existing consent screen and exact-payload send
approval remain mandatory regardless of who pays for the model call.

This document is a product and security decision, not proof that BYOK has been
implemented. Current maturity: **specified**.
