import { useState } from 'react';
import { X, Download, Filter, FileDown } from 'lucide-react';
import { adminApi } from '../../utils/api.js';

const exportData = (rows, filename, type) => {
  const header = ['Name', 'Email', 'Phone', 'Job', 'Experience', 'Location', 'Resume Link', 'Applied Date'].join(',');
  const body = rows.map(r => [r.name, r.email, r.phone, r.job, r.experience, r.location, r.resume, r.date].map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(','));
  const content = [header, ...body].join('\n');
  const bom = type === 'excel' ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${type}.csv`; a.click();
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const openProtectedPdf = async (url) => {
  const auth = localStorage.getItem('itbees_auth');
  const token = auth ? JSON.parse(auth).accessToken : null;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) { alert('Failed to load PDF'); return; }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), '_blank');
};

export default function ManageJobs({ jobs, setJobs, applications, setApplications, triggerToast }) {
  const [jobSubTab, setJobSubTab] = useState('postings');
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('Engineering');
  const [newJobSalary, setNewJobSalary] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [selectedApps, setSelectedApps] = useState([]);

  const toggleApp = (id) => setSelectedApps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllApps = () => setSelectedApps(prev => prev.length === filteredApplications.length ? [] : filteredApplications.map(a => a.id));

  const handleBulkDeleteApps = async () => {
    if (!selectedApps.length) return;
    if (!window.confirm(`Delete ${selectedApps.length} application(s)?`)) return;
    try {
      await Promise.all(selectedApps.map(id => adminApi.deleteApplication(id)));
      setApplications(prev => prev.filter(a => !selectedApps.includes(a.id)));
      setSelectedApps([]);
      triggerToast(`${selectedApps.length} application(s) deleted.`);
    } catch (err) { alert(err.message); }
  };

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [activeFilters, setActiveFilters] = useState({
    candidate: false, email: false, phone: false, job: false, experience: false, applied: false
  });
  const [filterValues, setFilterValues] = useState({
    candidate: '', email: '', phone: '', job: '', experience: '', applied: ''
  });

  const filteredApplications = applications.filter(app => {
    if (dateFrom || dateTo) {
      const d = new Date(app.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    }
    if (filterValues.candidate) {
      const val = filterValues.candidate.toLowerCase();
      if (!app.name?.toLowerCase().includes(val)) return false;
    }
    if (filterValues.email) {
      const val = filterValues.email.toLowerCase();
      if (!app.email?.toLowerCase().includes(val)) return false;
    }
    if (filterValues.phone) {
      const val = filterValues.phone.toLowerCase();
      if (!app.phone?.toLowerCase().includes(val)) return false;
    }
    if (filterValues.job) {
      const val = filterValues.job.toLowerCase();
      if (!app.job?.title?.toLowerCase().includes(val)) return false;
    }
    if (filterValues.experience) {
      const val = filterValues.experience.toLowerCase();
      if (!String(app.experience || '').toLowerCase().includes(val)) return false;
    }
    if (filterValues.applied) {
      const val = filterValues.applied.toLowerCase();
      const dateStr = new Date(app.createdAt).toLocaleDateString('en-IN').toLowerCase();
      if (!dateStr.includes(val)) return false;
    }
    return true;
  });

  const renderFilterHeader = (key, label, placeholder) => {
    const isActive = activeFilters[key];
    const value = filterValues[key];

    return (
      <th style={{ verticalAlign: 'middle', minWidth: '135px' }}>
        {isActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={e => setFilterValues(prev => ({ ...prev, [key]: e.target.value }))}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(35, 149, 238, 0.3)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                width: '100%'
              }}
              autoFocus
            />
            <button
              onClick={() => {
                setActiveFilters(prev => ({ ...prev, [key]: false }));
                setFilterValues(prev => ({ ...prev, [key]: '' }));
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-sky-blue)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close filter"
            >
              <Filter size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span>{label}</span>
            <button
              onClick={() => {
                setActiveFilters(prev => ({ ...prev, [key]: true }));
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: value ? 'var(--color-sky-blue)' : 'rgba(255, 255, 255, 0.3)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              title="Filter column"
            >
              <Filter size={14} />
            </button>
          </div>
        )}
      </th>
    );
  };

  const handleSelectJob = (job) => {
    setEditingJobId(job.id);
    setNewJobTitle(job.title);
    setNewJobDept(job.department);
    setNewJobSalary(job.salary);
    setNewJobDesc(job.description);
    setJobDrawerOpen(true);
  };

  const handleClear = () => {
    setEditingJobId(null);
    setNewJobTitle(''); setNewJobSalary(''); setNewJobDesc('');
    setNewJobDept('Engineering');
    setJobDrawerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      title: newJobTitle, department: newJobDept,
      location: 'Hyderabad Office', type: 'Full-time',
      salary: newJobSalary, description: newJobDesc,
      requirements: ['Relevant credentials', 'Good communication']
    };
    if (editingJobId) {
      try {
        const { data } = await adminApi.updateJob(editingJobId, payload);
        setJobs(prev => prev.map(j => j.id === editingJobId ? data : j));
        triggerToast('Job updated successfully.');
        handleClear();
      } catch (err) { alert(err.message); }
      finally { setIsSaving(false); }
    } else {
      if (jobs.find(j => j.title.trim().toLowerCase() === newJobTitle.trim().toLowerCase())) {
        triggerToast(`⚠️ Job "${newJobTitle}" already exists.`); return;
      }
      try {
        const { data } = await adminApi.createJob(payload);
        setJobs(prev => [data, ...prev]);
        triggerToast('New career opening published.');
        handleClear();
      } catch (err) { alert(err.message); }
      finally { setIsSaving(false); }
    }
  };

  const handleRemoveJob = async (id) => {
    if (!window.confirm('Archive this job opening?')) return;
    try {
      await adminApi.deleteJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
      triggerToast('Job archived successfully.');
    } catch (err) { alert(err.message); }
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await adminApi.deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
      triggerToast('Application deleted.');
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => { handleClear(); setJobDrawerOpen(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-corporate-blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>›</span> Add Job
        </button>
        <h2 className="heading-lg" style={{ color: 'var(--color-white)', margin: 0 }}>MANAGE JOBS</h2>
      </div>

      {/* Sub-tab toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        {[['postings', `Job Postings (${jobs.length})`], ['applicants', `Applicants (${applications.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setJobSubTab(key)} style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: jobSubTab === key ? 'var(--color-corporate-blue)' : 'transparent', color: jobSubTab === key ? '#fff' : 'rgba(255,255,255,0.45)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Job Postings Table */}
      {jobSubTab === 'postings' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Department</th><th>Location</th><th>Type</th><th>Salary</th><th>Added</th><th>Action</th></tr></thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} style={{ background: editingJobId === job.id ? 'rgba(35,149,238,0.08)' : undefined }}>
                  <td><strong>{job.title}</strong><br /><span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>{job.id.slice(0, 8)}…</span></td>
                  <td><span className="badge-blue">{job.department}</span></td>
                  <td>{job.location}</td>
                  <td>{job.type}</td>
                  <td style={{ fontWeight: '700', color: 'var(--color-sky-blue)' }}>{job.salary}</td>
                  <td style={{ fontSize: '12px' }}>{new Date(job.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }} onClick={() => handleSelectJob(job)}>Edit</button>
                      <button className="btn-mini" style={{ color: '#ff6b6b' }} onClick={() => handleRemoveJob(job.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No jobs yet. Click › Add Job to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {jobSubTab === 'applicants' && (
        <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '12px' }} />
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '12px' }} />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ fontSize: '11px', color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {selectedApps.length > 0 && (
              <button onClick={handleBulkDeleteApps}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '12px', cursor: 'pointer' }}>
                Delete ({selectedApps.length})
              </button>
            )}
            <button onClick={() => exportData(filteredApplications.map(app => ({ name: app.name, email: app.email, phone: app.phone, job: app.job?.title || '', experience: app.experience || '', location: app.location || '', resume: app.resumePath || '', date: new Date(app.createdAt).toLocaleDateString('en-IN') })), 'applicants', 'csv')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              <FileDown size={13} /> CSV
            </button>
            <button onClick={() => exportData(filteredApplications.map(app => ({ name: app.name, email: app.email, phone: app.phone, job: app.job?.title || '', experience: app.experience || '', location: app.location || '', resume: app.resumePath || '', date: new Date(app.createdAt).toLocaleDateString('en-IN') })), 'applicants', 'excel')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(104,239,63,0.4)', background: 'rgba(104,239,63,0.08)', color: 'var(--color-ai-lime)', fontSize: '12px', cursor: 'pointer' }}>
              <FileDown size={13} /> Excel
            </button>
          </div>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input type="checkbox" checked={selectedApps.length === filteredApplications.length && filteredApplications.length > 0} onChange={toggleAllApps} />
                </th>
                {renderFilterHeader('candidate', 'Candidate', 'Filter Candidate...')}
                {renderFilterHeader('email', 'Email', 'Filter Email...')}
                {renderFilterHeader('phone', 'Phone', 'Filter Phone...')}
                {renderFilterHeader('job', 'Job', 'Filter Job...')}
                {renderFilterHeader('experience', 'Experience', 'Filter Exp...')}
                <th>Resume</th>
                {renderFilterHeader('applied', 'Applied', 'Filter Date...')}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map(app => (
                <tr key={app.id}>
                  <td><input type="checkbox" checked={selectedApps.includes(app.id)} onChange={() => toggleApp(app.id)} /></td>
                  <td><strong>{app.name}</strong><br /><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{app.location}</span></td>
                  <td>{app.email}</td>
                  <td>{app.phone}</td>
                  <td>{app.job?.title}</td>
                  <td>{app.experience}</td>
                  <td>
                    <a href={app.resumePath} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-sky-blue)', fontSize: '12px' }}>
                      <Download size={12} /> View
                    </a>
                  </td>
                  <td style={{ fontSize: '12px' }}>{new Date(app.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><button className="btn-mini" style={{ color: '#ff6b6b' }} onClick={() => handleDeleteApp(app.id)}>Delete</button></td>
                </tr>
              ))}
              {filteredApplications.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Add/Edit Job Modal */}
      {jobDrawerOpen && (
        <>
          <div onClick={handleClear} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '520px', maxHeight: '90vh', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 201, display: 'flex', flexDirection: 'column', animation: 'popIn 0.22s ease' }}>
            <style>{`@keyframes popIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.97); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'var(--color-corporate-blue)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{editingJobId ? '✏️ Edit Job' : '› Add New Job'}</div>
              <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-corporate-blue)' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Job Title</label>
                  <input className="input-field" required value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Department</label>
                    <select className="input-field" value={newJobDept} onChange={e => setNewJobDept(e.target.value)}>
                      {['Engineering','Analytics','Sales','HR','Finance'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Salary</label>
                    <input className="input-field" required placeholder="e.g. ₹4-6 LPA" value={newJobSalary} onChange={e => setNewJobSalary(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Description</label>
                  <textarea className="input-field" rows="4" required value={newJobDesc} onChange={e => setNewJobDesc(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSaving}>{isSaving ? 'Saving...' : (editingJobId ? 'Update Job' : 'Publish Job')}</button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleClear}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
