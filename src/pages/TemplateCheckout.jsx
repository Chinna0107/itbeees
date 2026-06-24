import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { publicApi } from '../utils/api.js';

export default function TemplateCheckout({ triggerToast, setPayments }) {
  const location = useLocation();
  const navigate = useNavigate();
  const template = location.state?.template;

  const [checkoutStep, setCheckoutStep] = useState('details');
  const [userDetails, setUserDetails] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'india' });
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (!template) navigate('/training', { replace: true });
  }, [template]);

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
      const { data } = await publicApi.initiateTemplatePurchase({
        templateId: template.id,
        ...userDetails,
        otp: otpValue
      });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ITBEES GLOBAL",
        description: `Template: ${template.name}`,
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            const verifyRes = await publicApi.verifyTemplatePayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              purchaseId: data.purchaseId
            });
            if (typeof setPayments === 'function') {
              setPayments(prev => [{ ...verifyRes.data, id: response.razorpay_payment_id, createdAt: new Date(), status: 'SUCCESS', type: 'TEMPLATE', itemTitle: verifyRes.data.templateName }, ...prev]);
            }
            // Navigate to order confirmation page
            navigate('/training/order-confirmation', { state: { data: verifyRes.data } });
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
      if (err.message?.toLowerCase().includes('already purchased')) {
        triggerToast && triggerToast('⚠️ This email has already purchased this template.');
        setCheckoutStep('details');
      } else {
        alert(err.message || 'Payment initiation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  return (
    <div style={{ minHeight: '80vh', padding: '40px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ marginBottom: 18 }}>
          <button className="btn-mini" onClick={() => navigate('/training')}>← Back to Training</button>
        </div>

        <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-soft-gray)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 12 }}>
            {template.image && (
              <img src={template.image} alt={template.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
            )}
            <div>
              <h2 className="heading-lg" style={{ margin: 0 }}>{template.name}</h2>
              <p style={{ color: 'var(--color-muted-text)', fontSize: '13px', marginTop: '4px' }}>{template.category || 'General'} Template</p>
            </div>
          </div>
          <p style={{ color: 'var(--color-muted-text)', marginBottom: 12 }}>
            {userDetails.country === 'india' ? (
              <>
                Price (incl. 18% GST): <strong style={{ fontSize: '18px', color: 'var(--color-ink)' }}>₹{template.price.toLocaleString('en-IN')}</strong>
                <span style={{ display: 'block', fontSize: '12px', marginTop: 2 }}>
                  Subtotal: ₹{(template.price / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })} + GST: ₹{(template.price - template.price / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </>
            ) : (
              <>Price: <strong style={{ fontSize: '18px', color: 'var(--color-ink)' }}>₹{template.price.toLocaleString('en-IN')}</strong></>
            )}
          </p>
          {template.features && Array.isArray(template.features) && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-light-canvas)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-ink)' }}>WHAT'S INCLUDED:</div>
              {template.features.slice(0, 5).map((f, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--color-muted-text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <CheckCircle size={12} color="var(--color-evergreen-glow)" /> {f}
                </div>
              ))}
            </div>
          )}

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
                <label className="form-label">Country</label>
                <select className="input-field" value={userDetails.country} onChange={(e) => setUserDetails({ ...userDetails, country: e.target.value, state: '', pincode: '' })}>
                  <option value="india">India</option>
                  <option value="other">Other Country</option>
                </select>
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
                {userDetails.country === 'india' && (
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input type="text" className="input-field" required placeholder="Telangana" value={userDetails.state} onChange={(e) => setUserDetails({ ...userDetails, state: e.target.value })} />
                  </div>
                )}
              </div>
              {userDetails.country === 'india' && (
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" className="input-field" required placeholder="500032" maxLength="6" value={userDetails.pincode} onChange={(e) => setUserDetails({ ...userDetails, pincode: e.target.value })} />
                </div>
              )}
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