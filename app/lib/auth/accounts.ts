/**
 * Nova accounts — SERVER ONLY.
 *
 * An account is keyed by the user's Roqqu email. It owns the wallet ID, the
 * balance (funded through Roqqu payment links, paid out through Roqqu sends)
 * and the activity ledger, so users keep everything when they come back on any
 * device.
 *
 * Storage: a JSON file (`.data/accounts.json`, override with NOVA_DATA_DIR).
 * That is fine for one server process. On serverless hosts the filesystem is
 * ephemeral, so swap `load`/`save` for a real database before going live.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { LedgerEntry } from "@/app/lib/roqqu/types";

export interface Account {
  email: string;
  walletId: string;
  balance: number;
  /** payment references already credited (idempotency) */
  credited: string[];
  entries: LedgerEntry[];
  createdAt: number;
}

/** What the browser is allowed to see. */
export interface PublicAccount {
  signedIn: true;
  email: string;
  walletId: string;
  balance: number;
  entries: LedgerEntry[];
  /** Nova team member: may create public markets. */
  isAdmin: boolean;
}

interface Db {
  accounts: Record<string, Account>;
  /** payment reference → owner email */
  payments: Record<string, string>;
}

const MAX_ENTRIES = 50;
const DIR = process.env.NOVA_DATA_DIR ?? path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "accounts.json");

const g = globalThis as unknown as { __novaDb?: Db };

function load(): Db {
  if (g.__novaDb) return g.__novaDb;
  let db: Db = { accounts: {}, payments: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as Partial<Db>;
    db = { accounts: parsed.accounts ?? {}, payments: parsed.payments ?? {} };
  } catch {
    /* first run */
  }
  g.__novaDb = db;
  return db;
}

function save() {
  const db = load();
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, FILE);
  } catch {
    /* keep serving from memory if the disk is read-only */
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 254;
}

/** Stable wallet ID derived from the email, e.g. RQW-7K2M9XQA. */
export function walletIdFor(email: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const hash = crypto.createHash("sha256").update(`nova:${email}`).digest();
  let id = "";
  for (let i = 0; i < 8; i++) id += alphabet[hash[i] % alphabet.length];
  return `RQW-${id}`;
}

function entry(
  type: LedgerEntry["type"],
  amountUsd: number,
  label: string
): LedgerEntry {
  return {
    id: `${type}-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
    type,
    amountUsd,
    label,
    at: Date.now(),
  };
}

export function getOrCreateAccount(rawEmail: string): Account {
  const email = normalizeEmail(rawEmail);
  const db = load();
  let account = db.accounts[email];
  if (!account) {
    account = {
      email,
      walletId: walletIdFor(email),
      balance: 0,
      credited: [],
      entries: [],
      createdAt: Date.now(),
    };
    db.accounts[email] = account;
    save();
  }
  return account;
}

export function getAccount(rawEmail: string): Account | null {
  return load().accounts[normalizeEmail(rawEmail)] ?? null;
}

/**
 * Nova team emails (comma-separated NOVA_ADMIN_EMAILS). Only admins may create
 * public markets; everyone else can create private, invite-only ones.
 * Call this wherever a market is actually created (server or contract side).
 */
export function isAdminEmail(rawEmail: string): boolean {
  const email = normalizeEmail(rawEmail);
  return (process.env.NOVA_ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean)
    .includes(email);
}

export function toPublic(account: Account): PublicAccount {
  return {
    signedIn: true,
    email: account.email,
    walletId: account.walletId,
    balance: account.balance,
    entries: account.entries,
    isAdmin: isAdminEmail(account.email),
  };
}

/** Remember who a payment reference belongs to, so the webhook can credit them. */
export function registerPayment(reference: string, rawEmail: string) {
  load().payments[reference] = normalizeEmail(rawEmail);
  save();
}

/** Credit a completed Roqqu payment to its owner, once. */
export function creditPayment(reference: string, amountUsd: number): boolean {
  const db = load();
  const email = db.payments[reference];
  if (!email || !(amountUsd > 0)) return false;
  const account = db.accounts[email];
  if (!account || account.credited.includes(reference)) return false;
  account.balance = round2(account.balance + amountUsd);
  account.credited.push(reference);
  account.entries = [
    entry("fund", amountUsd, `Roqqu deposit ${reference.slice(0, 8)}`),
    ...account.entries,
  ].slice(0, MAX_ENTRIES);
  save();
  return true;
}

export type SpendResult =
  | { ok: true; account: Account }
  | { ok: false; error: string };

/** Debit the balance (bet or cash out). Fails if the balance is too low. */
export function spend(
  rawEmail: string,
  amountUsd: number,
  meta: { type: "bet" | "withdraw"; label: string }
): SpendResult {
  const account = getAccount(rawEmail);
  if (!account) return { ok: false, error: "Account not found." };
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { ok: false, error: "Enter an amount greater than zero." };
  }
  const amount = round2(amountUsd);
  if (account.balance < amount) {
    return {
      ok: false,
      error: `Insufficient Nova balance ($${account.balance.toFixed(2)}). Add funds with Roqqu to trade.`,
    };
  }
  account.balance = round2(account.balance - amount);
  account.entries = [
    entry(meta.type, -amount, meta.label),
    ...account.entries,
  ].slice(0, MAX_ENTRIES);
  save();
  return { ok: true, account };
}

/** Put money back (a cash out Roqqu rejected after we debited). */
export function refund(rawEmail: string, amountUsd: number, label: string) {
  const account = getAccount(rawEmail);
  if (!account || !(amountUsd > 0)) return;
  account.balance = round2(account.balance + amountUsd);
  account.entries = [entry("fund", amountUsd, label), ...account.entries].slice(
    0,
    MAX_ENTRIES
  );
  save();
}

/* ------------------------------------------------------------------ */
/* One-time codes (email sign-in)                                       */
/* ------------------------------------------------------------------ */

interface Otp {
  hash: string;
  expires: number;
  attempts: number;
  sentAt: number;
}

const otpStore = globalThis as unknown as { __novaOtps?: Map<string, Otp> };
const otps = (otpStore.__novaOtps ??= new Map<string, Otp>());

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 30 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const hashCode = (email: string, code: string) =>
  crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");

export function issueOtp(
  rawEmail: string
): { ok: true; code: string } | { ok: false; error: string } {
  const email = normalizeEmail(rawEmail);
  const existing = otps.get(email);
  const now = Date.now();
  if (existing && now - existing.sentAt < OTP_RESEND_MS) {
    const wait = Math.ceil((OTP_RESEND_MS - (now - existing.sentAt)) / 1000);
    return { ok: false, error: `Wait ${wait}s before asking for another code.` };
  }
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  otps.set(email, {
    hash: hashCode(email, code),
    expires: now + OTP_TTL_MS,
    attempts: 0,
    sentAt: now,
  });
  return { ok: true, code };
}

export function checkOtp(rawEmail: string, rawCode: string): boolean {
  const email = normalizeEmail(rawEmail);
  const otp = otps.get(email);
  if (!otp || Date.now() > otp.expires) {
    otps.delete(email);
    return false;
  }
  otp.attempts += 1;
  if (otp.attempts > OTP_MAX_ATTEMPTS) {
    otps.delete(email);
    return false;
  }
  const given = Buffer.from(hashCode(email, rawCode.trim()));
  const wanted = Buffer.from(otp.hash);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
    return false;
  }
  otps.delete(email);
  return true;
}
