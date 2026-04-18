/**
 * parseBudgetAllocation.ts
 * Sends a budget allocation document image to Google Cloud Vision API
 * and extracts Operating, ASG, and Gifts amounts.
 */

export interface BudgetScanResult {
  ASG: number;
  Operating: number;
  Gifts: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Find a dollar amount near a keyword in the OCR text.
// Searches the same line first, then the next line.
function findAmountNear(lines: string[], keyword: RegExp): number {
  const dollarPattern = /\$?\s*(\d{1,6}(?:[.,]\d{1,2})?)/;

  for (let i = 0; i < lines.length; i++) {
    if (keyword.test(lines[i])) {
      // Try current line
      const m = lines[i].match(dollarPattern);
      if (m) return parseFloat(m[1].replace(',', '.'));
      // Try next line
      if (i + 1 < lines.length) {
        const m2 = lines[i + 1].match(dollarPattern);
        if (m2) return parseFloat(m2[1].replace(',', '.'));
      }
    }
  }
  return 0;
}

export async function parseBudgetAllocation(file: File): Promise<BudgetScanResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error('VITE_GOOGLE_VISION_API_KEY is not set in .env');

  const base64 = await fileToBase64(file);

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message ?? 'Vision API request failed');
  }

  const data = await response.json();
  const fullText: string =
    data.responses?.[0]?.fullTextAnnotation?.text ??
    data.responses?.[0]?.textAnnotations?.[0]?.description ??
    '';

  const lines = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    ASG: findAmountNear(lines, /\basg\b/i),
    Operating: findAmountNear(lines, /\boperat/i),
    Gifts: findAmountNear(lines, /\bgift/i),
  };
}
