function InfoCard({ icon, title, description, variant = 'default' }) {
  return (
    <article className={`info-card ${variant === 'compact' ? 'is-compact' : ''}`}>
      <div className="card-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

export default InfoCard
