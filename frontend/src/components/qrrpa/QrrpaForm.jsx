import React, { useState, useEffect } from "react";

export default function QrrpaForm({ form, setForm, lgus, onSubmit, onReset, error, uploadProgress = 0, records = [], userRole = 'Admin' }) {
  const [checklistData, setChecklistData] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState("");

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    setForm({ ...form, attachment: file });
  }

  // derive regions and provinces from lgus list
  const regions = Array.from(new Set(lgus.map(l => l.region).filter(Boolean))).sort();
  const provincesForRegion = (region) => {
    if (!region) return [];
    return Array.from(new Set(lgus.filter(l => l.region === region).map(l => l.province).filter(Boolean))).sort();
  };
  const provinces = provincesForRegion(form.region);
  const lgusForProvince = (province) => {
    if (!province) return [];
    return lgus.filter(l => l.province === province);
  };

  // Filter LGUs based on user role and selections
  const getFilteredLgus = () => {
    let filteredLgus = [...lgus];

    // Filter by region if selected
    if (form.region) {
      filteredLgus = filteredLgus.filter(lgu => lgu.region === form.region);
    }

    // Filter by province if selected
    if (form.province) {
      filteredLgus = filteredLgus.filter(lgu => lgu.province === form.province);
    }

    // Filter by specific LGU if selected
    if (form.lguId) {
      filteredLgus = filteredLgus.filter(lgu => (lgu._id || lgu.id) === form.lguId);
    }

    // For Regional role, only show LGUs from their region
    if (userRole === 'Regional' && form.region) {
      filteredLgus = filteredLgus.filter(lgu => lgu.region === form.region);
    }

    return filteredLgus;
  };

  // Get unique periods from records
  const periods = [...new Set(records.map(r => r.period).filter(Boolean))].sort();

  useEffect(() => {
    if (selectedPeriod && getFilteredLgus().length > 0) {
      generateChecklist();
    }
  }, [selectedPeriod, form.region, form.province, form.lguId, records, lgus]);

  const generateChecklist = () => {
    const filteredLgus = getFilteredLgus();
    const provinceGroups = {};

    filteredLgus.forEach(lgu => {
      if (!provinceGroups[lgu.province]) {
        provinceGroups[lgu.province] = {
          province: lgu.province,
          lgus: [],
          totalLgu: 0
        };
      }

      // Find the record for this LGU and period
      const record = records.find(r =>
        (r.lguId === lgu._id) ||
        (r.lguId && r.lguId._id === lgu._id) ||
        (typeof r.lguId === 'object' && r.lguId._id === lgu._id)
      );

      provinceGroups[lgu.province].lgus.push({
        ...lgu,
        status: record?.status || "Not Submitted",
        dateSubmitted: record?.dateSubmitted || null,
        remarks: record?.description || ""
      });
      provinceGroups[lgu.province].totalLgu++;
    });

    setChecklistData(provinceGroups);
  };

  // Status icon helper - removed as it's not currently used
  // const getStatusIcon = (status) => {
  //   switch (status) {
  //     case "Submitted":
  //       return <span className="text-success">✓</span>;
  //     case "Late Submission":
  //       return <span className="text-warning">⚠</span>;
  //     case "Not Submitted":
  //       return <span className="text-error">✗</span>;
  //     default:
  //       return <span className="text-neutral">○</span>;
  //   }
  // };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Submitted":
        return <span className="badge badge-success">Completed</span>;
      case "Late Submission":
        return <span className="badge badge-warning">Under review</span>;
      case "Not Submitted":
        return <span className="badge badge-error">Not Submitted</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Region */}
      <div>
        <label className="label">Region</label>
        <select className="select w-full" value={form.region || ""} onChange={(e) => { setForm({ ...form, region: e.target.value, province: "", lguId: "" }); }}>
          <option value="">All regions</option>
          {regions.map(r => (<option key={r} value={r}>{r}</option>))}
        </select>
      </div>

      {/* Province */}
      <div>
        <label className="label">Province</label>
        <select className="select w-full" value={form.province || ""} onChange={(e) => { setForm({ ...form, province: e.target.value, lguId: "" }); }}>
          <option value="">Select Province</option>
          {provinces.map(p => (<option key={p} value={p}>{p}</option>))}
        </select>
      </div>

      {/* LGU (filtered by province) */}
      <div>
        <label className="label">LGU</label>
        <select className="select w-full" value={form.lguId} onChange={(e) => setForm({ ...form, lguId: e.target.value })}>
          <option value="">Select LGU</option>
          {lgusForProvince(form.province).map((l) => (
            <option key={l._id || l.id} value={l._id || l.id}>{l.name} {l.classification ? `(${l.classification})` : ''}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="label">Period</label>
        <input className="input w-full" placeholder="2025-Q1" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
      </div>

      <div>
        <label className="label">Status</label>
        <select className="select w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>Not Submitted</option>
          <option>Submitted</option>
          <option>Late Submission</option>
        </select>
      </div>

      <div className="md:col-span-3">
        <label className="label">Description</label>
        <input className="input w-full" placeholder="notes (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="md:col-span-3">
        <label className="label">Attachment (Excel/CSV)</label>
        <input type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={handleFileChange} />
        {form.attachment && <div className="text-sm mt-2 text-base-content">Selected: {form.attachment.name}</div>}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-base-300 rounded mt-2">
            <div className="bg-primary h-2 rounded" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      {/* Checklist Section */}
      <div className="md:col-span-3">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-lg font-medium text-base-content">QRRPA Submission Checklist</h3>
          <select
            className="select select-bordered select-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="">Select Period</option>
            {periods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </div>

        {!selectedPeriod ? (
          <div className="text-center p-8 text-base-content/60">
            Please select a period to view the checklist
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="bg-primary text-primary-content">PROVINCE</th>
                    <th className="bg-primary text-primary-content">TOTAL LGU</th>
                    <th className="bg-primary text-primary-content">LGU NAME</th>
                    <th className="bg-primary text-primary-content">SUBMISSION DATE</th>
                    <th className="bg-primary text-primary-content">STATUS</th>
                    <th className="bg-primary text-primary-content">REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(checklistData)
                    .sort((a, b) => a.province.localeCompare(b.province))
                    .map(provinceData => (
                      <React.Fragment key={provinceData.province}>
                        {/* Province Header Row */}
                        <tr className="bg-base-200 font-semibold">
                          <td className="font-bold text-primary">{provinceData.province}</td>
                          <td className="font-bold">{provinceData.totalLgu}</td>
                          <td colSpan="4"></td>
                        </tr>
                        {/* LGU Rows */}
                        {provinceData.lgus
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(lgu => (
                            <tr key={lgu._id} className="hover">
                              <td></td>
                              <td></td>
                              <td className="font-medium">{lgu.name} {lgu.classification ? `(${lgu.classification})` : ''}</td>
                              <td>
                                {lgu.dateSubmitted
                                  ? new Date(lgu.dateSubmitted).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : '-'
                                }
                              </td>
                              <td>{getStatusBadge(lgu.status)}</td>
                              <td className="max-w-xs truncate">
                                {lgu.remarks || '-'}
                              </td>
                            </tr>
                          ))
                        }
                      </React.Fragment>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Summary Statistics */}
            {Object.keys(checklistData).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="card bg-base-100 shadow">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm">Total LGUs</h4>
                    <p className="text-2xl font-bold">
                      {Object.values(checklistData).reduce((sum, prov) => sum + prov.totalLgu, 0)}
                    </p>
                  </div>
                </div>
                <div className="card bg-base-100 shadow">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm">Submitted</h4>
                    <p className="text-2xl font-bold text-success">
                      {Object.values(checklistData).reduce((sum, prov) =>
                        sum + prov.lgus.filter(lgu => lgu.status === 'Submitted').length, 0
                      )}
                    </p>
                  </div>
                </div>
                <div className="card bg-base-100 shadow">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm">Under Review</h4>
                    <p className="text-2xl font-bold text-warning">
                      {Object.values(checklistData).reduce((sum, prov) =>
                        sum + prov.lgus.filter(lgu => lgu.status === 'Late Submission').length, 0
                      )}
                    </p>
                  </div>
                </div>
                <div className="card bg-base-100 shadow">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm">Not Submitted</h4>
                    <p className="text-2xl font-bold text-error">
                      {Object.values(checklistData).reduce((sum, prov) =>
                        sum + prov.lgus.filter(lgu => lgu.status === 'Not Submitted').length, 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="md:col-span-3 flex items-center space-x-2">
        <button className="btn btn-primary" type="submit">Submit</button>
        <button type="button" className="btn" onClick={onReset}>Reset</button>
        {error && <div className="text-error">{error}</div>}
      </div>
    </form>
  );
}
