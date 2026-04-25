import { useMemo } from 'react'

function Dashboard({ user, resources, onEditPreferences }) {
  const hasPreferences =
    (user?.preferences?.categories?.length ?? 0) > 0 ||
    (user?.preferences?.subcategories?.length ?? 0) > 0

  const recommendedResources = useMemo(() => {
    if (!hasPreferences) {
      return resources.slice(0, 4)
    }

    const categories = user.preferences.categories ?? []
    const subcategories = user.preferences.subcategories ?? []

    return resources.filter((resource) => {
      const categoryMatch = categories.includes(resource.category)
      const subcategoryMatch = subcategories.includes(resource.subcategory)
      return categoryMatch || subcategoryMatch
    })
  }, [hasPreferences, resources, user])

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-heading">
      <header className="dashboard-hero">
        <p className="dashboard-tag">Protected Area</p>
        <h1 id="dashboard-heading">Learning Dashboard</h1>
        <p>
          Welcome back, {user?.username}. Review your current progress, quiz readiness,
          and typing momentum from one focused place.
        </p>

        <button type="button" className="btn btn-light" onClick={onEditPreferences}>
          Edit Preferences
        </button>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Course Progress</h2>
          <p>6 of 12 modules completed this week.</p>
        </article>

        <article className="dashboard-card">
          <h2>Quiz Readiness</h2>
          <p>Adaptive practice suggests 2 high-priority topics to revise today.</p>
        </article>

        <article className="dashboard-card">
          <h2>Typing Practice</h2>
          <p>English: 43 WPM | Nepali: 30 WPM with improving consistency.</p>
        </article>
      </div>

      <section className="dashboard-recommended" aria-labelledby="recommended-heading">
        <div className="dashboard-recommended-head">
          <h2 id="recommended-heading">Recommended for You</h2>
          {hasPreferences ? <p>Based on your selected interests.</p> : <p>Set preferences to personalize this feed.</p>}
        </div>

        {recommendedResources.length === 0 ? (
          <div className="empty-courses">
            <h2>No recommendations yet</h2>
            <p>Try selecting more categories or upload more resources from Admin.</p>
          </div>
        ) : (
          <div className="recommended-grid">
            {recommendedResources.map((resource) => (
              <article key={resource.id} className="course-card is-recommended">
                <p className="recommend-badge">Recommended</p>
                <h2>{resource.title}</h2>
                <p className="course-description">{resource.description}</p>
                <p className="course-file">
                  <span>Category:</span> {resource.category}
                </p>
                <p className="course-file-type">
                  <span>Subcategory:</span> {resource.subcategory}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default Dashboard
