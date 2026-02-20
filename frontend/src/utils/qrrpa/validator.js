/**
 * Validates the parsed QRRPA data.
 * @param {Object} parsedData - The output from parseQrrpaCsv.
 * @param {Object} config - The Ordinance Configuration (Assessment Levels).
 * @param {string} provinceScope - The Province/City to check against in config.
 * @returns {Object} - Validation results { score: number, findings: Array<string>, errors: Array<string> }
 */
export const validateQrrpaData = (parsedData, config, provinceScope) => {
    const findings = [];
    const errors = [];
    let score = 100; // Starting score

    if (!parsedData || !parsedData.data) {
        return { score: 0, findings: [], errors: ["Invalid data structure"] };
    }

    // Rule: Validate Specific Taxable Land Area (C11-C26)
    if (parsedData.meta && parsedData.meta.taxableLand) {
        const tl = parsedData.meta.taxableLand;
        const computedTotal = tl.residential + tl.agricultural + tl.commercial + tl.industrial + tl.mineral + tl.timberland + tl.special +
            tl.special_machineries + tl.special_cultural + tl.special_scientific + tl.special_hospital +
            tl.special_lvua + tl.special_gocc + tl.special_recreation + tl.special_others;

        // Allow small rounding diff (0.05 to catch 1.0 discrepancies)
        if (Math.abs(computedTotal - tl.total) > 0.05) {
            errors.push(`[Taxable Land Area] Sum of classes (${computedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) does not match Total in C26 (${tl.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`);
        } else if (tl.total === 0) {
            findings.push(`[Taxable Land Area] Total in C26 is 0 or missing.`);
        }
    }

    // Rule: Validate RPU Vertical Totals (Col E, F, G, I against Row 26)
    // and Horizontal Totals (E+F+G+H+I vs K)
    if (parsedData.meta && parsedData.meta.rpuValidation) {
        const rp = parsedData.meta.rpuValidation;
        const keys = [
            "residential", "agricultural", "commercial", "industrial", "mineral", "timberland", "special",
            "special_machineries", "special_cultural", "special_scientific", "special_hospital",
            "special_lvua", "special_gocc", "special_recreation", "special_others"
        ];

        // 1. Vertical Validation (Sum of rows vs Total at bottom)
        // 1. Vertical Validation (Consolidated)
        const verticalErrors = [];
        const checkVertical = (categoryData, colName) => {
            const sum = keys.reduce((acc, key) => acc + (categoryData[key] || 0), 0);
            const diff = sum - categoryData.total;
            if (diff !== 0) {
                verticalErrors.push(`${colName} (Diff: ${diff})`);
            }
        };

        checkVertical(rp.land, "Land");
        checkVertical(rp.building, "Building");
        checkVertical(rp.machinery, "Machinery");
        checkVertical(rp.otherImp, "Other Improvements");

        if (verticalErrors.length > 0) {
            errors.push(`VERTICAL SUM MISMATCH in RPU (Calculated vs Row 26 Total): ${verticalErrors.join(", ")}`);
        }

        // 2. Horizontal Validation (Sum of cols vs Total in Col K)
        keys.forEach(key => {
            const rowSum = rp.land[key] + rp.building[key] + rp.machinery[key] + rp.other[key] + rp.otherImp[key];
            const rowTotal = rp.rowTotal[key];

            if (rowSum !== rowTotal) {
                // Determine row number for clearer error msg
                // keys matches index 11 to 25
                // simple mapping: residential is 11, etc.
                errors.push(`[RPU ${key}] Horizontal Sum (E+F+G+H+I = ${rowSum}) does not match Total in Col K (${rowTotal}).`);
            }
        });

        // Check K26 (Grand Total of RPUs)
        const grandTotalRowSum = rp.land.total + rp.building.total + rp.machinery.total + rp.other.total + rp.otherImp.total;
        if (grandTotalRowSum !== rp.rowTotal.total) {
            errors.push(`[RPU Grand Total] Horizontal Sum of Totals (row 26) (${grandTotalRowSum}) does not match K26 (${rp.rowTotal.total}).`);
        }
    }

    // Rule: Validate Assessment Levels (Row-based) for Building, Others
    if (parsedData.sections && parsedData.sections.taxable) {
        parsedData.sections.taxable.forEach((record, index) => {
            // We skip Land here because we use the STRICT Fixed Cell check above
            // We skip Machinery here because we use the STRICT Fixed Cell check below
            const prefix = `[Row ${index + 11}]`;

            // Only check Building, OtherImp here
            checkType("building", record.marketValue.building, record.assessedValue.building, record, prefix, findings, errors, config, provinceScope);
            // checkType("machinery", record.marketValue.machinery, record.assessedValue.machinery, record, prefix, findings, errors, config, provinceScope);
            checkType("otherImp", record.marketValue.otherImp, record.assessedValue.otherImp, record, prefix, findings, errors, config, provinceScope);
        });
    }

    // Rule: Validate Fixed Cell Assessment Levels (Land Only) - STRICT T16/L16 Logic
    if (parsedData.meta && parsedData.meta.mvValidation && parsedData.meta.avValidation) {
        checkFixedAssessmentLevels(parsedData.meta.mvValidation.land, parsedData.meta.avValidation.land, findings, errors, config, provinceScope);

        // Rule: Validate Fixed Cell Assessment Levels (Machinery Only) - STRICT V/Q Logic (User Request)
        checkFixedMachineryAssessmentLevels(parsedData.meta.mvValidation.machinery, parsedData.meta.avValidation.machinery, findings, errors, config, provinceScope);
    }
    // Rule: Validate Market Value (Column L)
    // 1. Vertical Sum (L11-L25 == L26)
    // 2. Consistency: If MV > 0, then RPU (E) > 0
    // Rule: Validate Market Value (Column L, N-P, Q, R, S)
    if (parsedData.meta && parsedData.meta.mvValidation && parsedData.meta.rpuValidation) {
        const mv = parsedData.meta.mvValidation;
        const rpu = parsedData.meta.rpuValidation;

        const keys = [
            "residential", "agricultural", "commercial", "industrial", "mineral", "timberland", "special",
            "special_machineries", "special_cultural", "special_scientific", "special_hospital",
            "special_lvua", "special_gocc", "special_recreation", "special_others"
        ];

        // 1. Vertical Validation (Consolidated)
        const verticalMVErrors = [];
        const checkVerticalMV = (categoryData, colName) => {
            const sum = keys.reduce((acc, key) => acc + (categoryData[key] || 0), 0);
            const diff = sum - categoryData.total;
            if (Math.abs(diff) > 0.05) {
                verticalMVErrors.push(`${colName} (Diff: ${diff.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);
            }
        };

        checkVerticalMV(mv.land, "Land");
        checkVerticalMV(mv.building, "Building");
        checkVerticalMV(mv.machinery, "Machinery");
        checkVerticalMV(mv.otherImp, "Other Improvements");
        checkVerticalMV(mv.rowTotal, "Grand Total");

        if (verticalMVErrors.length > 0) {
            errors.push(`VERTICAL SUM MISMATCH in MARKET VALUE (Calculated vs Row 26 Total): ${verticalMVErrors.join(", ")}`);
        }

        // 2. Horizontal Validation (L + B + M + O = S)
        keys.forEach(key => {
            const rowSum = (mv.land[key] || 0) + (mv.building[key] || 0) + (mv.machinery[key] || 0) + (mv.otherImp[key] || 0);
            const rowTotal = mv.rowTotal[key] || 0;

            if (Math.abs(rowSum - rowTotal) > 0.05) {
                errors.push(`[Market Value ${key}] Horizontal Sum (₱${rowSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}) does not match Grand Total in Col S (Market Value Grand Total) (₱${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`);
            }
        });

        // Check S26 (Grand Total of MV)
        const grandTotalRowSum = mv.land.total + mv.building.total + mv.machinery.total + mv.otherImp.total;
        if (Math.abs(grandTotalRowSum - mv.rowTotal.total) > 0.05) {
            errors.push(`[Market Value Grand Total] Horizontal Sum of Totals (row 26) (₱${grandTotalRowSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}) does not match S26 (Market Value Grand Total) (₱${mv.rowTotal.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`);
        }

        // 3. MV vs RPU Consistency
        // "make sure if Land has Market Value, it should have a rpu same goes with Building, Machinery, Other Improvemnts and Total"
        const checkConsistency = (mvVal, rpuVal, type, key) => {
            if (mvVal > 0 && (!rpuVal || rpuVal === 0)) {
                findings.push(`[${key}] Has Market Value for ${type} (₱${mvVal.toLocaleString()}) but RPU count is 0.`);
            }
        };

        keys.forEach(key => {
            checkConsistency(mv.land[key], rpu.land[key], "Land", key);
            checkConsistency(mv.building[key], rpu.building[key], "Building", key);
            checkConsistency(mv.machinery[key], rpu.machinery[key], "Machinery", key);
            // Assuming 'Other RPU' (Column I in parser) corresponds to 'Other Improvements MV' (Column R)
            checkConsistency(mv.otherImp[key], rpu.otherImp[key], "Other Improvements", key);
        });

        // Check Total Consistency
        checkConsistency(mv.land.total, rpu.land.total, "Land Total", "Total");
        checkConsistency(mv.building.total, rpu.building.total, "Building Total", "Total");
        checkConsistency(mv.machinery.total, rpu.machinery.total, "Machinery Total", "Total");
        checkConsistency(mv.otherImp.total, rpu.otherImp.total, "Other Improvements Total", "Total");
    }

    // Rule: Validate Assessed Value (Column T, U, V, W, X)
    if (parsedData.meta && parsedData.meta.avValidation && parsedData.meta.rpuValidation) {
        const av = parsedData.meta.avValidation;
        const rpu = parsedData.meta.rpuValidation;

        const keys = [
            "residential", "agricultural", "commercial", "industrial", "mineral", "timberland", "special",
            "special_machineries", "special_cultural", "special_scientific", "special_hospital",
            "special_lvua", "special_gocc", "special_recreation", "special_others"
        ];

        // 1. Vertical Validation (Consolidated)
        const verticalAVErrors = [];
        const checkVerticalAV = (categoryData, colName) => {
            const sum = keys.reduce((acc, key) => acc + (categoryData[key] || 0), 0);
            const diff = sum - categoryData.total;
            if (Math.abs(diff) > 0.05) {
                verticalAVErrors.push(`${colName} (Diff: ${diff.toLocaleString(undefined, { minimumFractionDigits: 2 })})`);
            }
        };

        checkVerticalAV(av.land, "Land");
        checkVerticalAV(av.building, "Building");
        checkVerticalAV(av.machinery, "Machinery");
        checkVerticalAV(av.otherImp, "Other Improvements");
        checkVerticalAV(av.rowTotal, "Grand Total");

        if (verticalAVErrors.length > 0) {
            errors.push(`VERTICAL SUM MISMATCH in ASSESSED VALUE (Calculated vs Row 26 Total): ${verticalAVErrors.join(", ")}`);
        }

        // 2. Horizontal Validation (T + U + V + W = X)
        keys.forEach(key => {
            const rowSum = (av.land[key] || 0) + (av.building[key] || 0) + (av.machinery[key] || 0) + (av.otherImp[key] || 0);
            const rowTotal = av.rowTotal[key] || 0;

            if (Math.abs(rowSum - rowTotal) > 0.05) {
                errors.push(`[Assessed Value ${key}] Horizontal Sum (₱${rowSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}) does not match Grand Total in Col X (Assessed Value Grand Total) (₱${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`);
            }
        });

        // Check X26 (Grand Total of AV)
        const grandTotalRowSum = av.land.total + av.building.total + av.machinery.total + av.otherImp.total;
        if (Math.abs(grandTotalRowSum - av.rowTotal.total) > 0.05) {
            errors.push(`[Assessed Value Grand Total] Horizontal Sum of Totals (row 26) (₱${grandTotalRowSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}) does not match X26 (Assessed Value Grand Total) (₱${av.rowTotal.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`);
        }

        // 3. AV vs RPU Consistency
        const checkConsistencyAV = (avVal, rpuVal, type, key) => {
            if (avVal > 0 && (!rpuVal || rpuVal === 0)) {
                findings.push(`[${key}] Has Assessed Value for ${type} (₱${avVal.toLocaleString()}) but RPU count is 0.`);
            }
        };

        keys.forEach(key => {
            checkConsistencyAV(av.land[key], rpu.land[key], "Land", key);
            checkConsistencyAV(av.building[key], rpu.building[key], "Building", key);
            checkConsistencyAV(av.machinery[key], rpu.machinery[key], "Machinery", key);
            checkConsistencyAV(av.otherImp[key], rpu.otherImp[key], "Other Improvements", key);
        });

        // Check Total Consistency
        checkConsistencyAV(av.land.total, rpu.land.total, "Land Total", "Total");
        checkConsistencyAV(av.building.total, rpu.building.total, "Building Total", "Total");
        checkConsistencyAV(av.machinery.total, rpu.machinery.total, "Machinery Total", "Total");
        checkConsistencyAV(av.otherImp.total, rpu.otherImp.total, "Other Improvements Total", "Total");
    }

    const sections = ["taxable", "exempt", "privatelyOwned", "idle"];

    sections.forEach(section => {
        const records = parsedData.data[section];
        if (!records) return;

        records.forEach((record, index) => {
            validateRecord(record, section, index + 1, findings, errors, config, provinceScope);
        });
    });

    return {
        score: Math.max(0, score - (errors.length * 5) - (findings.length * 1)),
        findings,
        errors
    };
};

const validateRecord = (record, section, rowNum, findings, errors, config, provinceScope) => {
    const prefix = `[${section.toUpperCase()} Row ${rowNum}]`;

    // Rule 0: Assessment Level Compliance (New)
    // Only applicable for Taxable properties mostly, and needs Market Value > 0
    if (section === "taxable" && config && provinceScope) {
        checkAssessmentLevels(record, prefix, findings, errors, config, provinceScope);
    }

    // Rule: Specific Taxable Land Area Check (C11-C26)
    // We only check this once per file, but here we are in record loop.
    // Instead, we should check this in the main validation function.
    // Moved logic to validateQrrpaData main body.

    // Helper for Cell Reference
    const getCellRef = (colLetter) => `[Cell ${colLetter}${rowNum}]`;

    // Rule 1: RPU Consistency
    // RPU Total should equal sum of components
    const rpuSum = record.rpu.land + record.rpu.building + record.rpu.machinery + record.rpu.other;
    if (record.rpu.total !== rpuSum) {
        errors.push(`${prefix} ${getCellRef('J')} RPU Total mismatch: Analyzed ${rpuSum} vs Reported ${record.rpu.total}`);
    }

    // Rule 2: Market Value Consistency
    const mvSum = record.marketValue.land + record.marketValue.building + record.marketValue.machinery + record.marketValue.other;
    if (Math.abs(record.marketValue.total - mvSum) > 1) {
        errors.push(`${prefix} ${getCellRef('S')} Market Value Total mismatch: Analyzed ${mvSum} vs Reported ${record.marketValue.total}`);
    }

    // Rule 3: Zero Checks
    if (record.rpu.land > 0 && record.marketValue.land === 0) {
        findings.push(`${prefix} ${getCellRef('L')} Land RPU exists (${record.rpu.land}) but Market Value is 0.`);
    }
    if (record.rpu.building > 0 && record.marketValue.building === 0) {
        findings.push(`${prefix} ${getCellRef('O')} Building RPU exists (${record.rpu.building}) but Market Value is 0.`);
    }
    if (record.rpu.machinery > 0 && record.marketValue.machinery === 0) {
        findings.push(`${prefix} ${getCellRef('Q')} Machinery RPU exists (${record.rpu.machinery}) but Market Value is 0.`);
    }
    if (record.rpu.other > 0 && record.marketValue.other === 0) {
        findings.push(`${prefix} ${getCellRef('R')} Other Imp. RPU exists (${record.rpu.other}) but Market Value is 0.`);
    }

    // Rule 4: Tax Calculation
    const taxSum = record.tax.basic + record.tax.sef;
    if (Math.abs(record.tax.total - taxSum) > 0.05) {
        errors.push(`${prefix} ${getCellRef('AD')} Tax Total mismatch: Basic(${record.tax.basic}) + SEF(${record.tax.sef}) != Total(${record.tax.total})`);
    }

    // Rule 5: Negative Values
    if (record.landArea < 0) errors.push(`${prefix} ${getCellRef('C')} Negative Land Area detected.`);
    if (record.marketValue.total < 0) errors.push(`${prefix} ${getCellRef('S')} Negative Market Value detected.`);

    // Rule 6: Rate of Levy Check (Cols Y, Z, AA)
    // If Assessed Value exists (>0), Rate should be "1" or "2" (or equivalent)
    if (record.assessedValue.total > 0) {
        // Checks for "1" or "2" (allows "1.0", "2%", etc.)
        const isValidRate = (val) => /[12]/.test(String(val || ""));

        if (!isValidRate(record.rates.basic)) {
            errors.push(`${prefix} ${getCellRef('Y')} Basic Levy Rate (Col Y) is missing/invalid (should be 1 or 2), but Assessed Value exists.`);
        }
        if (!isValidRate(record.rates.sef)) {
            errors.push(`${prefix} ${getCellRef('Z')} SEF Levy Rate (Col Z) is missing/invalid (should be 1 or 2), but Assessed Value exists.`);
        }
        // Idle rate (AA) checks: User requested reverse logic.
        // "this is not mandatory in AA11 to AA25. So we well do the reverse if there is a value in idle lands show there is a value"
        // If there IS a value, show a finding/info.
        if (record.rates.idle && /[1-9]/.test(record.rates.idle)) {
            findings.push(`${prefix} ${getCellRef('AA')} Idle/Special Levy Rate (Col AA) detected: "${record.rates.idle}". Please verify if this property is truly Idle.`);
        }
    }
};

// Helper: Check Assessment Levels
const checkAssessmentLevels = (record, prefix, findings, errors, config, provinceScope) => {
    // Basic Classification Mapping (RACIMTS)
    // We look for these keywords in the row's classification string
    const classMap = ["Residential", "Agricultural", "Commercial", "Industrial", "Mineral", "Timberland", "Timber Land", "Timber", "Special"];
    const rowClass = (record.classification || "").toUpperCase();
    const matchedClassRaw = classMap.find(c => rowClass.includes(c.toUpperCase()));

    if (!matchedClassRaw) return; // Skip if we can't identify the classification

    // Normalize "Timber Land" or "Timber" to "Timberland" for config lookup
    let matchedClass = matchedClassRaw;
    if (matchedClassRaw.toUpperCase() === "TIMBER LAND" || matchedClassRaw.toUpperCase() === "TIMBER") {
        matchedClass = "Timberland";
    }

    const checkType = (type, mv, av) => {
        if (mv > 0 && av > 0) {
            const actualRate = (av / mv) * 100;
            // config[Province][Type][Class]
            // Note: Type in config is capitalized ("Land", "Building", "Machinery")
            const typeKey = type.charAt(0).toUpperCase() + type.slice(1);
            const expected = config[provinceScope]?.[typeKey]?.[matchedClass];

            if (expected) {
                // Allow +/- 5% variance as requested by user
                // e.g. if ordinance is 20%, range is 15-25%
                const allowedMin = Math.max(0, expected.min - 5);
                const allowedMax = expected.max + 5;

                if (actualRate < allowedMin || actualRate > allowedMax) {
                    errors.push(
                        `${prefix} !!! The Effective Assessment Level of ${matchedClass} ${typeKey} is at ${actualRate.toFixed(2)}%. (should be ${expected.min}% - ${expected.max}% with +/-5% variance: ${allowedMin}-${allowedMax}%)`
                    );
                }

                // Explicitly show logic for Timberland as requested by user
                if (matchedClass === "Timberland") {
                    findings.push(`${prefix} [Logic Check] Timberland ${typeKey}: MV=${record.marketValue[type].toLocaleString()} | AV=${record.assessedValue[type].toLocaleString()} | Rate=${actualRate.toFixed(4)}% (Target: ${expected.min}-${expected.max}% -> Allowed: ${allowedMin}-${allowedMax}%)`);
                }
            } else {
                // Warning if config is missing but we have valid data
                errors.push(`${prefix} !!! ASSESSMENT LEVEL CHECK FAILED: Configuration missing for ${provinceScope} ${matchedClass} ${typeKey}. Cannot validate Assessment Level. Please check Ordinance Settings.`);
            }
        }
    };

    // Check all three property types if they exist in record
    // Note: 'other' type might not have standard assessment levels in the config structure usually
    // Config usually has Land, Building, Machinery.

    if (record.marketValue.land > 0) checkType("land", record.marketValue.land, record.assessedValue.land);
    if (record.marketValue.building > 0) checkType("building", record.marketValue.building, record.assessedValue.building);
    if (record.marketValue.machinery > 0) checkType("machinery", record.marketValue.machinery, record.assessedValue.machinery);
    // Other Improvements are mapped to "Other" in config
    if (record.marketValue.other > 0) checkType("other", record.marketValue.other, record.assessedValue.other);
};

// Helper: Check Fixed Assessment Levels (Cell-based: T11/L11, T16/L16 etc)
// This satisfies the user request to strictly validate specific cells for Land
const checkFixedAssessmentLevels = (mvLand, avLand, findings, errors, config, provinceScope) => {
    const keys = [
        "residential", "agricultural", "commercial", "industrial", "mineral", "timberland", "special",
        "special_machineries", "special_cultural", "special_scientific", "special_hospital",
        "special_lvua", "special_gocc", "special_recreation", "special_others"
    ];

    keys.forEach(key => {
        const mv = mvLand[key] || 0;
        const av = avLand[key] || 0;

        if (mv > 0 && av > 0) {
            // Map key to config class
            const classMap = {
                "residential": "Residential",
                "agricultural": "Agricultural",
                "commercial": "Commercial",
                "industrial": "Industrial",
                "mineral": "Mineral",
                "timberland": "Timberland",
                // "special" and others map to "Special"
            };
            let matchedClass = classMap[key] || "Special";

            const actualRate = (av / mv) * 100;

            // config[Province]["Land"][Class]
            const expected = config[provinceScope]?.["Land"]?.[matchedClass];

            if (expected) {
                // Allow +/- 5% variance as requested by user
                const allowedMin = Math.max(0, expected.min - 5);
                const allowedMax = expected.max + 5;

                if (actualRate < allowedMin || actualRate > allowedMax) {
                    // Use accurate cell references for error message
                    // Residential=11, Agri=12 ... Timberland=16 ...
                    const rowMap = {
                        "residential": 11, "agricultural": 12, "commercial": 13, "industrial": 14, "mineral": 15, "timberland": 16,
                        "special": 17, "special_machineries": 18, "special_cultural": 19, "special_scientific": 20, "special_hospital": 21,
                        "special_lvua": 22, "special_gocc": 23, "special_recreation": 24, "special_others": 25
                    };
                    const rowNum = rowMap[key] || "?";

                    errors.push(
                        `[Cell T${rowNum}/L${rowNum}] !!! The Effective Assessment Level of ${matchedClass} Land is at ${actualRate.toFixed(2)}%. (should be ${expected.min}% - ${expected.max}% with +/-5% variance: ${allowedMin}-${allowedMax}%)`
                    );
                }

                /* Logic Check removed
                if (key === "timberland") {
                    findings.push(`[Cell T16/L16] [Logic Check] Timberland Land: MV=${mv.toLocaleString()} | AV=${av.toLocaleString()} | Rate=${actualRate.toFixed(4)}% (Target: ${expected.min}-${expected.max}% -> Allowed: ${allowedMin}-${allowedMax}%)`);
                }
                */

            } else {
                // Config missing warning
                // findings.push(`No config for Land ${matchedClass}`);
            }
        }
    });
};

// Helper: Check Fixed Machinery Assessment Levels (Cell-based: V11/Q11 etc)
// User Request: "V11/Q11, V12/Q12... V25/Q25"
const checkFixedMachineryAssessmentLevels = (mvMachinery, avMachinery, findings, errors, config, provinceScope) => {
    const keys = [
        "residential", "agricultural", "commercial", "industrial", "mineral", "timberland", "special",
        "special_machineries", "special_cultural", "special_scientific", "special_hospital",
        "special_lvua", "special_gocc", "special_recreation", "special_others"
    ];

    // Map keys to specific rows for error reporting
    // Residential = Row 11, Agricultural = Row 12, etc.
    const rowMap = {
        "residential": 11, "agricultural": 12, "commercial": 13, "industrial": 14, "mineral": 15, "timberland": 16,
        "special": 17, "special_machineries": 18, "special_cultural": 19, "special_scientific": 20, "special_hospital": 21,
        "special_lvua": 22, "special_gocc": 23, "special_recreation": 24, "special_others": 25
    };

    keys.forEach(key => {
        const mv = mvMachinery[key] || 0;
        const av = avMachinery[key] || 0;

        if (mv > 0 && av > 0) {
            const actualRate = (av / mv) * 100;

            // Map key back to Class Name for config lookup
            const classMap = {
                "residential": "Residential", "agricultural": "Agricultural", "commercial": "Commercial",
                "industrial": "Industrial", "mineral": "Mineral", "timberland": "Timberland",
                "special": "Special", "special_machineries": "Special", "special_cultural": "Special", "special_scientific": "Special", "special_hospital": "Special",
                "special_lvua": "Special", "special_gocc": "Special", "special_recreation": "Special", "special_others": "Special"
            };
            const matchedClass = classMap[key] || "Special"; // Default to Special for subtypes

            const expected = config[provinceScope]?.["Machinery"]?.[matchedClass];

            if (expected) {
                // Allow +/- 5% variance
                const allowedMin = Math.max(0, expected.min - 5);
                const allowedMax = expected.max + 5;

                if (actualRate < allowedMin || actualRate > allowedMax) {
                    const rowNum = rowMap[key] || "?";
                    errors.push(
                        `[Cell V${rowNum}/Q${rowNum}] !!! The Effective Assessment Level of ${matchedClass} Machinery is at ${actualRate.toFixed(2)}%. (should be ${expected.min}% - ${expected.max}% with +/-5% variance: ${allowedMin}-${allowedMax}%)`
                    );
                }


            } else {
                // Config missing warning
                // errors.push(`[Configuration Error] No Machinery rate defined for ${matchedClass} in ${provinceScope}.`);
            }
        }
    });
};
