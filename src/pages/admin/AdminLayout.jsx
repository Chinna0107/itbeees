import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Grid, Briefcase, BookOpen, Mail, DollarSign, Activity, Menu, X, Award, ClipboardList, FileText } from 'lucide-react';

import { CheckCircle } from 'lucide-react';
// import logoImg from '../../assets/logo.png';

const navItems = [
  { to: '/admin', label: 'Overview', icon: <Grid size={16} />, end: true },
  { to: '/admin/jobs', label: 'Jobs', icon: <Briefcase size={16} /> },
  { to: '/admin/courses', label: 'Courses', icon: <BookOpen size={16} /> },
  { to: '/admin/templates', label: 'Templates', icon: <BookOpen size={16} /> },
  { to: '/admin/inquiries', label: 'Inquiries', icon: <Mail size={16} /> },
  { to: '/admin/transactions', label: 'Transactions', icon: <DollarSign size={16} /> },
  { to: '/admin/certifications', label: 'Certifications', icon: <Award size={16} /> },
  { to: '/admin/assignments', label: 'Assignments', icon: <ClipboardList size={16} /> },
  { to: '/admin/external-invoices', label: 'Ext. Invoices', icon: <FileText size={16} /> },
  { to: '/admin/logs', label: 'Logs', icon: <Activity size={16} /> },

];

export default function AdminLayout({ onLogout, toast, adminLoading }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="admin-layout">
      {/* Mobile Hamburger */}
      <button
        className="admin-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle admin menu"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div className="admin-mobile-overlay" onClick={closeMobile} />
      )}

      <aside className={`admin-sidebar${mobileMenuOpen ? ' mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <h1 style={{ fontSize: '20px', color: '#fff' }}>ITBEES Global</h1>
          <button className="admin-mobile-close" onClick={closeMobile}>
            <X size={18} />
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-sidebar-btn${isActive ? ' active' : ''}`}
              onClick={closeMobile}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <section className="admin-content">
        {adminLoading ? (
          <div className="admin-loading">
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>Loading admin dataâ€¦</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Fetching inquiries, applications, transactions and logs.</div>
          </div>
        ) : (
          <Outlet />
        )}
      </section>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: '#0a1628', borderLeft: '4px solid var(--color-ai-lime)', color: '#fff', padding: '14px 20px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontFamily: 'var(--font-aeonik)', animation: 'slideInRight 0.3s ease' }}>
          <CheckCircle size={18} color="var(--color-ai-lime)" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
