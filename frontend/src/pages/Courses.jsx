import { useMemo, useState } from 'react'

function Courses({
  resources,
  courseCategories,
  userPreferences,
  resourceProgress,
  onResourceView,
  onResourceDownload,
}) {
  const [showAll, setShowAll] = useState(false)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all')

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

  const prioritizedResources = useMemo(() => {
    if (!hasPreferences) {
      return categoryFilteredResources
    }

    const preferredIds = new Set(preferredResources.map((item) => item.id))
    const nonPreferred = categoryFilteredResources.filter((item) => !preferredIds.has(item.id))
    return [...preferredResources, ...nonPreferred]
  }, [categoryFilteredResources, hasPreferences, preferredResources])

  const visibleResources = hasPreferences && !showAll ? preferredResources : prioritizedResources

  const isRecommended = (resource) => {
    if (!hasPreferences) {
      return false
    }

    return preferredResources.some((item) => item.id === resource.id)
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

    const looksLikePdf =
      resource.fileName?.toLowerCase().endsWith('.pdf') ||
      sourceUrl.toLowerCase().includes('.pdf')

    if (looksLikePdf && sourceUrl.includes('/image/upload/')) {
      return sourceUrl.replace('/image/upload/', '/raw/upload/')
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

  const openPdfInNewTab = async (resourceUrl) => {
    const previewTab = window.open('', '_blank')

    if (!previewTab) {
      throw new Error('Popup blocked. Please allow popups for this site.')
    }

    previewTab.document.write('<p style="font-family: sans-serif; padding: 1rem;">Loading PDF...</p>')

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 12000)

    try {
      const response = await fetch(resourceUrl, { signal: controller.signal })
      if (!response.ok) {
        throw new Error('Unable to fetch PDF preview.')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      previewTab.location.replace(objectUrl)

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 60000)
    } catch {
      // Important: reuse the same already-opened tab to avoid popup blockers.
      previewTab.location.replace(resourceUrl)
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const handleViewResource = async (resource) => {
    const resourceUrl = getResourceUrl(resource)
    if (!resourceUrl || resourceUrl === '#') {
      return
    }

    onResourceView?.(resource.id)

    if (isPdfResource(resource)) {
      await openPdfInNewTab(resourceUrl)
      return
    }

    window.open(resourceUrl, '_blank', 'noopener,noreferrer')
  }

  return (
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

              <div className="courses-toolbar">
                <button
                  type="button"
                  className="btn btn-primary course-action"
                  onClick={() => {
                    handleViewResource(resource)
                  }}
                >
                  View
                </button>

                <a
                  className="btn btn-light course-action"
                  href={getResourceUrl(resource)}
                  download={resource.fileName}
                  onClick={() => onResourceDownload?.(resource.id)}
                >
                  Download
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Courses
