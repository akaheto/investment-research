"use server";

import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedHolding {
  fundName: string;
  units: number;
  balance: number;
  percent: number;
  confidence: "high" | "medium" | "low";
}

interface StatementExtractionResult {
  ok: boolean;
  holdings?: ExtractedHolding[];
  statementDate?: string;
  accountName?: string;
  message?: string;
  error?: string;
}

/**
 * Extract holdings from account statement screenshot using Claude vision
 * Accepts base64-encoded image (PNG, JPG) or file data
 */
export async function extractHoldingsFromStatement(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" = "image/png"
): Promise<StatementExtractionResult> {
  try {
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `You are analyzing a retirement account statement screenshot. Extract the holdings/investments section and return ONLY a JSON object with this exact structure (no markdown, no code blocks, just raw JSON):

{
  "statementDate": "YYYY-MM-DD or null if not found",
  "accountName": "Account name or null",
  "holdings": [
    {
      "fundName": "Full fund name as shown",
      "units": 123.456789,
      "balance": 12345.67,
      "percent": 12.34,
      "confidence": "high"
    }
  ]
}

Rules:
- Extract EVERY holding shown in the statement
- fundName: Use EXACT name from statement (e.g., "Fidelity 500 Index Institutional Prem", "Vanguard Total Bond Market Index I")
- units: Number of shares/units owned (look for "Units", "Shares", "Qty", "Quantity" columns)
- balance: Dollar value of holding (look for "Value", "Amount", "Balance" columns)
- percent: Allocation percentage (if shown; otherwise calculate as balance/total)
- confidence: "high" if values are clear, "medium" if estimated, "low" if unclear
- Return empty holdings array if no holdings table found
- Always return valid JSON only`,
            },
          ],
        },
      ],
    });

    // Extract the text response
    const content = response.content[0];
    if (content.type !== "text") {
      return { ok: false, error: "Unexpected response type from Claude" };
    }

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(content.text);
    } catch (e) {
      console.error("Failed to parse Claude response:", content.text);
      return { ok: false, error: "Could not parse statement data. Please verify the image is clear." };
    }

    if (!extractedData.holdings || !Array.isArray(extractedData.holdings)) {
      return { ok: false, error: "No holdings found in statement" };
    }

    if (extractedData.holdings.length === 0) {
      return { ok: false, error: "No holdings/investments section found in statement" };
    }

    // Validate extracted data
    const validatedHoldings = extractedData.holdings.filter((h: ExtractedHolding) => {
      return h.fundName && typeof h.units === "number" && typeof h.balance === "number" && h.units > 0;
    });

    if (validatedHoldings.length === 0) {
      return { ok: false, error: "Could not extract valid holding data from statement" };
    }

    return {
      ok: true,
      holdings: validatedHoldings,
      statementDate: extractedData.statementDate || undefined,
      accountName: extractedData.accountName || undefined,
      message: `Extracted ${validatedHoldings.length} holdings from statement`,
    };
  } catch (error) {
    console.error("Statement extraction failed:", error);
    return {
      ok: false,
      error: `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate extracted holdings against known Transamerica funds
 * Fuzzy-matches fund names to detect potential entry errors
 */
export async function validateExtractedHoldings(
  holdings: ExtractedHolding[]
): Promise<{
  ok: boolean;
  validated: ExtractedHolding[];
  warnings: string[];
}> {
  // Known Transamerica funds (from fund-actions.ts)
  const knownFunds = [
    "Vanguard Federal Money Market Inv",
    "TCW MetWest Total Return Bond P",
    "Vanguard Total Bond Market Index I",
    "Dodge & Cox Stock X",
    "Fidelity 500 Index Institutional Prem",
    "NYLI Winslow Large Cap Growth R6",
    "Principal Global Real Estate Sec Inst",
    "Fidelity Extended Market Index",
    "Fidelity International Index",
    "Vanguard Target Retirement 2035 Inv",
    "Vanguard Target Retirement 2040 Inv",
    "Vanguard Target Retirement 2045 Inv",
    "Vanguard Target Retirement 2050 Inv",
    "Vanguard Target Retirement 2055 Inv",
    "Vanguard Target Retirement 2060 Inv",
    "Vanguard Target Retirement 2065 Inv",
    "Vanguard Target Retirement 2070 Inv",
  ];

  const warnings: string[] = [];

  // Simple fuzzy match: check if fund name contains key words from known funds
  const validated = holdings.map((holding) => {
    const match = knownFunds.find(
      (known) =>
        known.toLowerCase().includes(holding.fundName.toLowerCase()) ||
        holding.fundName.toLowerCase().includes(known.toLowerCase())
    );

    if (!match && holding.confidence !== "high") {
      warnings.push(`⚠️ "${holding.fundName}" may not be a recognized Transamerica fund - verify spelling`);
    }

    return holding;
  });

  return {
    ok: validated.length > 0,
    validated,
    warnings,
  };
}
