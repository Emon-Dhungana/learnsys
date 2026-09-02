import { useMemo } from 'react'

const getTypingRemark = (wpm) => {
  if (wpm <= 0) {
    return 'Start typing for checking speed.'
  }

  if (wpm < 25) {
    return 'Keep practicing accuracy first, speed will improve.'
  }

  if (wpm < 40) {
    return 'Good progress. Try regular timed tests to increase speed.'
  }

  if (wpm < 55) {
    return 'Strong typing pace. Focus on consistency to level up.'
  }

  return 'Excellent speed. Maintain rhythm and reduce small errors.'
}

function Dashboard({ user, resources, typingStats, courseProgress, onEditPreferences, roleMode, onToggleRole }) {
  const memberSinceText = user?.createdAtMs
    ? `Member since: ${new Date(user.createdAtMs).toLocaleDateString()}`
    : 'Member since: Unavailable'

  const hasPreferences =
    (user?.preferences?.categories?.length ?? 0) > 0 ||
    (user?.preferences?.subcategories?.length ?? 0) > 0

  const recommendedResources = useMemo(() => {
    if (!hasPreferences) {
      return resources.slice(0, 4)
    }

    const preferredCourseCategories = user.preferences.categories ?? []
    const subcategories = user.preferences.subcategories ?? []

    return resources.filter((resource) => {
      const categoryMatch = preferredCourseCategories.includes(resource.category)
      const subcategoryMatch = subcategories.includes(resource.subcategory)
      return categoryMatch || subcategoryMatch
    })
  }, [hasPreferences, resources, user])

  const englishHistory = useMemo(() => {
    return (typingStats?.history ?? []).filter((item) => (item.language ?? 'english') === 'english')
  }, [typingStats])

  const nepaliHistory = useMemo(() => {
    return (typingStats?.history ?? []).filter((item) => (item.language ?? 'english') === 'nepali')
  }, [typingStats])

  const latestEnglishWpm = englishHistory.length
    ? englishHistory[englishHistory.length - 1].wpm
    : 0
  const latestNepaliWpm = nepaliHistory.length
    ? nepaliHistory[nepaliHistory.length - 1].wpm
    : 0

  const englishRemark = getTypingRemark(latestEnglishWpm)
  const nepaliRemark = getTypingRemark(latestNepaliWpm)

  const courseProgressItems = useMemo(() => {
    return resources
      .map((resource) => {
        const progress = courseProgress?.[resource.id]
        if (!progress?.viewed && !progress?.downloaded) {
          return null
        }

        let status = 'Viewed'
        if (progress?.viewed && progress?.downloaded) {
          status = 'Viewed and Downloaded'
        } else if (progress?.downloaded) {
          status = 'Downloaded'
        }

        return {
          id: resource.id,
          title: resource.title,
          status,
          lastActionAt: Math.max(progress?.viewedAt ?? 0, progress?.downloadedAt ?? 0),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.lastActionAt - a.lastActionAt)
  }, [courseProgress, resources])

  const viewedCount = courseProgressItems.filter((item) => item.status.includes('Viewed')).length
  const downloadedCount = courseProgressItems.filter((item) => item.status.includes('Downloaded')).length

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-heading">
      <header className="dashboard-hero">
        <p className="dashboard-tag">Protected Area</p>
        <h1 id="dashboard-heading">Learning Dashboard</h1>
        <p>
          Welcome back, {user?.username}. Review your current progress, quiz readiness,
          and typing momentum from one focused place.
        </p>
        <p className="dashboard-member-since">{memberSinceText}</p>

        <div className="dashboard-actions">
          <button type="button" className="btn btn-light" onClick={onEditPreferences}>
            Edit Preferences
          </button>
          {roleMode === 'user' ? (
            <button type="button" className="btn btn-primary" onClick={onToggleRole}>
              Switch to Admin
            </button>
          ) : null}
        </div>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Course Progress</h2>
          {courseProgressItems.length === 0 ? (
            <p>No course activity yet. Open a course resource to mark it as viewed.</p>
          ) : (
            <>
              <p>
                Viewed: {viewedCount} | Downloaded: {downloadedCount}
              </p>
              <p>
                Remark:{' '}
                {downloadedCount > 0
                  ? 'Great consistency. You are both viewing and downloading learning materials.'
                  : 'You are viewing resources. Download important files for offline revision.'}
              </p>
              <ul>
                {courseProgressItems.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    {item.title}: {item.status}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>

        <article className="dashboard-card">
          <h2>Quiz Readiness</h2>
          <p>Adaptive practice suggests 2 high-priority topics to revise today.</p>
        </article>

        <article className="dashboard-card">
          <h2>Typing Practice</h2>
          <p>English: {latestEnglishWpm.toFixed(1)} WPM</p>
          <p>{englishRemark}</p>
          <p>Nepali: {latestNepaliWpm.toFixed(1)} WPM</p>
          <p>{nepaliRemark}</p>
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
