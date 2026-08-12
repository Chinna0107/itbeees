import { useState, useEffect } from 'react';
import { X, BookOpen, Download, Filter, FileDown } from 'lucide-react';
import { adminApi } from '../../utils/api.js';

const exportData = (rows, filename, type) => {
  const header = ['ID', 'Name', 'Email', 'Phone', 'Course', 'Date'].join(',');
  const body = rows.map(r => [r.id, r.name, r.email, r.phone, r.course, r.date].map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(','));
  const content = [header, ...body].join('\n');
  const bom = type === 'excel' ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${type}.csv`; a.click();
};

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ManageCourses({ courses, setCourses, payments = [], triggerToast }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Analytics');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');
  const [duration, setDuration] = useState('6 weeks');
  const [hours, setHours] = useState(20);
  const [imageUploading, setImageUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Trainees state - fetched directly from the dedicated /admin/trainees endpoint
  const [trainees, setTrainees] = useState([]);
  const [traineesLoading, setTraineesLoading] = useState(false);
  const [traineesError, setTraineesError] = useState(null);

  const fetchTrainees = async () => {
    setTraineesLoading(true);
    setTraineesError(null);
    try {
      const res = await adminApi.getTrainees();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setTrainees(list);
    } catch (err) {
      setTraineesError(err.message || 'Failed to load trainees');
    } finally {
      setTraineesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trainees') {
      fetchTrainees();
    }
  }, [activeTab]);

  // Build the ITBE-prefixed trainee ID
  const getTraineeId = (pay) => {
    const dateObj = new Date(pay.createdAt || pay.purchasedAt);
    const yy = String(dateObj.getFullYear()).slice(-2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');

    const sameDay = trainees
      .filter(p => {
        const d = new Date(p.createdAt || p.purchasedAt);
        return d.getDate() === dateObj.getDate() &&
               d.getMonth() === dateObj.getMonth() &&
               d.getFullYear() === dateObj.getFullYear();
      })
      .sort((a, b) => new Date(a.createdAt || a.purchasedAt) - new Date(b.createdAt || b.purchasedAt));

    const seq = sameDay.findIndex(p => p.id === pay.id) + 1;
    return `ITBE${yy}${mm}${dd}${String(seq).padStart(2, '0')}`;
  };

  const [addTraineeOpen, setAddTraineeOpen] = useState(false);
  const [traineeForm, setTraineeForm] = useState({ name: '', email: '', phone: '', courseId: '', address: '', city: '', state: '', pincode: '', country: 'india' });
  const [traineeSubmitting, setTraineeSubmitting] = useState(false);

  const handleAddTrainee = async (e) => {
    e.preventDefault();
    setTraineeSubmitting(true);
    try {
      const res = await adminApi.addTrainee(traineeForm);
      setTrainees(prev => [res.data, ...prev]);
      setAddTraineeOpen(false);
      setTraineeForm({ name: '', email: '', phone: '', courseId: '', address: '', city: '', state: '', pincode: '', country: 'india' });
      triggerToast('Trainee added successfully.');
    } catch (err) { alert(err.message); }
    finally { setTraineeSubmitting(false); }
  };

  const [selectedTrainees, setSelectedTrainees] = useState([]);

  const toggleTrainee = (id) => setSelectedTrainees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllTrainees = () => setSelectedTrainees(prev => prev.length === filteredTrainees.length ? [] : filteredTrainees.map(p => p.id));

  const handleBulkDeleteTrainees = async () => {
    if (!selectedTrainees.length) return;
    if (!window.confirm(`Delete ${selectedTrainees.length} trainee record(s)?`)) return;
    try {
      await Promise.all(selectedTrainees.map(id => adminApi.deleteTrainee(id)));
      setTrainees(prev => prev.filter(t => !selectedTrainees.includes(t.id)));
      setSelectedTrainees([]);
      triggerToast(`${selectedTrainees.length} trainee(s) deleted.`);
    } catch (err) { alert(err.message); }
  };

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [activeFilters, setActiveFilters] = useState({
    id: false, trainee: false, phone: false, course: false, date: false
  });
  const [filterValues, setFilterValues] = useState({
    id: '', trainee: '', phone: '', course: '', date: ''
  });

  const filteredTrainees = trainees.filter(pay => {
    if (dateFrom || dateTo) {
      const d = new Date(pay.createdAt || pay.purchasedAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    }
    if (filterValues.id) {
      const tId = getTraineeId(pay).toLowerCase();
      if (!tId.includes(filterValues.id.toLowerCase())) return false;
    }
    if (filterValues.trainee) {
      const val = filterValues.trainee.toLowerCase();
      const matchName = pay.name?.toLowerCase().includes(val);
      const matchEmail = pay.email?.toLowerCase().includes(val);
      if (!matchName && !matchEmail) return false;
    }
    if (filterValues.phone) {
      const val = filterValues.phone.toLowerCase();
      if (!pay.phone?.toLowerCase().includes(val)) return false;
    }
    if (filterValues.course) {
      const val = filterValues.course.toLowerCase();
      const courseId = pay.courseId?.toLowerCase() || '';
      const courseName = courses.find(c => c.id === pay.courseId)?.title?.toLowerCase() || '';
      if (!courseId.includes(val) && !courseName.includes(val)) return false;
    }
    if (filterValues.date) {
      const val = filterValues.date.toLowerCase();
      const dateStr = new Date(pay.createdAt || pay.purchasedAt).toLocaleDateString('en-IN').toLowerCase();
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

  const handleSelect = (course) => {
    setEditingId(course.id);
    setTitle(course.title);
    setCategory(course.category);
    setPrice(String(course.price));
    setDesc(course.description);
    setImage(course.image || '');
    setDuration(course.duration || '6 weeks');
    setHours(course.hours || 20);
    setDrawerOpen(true);
  };

  const handleClear = () => {
    setEditingId(null);
    setTitle(''); setPrice(''); setDesc('');
    setImage(''); setDuration('6 weeks'); setHours(20);
    setDrawerOpen(false);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url } = await adminApi.uploadImage(fd);
      setImage(url);
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const resolveUploadUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${BASE_URL}${url}`;
    return `${BASE_URL}/${url}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      title,
      category,
      hours: parseInt(hours),
      duration,
      price: parseFloat(price),
      description: desc,
      image: image || null,
      rating: 'New',
      icon: 'BOOK',
    };
    if (editingId) {
      try {
        const { data } = await adminApi.updateCourse(editingId, payload);
        setCourses(prev => prev.map(c => c.id === editingId ? data : c));
        triggerToast('Course updated successfully.');
        handleClear();
      } catch (err) { alert(err.message); }
      finally { setIsSaving(false); }
    } else {
      if (courses.find(c => c.title.trim().toLowerCase() === title.trim().toLowerCase())) {
        triggerToast(`WARNING: Course "${title}" already exists.`); return;
      }
      try {
        const { data } = await adminApi.createCourse(payload);
        setCourses(prev => [data, ...prev]);
        triggerToast('New training course published.');
        handleClear();
      } catch (err) { alert(err.message); }
      finally { setIsSaving(false); }
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Archive this course?')) return;
    try {
      await adminApi.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      triggerToast('Course archived successfully.');
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        {activeTab === 'courses' && (
          <button onClick={() => { handleClear(); setDrawerOpen(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-corporate-blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>›</span> Add Course
          </button>
        )}
        <h2 className="heading-lg" style={{ color: 'var(--color-white)', margin: 0 }}>
          {activeTab === 'courses' ? 'MANAGE COURSES' : 'COURSE TRAINEES'}
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        {[['courses', `Course Catalog (${courses.length})`], ['trainees', `Trainees (${trainees.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: activeTab === key ? 'var(--color-corporate-blue)' : 'transparent', color: activeTab === key ? '#fff' : 'rgba(255,255,255,0.45)' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'courses' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead><tr><th>Image</th><th>Title</th><th>Category</th><th>Duration</th><th>Hours</th><th>Price</th><th>Added</th><th>Action</th></tr></thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} style={{ background: editingId === course.id ? 'rgba(35,149,238,0.08)' : undefined }}>
                  <td>
                    {course.image
                      ? <img src={course.image} alt={course.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} onError={e => e.target.style.display = 'none'} />
                      : <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={16} /></div>
                    }
                  </td>
                  <td><strong>{course.title}</strong><br /><span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>{course.id.slice(0, 8)}...</span></td>
                  <td><span className="badge-blue">{course.category}</span></td>
                  <td>{course.duration}</td>
                  <td>{course.hours}h</td>
                  <td style={{ fontWeight: '700', color: 'var(--color-sky-blue)' }}>Rs.{Number(course.price).toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: '12px' }}>{new Date(course.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }} onClick={() => handleSelect(course)}>Edit</button>
                      <button className="btn-mini" style={{ color: '#ff6b6b' }} onClick={() => handleRemove(course.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No courses yet. Click › Add Course to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'trainees' && (
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
            {selectedTrainees.length > 0 && (
              <button onClick={handleBulkDeleteTrainees}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '12px', cursor: 'pointer' }}>
                Delete ({selectedTrainees.length})
              </button>
            )}
            <button onClick={() => setAddTraineeOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--color-corporate-blue)', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              + Add Trainee
            </button>
            <button onClick={() => exportData(filteredTrainees.map(pay => ({ id: getTraineeId(pay), name: pay.name, email: pay.email, phone: pay.phone, course: courses.find(c => c.id === pay.courseId)?.title || 'Unknown', date: new Date(pay.createdAt || pay.purchasedAt).toLocaleDateString('en-IN') })), 'trainees', 'csv')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              <FileDown size={13} /> CSV
            </button>
            <button onClick={() => exportData(filteredTrainees.map(pay => ({ id: getTraineeId(pay), name: pay.name, email: pay.email, phone: pay.phone, course: courses.find(c => c.id === pay.courseId)?.title || 'Unknown', date: new Date(pay.createdAt || pay.purchasedAt).toLocaleDateString('en-IN') })), 'trainees', 'excel')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(104,239,63,0.4)', background: 'rgba(104,239,63,0.08)', color: 'var(--color-ai-lime)', fontSize: '12px', cursor: 'pointer' }}>
              <FileDown size={13} /> Excel
            </button>
          </div>
        </div>
        <div className="admin-table-container">
          {traineesLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
              Loading trainees from course_purchases...
            </div>
          )}
          {traineesError && !traineesLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>
              Failed to load trainees: {traineesError}
              <div style={{ marginTop: '12px' }}>
                <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }} onClick={fetchTrainees}>Retry</button>
              </div>
            </div>
          )}
          {!traineesLoading && !traineesError && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>
                    <input type="checkbox" checked={selectedTrainees.length === filteredTrainees.length && filteredTrainees.length > 0} onChange={toggleAllTrainees} />
                  </th>
                  {renderFilterHeader('id', 'ID', 'Filter ID...')}                  {renderFilterHeader('trainee', 'Trainee', 'Filter Trainee...')}
                  {renderFilterHeader('phone', 'Phone', 'Filter Phone...')}
                  {renderFilterHeader('course', 'Course', 'Filter Course...')}
                  {renderFilterHeader('date', 'Date', 'Filter Date...')}
                </tr>
              </thead>
              <tbody>
                {filteredTrainees.map(pay => (
                  <tr key={pay.id}>
                    <td><input type="checkbox" checked={selectedTrainees.includes(pay.id)} onChange={() => toggleTrainee(pay.id)} /></td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-sky-blue)' }}>
                      {getTraineeId(pay)}
                    </td>
                    <td>
                      <strong>{pay.name}</strong><br />
                      <span style={{ fontSize: '11px', color: '#aaa' }}>{pay.email}</span>
                    </td>
                    <td>{pay.phone}</td>
                    <td>
                      <strong>{courses.find(c => c.id === pay.courseId)?.title || 'Unknown Course'}</strong>
                      {courses.find(c => c.id === pay.courseId)?.category && (
                        <><br /><span className="badge-blue" style={{ marginTop: '4px', display: 'inline-block' }}>{courses.find(c => c.id === pay.courseId)?.category}</span></>
                      )}
                    </td>
                    <td style={{ fontSize: '12px' }}>{new Date(pay.createdAt || pay.purchasedAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {filteredTrainees.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                      No trainees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        </>
      )}

      {drawerOpen && (
        <>
          <div onClick={handleClear} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '520px', maxHeight: '90vh', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 201, display: 'flex', flexDirection: 'column', animation: 'popIn 0.22s ease' }}>
            <style>{`@keyframes popIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.97); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'var(--color-corporate-blue)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{editingId ? 'Edit Course' : 'Add New Course'}</div>
              <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-corporate-blue)' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Course Title</label>
                  <input className="input-field" required value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Category</label>
                    <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                      {['Analytics','ERP','Cloud','Python','Power BI'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Price (INR)</label>
                    <input type="number" className="input-field" required value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Duration</label>
                    <input className="input-field" required placeholder="6 weeks" value={duration} onChange={e => setDuration(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Hours</label>
                    <input type="number" className="input-field" required value={hours} onChange={e => setHours(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Description</label>
                  <textarea className="input-field" rows="3" required value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Course Image <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>(optional, max 5MB)</span></label>
                  <input type="file" id="course-image-upload" hidden accept="image/*" onChange={handleImageChange} />
                  <label htmlFor="course-image-upload" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '2px dashed rgba(255,255,255,0.25)', borderRadius: '8px', cursor: imageUploading ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                    {imageUploading
                      ? <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Uploading...</span>
                      : image
                        ? <><img src={image} alt="Preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} /><span style={{ fontSize: '13px', color: 'var(--color-ai-lime)' }}>Image uploaded</span><span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Click to change</span></>
                        : <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Click to upload image</span>
                    }
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={imageUploading || isSaving}>{isSaving ? 'Saving...' : (editingId ? 'Update Course' : 'Publish Course')}</button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleClear}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      {addTraineeOpen && (
        <>
          <div onClick={() => setAddTraineeOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '520px', maxHeight: '90vh', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 201, display: 'flex', flexDirection: 'column', animation: 'popIn 0.22s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'var(--color-corporate-blue)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Add Trainee</div>
              <button onClick={() => setAddTraineeOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-corporate-blue)' }}>
              <form onSubmit={handleAddTrainee}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Course</label>
                  <select className="input-field" required value={traineeForm.courseId} onChange={e => setTraineeForm(p => ({ ...p, courseId: e.target.value }))}>
                    <option value="">Select a course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Full Name</label>
                  <input className="input-field" required placeholder="Anil Kumar" value={traineeForm.name} onChange={e => setTraineeForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Email Address</label>
                  <input type="email" className="input-field" required placeholder="anil@example.com" value={traineeForm.email} onChange={e => setTraineeForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Phone Number</label>
                  <input type="tel" className="input-field" required placeholder="+91 98765 43210" value={traineeForm.phone} onChange={e => setTraineeForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Country</label>
                  <select className="input-field" value={traineeForm.country} onChange={e => setTraineeForm(p => ({ ...p, country: e.target.value, state: '', pincode: '' }))}>
                    <option value="india">India</option>
                    <option value="other">Other Country</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Address</label>
                  <input className="input-field" placeholder="House No, Street, Area" value={traineeForm.address} onChange={e => setTraineeForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>City</label>
                    <input className="input-field" placeholder="Hyderabad" value={traineeForm.city} onChange={e => setTraineeForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  {traineeForm.country === 'india' && (
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>State</label>
                      <input className="input-field" placeholder="Telangana" value={traineeForm.state} onChange={e => setTraineeForm(p => ({ ...p, state: e.target.value }))} />
                    </div>
                  )}
                </div>
                {traineeForm.country === 'india' && (
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Pincode</label>
                    <input className="input-field" placeholder="500032" maxLength="6" value={traineeForm.pincode} onChange={e => setTraineeForm(p => ({ ...p, pincode: e.target.value }))} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={traineeSubmitting}>{traineeSubmitting ? 'Adding...' : 'Add Trainee'}</button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setAddTraineeOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}