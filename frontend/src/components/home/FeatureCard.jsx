function FeatureCard({ icon, title, description, tone = 'default' }) {
  return (
    <article className={`home-feature-card ${tone !== 'default' ? `tone-${tone}` : ''}`}>
      <div className="home-feature-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

export default FeatureCard
