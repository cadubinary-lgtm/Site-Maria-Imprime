export type PixExpirationState = {
  label: string;
  expired: boolean;
  expiresAtMs: number | null;
};

export function getPixExpirationState(expiresAt: string | null | undefined, now = Date.now()): PixExpirationState {
  if (!expiresAt) return { label: "Validade não informada", expired: false, expiresAtMs: null };
  const normalized = String(expiresAt).trim();
  const expiresAtMs = /^\d+$/.test(normalized) ? Number(normalized) : new Date(normalized).getTime();
  if (!Number.isFinite(expiresAtMs)) return { label: "Validade não informada", expired: false, expiresAtMs: null };
  const remaining = expiresAtMs - now;
  if (remaining <= 0) return { label: "Pix expirado", expired: true, expiresAtMs };
  const secondsTotal = Math.ceil(remaining / 1000);
  const days = Math.floor(secondsTotal / 86400);
  const hours = Math.floor((secondsTotal % 86400) / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;
  const label = days > 0
    ? `Expira em ${days}d ${hours}h`
    : hours > 0
      ? `Expira em ${hours}h ${minutes}min`
      : `Expira em ${minutes}min ${String(seconds).padStart(2, "0")}s`;
  return { label, expired: false, expiresAtMs };
}
