
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
            smvProjects,
            recentSmvUpdates
        ] = await Promise.all([
            LGU.countDocuments({}),
            Assessor.countDocuments({ isActive: true, statusOfAppointment: { $ne: 'Retired' } }),
            Assessor.find({ isActive: true }).select('lgu officialDesignation plantillaPosition statusOfAppointment').lean(),
            SMVMonitoring.find({}).select('overallStatus complianceStatus').lean(),
            SMVMonitoring.find({}).sort({ updatedAt: -1 }).limit(5).populate('lguId', 'name classification province').lean()
        ]);

        // 2. Vacant Head Assessor Calculation
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

            if (isTitleMatch && isPermanent) {
                lguIdsWithFilledHead.add(a.lgu.toString());
            }
        });

        const vacantHeadAssessors = allLguIds.length - lguIdsWithFilledHead.size;

        // 3. SMV Stats for Graphs
        const pipelineCounts = {
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
        };

        const riskCounts = {
            "On Track": 0,
            "Delayed": 0,
            "At Risk": 0,
            "Overdue": 0
        };

        smvProjects.forEach(proj => {
            // Pipeline Stage
            if (proj.overallStatus && pipelineCounts[proj.overallStatus] !== undefined) {
                pipelineCounts[proj.overallStatus]++;
            }

            // Compliance Status
            const cStatus = proj.complianceStatus || 'On Track';
            if (riskCounts[cStatus] !== undefined) {
                riskCounts[cStatus]++;
            }
        });

        // Format for Recharts
        const formattedPipeline = Object.entries(pipelineCounts).map(([name, count]) => ({ name, count }));
        const formattedRisk = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));

        const smvStats = {
            total: smvProjects.length,
            atRisk: riskCounts['At Risk'] + riskCounts['Delayed'] + riskCounts['Overdue'],
            pipeline: formattedPipeline,
            riskBreakdown: formattedRisk
        };

        // 4. Recent Activities
        const recentActivities = recentSmvUpdates.map(proj => ({
            id: proj._id,
            type: 'SMV Update',
            lguName: proj.lguId?.name || 'Unknown LGU',
            lguType: proj.lguId?.classification || '',
            status: proj.overallStatus,
            date: proj.updatedAt
        }));

        res.status(200).json({
            totalLgus,
            totalAssessors,
            vacantHeadAssessors: Math.max(0, vacantHeadAssessors), // Ensure no negative
            smvStats,
            recentActivities
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
    }
}
