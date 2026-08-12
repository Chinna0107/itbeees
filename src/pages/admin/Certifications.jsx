import { useState, useEffect, useMemo } from 'react';
import { Award, Send, X, Eye, Filter, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi } from '../../utils/api.js';
import ceoSign from '../../assets/ceo.png';
import trainerSign from '../../assets/trainer.png';
import logo from '../../assets/logo.png';
import chartsImg from '../../assets/charts.png';
import homeImg from '../../assets/home.png';
import certBg from '../../assets/certbg.png';

export default function Certifications() {
  const [trainees, setTrainees] = useState([]);
  const [sentCerts, setSentCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);

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
      setSentCerts(prev => [...prev.filter(c => c.purchaseId !== newCert.purchaseId), newCert]);
      showToast(`Certificate sent to ${pay.email} successfully!`, 'success');
    } catch (err) {
      showToast(`Failed to send certificate to ${pay.email}: ${err.message}`, 'error');
    } finally {
      setSending(null);
    }
  };

  const handleBulkSend = async () => {
    if (!selected.length) return;
    const targets = filteredTrainees.filter(p => selected.includes(p.id));
    if (!window.confirm(`Send certificates to ${targets.length} trainee(s)?`)) return;
    setBulkSending(true);
    let successCount = 0, failCount = 0;
    for (const pay of targets) {
      try {
        const res = await adminApi.sendCertificate(pay.id);
        const newCert = res?.data || { purchaseId: pay.id, sentAt: new Date().toISOString() };
        setSentCerts(prev => [...prev.filter(c => c.purchaseId !== newCert.purchaseId), newCert]);
        successCount++;
      } catch { failCount++; }
    }
    setBulkSending(false);
    setSelected([]);
    showToast(
      failCount === 0
        ? `${successCount} certificate(s) sent successfully!`
        : `${successCount} sent, ${failCount} failed.`,
      failCount === 0 ? 'success' : 'error'
    );
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(prev => prev.length === filteredTrainees.length ? [] : filteredTrainees.map(p => p.id));

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

      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '10px 16px', background: 'rgba(104,239,63,0.08)', border: '1px solid rgba(104,239,63,0.25)', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{selected.length} trainee(s) selected</span>
          <button
            onClick={handleBulkSend}
            disabled={bulkSending}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '6px', border: 'none', background: 'var(--color-ai-lime)', color: '#1a1a1a', fontSize: '13px', fontWeight: '700', cursor: bulkSending ? 'wait' : 'pointer' }}
          >
            <Send size={13} /> {bulkSending ? 'Sending...' : `Send ${selected.length} Certificate(s)`}
          </button>
          <button onClick={() => setSelected([])} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

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
                <th style={{ width: '36px' }}>
                  <input type="checkbox" checked={filteredTrainees.length > 0 && selected.length === filteredTrainees.length} onChange={toggleSelectAll} />
                </th>
                {renderFilterHeader('name', 'Name', 'Filter Name...')}
                {renderFilterHeader('course', 'Course', 'Filter Course...')}
                {renderFilterHeader('email', 'Email', 'Filter Email...')}
                <th>Start Date</th>
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
                    <td><input type="checkbox" checked={selected.includes(pay.id)} onChange={() => toggleSelect(pay.id)} /></td>
                    <td><strong>{pay.name}</strong></td>
                    <td>{getCourseName(pay)}</td>
                    <td style={{ fontSize: '12px' }}>{pay.email}</td>
                    <td style={{ fontSize: '12px' }}>
                      {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-IN') : <span style={{ color: 'rgba(255,255,255,0.3)' }}>--</span>}
                    </td>
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
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    No certification records found. Trainees with successful payments will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Certificate preview modal — ITBEES design */}
      {previewing && (() => {
        const courseName = getCourseName(previewing);
        const today = new Date();
        const completionDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        const dateObj = new Date(previewing.createdAt || previewing.purchasedAt || today);
        const yy = String(dateObj.getFullYear()).slice(-2);
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const sameDay = trainees
          .filter(p => {
            const d = new Date(p.createdAt || p.purchasedAt);
            return d.getDate() === dateObj.getDate() && d.getMonth() === dateObj.getMonth() && d.getFullYear() === dateObj.getFullYear();
          })
          .sort((a, b) => new Date(a.createdAt || a.purchasedAt) - new Date(b.createdAt || b.purchasedAt));
        const seq = String((sameDay.findIndex(p => p.id === previewing.id) + 1) || 1).padStart(2, '0');
        const certId = `ITBE${yy}${mm}${dd}${seq}`;
        const courseHours = previewing.course?.hours || previewing.hours || '';
        const courseDuration = previewing.course?.duration || previewing.duration || '';
        const durationLabel = courseHours && courseDuration
          ? `${courseHours} Hours / ${courseDuration}`
          : courseHours
            ? `${courseHours} Hours`
            : courseDuration || '____';
        return (
          <div
            onClick={() => setPreviewing(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.88)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                borderRadius: '14px',
                maxWidth: '1050px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setPreviewing(null)}
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '-14px',
                  background: '#ff4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                <X size={16} />
              </button>

              {/* ─── CERTIFICATE OVERLAY (ABSOLUTE POSITIONING) ─── */}
              <div style={{
                position: 'relative',
                width: '1000px',
                height: '666.6px', // 1536x1024 aspect ratio from certbg.png
                backgroundImage: `url(${certBg})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                boxShadow: '0 0 20px rgba(0,0,0,0.15)',
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: '#000',
                overflow: 'hidden'
              }}>

                {/* ── TOP HEADER ── */}
                <div style={{ position: 'absolute', top: '17%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', lineHeight: 1 }}>
                    ITBEES Global Pvt. Ltd.
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginTop: '2px', letterSpacing: '1px', fontWeight: '500' }}>
                    Smart Cloud &nbsp;|&nbsp; BI Analytics &nbsp;|&nbsp; ERP Solutions
                  </div>
                </div>

                {/* ── SUBTITLE ── */}
                <div style={{ position: 'absolute', top: '37%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '18px', color: '#333' }}>
                    This is to certify that
                  </div>
                </div>

                {/* ── DYNAMIC TRAINEE NAME ── */}
                <div style={{ position: 'absolute', top: '39.5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '60%' }}>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: '#0b2a6b', letterSpacing: '1px' }}>
                    {previewing.name}
                  </div>
                </div>

                {/* ── COURSE INFO ── */}
                <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '80%' }}>
                  <div style={{ fontSize: '16px', color: '#333' }}>
                    has successfully completed the <span style={{ color: '#0b2a6b', fontWeight: '700' }}>professional training program</span> in
                  </div>
                </div>

                {/* ── DYNAMIC COURSE NAME ── */}
                <div style={{ position: 'absolute', top: '48.5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '50%' }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#0b2a6b' }}>
                    {courseName}
                  </div>
                </div>

                {/* ── CONDUCTED BY ── */}
                <div style={{ position: 'absolute', top: '54.5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '16px', color: '#333' }}>
                    conducted by <strong style={{ color: '#0b2a6b' }}>ITBEES Global Pvt. Ltd.</strong>
                  </div>
                </div>

                {/* ── DESCRIPTION ── */}
                <div style={{ position: 'absolute', top: '59.5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '80%', lineHeight: '1.7' }}>
                  <div style={{ fontSize: '11.5px', color: '#333' }}>
                    The training was designed with an industry-oriented curriculum, covering practical applications, real-time scenarios, and hands-on exercises in Business Intelligence, Data Analytics and related technologies.<br />
                    The participant has demonstrated <strong style={{ color: '#0b2a6b' }}>commitment, proficiency</strong>, and <strong style={{ color: '#0b2a6b' }}>practical</strong> understanding during the course tenure.
                  </div>
                </div>

                {/* ── QR CODE (Production link) ── */}
                <div style={{ position: 'absolute', bottom: '14%', left: '11%', padding: '0' }}>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=https://www.itbeesglobal.com/courses&color=000000&bgcolor=ffffff&margin=0"
                    alt="QR Code"
                    style={{ width: '85px', height: '85px', display: 'block', borderRadius: '4px' }}
                  />
                </div>

                {/* ── LEFT BOX (Course Details) ── */}
                <div style={{ position: 'absolute', bottom: '14.5%', left: '20.5%', width: '25%' }}>
                  <div style={{ fontWeight: '800', fontSize: '12px', color: '#0b2a6b', marginBottom: '6px' }}>Course Details</div>
                  <ul style={{ listStyle: 'disc', paddingLeft: '14px', margin: 0, fontSize: '10.5px', color: '#333', lineHeight: '1.8' }}>
                    <li>Course Duration: <strong>{durationLabel}</strong></li>
                    <li>Mode: <strong>Live Practical Training</strong></li>
                    <li>Completion Date: <strong>{completionDate}</strong></li>
                  </ul>
                </div>

                {/* ── RIGHT BOX (Issued By) ── */}
                <div style={{ position: 'absolute', bottom: '15.5%', left: '59%', width: '22%', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>Issued By</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0b2a6b', marginBottom: '4px' }}>ITBEES Global Pvt. Ltd.</div>
                  <div style={{ fontSize: '10.5px', color: '#666', lineHeight: '1.4' }}>Smart Cloud | BI Analytics | ERP Solutions</div>
                </div>

                {/* ── BOTTOM SIGS & VERIFY ── */}
                <div style={{ position: 'absolute', bottom: '5%', left: '16%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: '#0b2a6b', fontWeight: '700' }}>Verify at: www.itbeesglobal.com</div>
                </div>
                <div style={{ position: 'absolute', bottom: '5%', left: '44.5%', transform: 'translateX(-50%)', textAlign: 'center', width: '180px', height: '50px' }}>
                  <div style={{ position: 'absolute', bottom: '14px', width: '100%' }}>
                    <img src={ceoSign} alt="Sign" style={{ height: '30px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
                    <div style={{ borderTop: '1px solid #888', width: '100%' }}></div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '0', width: '100%', fontSize: '11px', fontWeight: '600', color: '#333' }}>Authorized Signatory</div>
                </div>
                <div style={{ position: 'absolute', bottom: '5%', left: '74.5%', transform: 'translateX(-50%)', textAlign: 'center', width: '180px', height: '50px' }}>
                  <div style={{ position: 'absolute', bottom: '14px', width: '100%' }}>
                    <img src={trainerSign} alt="Sign" style={{ height: '30px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
                    <div style={{ borderTop: '1px solid #888', width: '100%' }}></div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '0', width: '100%', fontSize: '11px', fontWeight: '600', color: '#333' }}>Training Head</div>
                </div>

                {/* ── BOTTOM BLUE BAR ── */}
                <div style={{ position: 'absolute', bottom: '2%', left: '0', right: '0', textAlign: 'center', color: '#fff', fontSize: '13px' }}>
                  <strong>Certificate ID: {certId}</strong> <span style={{ opacity: 0.8, fontSize: '11px', marginLeft: '8px' }}>(For verification & records)</span>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

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











