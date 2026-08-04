"use server";

import { db } from "@/db/client";
import { accounts } from "@/db/schema";
import { seedTransamericaFunds, loadMainAccountHoldings, loadManagementStaffIRAHoldings } from "@/app/portfolio/fund-actions";

/**
 * Create Main 403b account and load holdings
 */
export async function setupMainAccount() {
  try {
    // Create account
    const result = await db
      .insert(accounts)
      .values({
        name: "Main",
        institution: "Transamerica",
        taxType: "403b",
        createdAt: new Date().toISOString(),
      })
      .returning();

    if (result.length === 0) {
      return { ok: false, message: "Failed to create account" };
    }

    const accountId = result[0].id;

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
    // Create account
    const result = await db
      .insert(accounts)
      .values({
        name: "Management staff",
        institution: "Transamerica",
        taxType: "ira",
        createdAt: new Date().toISOString(),
      })
      .returning();

    if (result.length === 0) {
      return { ok: false, message: "Failed to create account" };
    }

    const accountId = result[0].id;

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
    const { generateSuggestionsForAccount } = await import("@/app/portfolio/optimization-actions");

    // Get all accounts
    const allAccounts = await db.select().from(accounts);

    if (allAccounts.length === 0) {
      return { ok: false, message: "No accounts found" };
    }

    const results = [];
    let totalSavings = 0;

    for (const account of allAccounts) {
      const result = await generateSuggestionsForAccount(account.id);
      if (result.ok && result.suggestions) {
        results.push({
          account: account.name,
          suggestions: result.suggestions.length,
          savings: result.totalAnnualSavings || 0,
        });
        totalSavings += result.totalAnnualSavings || 0;
      }
    }

    return {
      ok: true,
      message: `Generated suggestions for ${results.length} account(s). Total potential savings: $${totalSavings.toFixed(2)}`,
      results,
    };
  } catch (error) {
    return { ok: false, message: String(error) };
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
