import { useState, useEffect, useMemo } from 'react';
import { Award, Send, X, Eye, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi } from '../../utils/api.js';
import ceoSign from '../../assets/ceo.png';
import trainerSign from '../../assets/trainer.png';
import logo from '../../assets/logo.png';

export default function Certifications() {
  const [trainees, setTrainees] = useState([]);
  const [sentCerts, setSentCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const [activeFilters, setActiveFilters] = useState({
    name: false,
    course: false,
    email: false
  });
  const [filterValues, setFilterValues] = useState({
    name: '',
    course: '',
    email: ''
  });

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [traineesRes, certsRes] = await Promise.all([
        adminApi.getTrainees().catch(() => []),
        adminApi.getSentCertificates().catch(() => [])
      ]);

      const traineesList = Array.isArray(traineesRes) ? traineesRes : (traineesRes?.data || []);
      const certsList = Array.isArray(certsRes) ? certsRes : (certsRes?.data || []);
      setTrainees(traineesList);
      setSentCerts(certsList);
    } catch (err) {
      setError(err.message || 'Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (pay) => {
    setSending(pay.id);
    try {
      const res = await adminApi.sendCertificate(pay.id);
      const newCert = res?.data || { purchaseId: pay.id, sentAt: new Date().toISOString() };
      setSentCerts(prev => {
        const filtered = prev.filter(c => c.purchaseId !== newCert.purchaseId);
        return [...filtered, newCert];
      });
      showToast(`Certificate sent to ${pay.email} successfully!`, 'success');
    } catch (err) {
      showToast(`Failed to send certificate to ${pay.email}: ${err.message}`, 'error');
    } finally {
      setSending(null);
    }
  };

  const getCourseName = (pay) => {
    if (pay.course?.title) return pay.course.title;
    if (pay.courseTitle) return pay.courseTitle;
    if (pay.title) return pay.title;
    return 'Course';
  };

  const certMap = useMemo(() => {
    const m = {};
    sentCerts.forEach(c => {
      if (c && c.purchaseId) {
        m[c.purchaseId] = c;
      }
    });
    return m;
  }, [sentCerts]);

  const filteredTrainees = useMemo(() => {
    return trainees.filter(pay => {
      if (filterValues.name) {
        const v = filterValues.name.toLowerCase();
        if (!pay.name?.toLowerCase().includes(v)) return false;
      }
      if (filterValues.email) {
        const v = filterValues.email.toLowerCase();
        if (!pay.email?.toLowerCase().includes(v)) return false;
      }
      if (filterValues.course) {
        const v = filterValues.course.toLowerCase();
        const courseName = getCourseName(pay).toLowerCase();
        const courseId = (pay.courseId || '').toLowerCase();
        if (!courseName.includes(v) && !courseId.includes(v)) return false;
      }
      return true;
    });
  }, [trainees, filterValues]);

  const renderFilterHeader = (key, label, placeholder) => {
    const isActive = activeFilters[key];
    const value = filterValues[key];

    return (
      <th style={{ verticalAlign: 'middle', minWidth: '160px' }}>
        {isActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
            <input
              type="text"
              autoFocus
              placeholder={placeholder}
              value={value}
              onChange={e => setFilterValues(prev => ({ ...prev, [key]: e.target.value }))}
              onBlur={() => { if (!value) setActiveFilters(prev => ({ ...prev, [key]: false })); }}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(35, 149, 238, 0.3)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '12px',
                outline: 'none'
              }}
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
                padding: '2px',
                display: 'flex'
              }}
              title="Close filter"
            >
              <X size={12} />
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
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              title="Filter column"
            >
              <Filter size={12} />
            </button>
          </div>
        )}
      </th>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h2 className="heading-lg" style={{ color: 'var(--color-white)', margin: 0 }}>
          <Award size={22} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          CERTIFICATIONS
        </h2>
      </div>

      <div className="admin-table-container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
            Loading certifications...
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>
            {error}
            <div style={{ marginTop: '12px' }}>
              <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }} onClick={fetchData}>Retry</button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <table className="admin-table">
            <thead>
              <tr>
                {renderFilterHeader('name', 'Name', 'Filter Name...')}
                {renderFilterHeader('course', 'Course', 'Filter Course...')}
                {renderFilterHeader('email', 'Email', 'Filter Email...')}
                <th>Sent Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainees.map(pay => {
                const cert = certMap[pay.id];
                const sentDate = cert?.sentAt ? new Date(cert.sentAt) : null;
                const isSending = sending === pay.id;
                return (
                  <tr key={pay.id}>
                    <td><strong>{pay.name}</strong></td>
                    <td>{getCourseName(pay)}</td>
                    <td style={{ fontSize: '12px' }}>{pay.email}</td>
                    <td style={{ fontSize: '12px' }}>
                      {sentDate ? sentDate.toLocaleDateString('en-IN') : <span style={{ color: 'rgba(255,255,255,0.3)' }}>--</span>}
                    </td>
                    <td>
                      {sentDate
                        ? <span className="status-badge status-success" style={{ fontSize: '11px' }}>SENT</span>
                        : <span className="status-badge status-pending" style={{ fontSize: '11px' }}>PENDING</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-mini"
                          style={{ color: 'var(--color-sky-blue)' }}
                          onClick={() => setPreviewing(pay)}
                          title="Preview certificate"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          className="btn-mini"
                          style={{ color: isSending ? '#aaa' : (sentDate ? '#aaa' : '#68ef3f'), cursor: isSending ? 'wait' : 'pointer' }}
                          onClick={() => handleSend(pay)}
                          disabled={isSending}
                          title={sentDate ? 'Resend certificate' : 'Send certificate'}
                        >
                          <Send size={12} /> {isSending ? 'Sending...' : (sentDate ? 'Resend' : 'Send')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTrainees.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    No certification records found. Trainees with successful payments will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Certificate preview modal */}
      {previewing && (
        <div
          onClick={() => setPreviewing(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#222',
              borderRadius: '12px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
            }}
          >
            <button
              onClick={() => setPreviewing(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={16} />
            </button>

            <div style={{ padding: '30px 40px' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1414 / 1000',
                  border: 'min(1.5vw, 12px) solid #1a3c5e',
                  padding: '5% 6%',
                  background: '#fff',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#000',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Logo Watermark */}
                <img 
                  src={logo} 
                  alt="Watermark" 
                  style={{
                    position: 'absolute',
                    top: '44%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '35%',
                    opacity: 0.1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    zIndex: 0
                  }} 
                />

                {/* Content container aligned above watermark */}
                <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1a3c5e', fontSize: 'min(2.5vw, 20px)', letterSpacing: '1.5px', marginBottom: '4%' }}>
                      ITBEES GLOBAL
                    </div>
                    <div style={{ fontSize: 'min(4.5vw, 36px)', color: '#1a3c5e', textTransform: 'uppercase', marginBottom: '2%', fontWeight: 'bold' }}>
                      Certificate of Completion
                    </div>
                    <div style={{ fontSize: 'min(2vw, 15px)', color: '#555', marginBottom: '3%', fontStyle: 'italic' }}>
                      This is to certify that
                    </div>
                    <div style={{ fontSize: 'min(4vw, 32px)', color: '#d4af37', borderBottom: '2px solid #d4af37', display: 'inline-block', padding: '0 30px 4px 30px', margin: '1% 0', fontWeight: '600' }}>
                      {previewing.name}
                    </div>
                    <div style={{ fontSize: 'min(2.2vw, 16px)', color: '#333', margin: '3% 0 1%' }}>
                      has successfully completed the course
                    </div>
                    <div style={{ fontSize: 'min(3.2vw, 24px)', fontWeight: 'bold', color: '#1a3c5e' }}>
                      {getCourseName(previewing)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 'min(1.8vw, 13px)', color: '#777', marginBottom: '5%' }}>
                      Awarded on: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10%', alignItems: 'flex-end' }}>
                      <div style={{ width: '30%', textAlign: 'center' }}>
                        <img src={ceoSign} alt="CEO Signature" style={{ height: '40px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                        <div style={{ borderTop: '1px solid #444', paddingTop: '6px', fontSize: 'min(1.8vw, 12px)', color: '#555', fontWeight: '500' }}>
                          Authorized Signature
                        </div>
                      </div>
                      <div style={{ width: '30%', textAlign: 'center' }}>
                        <img src={trainerSign} alt="Trainer Signature" style={{ height: '40px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                        <div style={{ borderTop: '1px solid #444', paddingTop: '6px', fontSize: 'min(1.8vw, 12px)', color: '#555', fontWeight: '500' }}>
                          Course Instructor
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: toast.type === 'success' ? 'var(--color-navy-dark)' : '#3a1a1a',
            borderLeft: `4px solid ${toast.type === 'success' ? 'var(--color-ai-lime)' : '#ff6b6b'}`,
            color: 'var(--color-white)',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--font-aeonik)',
            minWidth: '320px',
            maxWidth: '480px',
            animation: 'slideInRight 0.3s ease'
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle size={20} color="var(--color-ai-lime)" />
            : <AlertCircle size={20} color="#ff6b6b" />
          }
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
