import { useState, useEffect } from "react";
import { PROVINCES_AND_CITIES, PROPERTY_KINDS, PROPERTY_CLASSIFICATIONS } from "../../utils/qrrpa/defaultOrdinances";
import toast from "react-hot-toast";

export default function AssessmentConfig({ config, onSave, onBack }) {
    const [selectedLgu, setSelectedLgu] = useState(PROVINCES_AND_CITIES[0]);
    const [selectedKind, setSelectedKind] = useState(PROPERTY_KINDS[0]);
    const [localConfig, setLocalConfig] = useState(config);

    // When props config changes, update local
    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleRateChange = (classification, field, value) => {
        setLocalConfig(prev => ({
            ...prev,
            [selectedLgu]: {
                ...prev[selectedLgu],
                [selectedKind]: {
                    ...prev[selectedLgu]?.[selectedKind],
                    [classification]: {
                        ...prev[selectedLgu]?.[selectedKind]?.[classification],
                        [field]: value
                    }
                }
            }
        }));
    };

    const handleSave = () => {
        onSave(localConfig);
        toast.success("Assessment levels saved successfully!");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="btn btn-ghost gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <h2 className="text-xl font-bold">Assessment Level Configuration</h2>
                <div className="w-20"></div> {/* Spacer */}
            </div>

            <div className="space-y-4 bg-base-100 p-6 rounded-lg border border-base-300 shadow-sm">
                {/* Selectors */}
                <div className="form-control w-full">
                    <label className="label"><span className="label-text font-bold">Province / City Scope</span></label>
                    <select
                        className="select select-bordered w-full text-lg font-bold"
                        value={selectedLgu}
                        onChange={(e) => setSelectedLgu(e.target.value)}
                    >
                        {PROVINCES_AND_CITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="form-control w-full">
                    <label className="label"><span className="label-text font-bold">Property Classification</span></label>
                    <select
                        className="select select-bordered w-full text-lg font-bold"
                        value={selectedKind}
                        onChange={(e) => setSelectedKind(e.target.value)}
                    >
                        {PROPERTY_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>

                {/* Editable Table */}
                <div className="mt-6">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th className="text-lg">Classification</th>
                                <th className="text-center text-lg w-32">MIN (%)</th>
                                <th className="text-center text-lg w-32">MAX (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PROPERTY_CLASSIFICATIONS.map(cls => {
                                const rates = localConfig[selectedLgu]?.[selectedKind]?.[cls] || { min: 0, max: 0 };
                                return (
                                    <tr key={cls} className="hover">
                                        <td className="font-semibold text-base">{cls}</td>
                                        <td className="p-1">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-sm w-20 text-center font-mono"
                                                    value={rates.min}
                                                    onChange={(e) => handleRateChange(cls, 'min', parseFloat(e.target.value))}
                                                />
                                                <span className="ml-1 text-xs">%</span>
                                            </div>
                                        </td>
                                        <td className="p-1">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-sm w-20 text-center font-mono"
                                                    value={rates.max}
                                                    onChange={(e) => handleRateChange(cls, 'max', parseFloat(e.target.value))}
                                                />
                                                <span className="ml-1 text-xs">%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} className="btn btn-primary btn-wide">
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="alert alert-info shadow-sm">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-sm">These settings are locally saved and will be applied to all Batch Reviews for the selected Province.</span>
                </div>
            </div>
        </div>
    );
}
