import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Mail, Printer } from 'lucide-react';

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;
  const invoiceRef = useRef(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${data?.invoiceNumber || 'Receipt'}</title>
        <style>
          @page { margin: 20mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1a1a2e;
            font-size: 13px;
            line-height: 1.6;
            padding: 20px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #023295;
          }
          .company-info h1 {
            font-size: 24px;
            font-weight: 800;
            color: #023295;
            margin-bottom: 4px;
          }
          .company-info p {
            color: #666;
            font-size: 12px;
            margin: 2px 0;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            font-size: 20px;
            color: #023295;
            margin-bottom: 4px;
          }
          .invoice-title p {
            color: #666;
            font-size: 12px;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .bill-to h3, .invoice-meta h3 {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          .bill-to p {
            font-weight: 600;
            margin-bottom: 3px;
          }
          .bill-to span {
            color: #666;
            font-size: 12px;
          }
          .invoice-meta table {
            font-size: 12px;
          }
          .invoice-meta td {
            padding: 2px 0;
          }
          .invoice-meta td:first-child {
            color: #888;
            padding-right: 24px;
          }
          .invoice-meta td:last-child {
            font-weight: 600;
          }
          table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          table.items th {
            background: #023295;
            color: #fff;
            padding: 10px 14px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
          }
          table.items th:last-child { text-align: right; }
          table.items td {
            padding: 10px 14px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          table.items td:last-child { text-align: right; font-weight: 700; }
          .total-row td {
            border-top: 2px solid #1a1a2e !important;
            font-weight: 800 !important;
            font-size: 15px !important;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #999;
          }
          .footer p { margin: 2px 0; }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            background: rgba(104,239,63,0.15);
            color: #3cb823;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-info">
            <h1>ITBEES GLOBAL</h1>
            <p>Smart Cloud, BI Analytics & ERP Solutions</p>
            <p>Gachibowli, Hyderabad, India</p>
            <p>support@itbeesglobal.com</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p>#${data?.invoiceNumber || 'N/A'}</p>
            <p style="margin-top:6px"><span class="status-badge">PAID</span></p>
          </div>
        </div>

        <div class="invoice-details">
          <div class="bill-to">
            <h3>Bill To</h3>
            <p>${data?.name || '—'}</p>
            <span>${data?.email || '—'}</span>
          </div>
          <div class="invoice-meta">
            <table>
              <tr><td>Invoice Date</td><td>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td>Payment Method</td><td>Razorpay</td></tr>
              <tr><td>Payment ID</td><td style="font-size:11px;word-break:break-all;max-width:200px">${data?.paymentId || '—'}</td></tr>
            </table>
          </div>
        </div>

        <table class="items">
          <thead>
            <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${data?.templateName || 'Template Purchase'}</strong>
                <br/>
                <span style="font-size:12px;color:#888">Template download with full license</span>
              </td>
              <td>₹${data?.amount?.toLocaleString('en-IN') || '0'}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Paid</strong></td>
              <td>₹${data?.amount?.toLocaleString('en-IN') || '0'}</td>
            </tr>
          </tbody>
        </table>

        ${data?.downloadUrl ? `
        <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="font-size:12px;color:#555"><strong>Download Link:</strong> ${data.downloadUrl}</p>
        </div>` : ''}

        <div class="footer">
          <p><strong>ITBEES Global Pvt. Ltd.</strong></p>
          <p>Gachibowli, Hyderabad, Telangana, India</p>
          <p>support@itbeesglobal.com | www.itbeesglobal.com</p>
          <p style="margin-top:8px;color:#bbb">This is a computer-generated invoice. No signature required.</p>
        </div>

        <script>
          window.onload = function() { 
            setTimeout(function() { window.print(); }, 500);
          };
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  if (!data) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ color: 'var(--color-white)', marginBottom: '12px' }}>No order information found</h2>
        <p style={{ color: 'var(--color-muted-text)', marginBottom: '24px', maxWidth: '400px' }}>
          This page requires order confirmation data. Please complete your purchase first.
        </p>
        <button className="btn-primary" onClick={() => navigate('/training')}>
          Browse Templates
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 18 }}>
          <button className="btn-mini" onClick={() => navigate('/training')}>
            ← Back to Training
          </button>
        </div>

        {/* Success Card */}
        <div ref={invoiceRef} style={{
          background: 'var(--color-white)',
          border: '1px solid var(--color-soft-gray)',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center'
        }}>
          {/* Success Icon */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(104,239,63,0.1)',
            border: '3px solid #68ef3f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle size={44} color="#68ef3f" />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
            PAYMENT SUCCESSFUL! 🎉
          </h2>
          <p style={{ color: 'var(--color-muted-text)', fontSize: '14px', margin: '0 0 24px' }}>
            Your order has been confirmed and invoice has been sent to <strong>{data.email}</strong>
          </p>

          {/* Invoice-style Order Details */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            textAlign: 'left',
            borderLeft: '4px solid #023295'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#023295', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                GST INVOICE
              </div>
              <div style={{ fontSize: '11px', color: '#3cb823', background: 'rgba(104,239,63,0.12)', padding: '3px 10px', borderRadius: '4px', fontWeight: 700 }}>
                PAID
              </div>
            </div>

            <div style={{ borderBottom: '2px solid #023295', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#023295' }}>ITBEES GLOBAL</div>
              <div style={{ fontSize: '11px', color: '#888' }}>Smart Cloud, BI Analytics & ERP Solutions</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Invoice To</div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e' }}>{data.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{data.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Invoice Details</div>
                <table style={{ width: '100%', fontSize: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#888', paddingRight: 12, paddingBottom: 2 }}>Invoice #</td>
                      <td style={{ fontWeight: 600 }}>{data.invoiceNumber || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#888', paddingRight: 12, paddingBottom: 2 }}>Date</td>
                      <td style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#888', paddingRight: 12, paddingBottom: 2 }}>Payment</td>
                      <td style={{ fontWeight: 600 }}>Razorpay</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Line Item Table */}
            <div style={{ borderTop: '1px solid #e0e0e0', borderBottom: '2px solid #1a1a2e' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, padding: '10px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e' }}>{data.templateName || 'Template Purchase'}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>Template download with full license</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', textAlign: 'right', color: '#1a1a2e' }}>
                  ₹{data.amount?.toLocaleString('en-IN') || '0'}
                </div>
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, padding: '12px 0' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#1a1a2e' }}>Total Paid</div>
              <div style={{ fontWeight: 800, fontSize: '16px', textAlign: 'right', color: '#023295' }}>
                ₹{data.amount?.toLocaleString('en-IN') || '0'}
              </div>
            </div>

            {data.paymentId && (
              <div style={{ fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: 10, marginTop: 8, wordBreak: 'break-all' }}>
                Payment ID: {data.paymentId}
              </div>
            )}
          </div>

          {/* Download Button */}
          {data.downloadUrl && (
            <div style={{ marginBottom: 16 }}>
              <a
                href={data.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  padding: '14px 24px',
                  fontSize: '15px',
                  background: 'linear-gradient(135deg, #68ef3f, #3cb823)',
                  color: '#1a1a2e',
                  fontWeight: 700
                }}
              >
                <Download size={20} />
                Download Template Now
              </a>
              <p style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                Your download link will also remain available in your email receipt.
              </p>
            </div>
          )}

          {/* Email Info */}
          <div style={{
            background: 'rgba(35,149,238,0.08)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            textAlign: 'left',
            fontSize: '12px',
            color: '#555',
            lineHeight: 1.5
          }}>
            <Mail size={16} color="#2395ee" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              An invoice has been sent to <strong>{data.email}</strong>. 
              If you don't see it, please check your spam folder or contact us at support@itbeesglobal.com.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
              onClick={() => navigate('/training')}
            >
              Continue Shopping
            </button>
            <button
              className="btn-secondary"
              style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
              onClick={handlePrint}
            >
              <Printer size={16} /> Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}