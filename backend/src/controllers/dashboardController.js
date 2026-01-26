
import { LGU } from "../models/LGU.js";
import { Assessor } from "../models/Assessors.js";
import { SMVMonitoring } from "../models/SMVMonitoring.js";

export async function getDashboardStats(req, res) {
    try {
        // Parallel fetching for performance
        const [
            totalLgus,
            totalAssessors,
            assessors,
            smvProjects
        ] = await Promise.all([
            LGU.countDocuments({}),
            Assessor.countDocuments({ isActive: true }),
            Assessor.find({ isActive: true }).select('lgu officialDesignation plantillaPosition statusOfAppointment').lean(),
            SMVMonitoring.find({}).select('overallStatus complianceStatus').lean()
        ]);

        // 2. Vacant Head Assessor Calculation
        // Rule: A position is FILLED if: 
        // (Status == 'Permanent') AND (officialDesignation OR plantillaPosition is 'Provincial/City/Municipal Assessor')
        // Otherwise, if an LGU has NO such filled position, it is considered to have a VACANT Head Assessor.

        // Get all Active LGU IDs
        const allLguIds = await LGU.find({}).distinct('_id');
        const lguIdsWithFilledHead = new Set();

        const exactTitles = ["municipal assessor", "city assessor", "provincial assessor"];

        assessors.forEach(a => {
            if (!a.lgu) return; // Skip if no assigned LGU

            const oDes = (a.officialDesignation || "").toLowerCase().trim();
            const pPos = (a.plantillaPosition || "").toLowerCase().trim();
            const status = (a.statusOfAppointment || "").toLowerCase().trim();

            const isTitleMatch = exactTitles.includes(oDes) || exactTitles.includes(pPos);
            const isPermanent = status === "permanent";

            // If it's a permanent appointment to the exact head title, it's FILLED.
            if (isTitleMatch && isPermanent) {
                lguIdsWithFilledHead.add(a.lgu.toString());
            }
        });

        const vacantHeadAssessors = allLguIds.length - lguIdsWithFilledHead.size;


        // 2. SMV Stats
        const smvStats = {
            total: smvProjects.length,
            atRisk: 0,
            pipeline: {
                "Preparatory": 0,
                "Data Collection": 0,
                "Data Analysis": 0,
                "Preparation of Proposed SMV": 0,
                "Public Consultation": 0,
                "Review by RO": 0,
                "Submission to BLGF CO": 0,
                "DOF Review": 0,
                "Valuation Testing": 0,
                "Finalization": 0,
                "Completed": 0
            }
        };

        smvProjects.forEach(proj => {
            // Compliance Status
            if (['At Risk', 'Delayed', 'Overdue'].includes(proj.complianceStatus)) {
                smvStats.atRisk++;
            }

            // Pipeline Stage
            if (proj.overallStatus && smvStats.pipeline[proj.overallStatus] !== undefined) {
                smvStats.pipeline[proj.overallStatus]++;
            } else if (proj.overallStatus) {
                // Fallback for any unknown status
                if (!smvStats.pipeline["Other"]) smvStats.pipeline["Other"] = 0;
                smvStats.pipeline["Other"]++;
            }
        });

        res.status(200).json({
            totalLgus,
            totalAssessors,
            vacantHeadAssessors: Math.max(0, vacantHeadAssessors), // Ensure no negative
            smvStats
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
    }
}
