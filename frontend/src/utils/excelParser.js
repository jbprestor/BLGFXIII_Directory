import * as XLSX from "xlsx";

/**
 * Helper to get cell value by row/col (1-indexed like VBA)
 */
export function getCell(ws, row, col) {
  if (!ws) return null;
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  return ws[addr]?.v ?? null;
}

/**
 * Get sheet by name, fallback to first sheet
 */
export function getSheet(workbook, sheetName) {
  return workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
}

/**
 * Parse a single QRRPA file (mimics VBA macro logic)
 * Reads:
 * - H3 (total count)
 * - I3..I(1+total) (findings)
 * - Value1 sheet for LGU info
 * - Sample1 sheet for source filename
 */
export async function parseQrrpaFile(file) {
  try {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });

    // Get relevant sheets
    const wsFindings = getSheet(wb, "Findings");
    const wsValue1 = getSheet(wb, "Value1");
    const wsSample1 = getSheet(wb, "Sample1");
    const wsData = getSheet(wb, "Data") || getSheet(wb, "DataCaptured");

    // Read total from H3 (Cells(3,8))
    const total = Number(getCell(wsFindings, 3, 8)) || 0;

    // Read findings from I3..I(1+total) (Cells(3,9) to Cells(1+total,9))
    const findings = [];
    for (let r = 3; r <= 1 + total; r++) {
      const val = getCell(wsFindings, r, 9);
      if (val != null && String(val).trim() !== "") {
        findings.push(String(val));
      }
    }

    // Read LGU info from Value1 sheet
    const lguName = getCell(wsValue1, 3, 3) || file.name; // Cells(3,3)
    const taxableRpu = getCell(wsValue1, 3, 33) || null; // Cells(3,33)

    // Read additional metadata from Data/DataCaptured sheet
    const province = getCell(wsData, 1, 2) || ""; // Cells(1,2)
    const lguType = getCell(wsData, 3, 2) || ""; // Cells(3,2)

    // Read source filename from Sample1 if available
    const sourceFileName = getCell(wsSample1, 1, 1) || file.name; // Cells(1,1)

    // If no findings, use default message (VBA logic)
    const findingsText = findings.length > 0 
      ? findings.join("; ") 
      : "Recommended for Approval.";

    return {
      success: true,
      sourceFile: file.name,
      lguName,
      province,
      lguType,
      findings: findingsText,
      findingsList: findings,
      taxable: {
        residential: taxableRpu,
      },
      findingsCount: findings.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to parse ${file.name}:`, error);
    return {
      success: false,
      sourceFile: file.name,
      error: error.message || "Failed to parse file",
    };
  }
}

/**
 * Process multiple files sequentially
 */
export async function processBatchFiles(files, onProgress) {
  const results = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        message: `Processing ${file.name}...`,
      });
    }

    const result = await parseQrrpaFile(file);
    
    if (result.success) {
      results.push(result);
    } else {
      errors.push(result);
    }

    // Small delay to prevent blocking UI
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return { results, errors };
}

/**
 * Export compilation to Excel (mimics VBA output)
 */
export function exportToExcel(compilationData, filename = "QRRPA_Compilation.xlsx") {
  const wb = XLSX.utils.book_new();

  // Prepare data for export (match VBA Compilation sheet structure)
  const headers = [
    "Source File",
    "LGU Name", 
    "Province",
    "LGU Type",
    "Findings",
    "Taxable Properties (Residential)",
  ];

  const rows = compilationData.map(record => [
    record.sourceFile,
    record.lguName,
    record.province,
    record.lguType,
    record.findings,
    record.taxable?.residential || "",
  ]);

  const sheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-size columns
  const colWidths = [
    { wch: 30 }, // Source File
    { wch: 25 }, // LGU Name
    { wch: 20 }, // Province
    { wch: 15 }, // LGU Type
    { wch: 50 }, // Findings
    { wch: 25 }, // Taxable Properties
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Compilation");

  // Download file
  XLSX.writeFile(wb, filename);
}
