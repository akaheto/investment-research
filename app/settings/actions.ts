"use server";

import { db, getRawClient } from "@/db/client";
import { accounts } from "@/db/schema";
import { seedTransamericaFunds, loadMainAccountHoldings, loadManagementStaffIRAHoldings } from "@/app/portfolio/fund-actions";

/**
 * Create Main 403b account and load holdings
 */
export async function setupMainAccount() {
  try {
    const client = getRawClient();
    const result = await client.execute(
      "INSERT INTO accounts (name, institution, tax_type, created_at, external_id) VALUES (?, ?, ?, ?, NULL) RETURNING id, name, institution, tax_type, created_at, external_id",
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
      "INSERT INTO accounts (name, institution, tax_type, created_at, external_id) VALUES (?, ?, ?, ?, NULL) RETURNING id, name, institution, tax_type, created_at, external_id",
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
