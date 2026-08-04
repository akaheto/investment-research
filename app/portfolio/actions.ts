"use server";

/**
 * Portfolio server actions: import accounts and holdings.
 * TODO: Parse PDFs automatically; add auth checks.
 */

import { db } from "@/db/client";
import { accounts, planMenu, holdings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ACCOUNT_1, ACCOUNT_2, HOLDINGS_1, HOLDINGS_2, PLAN_MENU_FUNDS } from "@/lib/portfolio/importer";

/**
 * Import Transamerica accounts and holdings from extracted data.
 */
export async function importTransamericaAccounts() {
  try {
    console.log("📥 Importing Transamerica accounts...");

    // Import accounts
    const acc1Result = await db
      .insert(accounts)
      .values({
        name: ACCOUNT_1.name,
        institution: "Transamerica",
        taxType: ACCOUNT_1.taxType,
        createdAt: ACCOUNT_1.asOf,
      })
      .returning();

    const acc2Result = await db
      .insert(accounts)
      .values({
        name: ACCOUNT_2.name,
        institution: "Transamerica",
        taxType: ACCOUNT_2.taxType,
        createdAt: ACCOUNT_2.asOf,
      })
      .returning();

    const accountIds = [acc1Result[0].id, acc2Result[0].id];

    // Import plan menu
    for (const fund of PLAN_MENU_FUNDS) {
      for (const accountId of accountIds) {
        await db
          .insert(planMenu)
          .values({
            accountId,
            fundName: fund.name,
            assetClassSlot: fund.slot,
            expenseRatio: fund.expenseRatio,
            active: true,
          })
          .onConflictDoNothing();
      }
    }

    // Import Account 1 holdings
    const menuItemsAcc1 = await db.select().from(planMenu).where(eq(planMenu.accountId, accountIds[0]));
    for (const h of HOLDINGS_1) {
      const menuItem = menuItemsAcc1.find((m) => m.fundName === h.fundName);
      if (menuItem) {
        await db.insert(holdings).values({
          accountId: accountIds[0],
          planFundId: menuItem.id,
          balance: h.balance,
          asOf: ACCOUNT_1.asOf,
          source: "manual",
        });
      }
    }

    // Import Account 2 holdings
    const menuItemsAcc2 = await db.select().from(planMenu).where(eq(planMenu.accountId, accountIds[1]));
    for (const h of HOLDINGS_2) {
      const menuItem = menuItemsAcc2.find((m) => m.fundName === h.fundName);
      if (menuItem) {
        await db.insert(holdings).values({
          accountId: accountIds[1],
          planFundId: menuItem.id,
          balance: h.balance,
          asOf: ACCOUNT_2.asOf,
          source: "manual",
        });
      }
    }

    console.log(`✓ Imported 2 accounts, ${PLAN_MENU_FUNDS.length} plan menu items, ${HOLDINGS_1.length + HOLDINGS_2.length} holdings`);
    return { ok: true, accountCount: 2, menuCount: PLAN_MENU_FUNDS.length };
  } catch (error) {
    console.error("❌ Import failed:", error);
    return { ok: false, error: String(error) };
  }
}
