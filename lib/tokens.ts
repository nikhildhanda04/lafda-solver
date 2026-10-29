import { createHash, randomBytes } from "node:crypto";

/** Unguessable party link token. 32 bytes = 256 bits of entropy. */
export const newToken = () => randomBytes(32).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
