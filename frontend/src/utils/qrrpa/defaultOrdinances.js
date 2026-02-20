// Default Assessment Levels (Ordinances) for Region XIII
// Based on typical LG Code rates, editable by user.

export const PROPERTY_CLASSIFICATIONS = [
    "Residential",
    "Agricultural",
    "Commercial",
    "Industrial",
    "Mineral",
    "Timberland",
    "Special"
];

export const PROPERTY_KINDS = ["Land", "Building", "Machinery", "Other"];

export const PROVINCES_AND_CITIES = [
    "Agusan del Norte",
    "Agusan del Sur",
    "Surigao del Norte",
    "Surigao del Sur",
    "Dinagat Islands",
    "Butuan City",
    "Cabadbaran City",
    "Bayugan City",
    "Bislig City",
    "Tandag City",
    "Surigao City"
];

// Default max rates based on Local Government Code (RA 7160)
// Actual ordinances may vary, which is why we allow editing.
// Default max rates based on Local Government Code (RA 7160)
// Actual ordinances may vary, which is why we allow editing.
const createDefaultRates = (kind, lguName) => {
    // Specific Override for Agusan del Sur
    if (lguName === "Agusan del Sur" && kind === "Land") {
        return {
            "Residential": { min: 0, max: 12 },
            "Agricultural": { min: 0, max: 12 },
            "Commercial": { min: 0, max: 12 },
            "Industrial": { min: 0, max: 12 },
            "Mineral": { min: 0, max: 12 },
            "Timberland": { min: 10, max: 10 }, // 10% target -> 5-15% allowed range
            "Special": { min: 0, max: 12 }
        };
    }


    // Specific Override for Agusan del Sur Machinery (User Request)
    if (lguName === "Agusan del Sur" && kind === "Machinery") {
        return {
            "Residential": { min: 40, max: 40 }, // User: 40%
            "Agricultural": { min: 50, max: 50 }, // User: 50%
            "Commercial": { min: 80, max: 80 },
            "Industrial": { min: 80, max: 80 },
            "Mineral": { min: 0, max: 0 },
            "Timberland": { min: 0, max: 0 },
            "Special": { min: 10, max: 15 }
        };
    }

    if (kind === "Land") {
        return {
            "Residential": { min: 20, max: 20 },
            "Agricultural": { min: 40, max: 40 },
            "Commercial": { min: 50, max: 50 },
            "Industrial": { min: 50, max: 50 },
            "Mineral": { min: 50, max: 50 },
            "Timberland": { min: 20, max: 20 },
            "Special": { min: 10, max: 15 } // Actual use checks
        };
    }
    if (kind === "Building") {
        // Simplifying for defaults - users should edit based on FMV brackets if valid
        // Only setting generic defaults here
        return {
            "Residential": { min: 0, max: 60 }, // Varies by FMV
            "Agricultural": { min: 0, max: 60 },
            "Commercial": { min: 0, max: 80 },
            "Industrial": { min: 0, max: 80 },
            "Mineral": { min: 0, max: 0 }, // Usually N/A
            "Timberland": { min: 0, max: 0 },
            "Special": { min: 0, max: 0 }
        };
    }
    if (kind === "Machinery") {
        return {
            "Residential": { min: 50, max: 50 },
            "Agricultural": { min: 40, max: 40 },
            "Commercial": { min: 80, max: 80 },
            "Industrial": { min: 80, max: 80 },
            "Mineral": { min: 0, max: 0 },
            "Timberland": { min: 0, max: 0 },
            "Special": { min: 10, max: 15 }
        };
    }
    if (kind === "Other") {
        return {
            "Residential": { min: 50, max: 50 },
            "Agricultural": { min: 40, max: 40 },
            "Commercial": { min: 80, max: 80 },
            "Industrial": { min: 80, max: 80 },
            "Mineral": { min: 0, max: 0 },
            "Timberland": { min: 0, max: 0 },
            "Special": { min: 10, max: 15 }
        };
    }
    return {};
};

// Generate full default config
export const getDefaultOrdinances = () => {
    const config = {};
    PROVINCES_AND_CITIES.forEach(lgu => {
        config[lgu] = {};
        PROPERTY_KINDS.forEach(kind => {
            config[lgu][kind] = createDefaultRates(kind, lgu);
        });
    });
    return config;
};

// Helper to map Municipality to Province (for auto-detection)
export const MUNICIPALITY_TO_PROVINCE = {
    // Agusan del Norte
    "Buenavista": "Agusan del Norte", "Carmen": "Agusan del Norte", "Jabonga": "Agusan del Norte",
    "Kitcharao": "Agusan del Norte", "Las Nieves": "Agusan del Norte", "Magallanes": "Agusan del Norte",
    "Nasipit": "Agusan del Norte", "Remedios T. Romualdez": "Agusan del Norte", "Santiago": "Agusan del Norte",
    "Tubay": "Agusan del Norte",

    // Agusan del Sur
    "Bunawan": "Agusan del Sur", "Esperanza": "Agusan del Sur", "La Paz": "Agusan del Sur",
    "Loreto": "Agusan del Sur", "Prosperidad": "Agusan del Sur", "Rosario": "Agusan del Sur",
    "San Francisco": "Agusan del Sur", "San Luis": "Agusan del Sur", "Santa Josefa": "Agusan del Sur",
    "Sibagat": "Agusan del Sur", "Talacogon": "Agusan del Sur", "Trento": "Agusan del Sur",
    "Veruela": "Agusan del Sur",

    // Surigao del Norte
    "Alegria": "Surigao del Norte", "Bacuag": "Surigao del Norte", "Burgos": "Surigao del Norte",
    "Claver": "Surigao del Norte", "Dapa": "Surigao del Norte", "Del Carmen": "Surigao del Norte",
    "General Luna": "Surigao del Norte", "Gigaquit": "Surigao del Norte", "Mainit": "Surigao del Norte",
    "Malimono": "Surigao del Norte", "Pilar": "Surigao del Norte", "Placer": "Surigao del Norte",
    "San Benito": "Surigao del Norte", "San Francisco (Anao-Aon)": "Surigao del Norte",
    "San Isidro": "Surigao del Norte", "Santa Monica": "Surigao del Norte", "Sison": "Surigao del Norte",
    "Socorro": "Surigao del Norte", "Tagana-an": "Surigao del Norte", "Tubod": "Surigao del Norte",

    // Surigao del Sur
    "Barobo": "Surigao del Sur", "Bayabas": "Surigao del Sur", "Cagwait": "Surigao del Sur",
    "Cantilan": "Surigao del Sur", "Carmen": "Surigao del Sur", "Carrascal": "Surigao del Sur",
    "Cortes": "Surigao del Sur", "Hinatuan": "Surigao del Sur", "Lanuza": "Surigao del Sur",
    "Lianga": "Surigao del Sur", "Lingig": "Surigao del Sur", "Madrid": "Surigao del Sur",
    "Marihatag": "Surigao del Sur", "San Agustin": "Surigao del Sur", "San Miguel": "Surigao del Sur",
    "Tagbina": "Surigao del Sur", "Tago": "Surigao del Sur",

    // Dinagat Islands
    "Basilisa": "Dinagat Islands", "Cagdianao": "Dinagat Islands", "Dinagat": "Dinagat Islands",
    "Libjo": "Dinagat Islands", "San Jose": "Dinagat Islands",
    "Tubajon": "Dinagat Islands"
};
