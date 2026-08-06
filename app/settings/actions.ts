"use server";

import { db, getRawClient } from "@/db/client";
import { accounts, instruments, watchlist, holdings, planMenu, proxyMap } from "@/db/schema";
import { seedTransamericaFunds, loadMainAccountHoldings, loadManagementStaffIRAHoldings } from "@/app/portfolio/fund-actions";
import { eq, inArray } from "drizzle-orm";

/**
 * Create Main 403b account and load holdings
 */
export async function setupMainAccount() {
  try {
    const client = getRawClient();
    const result = await client.execute(
      "INSERT INTO accounts (name, institution, tax_type, created_at) VALUES (?, ?, ?, ?) RETURNING id, name, institution, tax_type, created_at",
      ["Main", "Transamerica", "403b", new Date().toISOString()]
    );

    if (!result.rows || result.rows.length === 0) {
      return { ok: false, message: "Failed to create account" };
    }

    const row = result.rows[0] as Record<string, unknown>;
    const accountId = row.id as number;

    // Load holdings
    const holdingsResult = await loadMainAccountHoldings(accountId);
    return {
      ok: holdingsResult.ok,
      accountId,
      message: holdingsResult.message,
    };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
}

/**
 * Create Management staff IRA account and load holdings
 */
export async function setupManagementStaffIRA() {
  try {
    const client = getRawClient();
    const result = await client.execute(
      "INSERT INTO accounts (name, institution, tax_type, created_at) VALUES (?, ?, ?, ?) RETURNING id, name, institution, tax_type, created_at",
      ["Management staff", "Transamerica", "ira", new Date().toISOString()]
    );

    if (!result.rows || result.rows.length === 0) {
      return { ok: false, message: "Failed to create account" };
    }

    const row = result.rows[0] as Record<string, unknown>;
    const accountId = row.id as number;

    // Load holdings
    const holdingsResult = await loadManagementStaffIRAHoldings(accountId);
    return {
      ok: holdingsResult.ok,
      accountId,
      message: holdingsResult.message,
    };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
}

/**
 * Seed all Transamerica funds (one-time setup)
 */
export async function seedFunds() {
  return await seedTransamericaFunds();
}

/**
 * Generate optimization suggestions for all accounts
 */
export async function generateAllSuggestions() {
  try {
    const { refreshSuggestionsForAccount } = await import("@/app/portfolio/optimization-actions");

    // Get all accounts
    const allAccounts = await db.select().from(accounts);
    console.log(`📊 Found ${allAccounts.length} accounts`);

    if (allAccounts.length === 0) {
      return { ok: false, message: "No accounts found" };
    }

    const results = [];
    let totalSavings = 0;

    for (const account of allAccounts) {
      try {
        console.log(`  Processing account: ${account.name} (ID: ${account.id})`);
        // Use refreshSuggestionsForAccount to clear old and generate new
        const result = await refreshSuggestionsForAccount(account.id);
        console.log(`  Result for ${account.name}:`, result);

        if (result.ok && result.suggestions) {
          results.push({
            account: account.name,
            suggestions: result.suggestions.length,
            savings: result.totalAnnualSavings || 0,
          });
          totalSavings += result.totalAnnualSavings || 0;
          console.log(`  ✓ Generated ${result.suggestions.length} suggestions, savings: $${result.totalAnnualSavings?.toFixed(2)}`);
        } else {
          console.log(`  ⚠️ No suggestions for ${account.name}: ${result.message}`);
        }
      } catch (accountError) {
        console.error(`  ❌ Failed to process ${account.name}:`, accountError);
      }
    }

    const message = results.length === 0
      ? "No optimization suggestions generated (no holdings found or all are best-in-class)"
      : `✅ Generated suggestions for ${results.length} account(s). Total potential savings: $${totalSavings.toFixed(2)}`;

    return {
      ok: results.length > 0,
      message,
      results,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ generateAllSuggestions failed:", error);
    return { ok: false, message: `Failed to generate suggestions: ${errorMsg}` };
  }
}

/**
 * Assess event impact for all accounts
 */
export async function assessAllEventImpacts() {
  try {
    const { assessEventImpactForAccount } = await import("@/app/portfolio/event-assessment-actions");

    // Get all accounts
    const allAccounts = await db.select().from(accounts);

    if (allAccounts.length === 0) {
      return { ok: false, message: "No accounts found" };
    }

    const results = [];

    for (const account of allAccounts) {
      const result = await assessEventImpactForAccount(account.id);
      if (result.ok && result.assessment) {
        results.push({
          account: account.name,
          events: result.assessment.upcomingEventsCount,
          riskLevel: result.assessment.riskLevel,
        });
      }
    }

    return {
      ok: true,
      message: `Event assessment complete for ${results.length} account(s)`,
      results,
    };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
}

/**
 * Initialize economic calendar (FOMC meetings, CPI releases)
 */
export async function initializeEconomicCalendar() {
  try {
    const { initializeEconomicCalendar: initCalendar } = await import("@/app/events/actions");
    return await initCalendar();
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * Check setup completion status
 */
export async function getSetupStatus() {
  try {
    const accountCount = await db.select().from(accounts);
    const instrumentCount = await db.select().from(instruments);

    return {
      accountsSeeded: accountCount.length > 0,
      fundsSeeded: instrumentCount.length > 0,
    };
  } catch (error) {
    return { accountsSeeded: false, fundsSeeded: false };
  }
}

/**
 * Create portfolio-based watchlists from holdings
 * Groups by institution and creates one watchlist per institution
 * Prevents duplicates by checking existing entries first
 */
/**
 * Migrate watchlist table: add watchlist_type column if missing
 */
async function ensureWatchlistTypeColumn() {
  try {
    const client = getRawClient();
    // Add watchlist_type column if it doesn't exist (SQLite doesn't support IF NOT EXISTS for columns)
    const result = await client.execute(
      "PRAGMA table_info(watchlist)"
    );

    const rows = result.rows as Record<string, unknown>[];
    const hasWatchlistType = rows.some((row) => row.name === "watchlist_type");

    if (!hasWatchlistType) {
      console.log("⚠️ Adding missing watchlist_type column...");
      await client.execute(
        "ALTER TABLE watchlist ADD COLUMN watchlist_type TEXT NOT NULL DEFAULT 'user'"
      );
      console.log("✅ Successfully added watchlist_type column");
    } else {
      console.log("✅ watchlist_type column already exists");
    }
  } catch (error) {
    console.error("❌ Failed to ensure watchlist_type column:", error);
    throw error;
  }
}

export async function createPortfolioWatchlists() {
  try {
    // Ensure the watchlist_type column exists in the database
    await ensureWatchlistTypeColumn();

    const allAccounts = await db.select().from(accounts);
    console.log(`📋 createPortfolioWatchlists: Found ${allAccounts.length} accounts`);

    if (allAccounts.length === 0) {
      return { ok: false, message: "No accounts found" };
    }

    // Group accounts by institution
    const accountsByInstitution = allAccounts.reduce(
      (acc, account) => {
        const inst = account.institution || "Unknown";
        if (!acc[inst]) acc[inst] = [];
        acc[inst].push(account.id);
        return acc;
      },
      {} as Record<string, number[]>
    );
    console.log(`📋 Grouped into institutions:`, accountsByInstitution);

    let totalAdded = 0;
    let skippedDuplicates = 0;

    // For each institution, create watchlist from holdings
    for (const [institution, accountIds] of Object.entries(accountsByInstitution)) {
      console.log(`📋 Processing institution: ${institution} with accounts: ${accountIds}`);

      // Get all holdings for these accounts
      const accountHoldings = await db
        .select({ planFundId: holdings.planFundId })
        .from(holdings)
        .where(inArray(holdings.accountId, accountIds));

      console.log(`📋 Found ${accountHoldings.length} holdings for ${institution}`);

      if (accountHoldings.length === 0) {
        console.log(`⚠️ Skipping ${institution}: no holdings found`);
        continue;
      }

      // Get unique planFundIds and map to instrumentIds
      const planFundIds = [...new Set(accountHoldings.map(h => h.planFundId))];
      console.log(`📋 Unique planFundIds: ${planFundIds.length}`);

      const mappings = await db
        .select({ planFundId: proxyMap.planFundId, instrumentId: proxyMap.instrumentId })
        .from(proxyMap)
        .where(inArray(proxyMap.planFundId, planFundIds));

      console.log(`📋 Found ${mappings.length} proxyMap entries`);

      // Get existing watchlist entries for this portfolio
      const watchlistType = `portfolio_${institution.toLowerCase().replace(/\s+/g, "_")}`;
      console.log(`📋 Watchlist type: ${watchlistType}`);

      const existingEntries = await db
        .select({ instrumentId: watchlist.instrumentId })
        .from(watchlist)
        .where(eq(watchlist.watchlistType, watchlistType));

      console.log(`📋 Found ${existingEntries.length} existing entries for ${watchlistType}`);
      const existingIds = new Set(existingEntries.map(e => e.instrumentId));

      // Add only new entries (skip if already exists)
      const newEntries = mappings
        .filter(m => !existingIds.has(m.instrumentId))
        .map(m => ({
          instrumentId: m.instrumentId,
          watchlistType,
          addedAt: new Date().toISOString(),
        }));

      console.log(`📋 Adding ${newEntries.length} new entries`);

      if (newEntries.length > 0) {
        await db.insert(watchlist).values(newEntries);
        totalAdded += newEntries.length;
      }

      skippedDuplicates += mappings.length - newEntries.length;
    }

    const message = skippedDuplicates > 0
      ? `Created portfolio watchlists. Added ${totalAdded} investments (${skippedDuplicates} duplicates skipped).`
      : `Created portfolio watchlists. Added ${totalAdded} investments total.`;

    console.log(`✅ Portfolio watchlist creation complete: ${message}`);
    return { ok: true, message };
  } catch (error) {
    console.error(`❌ createPortfolioWatchlists failed:`, error);
    return { ok: false, message: `Failed: ${String(error)}` };
  }
}
