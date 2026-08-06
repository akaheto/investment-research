import { describe, it, expect, beforeEach, vi } from "vitest";
import { IBKRBrokerageProvider } from "./ibkr";
import { ProviderError } from "./types";

// Mock fetch globally
global.fetch = vi.fn() as unknown as typeof fetch;

describe("IBKRBrokerageProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.IBKR_GATEWAY_URL = "https://fly.example.com/ibkr";
    process.env.IBKR_GATEWAY_SECRET = "test-secret";
  });

  describe("initialization", () => {
    it("throws if IBKR_GATEWAY_URL is missing", () => {
      delete process.env.IBKR_GATEWAY_URL;
      expect(() => new IBKRBrokerageProvider()).toThrow(ProviderError);
    });

    it("throws if IBKR_GATEWAY_SECRET is missing", () => {
      delete process.env.IBKR_GATEWAY_SECRET;
      expect(() => new IBKRBrokerageProvider()).toThrow(ProviderError);
    });

    it("allows constructor to override env vars", () => {
      const provider = new IBKRBrokerageProvider("https://custom.url", "custom-secret");
      expect(provider.name).toBe("ibkr");
    });
  });

  describe("getAccounts", () => {
    it("returns accounts successfully", async () => {
      const mockResponse = {
        accounts: [
          {
            accountId: "U1234567",
            accountTitle: "Test Account",
            accountType: "INDIVIDUAL",
            currency: "USD",
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const accounts = await provider.getAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0].externalId).toBe("U1234567");
      expect(accounts[0].title).toBe("Test Account");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://fly.example.com/ibkr/portfolio/accounts",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-secret",
          }),
        }),
      );
    });

    it("returns empty array if no accounts", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ accounts: [] }), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const accounts = await provider.getAccounts();

      expect(accounts).toEqual([]);
    });

    it("throws ProviderError on HTTP error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401 }),
      );

      const provider = new IBKRBrokerageProvider();
      await expect(provider.getAccounts()).rejects.toThrow(ProviderError);
    });

    it("throws ProviderError on network failure", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

      const provider = new IBKRBrokerageProvider();
      await expect(provider.getAccounts()).rejects.toThrow(ProviderError);
    });
  });

  describe("getPositions", () => {
    it("returns positions successfully", async () => {
      const mockResponse = {
        positions: [
          {
            conid: 265598,
            symbol: "AAPL",
            description: "Apple Inc",
            assetClass: "stock",
            position: 10,
            avgCost: 150.5,
            marketPrice: 175.2,
            value: 1752,
            unrealizedPnl: 248,
            currency: "USD",
          },
          {
            conid: 756733,
            symbol: "VTSAX",
            description: "Vanguard Total Stock Market",
            assetClass: "etf",
            position: 50,
            avgCost: 120.0,
            marketPrice: 135.5,
            value: 6775,
            unrealizedPnl: 775,
            currency: "USD",
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const positions = await provider.getPositions("U1234567");

      expect(positions).toHaveLength(2);
      expect(positions[0].symbol).toBe("AAPL");
      expect(positions[0].quantity).toBe(10);
      expect(positions[0].marketValue).toBe(1752);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://fly.example.com/ibkr/portfolio/U1234567/positions/0",
        expect.any(Object),
      );
    });

    it("returns empty array if no positions", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ positions: [] }), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const positions = await provider.getPositions("U1234567");

      expect(positions).toEqual([]);
    });

    it("handles null optional fields in positions", async () => {
      const mockResponse = {
        positions: [
          {
            conid: 12087817,
            symbol: "CASH",
            description: "USD Cash",
            assetClass: "cash",
            position: 5000,
            avgCost: null,
            marketPrice: null,
            value: 5000,
            unrealizedPnl: null,
            currency: "USD",
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const positions = await provider.getPositions("U1234567");

      expect(positions[0].avgCost).toBeNull();
      expect(positions[0].unrealizedPnl).toBeNull();
    });

    it("throws ProviderError on HTTP error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Not Found", { status: 404 }),
      );

      const provider = new IBKRBrokerageProvider();
      await expect(provider.getPositions("INVALID")).rejects.toThrow(ProviderError);
    });
  });

  describe("getAccountSummary", () => {
    it("returns account summary successfully", async () => {
      const mockResponse = {
        accountid: "U1234567",
        netliquidation: 50000.5,
        cashbalance: 5000.25,
        unrealizedpnl: 2500.75,
        buyingpower: 100000,
        currency: "USD",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const summary = await provider.getAccountSummary("U1234567");

      expect(summary.netLiquidation).toBe(50000.5);
      expect(summary.cashBalance).toBe(5000.25);
      expect(summary.totalUnrealizedPnl).toBe(2500.75);
      expect(summary.buyingPower).toBe(100000);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://fly.example.com/ibkr/portfolio/U1234567/summary",
        expect.any(Object),
      );
    });

    it("handles string values from API response", async () => {
      const mockResponse = {
        accountid: "U1234567",
        netliquidation: "50000.5",
        cashbalance: "5000.25",
        unrealizedpnl: "2500.75",
        buyingpower: "100000",
        currency: "USD",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const summary = await provider.getAccountSummary("U1234567");

      expect(summary.netLiquidation).toBe(50000.5);
      expect(summary.cashBalance).toBe(5000.25);
    });

    it("handles null optional fields in summary", async () => {
      const mockResponse = {
        accountid: "U1234567",
        netliquidation: 50000,
        cashbalance: null,
        unrealizedpnl: null,
        buyingpower: null,
        currency: "USD",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const provider = new IBKRBrokerageProvider();
      const summary = await provider.getAccountSummary("U1234567");

      expect(summary.cashBalance).toBeNull();
      expect(summary.totalUnrealizedPnl).toBeNull();
      expect(summary.buyingPower).toBeNull();
    });

    it("throws ProviderError on HTTP error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response("Forbidden", { status: 403 }),
      );

      const provider = new IBKRBrokerageProvider();
      await expect(provider.getAccountSummary("U1234567")).rejects.toThrow(ProviderError);
    });
  });
});
