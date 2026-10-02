export default function Logo({ className = 'logo-nav' }) {
  return (
    <img
      src="/logo.png"
      alt="LINFI Polyclean Enterprise"
      className={`logo ${className}`}
    />
  )
}
