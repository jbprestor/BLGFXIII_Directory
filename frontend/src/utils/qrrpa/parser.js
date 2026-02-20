import * as XLSX from "xlsx";

/**
 * Parses a raw QRRPA file (CSV, XLS, XLSX) into a structured object.
 * Uses SheetJS to handle specific cell extraction and data rows.
 * @param {File} file - The uploaded file.
 * @returns {Promise<Object>} - The structured data.
 */
export const parseQrrpaCsv = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                // Read as array to support binary formats (XLS, XLSX) better
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of arrays for sequential processing
                // header: 1 gives us an array of arrays [[A1, B1], [A2, B2]]
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                const data = processSheetData(worksheet, rows, file.name);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Extracts data from the worksheet and rows.
 */
const processSheetData = (worksheet, rows, fileName) => {
    // Helper to extract value safely from cell address (e.g., "C3")
    const getVal = (cellAddress) => {
        return worksheet[cellAddress] ? String(worksheet[cellAddress].v).trim() : "";
    };

    // Helper to search for keyword in first 0-30 rows if exact cell fails
    // Returns the value in the *next* column (colIndex)
    const findValueByKeyword = (keyword, colIndex = 1) => {
        // Scan first 30 rows
        for (let i = 0; i < Math.min(rows.length, 30); i++) {
            const row = rows[i];
            if (row) {
                const cellStr = String(row[0] || "").trim(); // Check first column
                if (cellStr.toLowerCase().includes(keyword.toLowerCase())) {
                    // Start looking from the specified column index
                    // Sometimes the value is in colIndex, sometimes colIndex+1 if merged
                    // We'll try finding the first non-empty cell after the label
                    for (let j = colIndex; j < row.length; j++) {
                        const val = String(row[j] || "").trim();
                        if (val && val !== ":") return val;
                    }
                }
            }
        }
        return "";
    };

    // 1. Metadata Extraction
    // Priority: Exact Cell -> Keyword Search -> Default

    // LGU Name: C3
    let lguName = getVal("C3");
    if (!lguName || lguName.toUpperCase().includes("LGU")) lguName = findValueByKeyword("LGU", 1);
    if (!lguName) lguName = "Unknown LGU";

    // Period: C4
    let period = getVal("C4");
    if (!period || period.includes("Period")) period = findValueByKeyword("Period", 1);
    if (!period) period = "Unknown Period";

    // Barangay: M3
    let specificBarangay = getVal("M3");
    if (!specificBarangay) specificBarangay = findValueByKeyword("Barangay", 1);

    // Assessor: AB106 (Column 27 is AB)
    let regionalAssessor = getVal("AB106");
    if (!regionalAssessor) regionalAssessor = findValueByKeyword("Assessor", 20);

    // Prepared By: V106 (Column 21 is V)
    let preparedBy = getVal("V106");
    if (!preparedBy) preparedBy = findValueByKeyword("Prepared", 15);

    // Ordinance: L114 (Column 11 is L)
    let ordinanceInfo = getVal("L114");
    if (!ordinanceInfo) ordinanceInfo = findValueByKeyword("Ordinance", 5);

    // Province: Search for "Province" keyword
    let province = findValueByKeyword("Province", 1);
    if (!province) {
        // Fallback: Check if C4 contains province info if not period
        const c4 = getVal("C4");
        if (c4 && c4.toUpperCase().includes("AGUSAN") || c4.toUpperCase().includes("SURIGAO") || c4.toUpperCase().includes("DINAGAT")) {
            province = c4;
        }
    }

    // Clean up Province string (remove "Province of", etc.)
    if (province) {
        province = province.replace(/Province of/i, "").replace(/Province/i, "").trim();
    }

    // Specific Taxable Land Area Extraction (User Request)
    // C11 (Res), C12 (Agri), C13 (Com), C14 (Ind), C15 (Min), C16 (Timb) ... C26 (Total)
    const taxableLandBreakdown = {
        residential: parseNumber(getVal("C11")),
        agricultural: parseNumber(getVal("C12")),

        commercial: parseNumber(getVal("C13")),
        industrial: parseNumber(getVal("C14")),
        mineral: parseNumber(getVal("C15")),
        timberland: parseNumber(getVal("C16")),
        special: parseNumber(getVal("C17")),
        special_machineries: parseNumber(getVal("C18")),
        special_cultural: parseNumber(getVal("C19")),
        special_scientific: parseNumber(getVal("C20")),
        special_hospital: parseNumber(getVal("C21")),
        special_lvua: parseNumber(getVal("C22")),
        special_gocc: parseNumber(getVal("C23")),
        special_recreation: parseNumber(getVal("C24")),
        special_others: parseNumber(getVal("C25")),
        total: parseNumber(getVal("C26"))
    };

    // Define taxableLandTotal for return object
    const taxableLandTotal = taxableLandBreakdown.total;

    // Helper to extract a column for rows 11-26 with semantic keys
    const extractColumn = (colPrefix) => ({
        residential: parseNumber(getVal(`${colPrefix}11`)),
        agricultural: parseNumber(getVal(`${colPrefix}12`)),
        commercial: parseNumber(getVal(`${colPrefix}13`)),
        industrial: parseNumber(getVal(`${colPrefix}14`)),
        mineral: parseNumber(getVal(`${colPrefix}15`)),
        timberland: parseNumber(getVal(`${colPrefix}16`)),
        special: parseNumber(getVal(`${colPrefix}17`)),
        special_machineries: parseNumber(getVal(`${colPrefix}18`)),
        special_cultural: parseNumber(getVal(`${colPrefix}19`)),
        special_scientific: parseNumber(getVal(`${colPrefix}20`)),
        special_hospital: parseNumber(getVal(`${colPrefix}21`)),
        special_lvua: parseNumber(getVal(`${colPrefix}22`)),
        special_gocc: parseNumber(getVal(`${colPrefix}23`)),
        special_recreation: parseNumber(getVal(`${colPrefix}24`)),
        special_others: parseNumber(getVal(`${colPrefix}25`)),
        total: parseNumber(getVal(`${colPrefix}26`))
    });

    const rpuValidationData = {
        land: extractColumn("E"),
        building: extractColumn("F"),
        machinery: extractColumn("G"),
        other: extractColumn("H"), // Assuming H is the 4th component based on "E, F, G, H, I" request
        otherImp: extractColumn("I"),
        rowTotal: extractColumn("K")
    };

    const extractBuildingMV = () => {
        // Residential (1) uses N and O
        const resN = parseNumber(getVal("N11"));
        const resO = parseNumber(getVal("O11"));

        // Others (2-7.8) use P
        // Helper to get P value
        const getP = (row) => parseNumber(getVal(`P${row}`));

        return {
            residential: resN + resO, // Sum of N11 and O11
            agricultural: getP(12),
            commercial: getP(13),
            industrial: getP(14),
            mineral: getP(15),
            timberland: getP(16),
            special: getP(17),
            special_machineries: getP(18),
            special_cultural: getP(19),
            special_scientific: getP(20),
            special_hospital: getP(21),
            special_lvua: getP(22),
            special_gocc: getP(23),
            special_recreation: getP(24),
            special_others: getP(25),
            total: parseNumber(getVal("N26")) + parseNumber(getVal("O26")) + parseNumber(getVal("P26"))
        };
    };

    const mvValidationData = {
        land: extractColumn("L"), // Market Value for Land
        building: extractBuildingMV(), // Special logic for N, O, P
        machinery: extractColumn("Q"), // Market Value for Machinery
        otherImp: extractColumn("R"), // Market Value for Other Improvements
        rowTotal: extractColumn("S") // Horizontal Total
    };

    // Helper with fallback column
    const extractColumnWithFallback = (colMain, colFallback) => ({
        residential: parseNumber(getVal(`${colMain}11`)) || parseNumber(getVal(`${colFallback}11`)),
        agricultural: parseNumber(getVal(`${colMain}12`)) || parseNumber(getVal(`${colFallback}12`)),
        commercial: parseNumber(getVal(`${colMain}13`)) || parseNumber(getVal(`${colFallback}13`)),
        industrial: parseNumber(getVal(`${colMain}14`)) || parseNumber(getVal(`${colFallback}14`)),
        mineral: parseNumber(getVal(`${colMain}15`)) || parseNumber(getVal(`${colFallback}15`)),
        timberland: parseNumber(getVal(`${colMain}16`)) || parseNumber(getVal(`${colFallback}16`)),
        special: parseNumber(getVal(`${colMain}17`)) || parseNumber(getVal(`${colFallback}17`)),
        special_machineries: parseNumber(getVal(`${colMain}18`)) || parseNumber(getVal(`${colFallback}18`)),
        special_cultural: parseNumber(getVal(`${colMain}19`)) || parseNumber(getVal(`${colFallback}19`)),
        special_scientific: parseNumber(getVal(`${colMain}20`)) || parseNumber(getVal(`${colFallback}20`)),
        special_hospital: parseNumber(getVal(`${colMain}21`)) || parseNumber(getVal(`${colFallback}21`)),
        special_lvua: parseNumber(getVal(`${colMain}22`)) || parseNumber(getVal(`${colFallback}22`)),
        special_gocc: parseNumber(getVal(`${colMain}23`)) || parseNumber(getVal(`${colFallback}23`)),
        special_recreation: parseNumber(getVal(`${colMain}24`)) || parseNumber(getVal(`${colFallback}24`)),
        special_others: parseNumber(getVal(`${colMain}25`)) || parseNumber(getVal(`${colFallback}25`)),
        total: parseNumber(getVal(`${colMain}26`)) || parseNumber(getVal(`${colFallback}26`))
    });

    const avValidationData = {
        land: extractColumnWithFallback("T", "W"), // Assessed Value for Land (Fallback to W)
        building: extractColumn("U"), // Assessed Value for Building
        machinery: extractColumn("V"), // Assessed Value for Machinery
        otherImp: extractColumn("W"), // Assessed Value for Other Improvements
        rowTotal: extractColumn("X") // Horizontal Total
    };

    // Define assessedValueTotal for return object
    const assessedValueTotal = avValidationData.rowTotal.total; // X26

    // 2. Identify Sections & Parse Data Rows
    const sections = {
        taxable: [],
        idle: []
    };

    let currentSection = null;
    let currentRowBarangay = null;

    // Helper to check if a row starts with a number (Data Row) like "1", "1.1", "25"
    const isDataRow = (cell0) => /^\d+(\.\d+)?/.test(String(cell0));

    // Start loop from index 10 (Row 11) to skip headers and metadata as requested
    for (let i = 10; i < rows.length; i++) {
        const row = rows[i];

        // Handling Column Shift for SECTION HEADERS
        // We look at row[0] AND row[1] to find the section header.
        const cell0 = String(row[0] || "").trim();
        const cell1 = String(row[1] || "").trim();

        // Use the first non-empty cell for detection, prioritizing cell0
        const firstCellContent = cell0 || cell1;
        const cleanCell = firstCellContent.toUpperCase().trim();

        if (cleanCell.startsWith("TAXABLE")) { currentSection = "taxable"; continue; }

        // Explicitly STOP processing if we hit Exempt or Privately Owned sections
        // This ensures subsequent rows are ignored, preventing them from bleeding into Taxable.
        if (cleanCell.startsWith("EXEMPT")) {
            currentSection = null; // previously "exempt"
            continue;
        }
        if (cleanCell.includes("RESTRICTIONS")) {
            currentSection = null; // previously "privatelyOwned"
            continue;
        }
        if (cleanCell.includes("IDLE")) { currentSection = "idle"; continue; }

        if (firstCellContent.includes("Grand Total") || firstCellContent.includes("Note:")) {
            currentSection = null;
            continue;
        }

        // Heuristic: Local Barangay header in the list 
        // If the row is NOT a data row, but has content, and we are in a section, it's likely a subheading/barangay
        if (currentSection && !isDataRow(firstCellContent) && firstCellContent.length > 2 && !firstCellContent.includes("Total")) {
            currentRowBarangay = firstCellContent;
            continue;
        }

        if (currentSection && isDataRow(firstCellContent)) {
            // Data Row processing
            // row[0] = Classification
            // row[1] = Land Area
            // row[11] (L) = MV Land
            // row[13] (N) = MV Building 1
            // row[14] (O) = MV Building 2
            // row[15] (P) = MV Building 3
            // row[16] (Q) = MV Machinery
            // row[17] (R) = MV Other
            // row[18] (S) = MV Total
            // row[19] (T) = AV Land
            // row[20] (U) = AV Building
            // row[21] (V) = AV Machinery
            // row[22] (W) = AV Other
            // row[23] (X) = AV Total

            // Determine shift: If first cell (row[0]) is empty but row[1] has content matching the section scan, shift is 1.
            // We already determined 'firstCell' as the non-empty one.
            // If row[0] is empty, offset is 1.
            const offset = (String(row[0] || "").trim() === "") ? 1 : 0;

            // row[0+offset] = Classification (Already capture in firstCell)
            // row[1+offset] = Land Area

            // MV Indices (Original -> New)
            // L(11) -> 11+offset
            // N(13) -> 13+offset
            // O(14) -> 14+offset
            // P(15) -> 15+offset
            // Q(16) -> 16+offset
            // R(17) -> 17+offset
            // S(18) -> 18+offset

            // AV Indices
            // T(19) -> 19+offset
            // U(20) -> 20+offset
            // V(21) -> 21+offset
            // W(22) -> 22+offset
            // X(23) -> 23+offset

            // Determine Building MV based on Classification
            // Determine Building MV
            // Robust approach: Sum 13, 14, and 15.
            // Residential uses 13 & 14 (15 is 0).
            // Commercial/Industrial uses 15 (13 & 14 are 0).
            // This covers "Privately Owned" or "Special" cases that might fall into either bucket.
            const mvBuilding = parseNumber(row[13]) + parseNumber(row[14]) + parseNumber(row[15]);

            const record = {
                barangay: currentRowBarangay || specificBarangay || "Unknown",
                classification: firstCellContent,
                landArea: parseNumber(row[1 + offset]),
                rpu: {
                    land: parseNumber(row[2 + offset]),
                    building: parseNumber(row[3 + offset]),
                    machinery: parseNumber(row[4 + offset]),
                    other: parseNumber(row[5 + offset]),
                    total: parseNumber(row[9 + offset]), // Adjusted index based on debug output (Index 10)
                },
                marketValue: {
                    land: parseNumber(row[11]), // L - Fixed
                    building: mvBuilding,
                    machinery: parseNumber(row[16]), // Q - Fixed
                    other: parseNumber(row[17]), // R - Fixed
                    total: parseNumber(row[18]), // S - Fixed
                },
                assessedValue: {
                    land: parseNumber(row[19]), // T - Fixed
                    building: parseNumber(row[20]), // U - Fixed
                    machinery: parseNumber(row[21]), // V - Fixed
                    other: parseNumber(row[22]), // W - Fixed
                    total: parseNumber(row[23]), // X - Fixed
                },
                tax: {
                    basic: parseNumber(row[27]),
                    sef: parseNumber(row[28]),
                    total: parseNumber(row[29])
                },
                rates: {
                    basic: String(row[24] || "").trim(),
                    sef: String(row[25] || "").trim(),
                    idle: String(row[26] || "").trim()
                }
            };
            sections[currentSection].push(record);
        }
    }

    return {
        meta: {
            lguName,
            province, // Added province
            period,
            barangay: specificBarangay,
            assessor: regionalAssessor,
            preparedBy,
            ordinance: ordinanceInfo,
            taxableLand: { ...taxableLandBreakdown, total: taxableLandTotal },
            mvValidation: mvValidationData,
            avValidation: avValidationData,
            rpuValidation: rpuValidationData,
            assessedValueTotal // Exposed for UI
        },
        sections,
        data: {
            taxable: sections.taxable,
            idle: sections.idle
        }
    };
};

const parseNumber = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/,/g, '').trim();
    if (str === '-' || str === '') return 0;
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
};
