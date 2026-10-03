import { API_BASE_URL } from "../config/constants";

export interface GiftCardPublicSettings {
  isEnabled: boolean;
  presetAmounts: number[];
  customAmountEnabled: boolean;
  customAmountMin: number;
  customAmountMax: number;
  interac: { email: string | null; recipientName: string | null; instructions: string | null } | null;
  bankDeposit: {
    bankName: string | null;
    accountName: string | null;
    institutionNumber: string | null;
    transitNumber: string | null;
    accountNumber: string | null;
    instructions: string | null;
  } | null;
}

export type GiftCardStatus =
  | "pending_verification"
  | "active"
  | "rejected"
  | "fully_redeemed"
  | "frozen"
  | "void";

export interface GiftCardCheckResult {
  code: string;
  status: GiftCardStatus;
  isLocked: boolean;
  requestedAmount: number;
  approvedAmount: number | null;
  amountAdjusted: boolean;
  rejectionReason: string | null;
  purchasedAt: string;
  activatedAt: string | null;
  pinVerified: boolean;
  balance?: number;
  history?: { type: string; amount: number; balanceAfter: number; date: string }[];
}

export interface GiftCardPurchaseInput {
  amount: number;
  paymentMethod: "interac" | "bank_deposit";
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  isForSelf: boolean;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  slip: { uri: string; name: string; type: string };
}

/** Error carrying HTTP status and whether the card is locked. */
export class GiftCardApiError extends Error {
  status: number;
  locked: boolean;
  constructor(message: string, status: number, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.locked = extra.locked === true || status === 423;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) return res.json();
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error */
  }
  const raw = data.message;
  const message = Array.isArray(raw)
    ? raw.join(". ")
    : typeof raw === "string"
      ? raw
      : res.status === 429
        ? "Too many requests. Please wait a few minutes and try again."
        : "Something went wrong. Please try again.";
  throw new GiftCardApiError(message, res.status, data);
}

export const giftCardsService = {
  getSettings: () =>
    fetch(`${API_BASE_URL}/giftcards/settings`).then((r) => handle<GiftCardPublicSettings>(r)),

  purchase: (input: GiftCardPurchaseInput) => {
    const form = new FormData();
    form.append("amount", String(input.amount));
    form.append("paymentMethod", input.paymentMethod);
    form.append("buyerName", input.buyerName);
    form.append("buyerEmail", input.buyerEmail);
    form.append("buyerPhone", input.buyerPhone);
    form.append("isForSelf", String(input.isForSelf));
    if (!input.isForSelf) {
      form.append("recipientName", input.recipientName ?? "");
      form.append("recipientEmail", input.recipientEmail ?? "");
    }
    if (input.message) form.append("message", input.message);
    // React Native FormData file shape
    form.append("slip", input.slip as unknown as Blob);
    return fetch(`${API_BASE_URL}/giftcards/purchase`, { method: "POST", body: form }).then((r) =>
      handle<{ code: string; status: GiftCardStatus; amount: number; message: string }>(r),
    );
  },

  check: (code: string, pin?: string) =>
    fetch(`${API_BASE_URL}/giftcards/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pin ? { code, pin } : { code }),
    }).then((r) => handle<GiftCardCheckResult>(r)),
};

export const GIFT_CARD_CODE_RE = /^BPGC-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** "bpgc 7k3m q9xa" → "BPGC-7K3M-Q9XA" */
export function normalizeGiftCardCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("BPGC") ? raw.slice(4) : raw;
  if (body.length !== 8) return input.trim().toUpperCase();
  return `BPGC-${body.slice(0, 4)}-${body.slice(4)}`;
}
