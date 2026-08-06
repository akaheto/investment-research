/**
 * Interactive Brokers Client Portal Web API provider.
 * Connects to a Fly.io-hosted IBeam + CPGW instance for read-only account/position data.
 */

import { type BrokerageAccount, type BrokeragePosition, type BrokerageAccountSummary, type BrokerageProvider, ProviderError } from "./types";

export class IBKRBrokerageProvider implements BrokerageProvider {
  readonly name = "ibkr";
  private gatewayUrl: string;
  private gatewaySecret: string;

  constructor(gatewayUrl?: string, gatewaySecret?: string) {
    this.gatewayUrl = gatewayUrl || process.env.IBKR_GATEWAY_URL || "";
    this.gatewaySecret = gatewaySecret || process.env.IBKR_GATEWAY_SECRET || "";

    if (!this.gatewayUrl || !this.gatewaySecret) {
      throw new ProviderError("IBKR_GATEWAY_URL and IBKR_GATEWAY_SECRET are required", {
        provider: this.name,
      });
    }
  }

  private async fetch<T>(endpoint: string, method = "GET"): Promise<T> {
    const url = `${this.gatewayUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.gatewaySecret}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(url, { method, headers });

      if (!response.ok) {
        throw new ProviderError(
          `IBKR API error: ${response.status} ${response.statusText}`,
          { provider: this.name, cause: response },
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(`IBKR fetch failed: ${String(error)}`, {
        provider: this.name,
        cause: error,
      });
    }
  }

  async getAccounts(): Promise<BrokerageAccount[]> {
    const response = await this.fetch<{ accounts: Array<{ accountId: string; accountTitle: string; accountType: string; currency: string }> }>("/portfolio/accounts");

    return (response.accounts || []).map((acc) => ({
      externalId: acc.accountId,
      title: acc.accountTitle,
      type: acc.accountType,
      currency: acc.currency,
    }));
  }

  async getPositions(externalAccountId: string): Promise<BrokeragePosition[]> {
    const response = await this.fetch<{
      positions: Array<{
        conid: number;
        symbol: string;
        description: string;
        assetClass: string;
        position: number;
        avgCost: number | null;
        marketPrice: number | null;
        value: number;
        unrealizedPnl: number | null;
        currency: string;
      }>;
    }>(`/portfolio/${externalAccountId}/positions/0`);

    return (response.positions || []).map((pos) => ({
      symbol: pos.symbol,
      description: pos.description,
      assetClass: pos.assetClass,
      quantity: pos.position,
      avgCost: pos.avgCost,
      marketPrice: pos.marketPrice,
      marketValue: pos.value,
      unrealizedPnl: pos.unrealizedPnl,
      currency: pos.currency,
    }));
  }

  async getAccountSummary(externalAccountId: string): Promise<BrokerageAccountSummary> {
    const response = await this.fetch<{
      accountid: string;
      netliquidation: number | string;
      cashbalance: number | string;
      unrealizedpnl: number | string;
      buyingpower: number | string;
      currency: string;
    }>(`/portfolio/${externalAccountId}/summary`);

    const toNumber = (val: number | string | undefined | null) => (typeof val === "string" ? parseFloat(val) : val ?? null);

    return {
      netLiquidation: toNumber(response.netliquidation) ?? 0,
      cashBalance: toNumber(response.cashbalance),
      totalUnrealizedPnl: toNumber(response.unrealizedpnl),
      buyingPower: toNumber(response.buyingpower),
      currency: response.currency || "USD",
    };
  }
}
