import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { publicApi } from '../utils/api.js';

export default function Checkout({ triggerToast, setPayments }) {
  const location = useLocation();
  const navigate = useNavigate();
  const course = location.state?.course;

  const [checkoutStep, setCheckoutStep] = useState('details');
  const [userDetails, setUserDetails] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!course) navigate('/training', { replace: true });
  }, [course]);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await publicApi.requestPurchaseOtp(userDetails.email);
      setCheckoutStep('otp');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
      }, 1000);
      triggerToast && triggerToast('OTP sent to your email.');
    } catch (err) {
      alert(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await publicApi.requestPurchaseOtp(userDetails.email);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
      }, 1000);
      triggerToast && triggerToast('New OTP sent to your email.');
    } catch (err) {
      alert(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerifyAndPay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await publicApi.initiatePurchase({ courseId: course.id, ...userDetails, otp: otpValue });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ITBEES GLOBAL",
        description: `Course: ${course.title}`,
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            const verifyRes = await publicApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              purchaseId: data.purchaseId
            });
            setUserDetails({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' });
            setOtpValue('');
            setCheckoutStep('details');
            setSuccessData(verifyRes.data);
            if (typeof setPayments === 'function') {
              setPayments(prev => [{ ...verifyRes.data, id: response.razorpay_payment_id, createdAt: new Date(), status: 'SUCCESS', course: { title: verifyRes.data.course } }, ...prev]);
            }
            triggerToast && triggerToast('Payment successful. Enrollment confirmed.');
          } catch (err) {
            alert('Payment verification failed: ' + (err.message || err));
          }
        },
        prefill: { name: userDetails.name, email: userDetails.email, contact: userDetails.phone },
        theme: { color: "#023295" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment Failed: ' + response.error.description);
      });
      rzp.open();
    } catch (err) {
      if (err.message?.toLowerCase().includes('already registered')) {
        triggerToast && triggerToast('⚠️ This email is already registered for this course.');
        setCheckoutStep('details');
      } else {
        alert(err.message || 'Payment initiation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  // Show success view immediately after payment — no form, no timer needed
  if (successData) {
    return (
      <div style={{ minHeight: '80vh', padding: '40px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>
          <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-soft-gray)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(104,239,63,0.1)', border: '3px solid #68ef3f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={44} color="#68ef3f" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>PAYMENT SUCCESSFUL! 🎉</h2>
            <p style={{ color: 'var(--color-muted-text)', fontSize: '14px', marginBottom: 24 }}>Enrollment confirmed. Invoice sent to <strong>{successData.email}</strong></p>
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20, marginBottom: 20, textAlign: 'left', borderLeft: '4px solid #023295' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: 2 }}>Name</div><div style={{ fontWeight: 600, color: '#1a1a2e' }}>{successData.name}</div></div>
                <div><div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: 2 }}>Course</div><div style={{ fontWeight: 600, color: '#1a1a2e' }}>{successData.course}</div></div>
                <div><div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: 2 }}>Amount Paid</div><div style={{ fontWeight: 700, color: '#023295' }}>₹{Number(successData.amount).toLocaleString('en-IN')}</div></div>
                <div><div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: 2 }}>Invoice #</div><div style={{ fontWeight: 600, color: '#1a1a2e' }}>{successData.invoiceNumber || '—'}</div></div>
              </div>
              {successData.paymentId && <div style={{ fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: 8, wordBreak: 'break-all' }}>Payment ID: {successData.paymentId}</div>}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/training')}>Back to Courses</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', padding: '40px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ marginBottom: 18 }}>
          <button className="btn-mini" onClick={() => navigate('/training')}>← Back to Courses</button>
        </div>

        <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-soft-gray)', borderRadius: 12, padding: 20 }}>
          <h2 className="heading-lg">Checkout — {course.title}</h2>
          <p style={{ color: 'var(--color-muted-text)', marginBottom: 12 }}>Price: <strong>₹{course.price.toLocaleString('en-IN')}</strong></p>

          {checkoutStep === 'details' ? (
            <form onSubmit={handleDetailsSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="input-field" required placeholder="Anil Kumar" value={userDetails.name} onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="input-field" required placeholder="anil@example.com" value={userDetails.email} onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="input-field" required placeholder="+91 98765 43210" value={userDetails.phone} onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="input-field" required placeholder="House No, Street, Area" value={userDetails.address} onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="input-field" required placeholder="Hyderabad" value={userDetails.city} onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" className="input-field" required placeholder="Telangana" value={userDetails.state} onChange={(e) => setUserDetails({ ...userDetails, state: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input type="text" className="input-field" required placeholder="500032" maxLength="6" value={userDetails.pincode} onChange={(e) => setUserDetails({ ...userDetails, pincode: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Processing...' : 'Verify Email & Proceed'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerifyAndPay}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: 'var(--color-ink)', marginBottom: '8px' }}>Enter the 6-digit code sent to <strong>{userDetails.email}</strong></div>
                <input type="text" className="input-field" required placeholder="123456" maxLength="6" style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', maxWidth: '200px', margin: '0 auto' }} value={otpValue} onChange={(e) => setOtpValue(e.target.value)} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-muted-text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', justifyContent: 'center' }}>
                <Lock size={12} /> Secure Razorpay Checkout will follow.
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Validating...' : 'Verify OTP & Pay Now'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                <button type="button" className="btn-mini" style={{ color: resendCooldown > 0 ? 'var(--color-muted-text)' : 'var(--color-corporate-blue)', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }} onClick={handleResendOtp} disabled={resendCooldown > 0 || loading}>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
              <button type="button" className="btn-mini" style={{ width: '100%', marginTop: '8px', color: 'var(--color-muted-text)' }} onClick={() => setCheckoutStep('details')}>
                Back to Details
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
