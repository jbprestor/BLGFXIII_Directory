// Minimal Debug Script for Timberland Check
const fs = require('fs');
const XLSX = require('xlsx');

try {
    console.log("Reading debug.xls...");
    const fileBuffer = fs.readFileSync('debug.xls');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    console.log(`\nRows found: ${rows.length}`);

    // Helper to clean numbers
    const parseNumber = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const clean = String(val).replace(/,/g, '').replace(/\s/g, '').replace(/%/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    // Search specifically for TIMBER
    let found = false;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowStr = JSON.stringify(row).toUpperCase();

        if (rowStr.includes("TIMBER")) {
            found = true;
            console.log(`\n=== FOUND TIMBERLAND ROW AT INDEX ${i} (Excel Row ${i + 1}) ===`);
            console.log(`Raw Row data: ${JSON.stringify(row)}`);

            // Check potential columns
            // Standard (Col A has class): MV=11, AV=19
            // Shifted (Col B has class): MV=11, AV=19 (MV/AV columns are usually fixed in specific excel templates even if text shifts)

            console.log(`\nIndex 11 (MV Land?): "${row[11]}"`);
            console.log(`Index 19 (AV Land?): "${row[19]}"`);

            const mv = parseNumber(row[11]);
            const av = parseNumber(row[19]);

            console.log(`Parsed MV: ${mv}`);
            console.log(`Parsed AV: ${av}`);

            if (mv > 0) {
                console.log(`Calculated Rate: ${(av / mv) * 100}%`);
            } else {
                console.log("Rate: Undefined (MV=0)");
            }
        }
    }

    if (!found) {
        console.log("\nNO Timberland row found in the file.");
    } else {
        console.log("\nSearch complete.");
    }

} catch (err) {
    console.error("Error:", err);
}
