import { useState, useEffect } from 'react';
import { FileText, Plus, X, Trash2, Download } from 'lucide-react';
import { adminApi } from '../../utils/api.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const emptyForm = {
  clientName: '', clientEmail: '', clientPhone: '', clientAddress: '',
  description: '', amount: '', gstIncluded: true, notes: '', invoiceDate: ''
};

const openProtectedPdf = async (url) => {
  const auth = localStorage.getItem('itbees_auth');
  const token = auth ? JSON.parse(auth).accessToken : null;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) { alert('Failed to load PDF'); return; }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), '_blank');
};

export default function ExternalInvoices({ triggerToast }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExternalInvoices();
      setInvoices(Array.isArray(res?.data) ? res.data : []);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.createExternalInvoice(form);
      setInvoices(prev => [res.data, ...prev]);
      triggerToast?.('Invoice created successfully.');
      setDrawerOpen(false);
      setForm(emptyForm);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await adminApi.deleteExternalInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      triggerToast?.('Invoice deleted.');
    } catch (err) { alert(err.message); }
  };

  const f = (key) => (e) => setForm(prev => ({
    ...prev,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setDrawerOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-corporate-blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          <Plus size={14} /> New Invoice
        </button>
        <h2 className="heading-lg" style={{ color: 'var(--color-white)', margin: 0 }}>
          <FileText size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          EXTERNAL INVOICES
        </h2>
      </div>

      {/* Stats */}
      <div className="analytics-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-corporate-blue)' }}>
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{invoices.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-evergreen-glow)' }}>
          <div className="stat-label">Total Billed</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Client</th>
                <th>Description</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-sky-blue)' }}>{inv.invoiceNumber}</td>
                  <td style={{ fontSize: '12px' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                  <td>
                    <strong>{inv.clientName}</strong>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{inv.clientEmail}</div>
                  </td>
                  <td style={{ fontSize: '12px', maxWidth: '200px' }}>{inv.description}</td>
                  <td style={{ fontWeight: '700', color: 'var(--color-sky-blue)' }}>₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: inv.gstIncluded ? 'rgba(104,239,63,0.15)' : 'rgba(255,255,255,0.08)', color: inv.gstIncluded ? '#68ef3f' : 'rgba(255,255,255,0.5)' }}>
                      {inv.gstIncluded ? '18% incl.' : 'No GST'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }}
                        onClick={() => openProtectedPdf(`${API_URL}/admin/external-invoices/${inv.id}/pdf`)}>
                        <Download size={12} /> PDF
                      </button>
                      <button className="btn-mini" style={{ color: '#ff6b6b' }} onClick={() => handleDelete(inv.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                  No external invoices yet. Click New Invoice to create one.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Invoice Modal */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '560px', maxHeight: '92vh', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 201, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'var(--color-corporate-blue)', flexShrink: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Create External Invoice</div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-corporate-blue)' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Client Name *</label>
                    <input className="input-field" required value={form.clientName} onChange={f('clientName')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Client Email *</label>
                    <input type="email" className="input-field" required value={form.clientEmail} onChange={f('clientEmail')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Phone</label>
                    <input className="input-field" value={form.clientPhone} onChange={f('clientPhone')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Invoice Date</label>
                    <input type="date" className="input-field" value={form.invoiceDate} onChange={f('invoiceDate')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Address</label>
                  <input className="input-field" value={form.clientAddress} onChange={f('clientAddress')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Description / Service *</label>
                  <textarea className="input-field" rows="2" required value={form.description} onChange={f('description')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Amount (₹) *</label>
                    <input type="number" className="input-field" required min="1" value={form.amount} onChange={f('amount')} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '13px', cursor: 'pointer', paddingBottom: '8px' }}>
                      <input type="checkbox" checked={form.gstIncluded} onChange={f('gstIncluded')} />
                      GST 18% included in amount
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Notes (optional)</label>
                  <textarea className="input-field" rows="2" value={form.notes} onChange={f('notes')} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Creating...' : 'Create & Save'}</button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setDrawerOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
