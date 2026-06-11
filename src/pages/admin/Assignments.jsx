import { useState, useEffect } from 'react';
import { ClipboardList, X, Plus, Trash2, ChevronDown, ChevronUp, Users, Pencil } from 'lucide-react';
import { adminApi } from '../../utils/api.js';

const emptyQuestion = () => ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });

export default function Assignments({ courses = [], triggerToast }) {
  const [tab, setTab] = useState('list');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // assignment being edited
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [subFilter, setSubFilter] = useState('');
  const [submissionsData, setSubmissionsData] = useState({ id: null, title: '', rows: [] });
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState(null);

  const [form, setForm] = useState({ title: '', description: '', courseId: '', dueDate: '', maxScore: 100, timeLimitMins: 0, questionsToShow: 0 });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [qSaving, setQSaving] = useState(false);

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAssignments();
      setAssignments(Array.isArray(res?.data) ? res.data : []);
      setFetchError(null);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setFetchError(err.message || 'Failed to load assignments');
      setAssignments([]);
    } finally { setLoading(false); }
  };

  // Auto-load all submissions when switching to submissions tab
  useEffect(() => {
    if (tab === 'submissions') fetchAllSubmissions();
  }, [tab]);

  const fetchAllSubmissions = async () => {
    if (assignments.length === 0) return;
    setSubLoading(true);
    setSubError(null);
    setSubmissionsData({ id: null, title: '', rows: [] });
    try {
      const results = await Promise.all(
        assignments.map(a =>
          adminApi.getAssignmentSubmissions(a.id)
            .then(res => (Array.isArray(res?.data) ? res.data : []).map(s => ({ ...s, assignmentTitle: a.title })))
            .catch(() => [])
        )
      );
      const flat = results.flat().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setAllSubmissions(flat);
    } catch (err) {
      console.error('Failed to load all submissions:', err);
      setSubError(err.message || 'Failed to load submissions');
    } finally { setSubLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        const res = await adminApi.updateAssignment(editTarget.id, form);
        setAssignments(prev => prev.map(a => a.id === editTarget.id ? { ...a, ...res.data } : a));
        triggerToast?.('Assignment updated.');
        setEditTarget(null);
      } else {
        const res = await adminApi.createAssignment(form);
        setAssignments(prev => [{ ...res.data, questions: [], submissions: [] }, ...prev]);
        triggerToast?.('Assignment created.');
      }
      setDrawerOpen(false);
      setForm({ title: '', description: '', courseId: '', dueDate: '', maxScore: 100, timeLimitMins: 0, questionsToShow: 0 });
      setQuestions([emptyQuestion()]);
      fetchAssignments();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await adminApi.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      triggerToast?.('Assignment deleted.');
    } catch (err) { alert(err.message); }
  };

  const handleAddQuestion = async (assignmentId) => {
    const q = questions[0];
    if (!q.questionText.trim()) return alert('Enter question text.');
    if (q.options.some(o => !o.trim())) return alert('Fill all 4 options.');
    setQSaving(true);
    try {
      const res = await adminApi.addAssignmentQuestion(assignmentId, {
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks
      });
      setAssignments(prev => prev.map(a => a.id === assignmentId
        ? { ...a, questions: [...(a.questions || []), res.data] }
        : a
      ));
      setQuestions([emptyQuestion()]);
      triggerToast?.('Question added.');
    } catch (err) { alert(err.message); }
    finally { setQSaving(false); }
  };

  const handleDeleteQuestion = async (assignmentId, qid) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await adminApi.deleteAssignmentQuestion(assignmentId, qid);
      setAssignments(prev => prev.map(a => a.id === assignmentId
        ? { ...a, questions: a.questions.filter(q => q.id !== qid) }
        : a
      ));
      triggerToast?.('Question deleted.');
    } catch (err) { alert(err.message); }
  };

  const handleViewSubmissions = async (assignment) => {
    setTab('submissions');
    setSubLoading(true);
    setSubError(null);
    setAllSubmissions([]);
    setSubmissionsData({ id: assignment.id, title: assignment.title, rows: [] });
    try {
      const res = await adminApi.getAssignmentSubmissions(assignment.id);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, submissions: rows } : a));
      setSubmissionsData({ id: assignment.id, title: assignment.title, rows });
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setSubError(err.message || 'Failed to load submissions');
    } finally { setSubLoading(false); }
  };

  const setOpt = (idx, optIdx, val) => setQuestions(qs => qs.map((q, i) => i === idx
    ? { ...q, options: q.options.map((o, j) => j === optIdx ? val : o) }
    : q
  ));

  const getCourseName = (a) => a.course?.title || courses.find(c => c.id === a.courseId)?.title || '—';

  // Rows to display in submissions tab
  const displayRows = submissionsData.id ? submissionsData.rows : allSubmissions;
  const showAssignmentCol = !submissionsData.id;
  const filteredRows = subFilter
    ? displayRows.filter(s => s.name?.toLowerCase().includes(subFilter.toLowerCase()) || s.email?.toLowerCase().includes(subFilter.toLowerCase()))
    : displayRows;

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setDrawerOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-corporate-blue)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          <Plus size={14} /> Add Assignment
        </button>
        <h2 className="heading-lg" style={{ color: 'var(--color-white)', margin: 0 }}>
          <ClipboardList size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          ASSIGNMENTS
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
        {[
          ['list', `Assignments (${assignments.length})`],
          ['submissions', submissionsData.title ? `Submissions — ${submissionsData.title}` : `All Submissions${allSubmissions.length > 0 ? ` (${allSubmissions.length})` : ''}`]
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: tab === key ? 'var(--color-corporate-blue)' : 'transparent', color: tab === key ? '#fff' : 'rgba(255,255,255,0.45)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {tab === 'list' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
          ) : fetchError ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>
              Error: {fetchError}<br />
              <button className="btn-mini" style={{ marginTop: '12px', color: 'var(--color-sky-blue)' }} onClick={fetchAssignments}>Retry</button>
            </div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No assignments yet. Click Add Assignment to get started.</div>
          ) : (
            assignments.map(a => (
              <div key={a.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{a.title}</strong>
                    <span className="badge-blue" style={{ marginLeft: '10px', fontSize: '11px' }}>{getCourseName(a)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span>{(a.questions || []).length} Qs{a.questionsToShow > 0 ? ` (show ${a.questionsToShow})` : ''}</span>
                    <span>{(a.submissions || []).length} submissions</span>
                    {a.timeLimitMins > 0 && <span>⏱ {a.timeLimitMins} min</span>}
                    {a.dueDate && <span>Due {new Date(a.dueDate).toLocaleDateString('en-IN')}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }}
                      onClick={() => handleViewSubmissions(a)}>
                      <Users size={12} /> Results
                    </button>
                    <button className="btn-mini" style={{ color: 'rgba(255,255,255,0.6)' }}
                      onClick={() => {
                        setEditTarget(a);
                        setForm({ title: a.title, description: a.description, courseId: a.courseId, dueDate: a.dueDate ? a.dueDate.slice(0,10) : '', maxScore: a.maxScore, timeLimitMins: a.timeLimitMins || 0, questionsToShow: a.questionsToShow || 0 });
                        setDrawerOpen(true);
                      }}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button className="btn-mini" style={{ color: 'rgba(255,255,255,0.6)' }}
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                      {expandedId === a.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Questions
                    </button>
                    <button className="btn-mini" style={{ color: '#ff6b6b' }} onClick={() => handleDelete(a.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {expandedId === a.id && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 18px', background: 'rgba(0,0,0,0.2)' }}>
                    {(a.questions || []).length > 0 && (
                      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {a.questions.map((q, qi) => (
                          <div key={q.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Q{qi + 1}. {q.questionText}</span>
                              <button className="btn-mini" style={{ color: '#ff6b6b', flexShrink: 0 }}
                                onClick={() => handleDeleteQuestion(a.id, q.id)}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              {(Array.isArray(q.options) ? q.options : []).map((opt, oi) => (
                                <div key={oi} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: q.correctAnswer === oi ? 'rgba(104,239,63,0.15)' : 'rgba(255,255,255,0.05)', color: q.correctAnswer === oi ? '#68ef3f' : 'rgba(255,255,255,0.6)', border: q.correctAnswer === oi ? '1px solid #68ef3f40' : '1px solid transparent' }}>
                                  {String.fromCharCode(65 + oi)}. {typeof opt === 'object' ? opt.text : opt}
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>Marks: {q.marks}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ background: 'rgba(35,149,238,0.08)', border: '1px solid rgba(35,149,238,0.2)', borderRadius: '8px', padding: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-sky-blue)', marginBottom: '10px' }}>+ Add Question</div>
                      <div style={{ marginBottom: '10px' }}>
                        <input className="input-field" placeholder="Question text" value={questions[0].questionText}
                          onChange={e => setQuestions([{ ...questions[0], questionText: e.target.value }])}
                          style={{ fontSize: '13px', marginBottom: '8px', width: '100%' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          {questions[0].options.map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input type="radio" name={`correct-${a.id}`} checked={questions[0].correctAnswer === oi}
                                onChange={() => setQuestions([{ ...questions[0], correctAnswer: oi }])}
                                title="Mark as correct answer" />
                              <input className="input-field" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt}
                                onChange={e => setOpt(0, oi, e.target.value)}
                                style={{ fontSize: '12px', flex: 1 }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Marks:</label>
                          <input type="number" className="input-field" value={questions[0].marks} min="1"
                            onChange={e => setQuestions([{ ...questions[0], marks: parseInt(e.target.value) || 1 }])}
                            style={{ width: '70px', fontSize: '12px' }} />
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Select radio button next to correct option</span>
                        </div>
                      </div>
                      <button className="btn-primary" style={{ fontSize: '12px', padding: '7px 16px' }} disabled={qSaving}
                        onClick={() => handleAddQuestion(a.id)}>
                        {qSaving ? 'Saving...' : 'Add Question'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {tab === 'submissions' && (
        <div className="admin-table-container">
          {/* Filter + back controls */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
            {submissionsData.id && (
              <button className="btn-mini" style={{ color: 'var(--color-sky-blue)' }}
                onClick={() => { setSubmissionsData({ id: null, title: '', rows: [] }); fetchAllSubmissions(); }}>
                ← All Submissions
              </button>
            )}
            <input
              className="input-field"
              placeholder="Search by name or email..."
              value={subFilter}
              onChange={e => setSubFilter(e.target.value)}
              style={{ fontSize: '12px', maxWidth: '260px' }}
            />
            <button className="btn-mini" style={{ color: 'rgba(255,255,255,0.5)' }}
              onClick={submissionsData.id ? () => handleViewSubmissions({ id: submissionsData.id, title: submissionsData.title }) : fetchAllSubmissions}>
              ↻ Refresh
            </button>
          </div>

          {subLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading submissions...</div>
          ) : subError ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>
              Error: {subError}
              <br />
              <button className="btn-mini" style={{ marginTop: '12px', color: 'var(--color-sky-blue)' }}
                onClick={submissionsData.id ? () => handleViewSubmissions({ id: submissionsData.id, title: submissionsData.title }) : fetchAllSubmissions}>
                Retry
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  {showAssignmentCol && <th>Assignment</th>}
                  <th>Score</th>
                  <th>Result</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={showAssignmentCol ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    No submissions found.
                  </td></tr>
                ) : (
                  filteredRows.map((s, idx) => {
                    const pct = s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100) : 0;
                    const passed = pct >= 60;
                    return (
                      <tr key={s.id}>
                        <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{idx + 1}</td>
                        <td><strong>{s.name}</strong></td>
                        <td style={{ fontSize: '12px' }}>{s.email}</td>
                        {showAssignmentCol && <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{s.assignmentTitle}</td>}
                        <td style={{ fontWeight: '700', color: 'var(--color-sky-blue)' }}>{s.score} / {s.totalMarks}</td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: passed ? 'rgba(104,239,63,0.15)' : 'rgba(255,107,107,0.15)', color: passed ? '#68ef3f' : '#ff6b6b' }}>
                            {pct}% — {passed ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px' }}>{new Date(s.submittedAt).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {drawerOpen && (
        <>
          <div onClick={() => { setDrawerOpen(false); setEditTarget(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', maxHeight: '90vh', background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'var(--color-corporate-blue)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{editTarget ? 'Edit Assignment' : 'Add New Assignment'}</div>
              <button onClick={() => { setDrawerOpen(false); setEditTarget(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-corporate-blue)' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Title</label>
                  <input className="input-field" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Course</label>
                  <select className="input-field" required value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                    <option value="">— Select Course —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Description / Instructions</label>
                  <textarea className="input-field" rows="3" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Due Date</label>
                    <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Max Score</label>
                    <input type="number" className="input-field" required value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Time Limit (mins) <span style={{fontSize:'11px',opacity:0.6}}>0 = no limit</span></label>
                    <input type="number" className="input-field" min="0" value={form.timeLimitMins} onChange={e => setForm(f => ({ ...f, timeLimitMins: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Questions to Show <span style={{fontSize:'11px',opacity:0.6}}>0 = all</span></label>
                    <input type="number" className="input-field" min="0" value={form.questionsToShow} onChange={e => setForm(f => ({ ...f, questionsToShow: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : editTarget ? 'Update Assignment' : 'Create Assignment'}</button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setDrawerOpen(false); setEditTarget(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
