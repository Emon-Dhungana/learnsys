function InfoSection({ id, title, subtitle, children }) {
  return (
    <section className="home-section" id={id} aria-labelledby={`${id}-title`}>
      <div className="home-section-head">
        <h2 id={`${id}-title`}>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default InfoSection
