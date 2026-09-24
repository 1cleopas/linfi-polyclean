export default function Logo({ className = 'h-12 w-12' }) {
  return (
    <img
      src="/logo.png"
      alt="LINFI Polyclean Enterprise"
      className={`rounded-xl bg-white object-contain ${className}`}
    />
  )
}
