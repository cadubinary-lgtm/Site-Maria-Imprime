import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Melhor Envio OAuth2 Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate correct authorization URL for production', async () => {
      const { generateAuthorizationUrl } = await import('./melhorenvio-oauth');
      
      const url = generateAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'https://www.mariaimprime.com.br/api/melhorenvio/callback',
        sandbox: false,
      });

      expect(url).toContain('https://melhorenvio.com.br/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('scope=');
    });

    it('should generate sandbox authorization URL when sandbox is true', async () => {
      const { generateAuthorizationUrl } = await import('./melhorenvio-oauth');
      
      const url = generateAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'https://www.mariaimprime.com.br/api/melhorenvio/callback',
        sandbox: true,
      });

      expect(url).toContain('sandbox.melhorenvio.com.br');
    });

    it('should include state parameter when provided', async () => {
      const { generateAuthorizationUrl } = await import('./melhorenvio-oauth');
      
      const url = generateAuthorizationUrl({
        clientId: 'test-client-id',
        redirectUri: 'https://www.mariaimprime.com.br/api/melhorenvio/callback',
        sandbox: false,
        state: 'test-state-42',
      });

      const urlObj = new URL(url);
      const state = urlObj.searchParams.get('state');
      expect(state).toBe('test-state-42');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 2592000, // 30 days
          token_type: 'Bearer',
        }),
      });

      const { exchangeCodeForTokens } = await import('./melhorenvio-oauth');
      
      const result = await exchangeCodeForTokens({
        code: 'auth-code-123',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'https://www.mariaimprime.com.br/api/melhorenvio/callback',
        sandbox: false,
      });

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(result.expires_in).toBe(2592000);
    });

    it('should throw error when token exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'invalid_client', error_description: 'Client authentication failed' }),
      });

      const { exchangeCodeForTokens } = await import('./melhorenvio-oauth');
      
      await expect(exchangeCodeForTokens({
        code: 'invalid-code',
        clientId: 'wrong-client-id',
        clientSecret: 'wrong-secret',
        redirectUri: 'https://www.mariaimprime.com.br/api/melhorenvio/callback',
        sandbox: false,
      })).rejects.toThrow();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token using refresh token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'refreshed-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 2592000,
          token_type: 'Bearer',
        }),
      });

      const { refreshAccessToken } = await import('./melhorenvio-oauth');
      
      const result = await refreshAccessToken({
        refreshToken: 'old-refresh-token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        sandbox: false,
      });

      expect(result.access_token).toBe('refreshed-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
    });

    it('should use sandbox endpoint when sandbox is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'sandbox-token',
          refresh_token: 'sandbox-refresh',
          expires_in: 2592000,
          token_type: 'Bearer',
        }),
      });

      const { refreshAccessToken } = await import('./melhorenvio-oauth');
      
      await refreshAccessToken({
        refreshToken: 'sandbox-refresh-token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        sandbox: true,
      });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('sandbox.melhorenvio.com.br');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return not_connected status for carrier without tokens', async () => {
      const { getConnectionStatus } = await import('./melhorenvio-oauth');
      
      const status = getConnectionStatus({
        melhorEnvioAccessToken: null,
        melhorEnvioRefreshToken: null,
        melhorEnvioAccessTokenExpiresAt: null,
        melhorEnvioRefreshTokenExpiresAt: null,
      });

      expect(status.status).toBe('not_connected');
    });

    it('should return connected status for carrier with valid token', async () => {
      const { getConnectionStatus } = await import('./melhorenvio-oauth');
      
      const futureMs = Date.now() + 86400000; // 1 day from now
      const status = getConnectionStatus({
        melhorEnvioAccessToken: 'valid-token',
        melhorEnvioRefreshToken: 'valid-refresh',
        melhorEnvioAccessTokenExpiresAt: futureMs,
        melhorEnvioRefreshTokenExpiresAt: futureMs * 45,
      });

      expect(status.status).toBe('connected');
    });

    it('should return token_expired status when access token is expired but refresh token is valid', async () => {
      const { getConnectionStatus } = await import('./melhorenvio-oauth');
      
      const pastMs = Date.now() - 1000; // expired
      const futureMs = Date.now() + 86400000 * 45; // valid
      const status = getConnectionStatus({
        melhorEnvioAccessToken: 'expired-token',
        melhorEnvioRefreshToken: 'valid-refresh',
        melhorEnvioAccessTokenExpiresAt: pastMs,
        melhorEnvioRefreshTokenExpiresAt: futureMs,
      });

      expect(status.status).toBe('token_expired');
    });
  });
});
