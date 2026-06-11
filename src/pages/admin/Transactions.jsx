import { useState, useMemo } from 'react';
import { Filter, BookOpen, Download } from 'lucide-react';

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

export default function Transactions({ payments }) {
  const [activeFilters, setActiveFilters] = useState({
    date: false,
    customer: false,
    course: false,
    amount: false,
    status: false
  });
  const [filterValues, setFilterValues] = useState({
    date: '',
    customer: '',
    course: '',
    amount: '',
    status: ''
  });
  const [activeTab, setActiveTab] = useState('all');

  const successPayments = useMemo(() => (payments || []).filter(p => p.status === 'SUCCESS'), [payments]);
  const coursePurchases = useMemo(() => successPayments.filter(p => p.type === 'COURSE'), [successPayments]);
  const templatePurchases = useMemo(() => successPayments.filter(p => p.type === 'TEMPLATE'), [successPayments]);

  const getFilteredList = (list) => {
    return list.filter(pay => {
      if (filterValues.date) {
        const val = filterValues.date.toLowerCase();
        const dateStr = new Date(pay.createdAt).toLocaleDateString('en-IN').toLowerCase();
        if (!dateStr.includes(val)) return false;
      }
      if (filterValues.customer) {
        const val = filterValues.customer.toLowerCase();
        const matchName = pay.name?.toLowerCase().includes(val);
        const matchEmail = pay.email?.toLowerCase().includes(val);
        if (!matchName && !matchEmail) return false;
      }
      if (filterValues.course) {
        const val = filterValues.course.toLowerCase();
        const itemName = pay.course?.title || pay.itemTitle || pay.templateName || pay.template?.name || '';
        if (!itemName.toLowerCase().includes(val)) return false;
      }
      if (filterValues.amount) {
        const val = filterValues.amount.toLowerCase();
        if (!String(pay.amount).toLowerCase().includes(val)) return false;
      }
      if (filterValues.status) {
        const val = filterValues.status.toLowerCase();
        if (!pay.status?.toLowerCase().includes(val)) return false;
      }
      return true;
    });
  };

  const filteredAll = getFilteredList(successPayments);
  const filteredCourse = getFilteredList(coursePurchases);
  const filteredTemplate = getFilteredList(templatePurchases);

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

  const renderTable = (data, emptyMessage) => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            {renderFilterHeader('date', 'Date', 'Filter Date...')}
            {renderFilterHeader('customer', 'Customer', 'Filter Cust...')}
            {renderFilterHeader('course', 'Item', 'Filter Item...')}
            {renderFilterHeader('amount', 'Amount', 'Filter Amt...')}
            {renderFilterHeader('status', 'Status', 'Filter Status...')}
            <th>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {data.map(pay => (
            <tr key={pay.id}>
              <td style={{ fontSize: '12px' }}>{new Date(pay.createdAt).toLocaleDateString()}</td>
              <td><strong>{pay.name}</strong><br />{pay.email}</td>
              <td>{pay.course?.title || pay.itemTitle || pay.templateName || pay.template?.name || '—'}</td>
              <td style={{ fontWeight: '700', color: 'var(--color-sky-blue)' }}>₹{pay.amount}</td>
              <td><span className={`status-badge status-${pay.status.toLowerCase()}`}>{pay.status}</span></td>
              <td>
                {pay.invoice && (
                  <button onClick={() => openProtectedPdf(`${API_URL}/admin/purchases/${pay.id}/invoice`)} style={{ color: 'var(--color-sky-blue)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Download
                  </button>
                )}
              </td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h2 className="heading-lg" style={{ color: 'var(--color-white)', marginBottom: '24px' }}>TRANSACTIONS</h2>

      {/* Tabs: All | Course Purchases | Template Purchases */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        <button onClick={() => setActiveTab('all')} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: activeTab === 'all' ? 'var(--color-corporate-blue)' : 'transparent', color: activeTab === 'all' ? '#fff' : 'rgba(255,255,255,0.6)' }}>
          All ({successPayments.length})
        </button>
        <button onClick={() => setActiveTab('courses')} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: activeTab === 'courses' ? 'var(--color-corporate-blue)' : 'transparent', color: activeTab === 'courses' ? '#fff' : 'rgba(255,255,255,0.6)' }}>
          <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Course Purchases ({coursePurchases.length})
        </button>
        <button onClick={() => setActiveTab('templates')} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: activeTab === 'templates' ? 'var(--color-corporate-blue)' : 'transparent', color: activeTab === 'templates' ? '#fff' : 'rgba(255,255,255,0.6)' }}>
          <Download size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Template Purchases ({templatePurchases.length})
        </button>
      </div>

      {/* Stats summary */}
      <div className="analytics-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-corporate-blue)' }}>
          <div className="stat-label">All Transactions</div>
          <div className="stat-value">{successPayments.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #2395ee' }}>
          <div className="stat-label">Course Purchases</div>
          <div className="stat-value">{coursePurchases.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #68ef3f' }}>
          <div className="stat-label">Template Purchases</div>
          <div className="stat-value">{templatePurchases.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-evergreen-glow)' }}>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">₹{successPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      {activeTab === 'all' && (
        <>
          <h3 style={{ color: 'var(--color-white)', fontSize: '15px', marginBottom: '12px' }}>
            All Transactions <span style={{ fontWeight: 400, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>(Course + Template)</span>
          </h3>
          {renderTable(filteredAll, 'No transactions found.')}
        </>
      )}

      {activeTab === 'courses' && (
        <>
          <h3 style={{ color: '#2395ee', fontSize: '15px', marginBottom: '12px' }}>
            <BookOpen size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Course Purchases
          </h3>
          {renderTable(filteredCourse, 'No course purchases found.')}
        </>
      )}

      {activeTab === 'templates' && (
        <>
          <h3 style={{ color: '#68ef3f', fontSize: '15px', marginBottom: '12px' }}>
            <Download size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Template Purchases
          </h3>
          {renderTable(filteredTemplate, 'No template purchases found.')}
        </>
      )}
    </div>
  );
}