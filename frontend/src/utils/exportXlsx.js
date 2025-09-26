// src/utils/exportXlsx.js
import * as XLSX from "xlsx";

/**
 * exportXlsxFromJson
 * - data: Array of objects to export
 * - filename: string, e.g. "assessors.xlsx"
 * - columns (optional): array of { header: 'Full Name', key: 'fullName' } to control column order/labels
 */
export function exportXlsxFromJson(data = [], filename = "export.xlsx", columns = null) {
  if (!Array.isArray(data) || data.length === 0) return;

  // optionally remap keys/labels if columns specified
  let sheetData = data;
  if (Array.isArray(columns) && columns.length) {
    // produce objects with header keys in requested order
    sheetData = data.map((row) => {
      const out = {};
      columns.forEach((col) => {
        out[col.header] = row[col.key] == null ? "" : row[col.key];
      });
      return out;
    });
  } else {
    // default: try to export plain objects (json_to_sheet picks keys from first object)
    // but we should clone/serialize nested objects to readable strings
    sheetData = data.map((row) => {
      const out = {};
      Object.keys(row).forEach((k) => {
        const val = row[k];
        if (val == null) out[k] = "";
        else if (typeof val === "object" && !Array.isArray(val)) out[k] = val.name ?? JSON.stringify(val);
        else out[k] = val;
      });
      return out;
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // writeFile triggers browser download
  XLSX.writeFile(workbook, filename);
}
