/**
 * Macro provider via FRED (Federal Reserve Economic Data).
 * Requires FRED_API_KEY (free at fred.stlouisfed.org/docs/api).
 * Returns time series observations: seriesId, date, value.
 */

export interface MacroObservation {
  seriesId: string;
  date: string; // YYYY-MM-DD
  value: number | null;
}

export interface MacroProvider {
  readonly name: string;
  /** Fetch observations for series IDs over a date range. */
  getObservations(seriesIds: string[], range: { from: string; to?: string }): Promise<MacroObservation[]>;
}

export class MacroError extends Error {
  readonly provider: string;
  readonly seriesId?: string;

  constructor(message: string, opts: { provider: string; seriesId?: string; cause?: unknown }) {
    super(message, { cause: opts.cause });
    this.name = "MacroError";
    this.provider = opts.provider;
    this.seriesId = opts.seriesId;
  }
}

export type FredClient = {
  series(seriesId: string, options: object): Promise<Record<string, unknown>>;
  data(seriesId: string, options: object): Promise<{ observations: Array<{ date: string; value: string | null }> }>;
};

export class FredMacroProvider implements MacroProvider {
  readonly name = "fred";
  private apiKey: string;
  private client: FredClient;

  constructor(apiKey?: string, client?: FredClient) {
    this.apiKey = apiKey ?? process.env.FRED_API_KEY ?? "";
    if (!this.apiKey) throw new MacroError("FRED_API_KEY not set", { provider: "fred" });
    this.client = client ?? createFredClient(this.apiKey);
  }

  async getObservations(seriesIds: string[], range: { from: string; to?: string }): Promise<MacroObservation[]> {
    if (seriesIds.length === 0) return [];
    const result: MacroObservation[] = [];

    for (const id of seriesIds) {
      let data: { observations: Array<{ date: string; value: string | null }> };
      try {
        data = await this.client.data(id, { observation_start: range.from, observation_end: range.to });
      } catch (cause) {
        throw new MacroError(`data request failed for ${id}`, { provider: this.name, seriesId: id, cause });
      }

      for (const obs of data.observations) {
        result.push({
          seriesId: id,
          date: obs.date,
          value: obs.value ? parseFloat(obs.value) : null,
        });
      }
    }
    return result;
  }
}

function createFredClient(apiKey: string): FredClient {
  const base = "https://api.stlouisfed.org/fred";
  return {
    async series(id: string, options: object) {
      const params = new URLSearchParams({ ...options, api_key: apiKey } as Record<string, string>);
      const res = await fetch(`${base}/series?id=${id}&${params}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    async data(id: string, options: object) {
      const params = new URLSearchParams({ ...options, api_key: apiKey } as Record<string, string>);
      const res = await fetch(`${base}/series/observations?series_id=${id}&${params}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
  };
}
