function SectionHeader({ id, title, subtitle }) {
  return (
    <div className="section-head">
      <h2 id={id}>{title}</h2>
      <p>{subtitle}</p>
    </div>
  )
}

export default SectionHeader
