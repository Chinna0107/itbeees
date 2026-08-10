import { useState } from 'react';
import { X, FileText, Download, Filter, FileDown } from 'lucide-react';
import { adminApi } from '../../utils/api.js';

const exportData = (rows, filename, type) => {
  const header = ['Customer', 'Email', 'Template', 'Category', 'Amount', 'Status', 'Date'].join(',');
  const body = rows.map(r => [r.customer, r.email, r.template, r.category, r.amount, r.status, r.date].map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(','));
  const content = [header, ...body].join('\n');
  const bom = type === 'excel' ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${type}.csv`; a.click();
};

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const openProtectedPdf = async (url) => {
  const auth = localStorage.getItem('itbees_auth');
  const token = auth ? JSON.parse(auth).accessToken : null;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) { alert('Failed to load PDF'); return; }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), '_blank');
};

export default function ManageTemplates({ templates, setTemplates, triggerToast }) {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'purchases'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [templateUrl, setTemplateUrl] = useState('');
  const [image, setImage] = useState('');
  const [rating, setRating] = useState('New');
  const [features, setFeatures] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const [selectedPurchases, setSelectedPurchases] = useState([]);

  const togglePurchase = (id) => setSelectedPurchases(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllPurchases = () => setSelectedPurchases(prev => prev.length === filteredPurchases.length ? [] : filteredPurchases.map(p => p.id));

  const handleBulkDeletePurchases = async () => {
    if (!selectedPurchases.length) return;
    if (!window.confirm(`Delete ${selectedPurchases.length} purchase record(s)?`)) return;
    try {
      await Promise.all(selectedPurchases.map(id => adminApi.deletePurchase(id)));
      setPurchases(prev => prev.filter(p => !selectedPurchases.includes(p.id)));
      setSelectedPurchases([]);
      triggerToast(`${selectedPurchases.length} purchase(s) deleted.`);
    } catch (err) { alert(err.message); }
  };

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [activeFilters, setActiveFilters] = useState({
    customer: false, template: false, amount: false, date: false, status: false
  });
  const [filterValues, setFilterValues] = useState({
    customer: '', template: '', amount: '', date: '', status: ''
  });

  const filteredPurchases = purchases.filter(p => {
    if (dateFrom || dateTo) {
      const d = new Date(p.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    }
    if (filterValues.customer) {
      const val = filterValues.customer.toLowerCase();
      if (!p.name?.toLowerCase().includes(val) && !p.email?.toLowerCase().includes(val)) return false;
    }
    if (filterValues.template) {
      const val = filterValues.template.toLowerCase();
      if (!p.template?.name?.toLowerCase().includes(val)) return false;
    }
    if (filterValues.amount) {
      if (!String(p.amount).toLowerCase().includes(filterValues.amount.toLowerCase())) return false;
    }
    if (filterValues.date) {
      const val = filterValues.date.toLowerCase();
      const dateStr = new Date(p.createdAt).toLocaleDateString('en-IN').toLowerCase();
      if (!dateStr.includes(val)) return false;
    }
    if (filterValues.status) {
      if (!p.status?.toLowerCase().includes(filterValues.status.toLowerCase())) return false;
    }
    return true;
  });

  const loadPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const { data } = await adminApi.getPurchases();
      setPurchases(data.filter(p => p.type === 'TEMPLATE'));
    } catch (e) {
      console.error('Failed to load template purchases:', e);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleSelect = (template) => {
    setEditingId(template.id);
    setName(template.name);
    setCategory(template.category || 'General');
    setPrice(String(template.price));
    setDescription(template.description);
    setTemplateUrl(template.templateUrl);
    setImage(template.image || '');
    setRating(template.rating || 'New');
    setFeatures(template.features ? template.features.join('\n') : '');
    setDrawerOpen(true);
  };

  const handleClear = () => {
    setEditingId(null);
    setName(''); setCategory('General'); setPrice('');
    setDescription(''); setTemplateUrl(''); setImage('');
    setRating('New'); setFeatures('');
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

    const featuresArr = features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const payload = {
      name,
      category,
      price: parseFloat(price),
      description,
      templateUrl,
      image: image || null,
      rating: rating || 'New',
      features: featuresArr.length > 0 ? featuresArr : null
    };

    try {
      if (editingId) {
        const { data } = await adminApi.updateTemplate(editingId, payload);
        setTemplates(prev => prev.map(t => t.id === editingId ? data : t));
        triggerToast('Template updated successfully.');
      } else {
        const { data } = await adminApi.createTemplate(payload);
        setTemplates(prev => [data, ...prev]);
        triggerToast('Template created successfully.');
      }
      handleClear();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Archive this template?')) return;
    try {
      await adminApi.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      triggerToast('Template archived successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

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
              onClick={() => setActiveFilters(prev => ({ ...prev, [key]: true }))}
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

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        {activeTab === 'templates' && (
          <button onClick={() => { handleClear(); setDrawerOpen(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-corporate-blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>›</span> Add Template
          </button>
        )}
        <h2 className="heading-lg" style={{ color: 'var(--color-white)', margin: 0 }}>
          {activeTab === 'templates' ? 'MANAGE TEMPLATES' : 'TEMPLATE PURCHASES'}
        </h2>
      </div>

      {/* Sub-tab toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        {[
          ['templates', `Templates (${templates.length})`],
          ['purchases', `Purchases (${purchases.length})`]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key === 'purchases' && purchases.length === 0) loadPurchases();
            }}
            style={{
              padding: '7px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              background: activeTab === key ? 'var(--color-corporate-blue)' : 'transparent',
              color: activeTab === key ? '#fff' : 'rgba(255,255,255,0.45)'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Templates Catalog Table */}
      {activeTab === 'templates' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Rating</th>
                <th>Features</th>
                <th>Resource URL</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template.id} style={{ background: editingId === template.id ? 'rgba(35,149,238,0.08)' : undefined }}>
                  <td>
                    {template.image
                      ? <img src={template.image} alt={template.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} onError={e => e.target.style.display = 'none'} />
                      : <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} /></div>
                    }
                  </td>
                  <td>
                    <strong>{template.name}</strong>
                    <br />
                    <span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>{template.id.slice(0, 8)}…</span>
                  </td>
                  <td><span className="badge-blue">{template.category || 'General'}</span></td>
                  <td style={{ fontWeight: '700', color: 'var(--color-sky-blue)' }}>₹{Number(template.price).toLocaleString('en-IN')}</td>
                  <td><span style={{ color: 'var(--color-gold)' }}>★ {template.rating || 'New'}</span></td>
                  <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                    {template.features && Array.isArray(template.features)
                      ? template.features.slice(0, 3).map((f, i) => <div key={i}>✓ {f}</div>)
                      : '-'}
                  </td>
                  <td>
                    <a href={template.templateUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-sky-blue)', fontSize: '12px', textDecoration: 'none' }}>
                      <Download size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      Link
                    </a>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }} onClick={() => handleSelect(template)}>Edit</button>
                      <button className="btn-mini" style={{ color: '#ff6b6b' }} onClick={() => handleRemove(template.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    No templates yet. Click › Add Template to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'purchases' && (
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
            {selectedPurchases.length > 0 && (
              <button onClick={handleBulkDeletePurchases}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontSize: '12px', cursor: 'pointer' }}>
                Delete ({selectedPurchases.length})
              </button>
            )}
            <button onClick={() => exportData(filteredPurchases.map(p => ({ customer: p.name, email: p.email, template: p.template?.name || '', category: p.template?.category || '', amount: p.amount, status: p.status, date: new Date(p.createdAt).toLocaleDateString('en-IN') })), 'template_purchases', 'csv')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              <FileDown size={13} /> CSV
            </button>
            <button onClick={() => exportData(filteredPurchases.map(p => ({ customer: p.name, email: p.email, template: p.template?.name || '', category: p.template?.category || '', amount: p.amount, status: p.status, date: new Date(p.createdAt).toLocaleDateString('en-IN') })), 'template_purchases', 'excel')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(104,239,63,0.4)', background: 'rgba(104,239,63,0.08)', color: 'var(--color-ai-lime)', fontSize: '12px', cursor: 'pointer' }}>
              <FileDown size={13} /> Excel
            </button>
          </div>
        </div>
        <div className="admin-table-container">
          {purchasesLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.5)' }}>Loading purchases...</div>
          )}
          {!purchasesLoading && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>
                    <input type="checkbox" checked={selectedPurchases.length === filteredPurchases.length && filteredPurchases.length > 0} onChange={toggleAllPurchases} />
                  </th>
                  {renderFilterHeader('customer', 'Customer', 'Filter Customer...')}                  {renderFilterHeader('template', 'Template', 'Filter Template...')}
                  {renderFilterHeader('amount', 'Amount', 'Filter Amount...')}
                  {renderFilterHeader('date', 'Date', 'Filter Date...')}
                  {renderFilterHeader('status', 'Status', 'Filter Status...')}
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map(p => (
                  <tr key={p.id}>
                    <td><input type="checkbox" checked={selectedPurchases.includes(p.id)} onChange={() => togglePurchase(p.id)} /></td>
                    <td>
                      <strong>{p.name}</strong><br />
                      <span style={{ fontSize: '11px', color: '#aaa' }}>{p.email}</span>
                    </td>
                    <td>
                      <strong>{p.template?.name || 'Unknown Template'}</strong>
                      {p.template?.category && (
                        <><br /><span className="badge-blue" style={{ marginTop: '4px', display: 'inline-block' }}>{p.template.category}</span></>
                      )}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--color-sky-blue)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '12px' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><span className={`status-badge status-${(p.status || 'pending').toLowerCase()}`}>{p.status}</span></td>
                    <td>
                      {p.invoice && (
                        <button onClick={() => openProtectedPdf(`${API_URL}/admin/purchases/${p.id}/invoice`)}
                          style={{ color: 'var(--color-sky-blue)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPurchases.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                      No template purchases found.
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
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '560px', maxHeight: '90vh', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 201, display: 'flex', flexDirection: 'column', animation: 'popIn 0.22s ease' }}>
            <style>{`@keyframes popIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.97); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'var(--color-corporate-blue)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{editingId ? '✏️ Edit Template' : '› Add New Template'}</div>
              <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-corporate-blue)' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Template Name</label>
                  <input className="input-field" required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Description / Details</label>
                  <textarea className="input-field" rows="3" required value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Category</label>
                    <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                      {['General', 'Finance', 'Analytics', 'Dashboard', 'ERP', 'Cloud', 'Report', 'Template'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Price (INR)</label>
                    <input type="number" className="input-field" required value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Product URL (Cloudinary / Download link)</label>
                  <input type="url" className="input-field" placeholder="https://" required value={templateUrl} onChange={e => setTemplateUrl(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Rating</label>
                  <select className="input-field" value={rating} onChange={e => setRating(e.target.value)}>
                    {['New', '4.5', '4.0', '3.5', '3.0'].map(r => (
                      <option key={r} value={r}>{r === 'New' ? 'New' : `★ ${r}`}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Features <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>(one per line)</span>
                  </label>
                  <textarea className="input-field" rows="4" placeholder="Premium quality template&#10;Fully editable&#10;Includes source files&#10;24/7 support" value={features} onChange={e => setFeatures(e.target.value)} />
                </div>
                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Preview Image <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>(optional, max 5MB)</span></label>
                  <input type="file" id="template-image-upload" hidden accept="image/*" onChange={handleImageChange} />
                  <label htmlFor="template-image-upload" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '2px dashed rgba(255,255,255,0.25)', borderRadius: '8px', cursor: imageUploading ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                    {imageUploading
                      ? <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Uploading...</span>
                      : image
                        ? <><img src={image} alt="Preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} /><span style={{ fontSize: '13px', color: 'var(--color-ai-lime)' }}>Image uploaded ✓</span><span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Click to change</span></>
                        : <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Click to upload preview image</span>
                    }
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={imageUploading || isSaving}>
                    {isSaving ? 'Saving...' : (editingId ? 'Update Template' : 'Publish Template')}
                  </button>
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