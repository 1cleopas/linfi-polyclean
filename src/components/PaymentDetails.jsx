import { payment } from '../data/content'

export default function PaymentDetails({ reference, paid = false }) {
  if (paid) {
    return (
      <div className="payment-box is-paid">
        <p className="eyebrow">Payment</p>
        <p className="payment-paid">
          Payment received by Mobile Money (MoMo). Thank you.
        </p>
        <p className="field-hint">
          Merchant: {payment.merchantName} · ID {payment.merchantId}
        </p>
      </div>
    )
  }

  return (
    <div className="payment-box">
      <div className="payment-copy">
        <p className="eyebrow">How to pay</p>
        <p className="payment-terms">{payment.terms}</p>
        <dl className="payment-ids">
          <div>
            <dt>Merchant ID</dt>
            <dd>{payment.merchantId}</dd>
          </div>
          <div>
            <dt>Merchant name</dt>
            <dd>{payment.merchantName}</dd>
          </div>
          {reference && (
            <div>
              <dt>Reference</dt>
              <dd>{reference}</dd>
            </div>
          )}
        </dl>
        <p className="payment-step-title">Pay with *170#</p>
        <ol>
          {payment.ussdSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <figure className="payment-qr">
        <img src={payment.qrImage} alt={`MoMo QR code for ${payment.merchantName}, merchant ID ${payment.merchantId}`} />
        <figcaption>Or scan with the MoMo app</figcaption>
      </figure>
    </div>
  )
}
