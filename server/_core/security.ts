import type { NextFunction, Request, Response } from "express";

const HTTPS_REDIRECT_STATUS = 308;

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
  next();
}
