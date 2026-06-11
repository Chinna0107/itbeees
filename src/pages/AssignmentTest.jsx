import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { adminApi } from '../utils/api.js';

const STEPS = { EMAIL: 'email', TEST: 'test', RESULT: 'result' };

export default function AssignmentTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If navigated from Training page with email+otp already in state, skip the email step
  const prefill = location.state || {};

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState(prefill.email || '');
  const [otp, setOtp] = useState(prefill.otp || '');
  const [otpSent, setOtpSent] = useState(!!prefill.otp);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);

  // If prefilled otp exists, auto-load the assignment
  useEffect(() => {
    if (prefill.email && prefill.otp) {
      loadAssignment(prefill.email, prefill.otp);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (step !== STEPS.TEST || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, step]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startCooldown = () => {
    setOtpCooldown(60);
    const t = setInterval(() => {
      setOtpCooldown(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setEmailError('');
    try {
      await adminApi.requestAssignmentOtp(email.trim());
      setOtpSent(true);
      startCooldown();
    } catch (err) {
      setEmailError(err.message || 'Failed to send OTP. Make sure you are enrolled in a course.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignment = async (emailVal, otpVal) => {
    setLoading(true);
    setEmailError('');
    try {
      const res = await adminApi.getAssignmentById(id, emailVal.trim(), otpVal.trim());
      const data = res.data;
      setAssignment(data);
      setTimeLeft(data.timeLimitMins > 0 ? data.timeLimitMins * 60 : null);
      setStep(STEPS.TEST);
    } catch (err) {
      setEmailError(err.message || 'Invalid OTP or assignment not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    await loadAssignment(email, otp);
  };

  const handleSubmit = async (autoSubmit = false) => {
    clearTimeout(timerRef.current);
    setSubmitting(true);
    const questions = assignment.questions || [];

    const answerPayload = questions.map(q => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] ?? -1
    }));

    try {
      const res = await adminApi.submitAssignment(id, {
        name: email.split('@')[0],
        email: email.trim(),
        otp: otp.trim(),
        answers: answerPayload
      });
      const { score, totalMarks } = res.data;
      setResult({ score, total: totalMarks, percent: totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0 });
      setStep(STEPS.RESULT);
    } catch (err) {
      alert('Submission failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Email / OTP Step ──
  if (step === STEPS.EMAIL) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div style={{ background: 'var(--color-white)', borderRadius: 16, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(35,149,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={22} color="var(--color-corporate-blue)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>Course Assignment</div>
                <div style={{ fontSize: 12, color: '#888' }}>Verify your enrollment to access this test</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#555', marginBottom: 24, lineHeight: 1.6 }}>
              Enter your enrolled email address to access this assignment. You must have a successful course purchase to proceed.
            </p>

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label">Enrolled Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  />
                </div>

                {emailError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#c0392b' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {emailError}
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Send OTP to Email'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit}>
                <p style={{ fontSize: 13, color: '#555', marginBottom: 16, textAlign: 'center' }}>
                  OTP sent to <strong>{email}</strong>
                </p>
                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="123456"
                    maxLength="6"
                    style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8 }}
                    value={otp}
                    onChange={e => { setOtp(e.target.value); setEmailError(''); }}
                  />
                </div>

                {emailError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#c0392b' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {emailError}
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 10 }} disabled={loading}>
                  {loading ? 'Verifying…' : 'Start Assignment'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" className="btn-mini"
                    style={{ color: otpCooldown > 0 ? '#aaa' : 'var(--color-corporate-blue)' }}
                    disabled={otpCooldown > 0 || loading}
                    onClick={handleSendOtp}>
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                  </button>
                  <button type="button" className="btn-mini" style={{ color: '#aaa' }}
                    onClick={() => { setOtpSent(false); setOtp(''); setEmailError(''); }}>
                    Change Email
                  </button>
                </div>
              </form>
            )}

            <button className="btn-mini" style={{ marginTop: 14, color: 'var(--color-muted-text)' }} onClick={() => navigate('/training')}>
              ← Back to Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Test Step ──
  if (step === STEPS.TEST) {
    const questions = assignment?.questions || [];
    const answered = Object.keys(answers).length;
    const isWarning = timeLeft !== null && timeLeft <= 60;

    return (
      <div style={{ minHeight: '80vh', padding: '32px 16px', maxWidth: 760, margin: '0 auto' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-white)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{assignment.title}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{answered}/{questions.length} answered · Max score: {assignment.maxScore}</div>
          </div>
          {timeLeft !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 18, color: isWarning ? '#e53e3e' : '#023295', background: isWarning ? 'rgba(229,62,62,0.08)' : 'rgba(2,50,149,0.07)', padding: '6px 14px', borderRadius: 8 }}>
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Instructions */}
        {assignment.description && (
          <div style={{ background: 'rgba(35,149,238,0.07)', border: '1px solid rgba(35,149,238,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#444', lineHeight: 1.6 }}>
            {assignment.description}
          </div>
        )}

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
          {questions.map((q, qi) => {
            const opts = Array.isArray(q.options) ? q.options : [];
            return (
              <div key={q.id} style={{ background: 'var(--color-white)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: answers[q.id] !== undefined ? '2px solid rgba(35,149,238,0.3)' : '2px solid transparent' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 14 }}>
                  <span style={{ color: '#023295', marginRight: 6 }}>Q{qi + 1}.</span>{q.questionText}
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8, fontWeight: 400 }}>[{q.marks || 1} mark{q.marks !== 1 ? 's' : ''}]</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {opts.map((opt, oi) => {
                    const optText = typeof opt === 'object' ? opt.text : opt;
                    const selected = answers[q.id] === oi;
                    return (
                      <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${selected ? '#023295' : '#e0e0e0'}`, background: selected ? 'rgba(2,50,149,0.06)' : '#fff', cursor: 'pointer', fontSize: 13, color: '#1a1a2e', transition: 'all 0.15s' }}>
                        <input type="radio" name={`q-${q.id}`} checked={selected} onChange={() => setAnswers(a => ({ ...a, [q.id]: oi }))} style={{ accentColor: '#023295' }} />
                        <span style={{ fontWeight: selected ? 600 : 400 }}>{String.fromCharCode(65 + oi)}. {optText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: 15 }}
          disabled={submitting}
          onClick={() => {
            if (answered < questions.length && !window.confirm(`You have ${questions.length - answered} unanswered question(s). Submit anyway?`)) return;
            handleSubmit(false);
          }}
        >
          {submitting ? 'Submitting…' : `Submit Assignment (${answered}/${questions.length} answered)`}
        </button>
      </div>
    );
  }

  // ── Result Step ──
  if (step === STEPS.RESULT && result) {
    const passed = result.percent >= 60;
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ background: 'var(--color-white)', borderRadius: 16, padding: 40, boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: passed ? 'rgba(104,239,63,0.1)' : 'rgba(220,53,69,0.1)', border: `3px solid ${passed ? '#68ef3f' : '#e53e3e'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={44} color={passed ? '#68ef3f' : '#e53e3e'} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
              {passed ? '🎉 Congratulations!' : 'Assignment Submitted'}
            </h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>
              {passed ? 'You passed the assignment!' : 'Keep practising — review the material and try again.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Score', value: `${result.score}/${result.total}` },
                { label: 'Percentage', value: `${result.percent}%` },
                { label: 'Status', value: passed ? 'PASSED' : 'FAILED' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 8px' }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: i === 2 ? (passed ? '#3cb823' : '#e53e3e') : '#1a1a2e' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/training')}>
              Back to Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
