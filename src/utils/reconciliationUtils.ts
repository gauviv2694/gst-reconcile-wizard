
import Fuse from 'fuse.js';

export interface ReconciliationOptions {
  matchingThreshold: number;
  keyFields: string[];
  mappedFields: Record<string, string>;
}

export interface MatchResult {
  common: Array<{
    gstr2b: Record<string, any>;
    purchaseRegister: Record<string, any>;
    mismatches: Array<{
      field: string;
      gstr2bValue: any;
      purchaseRegisterValue: any;
    }>;
  }>;
  moreInGstr2b: Array<Record<string, any>>;
  lessInGstr2b: Array<Record<string, any>>;
}

/**
 * Perform fuzzy matching between GSTR-2B and Purchase Register
 */
export function performReconciliation(
  gstr2bData: Array<Record<string, any>>,
  purchaseRegisterData: Array<Record<string, any>>,
  options: ReconciliationOptions
): MatchResult {
  const { matchingThreshold, keyFields, mappedFields } = options;
  
  // Result containers
  const common: MatchResult['common'] = [];
  const moreInGstr2b: MatchResult['moreInGstr2b'] = [];
  const lessInGstr2b: MatchResult['lessInGstr2b'] = [];
  
  // Track matched entries to avoid duplicates
  const matchedPurchaseIndices = new Set<number>();
  
  // Configure Fuse.js for fuzzy matching
  const fuseOptions = {
    includeScore: true,
    threshold: 1 - matchingThreshold / 100,
    keys: keyFields.map(field => field),
  };
  
  const fuse = new Fuse(purchaseRegisterData, fuseOptions);
  
  // Process each GSTR-2B entry
  gstr2bData.forEach(gstr2bEntry => {
    // Create search pattern for key fields
    const searchPattern: any = {};
    keyFields.forEach(keyField => {
      searchPattern[keyField] = gstr2bEntry[keyField]?.toString() || '';
    });
    
    // Perform fuzzy search
    const results = fuse.search(searchPattern);
    
    if (results.length > 0 && results[0].score !== undefined && results[0].score <= (1 - matchingThreshold / 100)) {
      const bestMatch = results[0].item;
      const bestMatchIndex = purchaseRegisterData.indexOf(bestMatch);
      
      // Identify mismatches in mapped fields
      const mismatches: Array<{
        field: string;
        gstr2bValue: any;
        purchaseRegisterValue: any;
      }> = [];
      
      Object.entries(mappedFields).forEach(([gstr2bField, prField]) => {
        if (keyFields.includes(gstr2bField)) return; // Skip key fields
        
        const gstr2bValue = gstr2bEntry[gstr2bField];
        const prValue = bestMatch[prField];
        
        // Handle numeric values with tolerance
        if (
          typeof gstr2bValue === 'number' && 
          typeof prValue === 'number'
        ) {
          // Allow small difference (0.1%) for floating point errors
          const tolerance = Math.abs(gstr2bValue) * 0.001;
          if (Math.abs(gstr2bValue - prValue) > tolerance) {
            mismatches.push({
              field: gstr2bField,
              gstr2bValue,
              purchaseRegisterValue: prValue
            });
          }
        } 
        // For non-numeric values or different types
        else if (String(gstr2bValue) !== String(prValue)) {
          mismatches.push({
            field: gstr2bField,
            gstr2bValue,
            purchaseRegisterValue: prValue
          });
        }
      });
      
      // Add to common entries
      common.push({
        gstr2b: gstr2bEntry,
        purchaseRegister: bestMatch,
        mismatches
      });
      
      matchedPurchaseIndices.add(bestMatchIndex);
    } else {
      // No match found
      moreInGstr2b.push(gstr2bEntry);
    }
  });
  
  // Find entries in Purchase Register not matched with GSTR-2B
  purchaseRegisterData.forEach((prEntry, index) => {
    if (!matchedPurchaseIndices.has(index)) {
      lessInGstr2b.push(prEntry);
    }
  });
  
  return {
    common,
    moreInGstr2b,
    lessInGstr2b
  };
}

/**
 * Generate a mismatch summary string for display
 */
export function generateMismatchSummary(mismatches: Array<{
  field: string;
  gstr2bValue: any;
  purchaseRegisterValue: any;
}>): string {
  if (mismatches.length === 0) return 'No mismatches';
  
  return mismatches.map(mismatch => 
    `${mismatch.field} mismatch: ${mismatch.gstr2bValue} vs ${mismatch.purchaseRegisterValue}`
  ).join('; ');
}

/**
 * Auto-suggest column mappings based on header names
 */
export function suggestColumnMappings(
  gstr2bHeaders: string[],
  purchaseRegisterHeaders: string[]
): Record<string, string> {
  const mappings: Record<string, string> = {};
  const commonKeywords = [
    { gstr: ['gstin', 'gst'], pr: ['gstin', 'gst'] },
    { gstr: ['invoice', 'bill'], pr: ['invoice', 'bill'] },
    { gstr: ['date'], pr: ['date'] },
    { gstr: ['taxable', 'value'], pr: ['taxable', 'value'] },
    { gstr: ['amount', 'total'], pr: ['amount', 'total'] },
    { gstr: ['igst'], pr: ['igst'] },
    { gstr: ['cgst'], pr: ['cgst'] },
    { gstr: ['sgst'], pr: ['sgst'] },
    { gstr: ['supplier', 'vendor'], pr: ['supplier', 'vendor'] },
    { gstr: ['party'], pr: ['party'] },
  ];

  gstr2bHeaders.forEach(gstrHeader => {
    const lowerHeader = gstrHeader.toLowerCase();
    
    // Try to find matching header in Purchase Register
    for (const keywordSet of commonKeywords) {
      // Check if GSTR header contains any of the keywords
      const matchesGstr = keywordSet.gstr.some(keyword => 
        lowerHeader.includes(keyword.toLowerCase())
      );
      
      if (matchesGstr) {
        // Find corresponding PR header with matching keywords
        const matchingPrHeader = purchaseRegisterHeaders.find(prHeader => {
          const lowerPrHeader = prHeader.toLowerCase();
          return keywordSet.pr.some(keyword => 
            lowerPrHeader.includes(keyword.toLowerCase())
          );
        });
        
        if (matchingPrHeader) {
          mappings[gstrHeader] = matchingPrHeader;
          break;
        }
      }
    }
  });
  
  return mappings;
}
