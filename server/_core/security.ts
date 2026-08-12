import type { NextFunction, Request, Response } from "express";

const HTTPS_REDIRECT_STATUS = 308;
const MAX_RATE_LIMIT_KEYS = 10_000;

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function forwardedProtocol(req: Request): string | null {
  const value = req.get("x-forwarded-proto");
  return value?.split(",")[0]?.trim().toLowerCase() || null;
}

export function enforceHttpsInProduction(req: Request, res: Response, next: NextFunction) {
  const protocol = forwardedProtocol(req);
  const shouldEnforce = process.env.NODE_ENV === "production" && protocol !== null;

  if (!shouldEnforce || protocol === "https") {
    return next();
  }

  const host = req.get("host");
  if (!host) {
    return res.status(400).send("Host inválido");
  }

  return res.redirect(HTTPS_REDIRECT_STATUS, `https://${host}${req.originalUrl}`);
}

export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader(
    "Content-Security-Policy-Report-Only",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data: blob: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https: wss:; frame-src 'self' https:; form-action 'self' https:; report-uri /api/security/csp-report"
  );
  next();
}

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Limite de memória deliberadamente pequeno para proteção local por instância.
 * A borda do provedor continua sendo a camada indicada para bloqueio distribuído.
 */
export function createRateLimiter({ windowMs, max, message }: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = getClientKey(req);
    const current = entries.get(key);

    if (!current || current.resetAt <= now) {
      if (entries.size >= MAX_RATE_LIMIT_KEYS) {
        entries.forEach((value, existingKey) => {
          if (value.resetAt <= now) entries.delete(existingKey);
        });
        if (entries.size >= MAX_RATE_LIMIT_KEYS) entries.delete(entries.keys().next().value as string);
      }
      entries.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", Math.max(0, max - 1));
      return next();
    }

    current.count += 1;
    const remaining = Math.max(0, max - current.count);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", Math.ceil(current.resetAt / 1000));

    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ error: message, retryAfter });
    }

    return next();
  };
}

export function isLoginAttempt(req: Request) {
  if (req.method !== "POST") return false;
  const path = req.path;
  return /\/api\/trpc\/(customerAuth\.(login|register|requestPasswordReset)|adminAuth\.(login|requestPasswordReset))/.test(path);
}

export function isPublicUploadRequest(req: Request) {
  if (req.method !== "POST") return false;
  return [
    "/api/upload",
    "/api/upload-art",
    "/api/upload-art-chunk",
    "/api/upload-art-notify",
    "/api/upload-art-preview",
  ].includes(req.path);
}
