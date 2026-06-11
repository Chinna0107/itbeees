import { useState, useMemo, useCallback } from 'react';
import { Grid, Briefcase, BookOpen, Mail, Users, DollarSign, Activity, X, Download } from 'lucide-react';
import { MdVerified } from 'react-icons/md';
import { FaClock, FaStar } from 'react-icons/fa';
import { BsPeopleFill } from 'react-icons/bs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

import { adminApi } from '../utils/api.js';

const openProtectedPdf = async (url) => {
  const auth = localStorage.getItem('itbees_auth');
  const token = auth ? JSON.parse(auth).accessToken : null;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) { alert('Failed to load PDF'); return; }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), '_blank');
};

export default function AdminPanel({
    jobs = [], setJobs,
    courses = [], setCourses,
    applications = [], setApplications,
    inquiries = [], setInquiries,
    payments = [],
    logs = [],
    triggerToast,
    authUser,
    onLogout
}) {
    const [activeTab, setActiveTab] = useState('overview');

    // Job states
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newJobDept, setNewJobDept] = useState('Engineering');
    const [newJobSalary, setNewJobSalary] = useState('');
    const [newJobDesc, setNewJobDesc] = useState('');
    const [editingJobId, setEditingJobId] = useState(null);
    const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
    const [jobSubTab, setJobSubTab] = useState('postings'); // 'postings' | 'applicants'
    const [jobSaving, setJobSaving] = useState(false);

    const handleSelectJob = (job) => {
        setEditingJobId(job.id);
        setNewJobTitle(job.title);
        setNewJobDept(job.department);
        setNewJobSalary(job.salary);
        setNewJobDesc(job.description);
        setJobDrawerOpen(true);
    };

    const handleClearJobForm = () => {
        setEditingJobId(null);
        setNewJobTitle(''); setNewJobSalary(''); setNewJobDesc('');
        setNewJobDept('Engineering');
        setJobDrawerOpen(false);
    };

    // Course creator states
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseCat, setNewCourseCat] = useState('Analytics');
    const [newCoursePrice, setNewCoursePrice] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');
    const [newCourseImage, setNewCourseImage] = useState('');
    const [courseImageFile, setCourseImageFile] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [newCourseDuration, setNewCourseDuration] = useState('6 weeks');
    const [newCourseHours, setNewCourseHours] = useState(20);
    const [editingCourseId, setEditingCourseId] = useState(null);

    const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
    const [courseSaving, setCourseSaving] = useState(false);

    const handleSelectCourse = (course) => {
        setEditingCourseId(course.id);
        setNewCourseTitle(course.title);
        setNewCourseCat(course.category);
        setNewCoursePrice(String(course.price));
        setNewCourseDesc(course.description);
        setNewCourseImage(course.image || '');
        setNewCourseDuration(course.duration || '6 weeks');
        setNewCourseHours(course.hours || 20);
        setCourseDrawerOpen(true);
    };

    const handleClearCourseForm = () => {
        setEditingCourseId(null);
        setNewCourseTitle(''); setNewCoursePrice(''); setNewCourseDesc('');
        setNewCourseImage(''); setNewCourseDuration('6 weeks'); setNewCourseHours(20);
        setCourseImageFile(null);
        setCourseDrawerOpen(false);
    };

    const handleCourseImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const { url } = await adminApi.uploadImage(fd);
            setNewCourseImage(url);
            setCourseImageFile(file);
        } catch (err) {
            alert('Image upload failed: ' + err.message);
        } finally {
            setImageUploading(false);
        }
    };

    const [activeInvoice, setActiveInvoice] = useState(null);

    const handleDeleteApp = async (id) => {
        if (!window.confirm('Delete this application?')) return;
        try {
            await adminApi.deleteApplication(id);
            setApplications(prev => prev.filter(a => a.id !== id));
            triggerToast('Application deleted.');
        } catch (err) { alert(err.message); }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        setJobSaving(true);
        const payload = {
            title: newJobTitle,
            department: newJobDept,
            location: 'Hyderabad Office',
            type: 'Full-time',
            salary: newJobSalary,
            description: newJobDesc,
            requirements: ['Relevant credentials', 'Good communication']
        };
        if (editingJobId) {
            try {
                const { data } = await adminApi.updateJob(editingJobId, payload);
                setJobs(prev => prev.map(j => j.id === editingJobId ? data : j));
                triggerToast('Job updated successfully.');
                handleClearJobForm();
            } catch (err) { alert(err.message); }
            finally { setJobSaving(false); }
        } else {
            const duplicate = jobs.find(j => j.title.trim().toLowerCase() === newJobTitle.trim().toLowerCase());
            if (duplicate) { triggerToast(`⚠️ Job "${duplicate.title}" already exists.`); return; }
            try {
                const { data } = await adminApi.createJob(payload);
                setJobs(prev => [data, ...prev]);
                triggerToast('New career opening published.');
                handleClearJobForm();
            } catch (err) { alert(err.message); }
            finally { setJobSaving(false); }
        }
    };

    const handleRemoveJob = async (id) => {
        if (!window.confirm('Archive this job opening?')) return;
        try {
            await adminApi.deleteJob(id);
            setJobs(prev => prev.filter(j => j.id !== id));
            triggerToast('Job archived successfully.');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setCourseSaving(true);
        const payload = {
            title: newCourseTitle,
            category: newCourseCat,
            hours: parseInt(newCourseHours),
            duration: newCourseDuration,
            price: parseFloat(newCoursePrice),
            description: newCourseDesc,
            image: newCourseImage || null,
            rating: 'New',
            icon: '📚'
        };
        if (editingCourseId) {
            // UPDATE
            try {
                const { data } = await adminApi.updateCourse(editingCourseId, payload);
                setCourses(prev => prev.map(c => c.id === editingCourseId ? data : c));
                triggerToast('Course updated successfully.');
                handleClearCourseForm();
            } catch (err) { alert(err.message); }
            finally { setCourseSaving(false); }
        } else {
            // CREATE — check duplicate
            const duplicate = courses.find(c => c.title.trim().toLowerCase() === newCourseTitle.trim().toLowerCase());
            if (duplicate) {
                triggerToast(`⚠️ Course "${duplicate.title}" already exists (ID: ${duplicate.id.slice(0, 8)}...)`);
                return;
            }
            try {
                const { data } = await adminApi.createCourse(payload);
                setCourses(prev => [data, ...prev]);
                triggerToast('New training course published.');
                handleClearCourseForm();
            } catch (err) { alert(err.message); }
            finally { setCourseSaving(false); }
        }
    };

    const handleRemoveCourse = async (id) => {
        if (!window.confirm('Archive this training course?')) return;
        try {
            await adminApi.deleteCourse(id);
            setCourses(prev => prev.filter(c => c.id !== id));
            triggerToast('Course archived successfully.');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleInqStatus = async (inqId) => {
        try {
            await adminApi.archiveInquiry(inqId);
            setInquiries(prev => prev.map(inq => inq.id === inqId ? { ...inq, status: 'ARCHIVED' } : inq));
            triggerToast('Inquiry archived.');
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div style={{ color: 'var(--color-white)', fontSize: '13px', fontWeight: 'bold', padding: '0 16px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                    ADMIN MENU
                </div>
                <button className={`admin-sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <Grid size={16} /> Overview Stats
                </button>
                <button className={`admin-sidebar-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                    <Briefcase size={16} /> Manage Jobs
                </button>
                <button className={`admin-sidebar-btn ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
                    <BookOpen size={16} /> Manage Courses
                </button>
                <button className={`admin-sidebar-btn ${activeTab === 'inquiries' ? 'active' : ''}`} onClick={() => setActiveTab('inquiries')}>
                    <Mail size={16} /> Client Inquiries
                </button>
                <button className={`admin-sidebar-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
                    <DollarSign size={16} /> Transactions
                </button>
                <button className={`admin-sidebar-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                    <Activity size={16} /> System Logs
                </button>
                <div style={{ marginTop: 'auto', padding: '16px' }}>
                    <button className="btn-mini" style={{ color: 'var(--color-ai-lime)', width: '100%' }} onClick={onLogout}>Logout</button>
                </div>
            </aside>

            <section className="admin-content" style={{ textAlign: 'left' }}>
                {activeTab === 'overview' && (
                    <div>
                        <h2 className="heading-lg" style={{ color: 'var(--color-navy-dark)', marginBottom: '24px' }}>ADMINISTRATIVE OVERVIEW</h2>
                        
                        {/* Stat cards */}
                        <div className="analytics-grid" style={{ marginBottom: '28px' }}>
                            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-corporate-blue)' }}>
                                <div className="stat-label">📩 Inquiries</div>
                                <div className="stat-value">{inquiries.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-gold)' }}>
                                <div className="stat-label">👔 Job Applications</div>
                                <div className="stat-value">{applications.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-evergreen-glow)' }}>
                                <div className="stat-label">💳 Total Transactions</div>
                                <div className="stat-value">{payments.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-ai-lime)' }}>
                                <div className="stat-label">💰 Total Revenue</div>
                                <div className="stat-value">₹{payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString('en-IN')}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                <div className="stat-label">📚 Courses Published</div>
                                <div className="stat-value">{courses.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #9b59b6' }}>
                                <div className="stat-label">📦 Templates</div>
                                <div className="stat-value">{templates ? templates.length : 0}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #e05c5c' }}>
                                <div className="stat-label">💼 Job Postings</div>
                                <div className="stat-value">{jobs.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #1abc9c' }}>
                                <div className="stat-label">📊 Avg Transaction</div>
                                <div className="stat-value">₹{payments.length > 0 ? Math.round(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / payments.length).toLocaleString('en-IN') : 0}</div>
                            </div>
                        </div>

                        {/* Charts row */}
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            {/* Course vs Template Sales Bar Chart */}
                            <div style={{ flex: '1 1 380px', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
                                    Course vs Template Sales
                                </h3>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={(() => {
                                        const courseSales = payments.filter(p => p.type === 'COURSE').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                                        const templateSales = payments.filter(p => p.type === 'TEMPLATE').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                                        const courseCount = payments.filter(p => p.type === 'COURSE').length;
                                        const templateCount = payments.filter(p => p.type === 'TEMPLATE').length;
                                        return [
                                            { name: 'Courses', amount: courseSales, count: courseCount },
                                            { name: 'Templates', amount: templateSales, count: templateCount },
                                        ];
                                    })()} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                                            formatter={(value, name) => [name === 'amount' ? `₹${value.toLocaleString('en-IN')}` : value, name === 'amount' ? 'Revenue' : 'Count']}
                                        />
                                        <Legend formatter={(value) => <span style={{ fontSize: '12px' }}>{value === 'amount' ? 'Revenue (₹)' : 'Count'}</span>} />
                                        <Bar dataKey="amount" fill="#2395ee" radius={[6, 6, 0, 0]} name="amount" />
                                        <Bar dataKey="count" fill="#68ef3f" radius={[6, 6, 0, 0]} name="count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Transactions by Type Pie Chart */}
                            <div style={{ flex: '1 1 320px', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
                                    Transactions by Type
                                </h3>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={(() => {
                                                const coursePays = payments.filter(p => p.type === 'COURSE');
                                                const templatePays = payments.filter(p => p.type === 'TEMPLATE');
                                                const otherCount = payments.length - coursePays.length - templatePays.length;
                                                const items = [];
                                                if (coursePays.length) items.push({ name: 'Course Payments', value: coursePays.length, color: '#2395ee' });
                                                if (templatePays.length) items.push({ name: 'Template Purchases', value: templatePays.length, color: '#68ef3f' });
                                                if (otherCount > 0) items.push({ name: 'Other', value: otherCount, color: '#f59e0b' });
                                                return items.length ? items : [{ name: 'No Data', value: 1, color: '#e0e0e0' }];
                                            })()}
                                            cx="50%" cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {(() => {
                                                const data = (() => {
                                                    const coursePays = payments.filter(p => p.type === 'COURSE');
                                                    const templatePays = payments.filter(p => p.type === 'TEMPLATE');
                                                    const otherCount = payments.length - coursePays.length - templatePays.length;
                                                    const items = [];
                                                    if (coursePays.length) items.push({ name: 'Course Payments', value: coursePays.length, color: '#2395ee' });
                                                    if (templatePays.length) items.push({ name: 'Template Purchases', value: templatePays.length, color: '#68ef3f' });
                                                    if (otherCount > 0) items.push({ name: 'Other', value: otherCount, color: '#f59e0b' });
                                                    return items.length ? items : [{ name: 'No Data', value: 1, color: '#e0e0e0' }];
                                                })();
                                                return data.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ));
                                            })()}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Recent Transactions Summary */}
                            <div style={{ flex: '1 1 300px', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
                                    Recent Activity
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {payments.slice(0, 5).map((p, i) => (
                                        <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: i % 2 === 0 ? '#f8f9fc' : 'transparent' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.type === 'TEMPLATE' ? 'rgba(104,239,63,0.12)' : 'rgba(35,149,238,0.12)', flexShrink: 0 }}>
                                                {p.type === 'TEMPLATE' ? <Download size={14} color="#68ef3f" /> : <BookOpen size={14} color="#2395ee" />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {p.name || p.customerName || p.email || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#999' }}>
                                                    {p.course?.title || p.itemTitle || p.templateName || '—'} · {new Date(p.createdAt).toLocaleDateString('en-IN')}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: p.type === 'TEMPLATE' ? '#68ef3f' : '#2395ee', whiteSpace: 'nowrap' }}>
                                                ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    ))}
                                    {payments.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: '13px' }}>
                                            No transactions yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div style={{ position: 'relative' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <button
                                onClick={() => { handleClearJobForm(); setJobDrawerOpen(true); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-corporate-blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                <span style={{ fontSize: '18px', lineHeight: 1 }}>&#8250;</span> Add Job
                            </button>
                            <h2 className="heading-lg" style={{ color: 'var(--color-navy-dark)', margin: 0 }}>MANAGE JOBS</h2>
                        </div>

                        {/* Sub-tab toggle */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f0f2f5', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
                            <button onClick={() => setJobSubTab('postings')} style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: jobSubTab === 'postings' ? '#fff' : 'transparent', color: jobSubTab === 'postings' ? 'var(--color-corporate-blue)' : 'var(--color-muted-text)', boxShadow: jobSubTab === 'postings' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>Job Postings ({jobs.length})</button>
                            <button onClick={() => setJobSubTab('applicants')} style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: jobSubTab === 'applicants' ? '#fff' : 'transparent', color: jobSubTab === 'applicants' ? 'var(--color-corporate-blue)' : 'var(--color-muted-text)', boxShadow: jobSubTab === 'applicants' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>Applicants ({applications.length})</button>
                        </div>

                        {/* Job Postings Table */}
                        {jobSubTab === 'postings' && (
                            <div className="admin-table-container" style={{ width: '100%' }}>
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Department</th>
                                            <th>Location</th>
                                            <th>Type</th>
                                            <th>Salary</th>
                                            <th>Added</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map(job => (
                                            <tr key={job.id} style={{ background: editingJobId === job.id ? '#eef4ff' : undefined }}>
                                                <td><strong>{job.title}</strong><br/><span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>{job.id.slice(0, 8)}…</span></td>
                                                <td><span className="badge-blue">{job.department}</span></td>
                                                <td>{job.location}</td>
                                                <td>{job.type}</td>
                                                <td style={{ fontWeight: '700', color: 'var(--color-corporate-blue)' }}>{job.salary}</td>
                                                <td style={{ fontSize: '12px' }}>{new Date(job.createdAt).toLocaleDateString('en-IN')}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button className="btn-mini" style={{ color: 'var(--color-corporate-blue)' }} onClick={() => handleSelectJob(job)}>Edit</button>
                                                        <button className="btn-mini" style={{ color: '#d93838' }} onClick={() => handleRemoveJob(job.id)}>Remove</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {jobs.length === 0 && (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted-text)' }}>No jobs yet. Click › Add Job to get started.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Applicants Table */}
                        {jobSubTab === 'applicants' && (
                            <div className="admin-table-container" style={{ width: '100%' }}>
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Job</th>
                                            <th>Experience</th>
                                            <th>Resume</th>
                                            <th>Applied</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.map(app => (
                                            <tr key={app.id}>
                                                <td><strong>{app.name}</strong><br/><span style={{ fontSize: '11px', color: '#aaa' }}>{app.location}</span></td>
                                                <td>{app.email}</td>
                                                <td>{app.phone}</td>
                                                <td>{app.job?.title}</td>
                                                <td>{app.experience}</td>
                                                <td>
                                                    <a href={app.resumePath} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-corporate-blue)', fontSize: '12px' }}>
                                                        <Download size={12} /> View
                                                    </a>
                                                </td>
                                                <td style={{ fontSize: '12px' }}>{new Date(app.createdAt).toLocaleDateString('en-IN')}</td>
                                                <td>
                                                    <button className="btn-mini" style={{ color: '#d93838' }} onClick={() => handleDeleteApp(app.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {applications.length === 0 && (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted-text)' }}>No applications yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}



                        {/* Add/Edit Job Modal */}
                        {jobDrawerOpen && (
                            <>
                                <div onClick={handleClearJobForm} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
                                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '520px', maxHeight: '90vh', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', zIndex: 201, display: 'flex', flexDirection: 'column', animation: 'popIn 0.22s ease' }}>
                                    <style>{`@keyframes popIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.97); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'var(--color-corporate-blue)', borderRadius: '12px 12px 0 0' }}>
                                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{editingJobId ? '✏️ Edit Job' : '› Add New Job'}</div>
                                        <button onClick={handleClearJobForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-corporate-blue)' }}>
                                        <form onSubmit={handleCreateJob}>
                                            <div className="form-group">
                                                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Job Title</label>
                                                <input type="text" className="input-field" required value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} />
                                            </div>
                                            <div className="grid-2">
                                                <div className="form-group">
                                                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Department</label>
                                                    <select className="input-field" value={newJobDept} onChange={(e) => setNewJobDept(e.target.value)}>
                                                        <option value="Engineering">Engineering</option>
                                                        <option value="Analytics">Analytics</option>
                                                        <option value="Sales">Sales</option>
                                                        <option value="HR">HR</option>
                                                        <option value="Finance">Finance</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Salary</label>
                                                    <input type="text" className="input-field" required placeholder="e.g. ₹4-6 LPA" value={newJobSalary} onChange={(e) => setNewJobSalary(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Description</label>
                                                <textarea className="input-field" rows="4" required value={newJobDesc} onChange={(e) => setNewJobDesc(e.target.value)}></textarea>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={jobSaving}>{jobSaving ? 'Saving...' : (editingJobId ? 'Update Job' : 'Publish Job')}</button>
                                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleClearJobForm}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div style={{ position: 'relative' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={() => { handleClearCourseForm(); setCourseDrawerOpen(true); }}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-corporate-blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    <span style={{ fontSize: '18px', lineHeight: 1 }}>&#8250;</span> Add Course
                                </button>
                                <h2 className="heading-lg" style={{ color: 'var(--color-navy-dark)', margin: 0 }}>MANAGE COURSES</h2>
                            </div>
                        </div>

                        {/* Full-width table */}
                        <div className="admin-table-container" style={{ width: '100%' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Duration</th>
                                        <th>Hours</th>
                                        <th>Price</th>
                                        <th>Added</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(course => (
                                        <tr key={course.id} style={{ background: editingCourseId === course.id ? '#eef4ff' : undefined }}>
                                            <td>
                                                {course.image
                                                    ? <img src={course.image} alt={course.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} onError={(e) => e.target.style.display = 'none'} />
                                                    : <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={16} /></div>
                                                }
                                            </td>
                                            <td>
                                                <strong>{course.title}</strong><br/>
                                                <span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>{course.id.slice(0, 8)}…</span>
                                            </td>
                                            <td><span className="badge-blue">{course.category}</span></td>
                                            <td>{course.duration}</td>
                                            <td>{course.hours}h</td>
                                            <td style={{ fontWeight: '700', color: 'var(--color-corporate-blue)' }}>₹{Number(course.price).toLocaleString('en-IN')}</td>
                                            <td style={{ fontSize: '12px' }}>{new Date(course.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn-mini" style={{ color: 'var(--color-corporate-blue)' }} onClick={() => handleSelectCourse(course)}>Edit</button>
                                                    <button className="btn-mini" style={{ color: '#d93838' }} onClick={() => handleRemoveCourse(course.id)}>Remove</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && (
                                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted-text)' }}>No courses yet. Click › Add Course to get started.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Center modal popup */}
                        {courseDrawerOpen && (
                            <div className="modal-overlay">
                                <div className="modal-content" style={{ maxWidth: '520px' }}>
                                    {/* Modal header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'var(--color-corporate-blue)', borderRadius: '12px 12px 0 0' }}>
                                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
                                            {editingCourseId ? '✏️ Edit Course' : '› Add New Course'}
                                        </div>
                                        <button onClick={handleClearCourseForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Modal body */}
                                    <div className="modal-body" style={{ background: 'var(--color-corporate-blue)' }}>
                                        <form onSubmit={handleCreateCourse}>
                                            <div className="form-group">
                                                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Course Title</label>
                                                <input type="text" className="input-field" required value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
                                            </div>
                                            <div className="grid-2" style={{ gap: '16px' }}>
                                                <div className="form-group">
                                                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Category</label>
                                                    <select className="input-field" value={newCourseCat} onChange={(e) => setNewCourseCat(e.target.value)}>
                                                        <option value="Analytics">Analytics</option>
                                                        <option value="ERP">ERP</option>
                                                        <option value="Cloud">Cloud</option>
                                                        <option value="Python">Python</option>
                                                        <option value="Power BI">Power BI</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Price (INR)</label>
                                                    <input type="number" className="input-field" required value={newCoursePrice} onChange={(e) => setNewCoursePrice(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="grid-2" style={{ gap: '16px' }}>
                                                <div className="form-group">
                                                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Duration</label>
                                                    <input type="text" className="input-field" required placeholder="6 weeks" value={newCourseDuration} onChange={(e) => setNewCourseDuration(e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Hours</label>
                                                    <input type="number" className="input-field" required value={newCourseHours} onChange={(e) => setNewCourseHours(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Description</label>
                                                <textarea className="input-field" rows="3" required value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)}></textarea>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Course Image <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>(optional, max 5MB)</span></label>
                                                <input type="file" id="course-image-upload" hidden accept="image/*" onChange={handleCourseImageChange} />
                                                <label htmlFor="course-image-upload" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '2px dashed rgba(255,255,255,0.25)', borderRadius: '8px', cursor: imageUploading ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.05)', transition: 'all 0.15s' }}>
                                                    {imageUploading
                                                        ? <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Uploading...</span>
                                                        : newCourseImage
                                                            ? <><img src={newCourseImage} alt="Preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} /><span style={{ fontSize: '13px', color: 'var(--color-ai-lime)' }}>Image uploaded ✓</span><span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Click to change</span></>
                                                            : <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Click to upload image</span>
                                                    }
                                                </label>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={imageUploading || courseSaving}>
                                                    {courseSaving ? 'Saving...' : (editingCourseId ? 'Update Course' : 'Publish Course')}
                                                </button>
                                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleClearCourseForm}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'inquiries' && (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Client</th>
                                    <th>Message</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inquiries.map(inq => (
                                    <tr key={inq.id}>
                                        <td>{new Date(inq.createdAt).toLocaleDateString()}</td>
                                        <td><strong>{inq.name}</strong><br/>{inq.email}</td>
                                        <td>{inq.message}</td>
                                        <td><span className={`status-badge status-${inq.status.toLowerCase()}`}>{inq.status}</span></td>
                                        <td>
                                            <button className="btn-mini" onClick={() => handleInqStatus(inq.id)}>Archive</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}


                {activeTab === 'payments' && (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Course</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(pay => (
                                    <tr key={pay.id}>
                                        <td>{new Date(pay.createdAt).toLocaleDateString()}</td>
                                        <td><strong>{pay.name}</strong><br/>{pay.email}</td>
                                        <td>{pay.course?.title || pay.itemTitle || pay.templateName || pay.template?.name || '—'}</td>
                                        <td>₹{pay.amount}</td>
                                        <td><span className={`status-badge status-${pay.status.toLowerCase()}`}>{pay.status}</span></td>
                                        <td>
                                            {pay.invoice && (
                                                <button onClick={() => openProtectedPdf(`${API_URL}/admin/purchases/${pay.id}/invoice`)} style={{ color: 'var(--color-corporate-blue)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                    Download
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="card-white" style={{ backgroundColor: '#16171d', padding: '24px' }}>
                        <div style={{ height: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px', color: '#a3be8c' }}>
                            {logs.map(log => (
                                <div key={log.id} style={{ marginBottom: '8px' }}>
                                    <span style={{ color: '#88c0d0' }}>[{log.time}]</span> {log.message}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
