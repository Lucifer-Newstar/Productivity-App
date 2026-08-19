/** Security control for pairing handling. */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { SessionPermissions } from "../contracts/protocol.js";

interface SessionRecord { tokenHash: Buffer; expiresAt: number; permissions: SessionPermissions }

function hash(value: string): Buffer { return createHash("sha256").update(value).digest(); }
function equal(a: Buffer, b: Buffer): boolean { return a.length === b.length && timingSafeEqual(a, b); }

export class PairingManager {
  readonly pairingCode: string;
  private readonly pairingHash: Buffer;
  private pairingUsed = false;
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly pairingTtlMs: number, private readonly sessionTtlMs: number, private readonly createdAt = Date.now()) {
    this.pairingCode = randomBytes(18).toString("base64url");
    this.pairingHash = hash(this.pairingCode);
  }

  pair(code: string, now = Date.now()): { token: string; expiresAt: number; permissions: SessionPermissions } | null {
    if (this.pairingUsed || now > this.createdAt + this.pairingTtlMs || !equal(hash(code), this.pairingHash)) return null;
    this.pairingUsed = true;
    const token = randomBytes(32).toString("base64url"), tokenHash = hash(token), id = tokenHash.toString("hex"), expiresAt = now + this.sessionTtlMs;
    const permissions: SessionPermissions = { mode: "local", domains: ["core", "notifications"], healthConsent: false, tools: ["get_today"] };
    this.sessions.set(id, { tokenHash, expiresAt, permissions });
    return { token, expiresAt, permissions };
  }

  authorize(token: string, now = Date.now()): SessionRecord | null {
    const supplied = hash(token), id = supplied.toString("hex"), session = this.sessions.get(id);
    if (!session || session.expiresAt <= now || !equal(supplied, session.tokenHash)) { if (session) this.sessions.delete(id); return null; }
    return session;
  }

  revoke(token: string): boolean { return this.sessions.delete(hash(token).toString("hex")); }
  cleanup(now = Date.now()): void { for (const [id, session] of this.sessions) if (session.expiresAt <= now) this.sessions.delete(id); }
}
