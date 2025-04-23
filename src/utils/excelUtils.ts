
import * as XLSX from 'xlsx';
import { MatchResult } from './reconciliationUtils';

export interface ExportOptions {
  includeHeaders: boolean;
  highlightMismatches: boolean;
  autoWidth: boolean;
  freezeHeader: boolean;
}

/**
 * Generate an Excel workbook with formatted data from the reconciliation
 */
export function generateReconciliationWorkbook(
  matchResult: MatchResult,
  mappedFields: Record<string, string>,
  options: ExportOptions = {
    includeHeaders: true,
    highlightMismatches: true,
    autoWidth: true,
    freezeHeader: true
  }
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  
  // Generate the three sheets
  generateCommonEntriesSheet(workbook, matchResult.common, mappedFields, options);
  generateMoreInGstr2bSheet(workbook, matchResult.moreInGstr2b, options);
  generateLessInGstr2bSheet(workbook, matchResult.lessInGstr2b, options);
  
  return workbook;
}

/**
 * Download the workbook as an Excel file
 */
export function downloadWorkbook(workbook: XLSX.WorkBook, filename: string = 'gst-reconciliation.xlsx'): void {
  XLSX.writeFile(workbook, filename);
}

/**
 * Generate the sheet for common entries with mismatch highlighting
 */
function generateCommonEntriesSheet(
  workbook: XLSX.WorkBook,
  commonEntries: MatchResult['common'],
  mappedFields: Record<string, string>,
  options: ExportOptions
): void {
  // Create a combined dataset for the common entries
  const combinedData = commonEntries.map(entry => {
    const row: Record<string, any> = {};
    
    // Add all fields from GSTR-2B with prefix
    Object.entries(entry.gstr2b).forEach(([key, value]) => {
      row[`GSTR-2B: ${key}`] = value;
    });
    
    // Add all fields from Purchase Register with prefix
    Object.entries(entry.purchaseRegister).forEach(([key, value]) => {
      row[`PR: ${key}`] = value;
    });
    
    // Add mismatch summary
    row['Mismatch Summary'] = entry.mismatches.map(m => 
      `${m.field}: ${m.gstr2bValue} vs ${m.purchaseRegisterValue}`
    ).join('; ') || 'No mismatches';
    
    return row;
  });
  
  // Convert to worksheet
  const worksheet = XLSX.utils.json_to_sheet(combinedData, {
    header: options.includeHeaders ? Object.keys(combinedData[0] || {}) : undefined
  });
  
  // Apply formatting
  applyWorksheetFormatting(worksheet, options, commonEntries);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, '✓ Common Entries');
}

/**
 * Generate the sheet for entries only in GSTR-2B
 */
function generateMoreInGstr2bSheet(
  workbook: XLSX.WorkBook,
  moreEntries: MatchResult['moreInGstr2b'],
  options: ExportOptions
): void {
  if (moreEntries.length === 0) {
    // Create an empty sheet with a note if there are no entries
    const worksheet = XLSX.utils.aoa_to_sheet([['No entries found only in GSTR-2B']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, '+ More in GSTR-2B');
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet(moreEntries);
  
  // Apply formatting
  applyWorksheetFormatting(worksheet, options);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, '+ More in GSTR-2B');
}

/**
 * Generate the sheet for entries only in Purchase Register
 */
function generateLessInGstr2bSheet(
  workbook: XLSX.WorkBook,
  lessEntries: MatchResult['lessInGstr2b'],
  options: ExportOptions
): void {
  if (lessEntries.length === 0) {
    // Create an empty sheet with a note if there are no entries
    const worksheet = XLSX.utils.aoa_to_sheet([['No entries found only in Purchase Register']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, '- Less in GSTR-2B');
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet(lessEntries);
  
  // Apply formatting
  applyWorksheetFormatting(worksheet, options);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, '- Less in GSTR-2B');
}

/**
 * Apply common formatting to worksheets
 * Note: Some advanced formatting requires proper Excel libraries on backend
 * This is a simplified version for client-side
 */
function applyWorksheetFormatting(
  worksheet: XLSX.WorkSheet,
  options: ExportOptions,
  commonEntries?: MatchResult['common']
): void {
  // Basic formatting that XLSX.js supports
  if (!worksheet['!cols']) worksheet['!cols'] = [];
  
  // Auto-width columns (approximation)
  if (options.autoWidth) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      worksheet['!cols'][col] = { wch: 15 }; // Default width
    }
  }
  
  // Freeze header row
  if (options.freezeHeader && options.includeHeaders) {
    worksheet['!freeze'] = { xSplit: "0", ySplit: "1" };
  }
  
  // Note: For more advanced styling like:
  // - Cell highlighting for mismatches
  // - Bold headers
  // - Borders
  // We would need a library like ExcelJS or to process this server-side with openpyxl
  // XLSX.js has limited styling capabilities in the browser
}
