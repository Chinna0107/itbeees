import { useState } from 'react';
import { Search, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaMapMarkerAlt, FaRupeeSign, FaUsers, FaRocket, FaHeart } from 'react-icons/fa';
import { MdVerified, MdWorkOutline, MdSchool } from 'react-icons/md';
import { BsStarFill } from 'react-icons/bs';
import { HiLightningBolt } from 'react-icons/hi';
import careersBg from '../assets/carrier.png';
import aboutBg from '../assets/about.png';

export default function Careers({ jobs }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [videoPlaying, setVideoPlaying] = useState(false);
    const YT_ID = 'tBkfxgwX_IY';

    const filteredJobs = jobs.filter(job => {
        if (job.isAvailable === false) return false;
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'All' || job.department === selectedDept;
        return matchesSearch && matchesDept;
    });

    const perks = [
        { icon: <FaRocket size={24} />, title: 'Fast Career Growth', desc: 'Structured growth paths with quarterly performance reviews.', color: 'var(--color-corporate-blue)' },
        { icon: <MdSchool size={24} />, title: 'Learning & Development', desc: 'Free access to all ITBEES training courses and certifications.', color: 'var(--color-evergreen-glow)' },
        { icon: <FaHeart size={24} />, title: 'Health Benefits', desc: 'Comprehensive health insurance for you and your family.', color: '#e05c5c' },
        { icon: <HiLightningBolt size={24} />, title: 'Flexible Work', desc: 'Hybrid work options with flexible hours for all roles.', color: 'var(--color-gold)' },
        { icon: <FaUsers size={24} />, title: 'Great Team Culture', desc: 'Collaborative, inclusive environment with 200+ professionals.', color: '#9b59b6' },
        { icon: <FaRupeeSign size={24} />, title: 'Competitive Pay', desc: 'Market-leading salaries with performance bonuses.', color: 'var(--color-evergreen-glow)' },
    ];

    return (
        <>
            {/* Hero */}
            <section className="page-hero hero-text-clip" style={{ backgroundImage: `url(${careersBg})` }}>
                <div className="page-hero-inner" >
                    <div className="badge-mint" style={{ marginBottom: '16px' }}>
                        <FaBriefcase style={{ display: 'inline', marginRight: '6px' }} />
                        JOIN OUR TEAM
                    </div>
                    <h1 className="display-lg">CAREERS & OPPORTUNITIES</h1>
                    <p className="page-hero-sub">Accelerate your technical career. Apply to our Gachibowli engineering teams.</p>
                </div>
            </section>

            {/* Stats Bar */}
            <section style={{ backgroundColor: 'var(--color-navy-dark)', padding: '24px 0' }}>
                <div className="container">
                    <div className="careers-stats-bar">
                        {[
                            { icon: <MdWorkOutline size={18} />, text: `${jobs.length} Open Positions` },
                            { icon: <FaUsers size={16} />, text: '200+ Team Members' },
                            { icon: <BsStarFill size={14} />, text: '4.8/5 Glassdoor Rating' },
                            { icon: <MdVerified size={18} />, text: 'Great Place to Work Certified' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                <span style={{ color: 'var(--color-ai-lime)' }}>{item.icon}</span>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            



            {/* Search & Filters */}
            <div style={{ margin: '32px' }}>
                <div className="job-search-bar">
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input type="text" className="input-field" placeholder="Search jobs by title or keyword..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '44px' }} />
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--color-muted-text)' }} />
                    </div>
                    <div>
                        <select className="input-field" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ minWidth: '180px' }}>
                            <option value="All">All Departments</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Analytics">Analytics</option>
                            <option value="Consulting">Consulting</option>
                            <option value="HR & Staffing">HR & Staffing</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Job Grid */}
            <div className="grid-2" style={{ margin: '32px' }}>
                {filteredJobs.map(job => (
                    <div key={job.id} className="card-white job-card" style={{ padding: '32px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <h3 className="heading-lg" style={{ color: 'var(--color-ink)', marginBottom: '4px' }}>{job.title}</h3>
                                <span className="badge-blue">{job.department}</span>
                            </div>
                            <span className="badge-mint">{job.type}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', color: 'var(--color-muted-text)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaMapMarkerAlt size={12} /> {job.location || 'Hyderabad'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaRupeeSign size={12} /> {job.salary}</span>
                        </div>
                        <p style={{ color: 'var(--color-ink)', fontSize: '13px', margin: '0 0 20px 0', flex: 1 }}>
                            {job.description.substring(0, 120)}...
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-soft-gray)', paddingTop: '16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaBriefcase size={12} color="var(--color-corporate-blue)" /> {job.type}
                            </span>
                            <Link to={`/careers/apply/${job.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}>
                                Apply Now <FaBriefcase size={12} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {filteredJobs.length === 0 && (
                <div style={{ padding: '64px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
                    <MdWorkOutline size={48} style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.3 }} />
                    <p>No jobs found matching your criteria. Check back later!</p>
                </div>
            )}


{/* YouTube Video — 2 col */}
            <section style={{ backgroundColor: 'var(--color-navy-dark)', padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="container">
                    <div className="grid-2" style={{ alignItems: 'center', gap: '48px' }}>
                        <div>
                            <div className="badge-mint" style={{ marginBottom: '16px' }}>WATCH US IN ACTION</div>
                            <h2 className="display-md" style={{ color: 'var(--color-white)', textAlign: 'left', marginBottom: '16px' }}>BUILD YOUR CAREER WITH ITBEES GLOBAL</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: '1.8', marginBottom: '24px' }}>
                                See what it's like to work at ITBEES Global — a culture of innovation, growth, and enterprise impact across 150+ organizations.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    'Fast career growth with quarterly reviews & promotions',
                                    'Free access to all ITBEES training courses & certifications',
                                    'Collaborative hybrid culture with 200+ professionals',
                                ].map((point, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
                                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(104,239,63,0.15)', border: '1px solid var(--color-ai-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-ai-lime)', display: 'block' }} />
                                        </span>
                                        {point}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', aspectRatio: '16/9' }}>
                            {!videoPlaying ? (
                                <>
                                    <img src={`https://img.youtube.com/vi/${YT_ID}/maxresdefault.jpg`} alt="Video preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,14,49,0.45)' }} />
                                    <button onClick={() => setVideoPlaying(true)} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(255,0,0,0.4)', transition: 'transform 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <Play size={26} color="#fff" fill="#fff" style={{ marginLeft: '4px' }} />
                                        </div>
                                    </button>
                                </>
                            ) : (
                                <iframe src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&enablejsapi=1`} title="ITBEES Global Careers" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Culture Image Banner Card */}
            <section style={{ padding: '40px 0' }}>
                <div className="container">
                    <div style={{ position: 'relative', overflow: 'hidden', height: '240px', borderRadius: 'var(--radius-containers)', boxShadow: 'var(--shadow-md)' }}>
                        <img src={aboutBg} alt="Team Culture" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35)' }} />
                        <div className="careers-banner-content" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '24px' }}>
                            <FaHeart size={36} color="#e05c5c" />
                            <h2 style={{ color: 'var(--color-white)', fontFamily: 'var(--font-ozik)', fontSize: '24px', textAlign: 'center' }}>
                                BUILD YOUR CAREER AT ITBEES GLOBAL
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', textAlign: 'center', maxWidth: '500px' }}>
                                Join a team of 200+ passionate engineers, analysts, and consultants shaping the future of enterprise technology.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container section-gap">

                {/* Perks & Benefits */}
                <div style={{ marginBottom: '64px' }}>
                    <div className="section-header">
                        <h2 className="display-md">WHY WORK WITH US?</h2>
                        <p className="section-subtitle">We invest in our people as much as we invest in our technology.</p>
                    </div>
                    <div className="grid-3">
                        {perks.map((p, i) => (
                            <div key={i} className="card-neutral" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ color: p.color }}>{p.icon}</div>
                                <h4 className="heading-md" style={{ color: 'var(--color-ink)' }}>{p.title}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '1.6' }}>{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}