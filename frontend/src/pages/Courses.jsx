import { useMemo, useState } from 'react'
import PdfViewer from '../components/PdfViewer'
import { fetchPdfAsBlob, downloadPdf } from '../utils/pdfUtils'

function Courses({
  resources,
  courseCategories,
  userPreferences,
  resourceProgress,
  courseRatingsByUsername,
  currentUser,
  onResourceView,
  onResourceDownload,
  onRateCourse,
}) {
  const [showAll, setShowAll] = useState(false)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all')
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null)
  const [selectedPdfFileName, setSelectedPdfFileName] = useState(null)

  const categoryNames = courseCategories.map((item) => item.name)

  const categoryFilteredResources = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return resources
    }

    return resources.filter((resource) => resource.category === activeCategoryFilter)
  }, [activeCategoryFilter, resources])

  const hasPreferences =
    (userPreferences?.categories?.length ?? 0) > 0 ||
    (userPreferences?.subcategories?.length ?? 0) > 0

  const preferredResources = useMemo(() => {
    if (!hasPreferences) {
      return categoryFilteredResources
    }

    const preferredCategories = userPreferences.categories ?? []
    const preferredSubcategories = userPreferences.subcategories ?? []

    return categoryFilteredResources.filter((resource) => {
      const categoryMatch = preferredCategories.includes(resource.category)
      const subcategoryMatch = preferredSubcategories.includes(resource.subcategory)
      return categoryMatch || subcategoryMatch
    })
  }, [categoryFilteredResources, hasPreferences, userPreferences])

  const getUserRatingForResource = (resourceId) => {
    if (!currentUser?.username) {
      return 0
    }

    return courseRatingsByUsername?.[currentUser.username]?.[resourceId] ?? 0
  }

  const getAverageRating = (resourceId) => {
    const ratings = Object.values(courseRatingsByUsername ?? {}).flatMap((userRatings) =>
      userRatings?.[resourceId] != null ? [Number(userRatings[resourceId])] : [],
    )

    if (ratings.length === 0) {
      return 0
    }

    return ratings.reduce((sum, value) => sum + value, 0) / ratings.length
  }

  const getRecommendationScore = (resource) => {
    const categoryBoost = hasPreferences
      ? preferredResources.some((item) => item.id === resource.id)
        ? 5
        : 0
      : 0

    const averageRating = getAverageRating(resource.id)
    const ratingBoost = averageRating * 2
    const userRatingBoost = getUserRatingForResource(resource.id) * 2

    return categoryBoost + ratingBoost + userRatingBoost
  }

  const rankedResources = useMemo(() => {
    return [...categoryFilteredResources].sort(
      (a, b) => getRecommendationScore(b) - getRecommendationScore(a),
    )
  }, [categoryFilteredResources, hasPreferences, preferredResources, courseRatingsByUsername, currentUser])

  const visibleResources = hasPreferences && !showAll ? preferredResources : rankedResources

  const isRecommended = (resource) => {
    if (!hasPreferences && getAverageRating(resource.id) < 4) {
      return false
    }

    return preferredResources.some((item) => item.id === resource.id) || getAverageRating(resource.id) >= 4
  }

  const getProgressStatus = (resourceId) => {
    const progress = resourceProgress?.[resourceId]
    if (!progress?.viewed && !progress?.downloaded) {
      return null
    }

    if (progress?.viewed && progress?.downloaded) {
      return 'Viewed and Downloaded'
    }

    if (progress?.downloaded) {
      return 'Downloaded'
    }

    return 'Viewed'
  }

  const getResourceUrl = (resource) => {
    const sourceUrl = resource.fileUrl
    if (!sourceUrl) {
      return '#'
    }

    return sourceUrl
  }

  const isPdfResource = (resource) => {
    const resourceUrl = getResourceUrl(resource)
    return (
      resource.fileName?.toLowerCase().endsWith('.pdf') ||
      resourceUrl.toLowerCase().includes('.pdf')
    )
  }

  const openPdfViewer = (resource) => {
    const resourceUrl = getResourceUrl(resource)
    setSelectedPdfUrl(resourceUrl)
    setSelectedPdfFileName(resource.fileName)
    setPdfViewerOpen(true)
  }

  const handleViewResource = (resource) => {
    const resourceUrl = getResourceUrl(resource)
    if (!resourceUrl || resourceUrl === '#') {
      return
    }

    onResourceView?.(resource.id)

    if (isPdfResource(resource)) {
      openPdfViewer(resource)
      return
    }

    window.open(resourceUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadResource = async (resource) => {
    const resourceUrl = getResourceUrl(resource)
    if (!resourceUrl || resourceUrl === '#') {
      return
    }

    onResourceDownload?.(resource.id)

    try {
      if (isPdfResource(resource)) {
        const blob = await fetchPdfAsBlob(resourceUrl)
        downloadPdf(blob, resource.fileName)
        return
      }

      const link = document.createElement('a')
      link.href = resourceUrl
      link.download = resource.fileName || 'document'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      const link = document.createElement('a')
      link.href = resourceUrl
      link.download = resource.fileName || 'document'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const renderStars = (resource) => {
    const currentRating = getUserRatingForResource(resource.id)

    return (
      <div className="course-rating" aria-label={`Rate ${resource.title}`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`rating-star ${value <= currentRating ? 'is-active' : ''}`}
            onClick={() => onRateCourse?.(resource.id, value)}
            aria-label={`Rate ${value} out of 5`}
            title={`Rate ${value} out of 5`}
          >
            ★
          </button>
        ))}
        <span className="rating-average">
          {getAverageRating(resource.id) > 0
            ? `${getAverageRating(resource.id).toFixed(1)} avg`
            : 'No ratings yet'}
        </span>
      </div>
    )
  }

  return (
    <>
      <PdfViewer
        pdfUrl={selectedPdfUrl}
        fileName={selectedPdfFileName}
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
      />

      <section className="courses-page" aria-labelledby="courses-heading">
      <header className="courses-hero">
        <p className="courses-tag">Learning Resources</p>
        <h1 id="courses-heading">Courses Library</h1>
        <p>
          Explore uploaded PDFs, notes, and study files curated for focused and
          structured learning.
        </p>

        <div className="courses-toolbar">
          <select
            className="courses-filter-select"
            value={activeCategoryFilter}
            onChange={(event) => setActiveCategoryFilter(event.target.value)}
          >
            <option value="all">All Categories</option>
            {categoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {hasPreferences ? (
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? 'Show Preferred Only' : 'Show All'}
            </button>
          ) : null}
        </div>
      </header>

      {resources.length === 0 ? (
        <div className="empty-courses">
          <h2>No courses available yet</h2>
          <p>Admin uploads will appear here once resources are added.</p>
        </div>
      ) : visibleResources.length === 0 ? (
        <div className="empty-courses">
          <h2>No preferred resources found</h2>
          <p>Try using Show All or update your preferences from Dashboard.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {visibleResources.map((resource) => (
            <article
              key={resource.id}
              className={`course-card ${isRecommended(resource) ? 'is-recommended' : ''}`}
            >
              {isRecommended(resource) ? <p className="recommend-badge">Recommended</p> : null}
              <h2>{resource.title}</h2>
              <p className="course-description">{resource.description}</p>

              <div className="course-badges">
                <span className="course-pill">{resource.category}</span>
                <span className="course-pill is-sub">{resource.subcategory}</span>
              </div>

              <p className="course-file">
                <span>File:</span> {resource.fileName}
              </p>
              <p className="course-file-type">
                <span>Type:</span> {resource.fileType}
              </p>

              {getProgressStatus(resource.id) ? (
                <p className="course-file-type">
                  <span>Status:</span> {getProgressStatus(resource.id)}
                </p>
              ) : null}

              {renderStars(resource)}

              <div className="courses-toolbar">
                <button
                  type="button"
                  className="btn btn-primary course-action"
                  onClick={() => handleViewResource(resource)}
                >
                  View
                </button>

                <button
                  type="button"
                  className="btn btn-light course-action"
                  onClick={() => handleDownloadResource(resource)}
                >
                  Download
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
    </>
  )
}

export default Courses
