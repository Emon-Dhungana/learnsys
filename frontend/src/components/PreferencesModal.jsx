import { useMemo, useState } from 'react'

function PreferencesModal({ isOpen, user, courseCategories, onClose, onSave }) {
  const [selectedCategories, setSelectedCategories] = useState(
    user?.preferences?.categories ?? [],
  )
  const [selectedSubcategories, setSelectedSubcategories] = useState(
    user?.preferences?.subcategories ?? [],
  )

  const categoriesMap = useMemo(() => {
    const nextMap = {}

    courseCategories.forEach((categoryItem) => {
      const categoryName = categoryItem.name?.trim()
      if (!categoryName) {
        return
      }

      if (!nextMap[categoryName]) {
        nextMap[categoryName] = new Set()
      }

      ;(categoryItem.subcategories ?? []).forEach((subcategory) => {
        if (subcategory?.trim()) {
          nextMap[categoryName].add(subcategory)
        }
      })
    })

    return nextMap
  }, [courseCategories])

  const categoryNames = useMemo(() => {
    return Object.keys(categoriesMap).sort((a, b) => a.localeCompare(b))
  }, [categoriesMap])

  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category)

      if (isSelected) {
        const nextCategories = prev.filter((item) => item !== category)
        const subcategoriesForCategory = Array.from(categoriesMap[category] ?? [])

        setSelectedSubcategories((prevSubcategories) =>
          prevSubcategories.filter((subcat) => !subcategoriesForCategory.includes(subcat)),
        )

        return nextCategories
      }

      return [...prev, category]
    })
  }

  const toggleSubcategory = (subcategory) => {
    setSelectedSubcategories((prev) => {
      if (prev.includes(subcategory)) {
        return prev.filter((item) => item !== subcategory)
      }

      return [...prev, subcategory]
    })
  }

  const handleSave = () => {
    onSave({
      categories: selectedCategories,
      subcategories: selectedSubcategories,
    })
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={`preferences-overlay ${isOpen ? 'is-open' : ''}`}
      role="presentation"
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
    >
      <section className="preferences-modal" role="dialog" aria-modal="true" aria-label="Select your learning interests">
        <button type="button" className="preferences-close" onClick={onClose} aria-label="Close preferences modal">
          X
        </button>

        <h3>Select Your Interests</h3>
        <p className="preferences-subtext">
          Choose categories and subcategories to personalize recommendations.
        </p>

        {categoryNames.length === 0 ? (
          <div className="preferences-empty">
            <p>No categories available yet. Ask admin to create categories first.</p>
          </div>
        ) : (
          <div className="preference-categories">
            {categoryNames.map((category) => {
              const isCategorySelected = selectedCategories.includes(category)
              const subcategories = Array.from(categoriesMap[category] ?? []).sort((a, b) =>
                a.localeCompare(b),
              )

              return (
                <article
                  key={category}
                  className={`category-card ${isCategorySelected ? 'is-selected' : ''}`}
                >
                  <label className="category-choice">
                    <input
                      type="checkbox"
                      checked={isCategorySelected}
                      onChange={() => toggleCategory(category)}
                    />
                    <span>{category}</span>
                  </label>

                  {isCategorySelected && subcategories.length > 0 ? (
                    <div className="subcategory-list">
                      {subcategories.map((subcategory) => (
                        <label key={subcategory} className="subcategory-choice">
                          <input
                            type="checkbox"
                            checked={selectedSubcategories.includes(subcategory)}
                            onChange={() => toggleSubcategory(subcategory)}
                          />
                          <span>{subcategory}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}

        <div className="preferences-actions">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </section>
    </div>
  )
}

export default PreferencesModal
