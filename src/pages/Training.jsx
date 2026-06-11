import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, X, CheckCircle, Play } from 'lucide-react';
import { FaGraduationCap, FaCertificate, FaUsers, FaClock, FaStar, FaPlayCircle, FaChalkboardTeacher, FaLaptopCode, FaAward, FaRocket } from 'react-icons/fa';
import { MdOutlineQuiz, MdVerified, MdSchool } from 'react-icons/md';
import { BsGraphUp, BsPeopleFill } from 'react-icons/bs';
import { FiDownload, FiGrid } from 'react-icons/fi';
import trainingBg from '../assets/training.png';

import { publicApi, adminApi } from '../utils/api.js';

// Scroll to course/template card when navigated via navbar hash link
function useHashScroll() {
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) return;
        const targetId = hash.slice(1);
        const tryScroll = (attempts = 0) => {
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.outline = '2px solid var(--color-ai-lime)';
                el.style.borderRadius = 'var(--radius-containers)';
                setTimeout(() => { el.style.outline = ''; }, 1500);
            } else if (attempts < 10) {
                setTimeout(() => tryScroll(attempts + 1), 150);
            }
        };
        tryScroll();
    }, []);
}

export default function Training({ courses, templates = [], setEnrollments, setPayments, triggerToast, addLog }) {
    useHashScroll();
    const navigate = useNavigate();
    const [videoPlaying, setVideoPlaying] = useState(false);
    const YT_ID = 'XJ5ypnHE2P0';

    // Assignments state
    const [assignStep, setAssignStep] = useState('email'); // 'email' | 'otp' | 'results'
    const [assignEmail, setAssignEmail] = useState('');
    const [assignOtp, setAssignOtp] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignCooldown, setAssignCooldown] = useState(0);
    const [myAssignments, setMyAssignments] = useState([]);
    const [assignError, setAssignError] = useState('');

    const handleAssignEmailSubmit = async (e) => {
        e.preventDefault();
        setAssignLoading(true);
        setAssignError('');
        try {
            await adminApi.requestAssignmentOtp(assignEmail);
            setAssignStep('otp');
            setAssignCooldown(60);
            const timer = setInterval(() => {
                setAssignCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
            }, 1000);
        } catch (err) {
            setAssignError(err.message || 'Failed to send OTP. Make sure you are enrolled in a course.');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleAssignOtpSubmit = async (e) => {
        e.preventDefault();
        setAssignLoading(true);
        setAssignError('');
        try {
            const res = await adminApi.getMyAssignments(assignEmail, assignOtp);
            setMyAssignments(Array.isArray(res?.data) ? res.data : []);
            setAssignStep('results');
        } catch (err) {
            setAssignError(err.message || 'Invalid OTP or no assignments found.');
        } finally {
            setAssignLoading(false);
        }
    };

    const stats = [
        { icon: <FaUsers size={28} />, value: '5,000+', label: 'Students Trained', color: 'var(--color-corporate-blue)' },
        { icon: <FaAward size={28} />, value: '1,200+', label: 'Certificates Issued', color: 'var(--color-evergreen-glow)' },
        { icon: <FaStar size={28} />, value: '4.9/5', label: 'Average Rating', color: 'var(--color-gold)' },
        { icon: <FaChalkboardTeacher size={28} />, value: '20+', label: 'Expert Instructors', color: '#e05c5c' },
    ];

    const features = [
        { icon: <FaPlayCircle size={24} />, title: 'Live & Recorded Sessions', desc: 'Access both live instructor-led classes and recorded sessions at your own pace.' },
        { icon: <FaAward size={24} />, title: 'Digital Certificates', desc: 'Earn verified digital certificates upon successful course completion.' },
        { icon: <FaLaptopCode size={24} />, title: 'Hands-on Labs', desc: 'Practice with real-world datasets and live coding environments.' },
        { icon: <BsGraphUp size={24} />, title: 'Progress Tracking', desc: 'Monitor your learning journey with detailed analytics dashboards.' },
        { icon: <FaRocket size={24} />, title: 'Career Support', desc: 'Get placement assistance and resume review from our HR team.' },
    ];

    const templateFeatures = [
        { icon: <FiDownload size={24} />, title: 'Instant Download', desc: 'Access your purchased templates immediately after payment confirmation.' },
        { icon: <MdVerified size={24} />, title: 'Premium Quality', desc: 'Professionally designed templates built for enterprise use cases.' },
        { icon: <FiGrid size={24} />, title: 'Fully Editable', desc: 'All templates come with editable source files and documentation.' },
    ];

    return (
        <>
            {/* Hero */}
            <section className="page-hero hero-text-clip" style={{ backgroundImage: `url(${trainingBg})` }}>
                <div className="page-hero-inner">
                    <div className="badge-mint" style={{ marginBottom: '16px' }}>
                        <FaGraduationCap style={{ display: 'inline', marginRight: '6px' }} />
                        LEARN & SCALE
                    </div>
                    <h1 className="display-lg">CORPORATE TRAINING PROGRAMS</h1>
                    <p className="page-hero-sub">Enroll teams in database automation, React frontend layouts, or cloud dashboards.</p>
                </div>
            </section>


            {/* Course Catalog */}
            <div id="courses-section" style={{ margin: '64px' }}>
                <div className="section-header">
                    <h2 className="display-md">AVAILABLE COURSES</h2>
                    <p className="section-subtitle">Choose from our curated catalog of enterprise-grade training programs.</p>
                </div>
                <div className="grid-3">
                    {courses.map(course => (
                        <div key={course.id} id={`course-${course.id}`} className="course-card" style={{ scrollMarginTop: '100px' }}>
                            <div className="course-card-img-placeholder" style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--color-light-canvas)', borderRadius: '8px 8px 0 0' }}>
                                {course.image ? (
                                    <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <div style={{ display: course.image ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0, background: 'var(--gradient-card)' }}>
                                    <BookOpen size={36} color="rgba(255,255,255,0.5)" />
                                </div>
                                <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
                                    <MdVerified size={20} color="var(--color-corporate-blue)" />
                                </div>
                            </div>
                            <div className="course-card-body">
                                <span className="badge-blue" style={{ marginBottom: '10px', display: 'inline-block' }}>{course.category}</span>
                                <h3 className="heading-lg" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>{course.title}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginBottom: '12px', flex: 1, lineHeight: '1.6' }}>{course.description}</p>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--color-muted-text)', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaClock size={12} /> {course.duration}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BsPeopleFill size={12} /> {course.modules} Modules</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaStar size={12} color="var(--color-gold)" /> 4.8</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-soft-gray)', paddingTop: '16px', gap: '8px', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>₹{course.price.toLocaleString('en-IN')}</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => navigate('/training/checkout', { state: { course } })}>
                                            Enroll Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="container section-gap">

                {/* Why Choose Us */}
                <div style={{ marginBottom: '64px' }}>
                    <div className="section-header">
                        <h2 className="display-md">WHY CHOOSE ITBEES TRAINING?</h2>
                        <p className="section-subtitle">Everything you need to upskill your team and stay ahead of the curve.</p>
                    </div>
                    <div className="grid-3">
                        {features.map((f, i) => (
                            <div key={i} className="card-neutral" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ color: 'var(--color-corporate-blue)' }}>{f.icon}</div>
                                <h4 className="heading-md" style={{ color: 'var(--color-ink)' }}>{f.title}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '1.6' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>


                {/* YouTube Video — 2 col
                <section style={{ backgroundColor: 'var(--color-navy-dark)', padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', }}>
                    <div className="container">
                        <div className="grid-2" style={{ alignItems: 'center', gap: '48px' }}>
                            <div>
                                <div className="badge-mint" style={{ marginBottom: '16px' }}>WATCH US IN ACTION</div>
                                <h2 className="display-md" style={{ color: 'var(--color-white)', textAlign: 'left', marginBottom: '16px' }}>EXPERIENCE ITBEES TRAINING IN ACTION</h2>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: '1.8', marginBottom: '24px' }}>
                                    Watch how our instructors deliver live Power BI sessions, guide students through real-world datasets, and help teams upskill with enterprise-grade curriculum.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        'Live instructor-led sessions with real enterprise data',
                                        'Hands-on labs with Power BI, Python, Excel & SQL',
                                        '5,000+ professionals trained with 4.9/5 average rating',
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
                                    <iframe src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&enablejsapi=1`} title="ITBEES Global Training" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
                                )}
                            </div>
                        </div>
                    </div>
                </section> */}

                {/* Learning Paths */}
                <div style={{ marginBottom: '64px' }}>
                    <div className="section-header">
                        <h2 className="display-md">STRUCTURED LEARNING PATHS</h2>
                        <p className="section-subtitle">Follow a guided roadmap — from beginner to job-ready professional.</p>
                    </div>
                    <div className="grid-3">
                        {[
                            { label: 'Data Analyst Track', color: 'var(--color-corporate-blue)', badge: 'Most Popular', steps: ['Excel Basics & Advanced', 'Power Query', 'Python for Analytics', 'Power BI Dashboards'], outcome: 'Land a Data Analyst role in 3 months' },
                            { label: 'Automation Specialist Track', color: 'var(--color-evergreen-glow)', badge: 'Fast Track', steps: ['Excel & Formulas', 'VBA & Macros', 'Power Query Automation', 'Python Scripting'], outcome: 'Automate 80% of manual reporting tasks' },
                            { label: 'BI Developer Track', color: 'var(--color-gold)', badge: 'Enterprise Ready', steps: ['SQL Essentials', 'Data Modeling', 'Power BI Advanced', 'Cloud Data Warehousing'], outcome: 'Build and own enterprise BI infrastructure' },
                        ].map((path, i) => (
                            <div key={i} className="card-white" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <h4 className="heading-md" style={{ color: 'var(--color-ink)', flex: 1 }}>{path.label}</h4>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: path.color, backgroundColor: `${path.color}18`, border: `1px solid ${path.color}40`, borderRadius: '20px', padding: '3px 10px', whiteSpace: 'nowrap', marginLeft: '8px' }}>{path.badge}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                    {path.steps.map((step, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-ink)' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: path.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: 'white', flexShrink: 0 }}>{j + 1}</div>
                                            {step}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-soft-gray)', paddingTop: '14px', fontSize: '12px', color: path.color, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaRocket size={11} /> {path.outcome}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Template Catalog */}
                {templates.length > 0 && (
                    <div id="templates-section" style={{ marginBottom: '64px' }}>
                        <div style={{ borderTop: '2px solid var(--color-soft-gray)', paddingTop: '48px', marginBottom: '32px' }}>
                            <div className="section-header">
                                <div className="badge-mint" style={{ marginBottom: '12px' }}>
                                    <FiDownload style={{ display: 'inline', marginRight: '6px' }} />
                                    READY-TO-USE ASSETS
                                </div>
                                <h2 className="display-md">AVAILABLE TEMPLATES</h2>
                                <p className="section-subtitle">Premium digital templates for your business — dashboards, reports, ERP sheets, and more.</p>
                            </div>

                            {/* Template Features */}
                            <div className="grid-3" style={{ marginBottom: '40px' }}>
                                {templateFeatures.map((f, i) => (
                                    <div key={i} className="card-neutral" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ color: 'var(--color-evergreen-glow)' }}>{f.icon}</div>
                                        <h4 className="heading-md" style={{ color: 'var(--color-ink)' }}>{f.title}</h4>
                                        <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '1.6' }}>{f.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid-3" >
                                {templates.map(template => (
                                    <div key={template.id} id={`template-${template.id}`} className="course-card" style={{ scrollMarginTop: '100px' }}>
                                        <div className="course-card-img-placeholder" style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--color-light-canvas)', borderRadius: '8px 8px 0 0' }}>
                                            {template.image ? (
                                                <img src={template.image} alt={template.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                            ) : null}
                                            <div style={{ display: template.image ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0, background: 'var(--gradient-card)' }}>
                                                <FiDownload size={36} color="rgba(255,255,255,0.5)" />
                                            </div>
                                            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
                                                <MdVerified size={20} color="var(--color-evergreen-glow)" />
                                            </div>
                                        </div>
                                        <div className="course-card-body">
                                            <span className="badge-blue" style={{ marginBottom: '10px', display: 'inline-block' }}>{template.category || 'General'}</span>
                                            <h3 className="heading-lg" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>{template.name}</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginBottom: '12px', flex: 1, lineHeight: '1.6' }}>{template.description}</p>
                                            {template.features && Array.isArray(template.features) && template.features.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '12px', color: 'var(--color-muted-text)' }}>
                                                    {template.features.slice(0, 3).map((f, i) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <MdVerified size={12} color="var(--color-evergreen-glow)" />
                                                            {f}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--color-muted-text)', flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiGrid size={12} /> {template.category || 'Template'}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaStar size={12} color="var(--color-gold)" /> {template.rating || 'New'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-soft-gray)', paddingTop: '16px', gap: '8px', flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>₹{template.price.toLocaleString('en-IN')}</div>
                                                <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => navigate('/training/template-checkout', { state: { template } })}>
                                                    Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}



                {/* Training Image Banner */}
                <section style={{ padding: '48px 0', borderBottom: '1px solid var(--color-soft-gray)' }}>
                    <div className="container">
                        <div style={{ position: 'relative', overflow: 'hidden', height: '280px', borderRadius: 'var(--radius-containers)' }}>
                            <img src={trainingBg} alt="Training Programs" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }} />
                            <div className="training-banner-content" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '24px' }}>
                                <MdSchool size={48} color="var(--color-ai-lime)" />
                                <h2 style={{ color: 'var(--color-white)', fontFamily: 'var(--font-ozik)', fontSize: '28px', textAlign: 'center' }}>
                                    WORLD-CLASS TRAINING FOR MODERN ENTERPRISES
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', textAlign: 'center', maxWidth: '500px' }}>
                                    Industry-aligned curriculum designed by practitioners with 10+ years of enterprise experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>



                {/* Stats Bar */}
                <section style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-soft-gray)', padding: '28px 0' }}>
                    <div className="container">
                        <div className="grid-4" style={{ gap: '24px' }}>
                            {stats.map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
                                    <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: 1 }}>{s.value}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonial Banner */}
                <div className="card-blue-premium" style={{ marginBottom: '64px', padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <FaGraduationCap size={36} color="var(--color-ai-lime)" />
                        <div>
                            <h3 style={{ color: 'var(--color-white)', fontFamily: 'var(--font-aeonik)', fontWeight: '600' }}>What Our Students Say</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Real feedback from enterprise learners</p>
                        </div>
                    </div>
                    <div className="grid-2" style={{ gap: '24px' }}>
                        {[
                            { name: 'Priya Sharma', role: 'Data Analyst, TechCorp', text: 'The PowerBI course was incredibly practical. I built my first live dashboard within a week of completing the training.' },
                            { name: 'Arjun Reddy', role: 'ERP Consultant, InfoSys', text: 'ITBEES training gave me the confidence to handle complex ERP migrations. The instructors are top-notch professionals.' }
                        ].map((t, i) => (
                            <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                                    {[...Array(5)].map((_, j) => <FaStar key={j} size={14} color="var(--color-gold)" />)}
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontStyle: 'italic', marginBottom: '16px', lineHeight: '1.6' }}>"{t.text}"</p>
                                <div>
                                    <div style={{ color: 'var(--color-white)', fontWeight: '600', fontSize: '13px' }}>{t.name}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{t.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Corporate CTA Banner */}
                <div className="training-cta-banner">
                    <div style={{ maxWidth: '560px' }}>
                        <div className="badge-mint" style={{ marginBottom: '14px' }}>CORPORATE PACKAGES</div>
                        <h2 style={{ color: 'var(--color-white)', fontFamily: 'var(--font-ozik)', fontSize: '28px', lineHeight: 1.1, marginBottom: '12px' }}>TRAINING YOUR ENTIRE TEAM?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: '1.7' }}>Get bulk enrollment discounts, a dedicated instructor, and a custom curriculum built around your tech stack. We've trained teams of 10 to 500+.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                        {['✓ Custom curriculum', '✓ Bulk discounts (10+ seats)', '✓ Dedicated account manager', '✓ Progress tracking dashboard'].map((item, i) => (
                            <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{item}</div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <a href="/contact#send-message" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <FaChalkboardTeacher size={14} /> Request Corporate Quote
                        </a>
                        <a href="tel:9963186067" className="btn-ghost-dark" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Call Us Now</a>
                    </div>
                </div>

            {/* My Assignments */}
            <div id="assignments-section" style={{ marginBottom: '64px', marginTop: '64px' }}>
                <div className="section-header">
                    <h2 className="display-md">MY ASSIGNMENTS</h2>
                    <p className="section-subtitle">Enter your enrolled email to view assignments for your courses.</p>
                </div>

                <div style={{ maxWidth: '480px', margin: '0 auto', background: 'var(--color-white)', border: '1px solid var(--color-soft-gray)', borderRadius: '12px', padding: '28px' }}>
                    {assignStep === 'email' && (
                        <form onSubmit={handleAssignEmailSubmit}>
                            <div className="form-group">
                                <label className="form-label">Your Enrolled Email</label>
                                <input type="email" className="input-field" required placeholder="you@example.com" value={assignEmail} onChange={e => setAssignEmail(e.target.value)} />
                            </div>
                            {assignError && <p style={{ color: '#d93838', fontSize: '13px', marginBottom: '12px' }}>{assignError}</p>}
                            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={assignLoading}>
                                {assignLoading ? 'Sending OTP...' : 'Verify Email & View Assignments'}
                            </button>
                        </form>
                    )}

                    {assignStep === 'otp' && (
                        <form onSubmit={handleAssignOtpSubmit}>
                            <p style={{ fontSize: '14px', color: 'var(--color-ink)', marginBottom: '16px', textAlign: 'center' }}>
                                Enter the 6-digit OTP sent to <strong>{assignEmail}</strong>
                            </p>
                            <div className="form-group">
                                <input type="text" className="input-field" required placeholder="123456" maxLength="6" style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '8px' }} value={assignOtp} onChange={e => setAssignOtp(e.target.value)} />
                            </div>
                            {assignError && <p style={{ color: '#d93838', fontSize: '13px', marginBottom: '12px' }}>{assignError}</p>}
                            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={assignLoading}>
                                {assignLoading ? 'Verifying...' : 'View My Assignments'}
                            </button>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <button type="button" className="btn-mini" style={{ color: assignCooldown > 0 ? 'var(--color-muted-text)' : 'var(--color-corporate-blue)' }} disabled={assignCooldown > 0 || assignLoading} onClick={handleAssignEmailSubmit}>
                                    {assignCooldown > 0 ? `Resend in ${assignCooldown}s` : 'Resend OTP'}
                                </button>
                                <button type="button" className="btn-mini" style={{ color: 'var(--color-muted-text)' }} onClick={() => { setAssignStep('email'); setAssignError(''); setAssignOtp(''); }}>
                                    Change Email
                                </button>
                            </div>
                        </form>
                    )}

                    {assignStep === 'results' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <strong style={{ fontSize: '14px' }}>Assignments for {assignEmail}</strong>
                                <button className="btn-mini" style={{ color: 'var(--color-corporate-blue)' }} onClick={() => { setAssignStep('email'); setAssignEmail(''); setAssignOtp(''); setMyAssignments([]); }}>Change Email</button>
                            </div>
                            {myAssignments.length === 0 ? (
                                <p style={{ color: 'var(--color-muted-text)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>No assignments found for your enrolled courses.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {myAssignments.map(a => (
                                        <div key={a.id} style={{ border: '1px solid var(--color-soft-gray)', borderRadius: '8px', padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>{a.title}</strong>
                                                <span className="badge-blue" style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>{a.course?.title || 'Course'}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: '6px 0 8px', lineHeight: '1.5' }}>{a.description}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-muted-text)' }}>
                                                    {a.dueDate && <span>Due: <strong>{new Date(a.dueDate).toLocaleDateString('en-IN')}</strong></span>}
                                                    <span>Max Score: <strong>{a.maxScore}</strong></span>
                                                    <span>{a.questionCount ?? (a.questions || []).length} Questions</span>
                                                </div>
                                                {(a.questionCount ?? (a.questions || []).length) > 0 && (
                                                    <button className="btn-primary" style={{ fontSize: '12px', padding: '7px 16px' }}
                                                        onClick={() => navigate(`/assignment-test/${a.id}`, { state: { email: assignEmail, otp: assignOtp } })}>
                                                        Take Test
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            </div>

        </>
    );
}