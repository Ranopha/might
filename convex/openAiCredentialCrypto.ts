const KEY_BYTES = 32;
const IV_BYTES = 12;
const ENCODING = "might-openai-credential:v1";

function decodeBase64(value: string): Uint8Array {
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new Error("OPENAI_BYOK_ENCRYPTION_KEY must be base64 encoded.");
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function ownedBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

async function importMasterKey(encodedKey: string): Promise<CryptoKey> {
  const bytes = decodeBase64(encodedKey);
  if (bytes.byteLength !== KEY_BYTES) {
    throw new Error("OPENAI_BYOK_ENCRYPTION_KEY must contain exactly 32 bytes.");
  }
  return await crypto.subtle.importKey(
    "raw",
    ownedBuffer(bytes),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

function additionalData(userId: string, version: number): Uint8Array {
  return new TextEncoder().encode(`${ENCODING}:${userId}:${version}`);
}

export async function encryptOpenAiApiKey(args: {
  apiKey: string;
  encodedMasterKey: string;
  userId: string;
  version: number;
}): Promise<{ ciphertext: string; iv: string }> {
  const key = await importMasterKey(args.encodedMasterKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = new TextEncoder().encode(args.apiKey);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ownedBuffer(iv),
      additionalData: ownedBuffer(additionalData(args.userId, args.version)),
    },
    key,
    ownedBuffer(plaintext),
  );
  plaintext.fill(0);
  return {
    ciphertext: encodeBase64(new Uint8Array(encrypted)),
    iv: encodeBase64(iv),
  };
}

export async function decryptOpenAiApiKey(args: {
  ciphertext: string;
  iv: string;
  encodedMasterKey: string;
  userId: string;
  version: number;
}): Promise<string> {
  const key = await importMasterKey(args.encodedMasterKey);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ownedBuffer(decodeBase64(args.iv)),
      additionalData: ownedBuffer(additionalData(args.userId, args.version)),
    },
    key,
    ownedBuffer(decodeBase64(args.ciphertext)),
  );
  return new TextDecoder().decode(decrypted);
}
