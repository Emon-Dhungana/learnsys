import { useState } from 'react'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'courseManagement', label: 'Course Management' },
  { id: 'courseCategories', label: 'Course Categories' },
  { id: 'quizManagement', label: 'Quiz Management' },
  { id: 'quizCategories', label: 'Quiz Categories' },
]

function CategoryManagerSection({
  title,
  emptyMessage,
  addPlaceholder,
  categoryList,
  categoryName,
  categoryError,
  subcategoryError,
  editingCategoryId,
  editingCategoryName,
  subcategoryInput,
  onCategoryNameChange,
  onAddCategory,
  onStartEdit,
  onEditingCategoryNameChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteCategory,
  onSubcategoryInputChange,
  onAddSubcategory,
  onDeleteSubcategory,
}) {
  return (
    <section className="admin-category-panel" aria-label={title}>
      <h2>{title}</h2>

      <form className="admin-inline-form" onSubmit={onAddCategory}>
        <input
          type="text"
          value={categoryName}
          onChange={onCategoryNameChange}
          placeholder={addPlaceholder}
        />
        <button type="submit" className="btn btn-primary">
          Add Category
        </button>
      </form>

      {categoryError ? <p className="auth-error">{categoryError}</p> : null}
      {subcategoryError ? <p className="auth-error">{subcategoryError}</p> : null}

      {categoryList.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div className="admin-category-grid">
          {categoryList.map((category) => (
            <article key={category.id} className="admin-category-card">
              {editingCategoryId === category.id ? (
                <div className="admin-category-edit">
                  <input
                    type="text"
                    value={editingCategoryName}
                    onChange={onEditingCategoryNameChange}
                    placeholder="Category name"
                  />
                  <div className="admin-small-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onSaveEdit(category.id)}
                    >
                      Save
                    </button>
                    <button type="button" className="btn btn-light" onClick={onCancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-category-head">
                  <h3>{category.name}</h3>
                  <div className="admin-small-actions">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => onStartEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => onDeleteCategory(category)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="admin-subcategory-list">
                {category.subcategories.length === 0 ? (
                  <p>No subcategories yet.</p>
                ) : (
                  category.subcategories.map((subcategoryName) => (
                    <div key={subcategoryName} className="admin-subcategory-item">
                      <span>{subcategoryName}</span>
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => onDeleteSubcategory(category, subcategoryName)}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-add-subcategory">
                <input
                  type="text"
                  value={subcategoryInput[category.id] ?? ''}
                  onChange={(event) => onSubcategoryInputChange(category.id, event.target.value)}
                  placeholder="New subcategory"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onAddSubcategory(category)}
                >
                  Add Subcategory
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function Admin({
  courseCategories,
  quizCategories,
  adminQuizzes,
  resources,
  onAddCourseCategory,
  onRenameCourseCategory,
  onDeleteCourseCategory,
  onAddCourseSubcategory,
  onDeleteCourseSubcategory,
  onAddQuizCategory,
  onRenameQuizCategory,
  onDeleteQuizCategory,
  onAddQuizSubcategory,
  onDeleteQuizSubcategory,
  onAddAdminQuestion,
  onDeleteAdminQuestion,
  onUploadResource,
  onDeleteResource,
  onAdminLogout,
}) {
  const [activeTab, setActiveTab] = useState('overview')

  const [courseCategoryName, setCourseCategoryName] = useState('')
  const [courseCategoryError, setCourseCategoryError] = useState('')
  const [editingCourseCategoryId, setEditingCourseCategoryId] = useState(null)
  const [editingCourseCategoryName, setEditingCourseCategoryName] = useState('')
  const [courseSubcategoryInput, setCourseSubcategoryInput] = useState({})
  const [courseSubcategoryError, setCourseSubcategoryError] = useState('')

  const [quizCategoryName, setQuizCategoryName] = useState('')
  const [quizCategoryError, setQuizCategoryError] = useState('')
  const [editingQuizCategoryId, setEditingQuizCategoryId] = useState(null)
  const [editingQuizCategoryName, setEditingQuizCategoryName] = useState('')
  const [quizSubcategoryInput, setQuizSubcategoryInput] = useState({})
  const [quizSubcategoryError, setQuizSubcategoryError] = useState('')

  const [questionError, setQuestionError] = useState('')
  const [questionData, setQuestionData] = useState({
    question: '',
    categoryId: '',
    subcategory: '',
    options: {
      A: '',
      B: '',
      C: '',
      D: '',
    },
    correctAnswer: 'A',
  })

  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategory: '',
    file: null,
  })
  const [uploadError, setUploadError] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const selectedCourseCategory = courseCategories.find((item) => item.id === uploadData.categoryId)
  const selectedQuizCategory = quizCategories.find((item) => item.id === questionData.categoryId)
  const totalCourses = courseCategories.length
  const totalResources = resources.length
  const totalQuizQuestions = adminQuizzes.length

  const isDuplicateCategoryName = (categoryList, name, ignoreId = null) => {
    return categoryList.some(
      (item) => item.id !== ignoreId && item.name.toLowerCase() === name.trim().toLowerCase(),
    )
  }

  const handleAddCourseCategorySubmit = (event) => {
    event.preventDefault()

    const normalizedName = courseCategoryName.trim()
    if (!normalizedName) {
      setCourseCategoryError('Category name is required.')
      return
    }

    if (isDuplicateCategoryName(courseCategories, normalizedName)) {
      setCourseCategoryError('Category name already exists.')
      return
    }

    onAddCourseCategory(normalizedName)
    setCourseCategoryName('')
    setCourseCategoryError('')
  }

  const startCourseCategoryEdit = (category) => {
    setEditingCourseCategoryId(category.id)
    setEditingCourseCategoryName(category.name)
    setCourseCategoryError('')
  }

  const saveCourseCategoryEdit = (categoryId) => {
    const normalizedName = editingCourseCategoryName.trim()
    if (!normalizedName) {
      setCourseCategoryError('Category name is required.')
      return
    }

    if (isDuplicateCategoryName(courseCategories, normalizedName, categoryId)) {
      setCourseCategoryError('Category name already exists.')
      return
    }

    onRenameCourseCategory(categoryId, normalizedName)
    setEditingCourseCategoryId(null)
    setEditingCourseCategoryName('')
    setCourseCategoryError('')
  }

  const cancelCourseCategoryEdit = () => {
    setEditingCourseCategoryId(null)
    setEditingCourseCategoryName('')
    setCourseCategoryError('')
  }

  const removeCourseCategory = (category) => {
    const confirmed = window.confirm(
      `Delete course category "${category.name}"? Resources in this category will become Uncategorized.`,
    )

    if (!confirmed) {
      return
    }

    onDeleteCourseCategory(category.id)
  }

  const handleCourseSubcategoryInputChange = (categoryId, value) => {
    setCourseSubcategoryInput((prev) => ({
      ...prev,
      [categoryId]: value,
    }))
    setCourseSubcategoryError('')
  }

  const addCourseSubcategory = (category) => {
    const rawValue = courseSubcategoryInput[category.id] ?? ''
    const normalizedName = rawValue.trim()

    if (!normalizedName) {
      setCourseSubcategoryError('Subcategory name is required.')
      return
    }

    const duplicate = category.subcategories.some(
      (item) => item.toLowerCase() === normalizedName.toLowerCase(),
    )
    if (duplicate) {
      setCourseSubcategoryError('Subcategory already exists for this category.')
      return
    }

    onAddCourseSubcategory(category.id, normalizedName)
    setCourseSubcategoryInput((prev) => ({
      ...prev,
      [category.id]: '',
    }))
    setCourseSubcategoryError('')
  }

  const removeCourseSubcategory = (category, subcategoryName) => {
    onDeleteCourseSubcategory(category.id, subcategoryName)
  }

  const handleAddQuizCategorySubmit = (event) => {
    event.preventDefault()

    const normalizedName = quizCategoryName.trim()
    if (!normalizedName) {
      setQuizCategoryError('Category name is required.')
      return
    }

    if (isDuplicateCategoryName(quizCategories, normalizedName)) {
      setQuizCategoryError('Category name already exists.')
      return
    }

    onAddQuizCategory(normalizedName)
    setQuizCategoryName('')
    setQuizCategoryError('')
  }

  const startQuizCategoryEdit = (category) => {
    setEditingQuizCategoryId(category.id)
    setEditingQuizCategoryName(category.name)
    setQuizCategoryError('')
  }

  const saveQuizCategoryEdit = (categoryId) => {
    const normalizedName = editingQuizCategoryName.trim()
    if (!normalizedName) {
      setQuizCategoryError('Category name is required.')
      return
    }

    if (isDuplicateCategoryName(quizCategories, normalizedName, categoryId)) {
      setQuizCategoryError('Category name already exists.')
      return
    }

    onRenameQuizCategory(categoryId, normalizedName)
    setEditingQuizCategoryId(null)
    setEditingQuizCategoryName('')
    setQuizCategoryError('')
  }

  const cancelQuizCategoryEdit = () => {
    setEditingQuizCategoryId(null)
    setEditingQuizCategoryName('')
    setQuizCategoryError('')
  }

  const removeQuizCategory = (category) => {
    const confirmed = window.confirm(
      `Delete quiz category "${category.name}"? Quiz questions in this category will become Uncategorized.`,
    )

    if (!confirmed) {
      return
    }

    onDeleteQuizCategory(category.id)
  }

  const handleQuizSubcategoryInputChange = (categoryId, value) => {
    setQuizSubcategoryInput((prev) => ({
      ...prev,
      [categoryId]: value,
    }))
    setQuizSubcategoryError('')
  }

  const addQuizSubcategory = (category) => {
    const rawValue = quizSubcategoryInput[category.id] ?? ''
    const normalizedName = rawValue.trim()

    if (!normalizedName) {
      setQuizSubcategoryError('Subcategory name is required.')
      return
    }

    const duplicate = category.subcategories.some(
      (item) => item.toLowerCase() === normalizedName.toLowerCase(),
    )
    if (duplicate) {
      setQuizSubcategoryError('Subcategory already exists for this category.')
      return
    }

    onAddQuizSubcategory(category.id, normalizedName)
    setQuizSubcategoryInput((prev) => ({
      ...prev,
      [category.id]: '',
    }))
    setQuizSubcategoryError('')
  }

  const removeQuizSubcategory = (category, subcategoryName) => {
    onDeleteQuizSubcategory(category.id, subcategoryName)
  }

  const handleUploadChange = (event) => {
    const { name, value, files } = event.target

    if (name === 'file') {
      setUploadData((prev) => ({ ...prev, file: files?.[0] ?? null }))
    } else {
      setUploadData((prev) => ({ ...prev, [name]: value }))
    }

    setUploadError('')
  }

  const handleQuestionFieldChange = (event) => {
    const { name, value } = event.target

    if (name === 'categoryId') {
      const nextCategory = quizCategories.find((item) => item.id === value)
      setQuestionData((prev) => ({
        ...prev,
        categoryId: value,
        subcategory: nextCategory?.subcategories[0] ?? '',
      }))
    } else {
      setQuestionData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    setQuestionError('')
  }

  const handleOptionChange = (key, value) => {
    setQuestionData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [key]: value,
      },
    }))
    setQuestionError('')
  }

  const handleAdminQuestionSubmit = (event) => {
    event.preventDefault()

    if (!quizCategories.length) {
      setQuestionError('Create quiz categories before adding admin quiz questions.')
      return
    }

    const selectedQuestionCategory = quizCategories.find((item) => item.id === questionData.categoryId)

    const optionsFilled = ['A', 'B', 'C', 'D'].every(
      (key) => questionData.options[key].trim().length > 0,
    )

    if (
      !questionData.question.trim() ||
      !selectedQuestionCategory ||
      !questionData.subcategory.trim() ||
      !optionsFilled
    ) {
      setQuestionError('Question, category, subcategory, and all options are required.')
      return
    }

    onAddAdminQuestion({
      question: questionData.question.trim(),
      options: {
        A: questionData.options.A.trim(),
        B: questionData.options.B.trim(),
        C: questionData.options.C.trim(),
        D: questionData.options.D.trim(),
      },
      correctAnswer: questionData.correctAnswer,
      category: selectedQuestionCategory.name,
      subcategory: questionData.subcategory.trim(),
    })

    setQuestionData({
      question: '',
      categoryId: '',
      subcategory: '',
      options: {
        A: '',
        B: '',
        C: '',
        D: '',
      },
      correctAnswer: 'A',
    })
    setQuestionError('')
  }

  const handleUploadSubmit = async (event) => {
    event.preventDefault()

    if (!courseCategories.length) {
      setUploadError('Create at least one course category before uploading resources.')
      return
    }

    if (!uploadData.title.trim() || !uploadData.description.trim() || !uploadData.file) {
      setUploadError('Please complete title, description, and file upload.')
      return
    }

    if (!selectedCourseCategory || !uploadData.subcategory.trim()) {
      setUploadError('Please complete title, description, category, subcategory, and file upload.')
      return
    }

    try {
      setUploadLoading(true)
      setUploadProgress(0)

      const result = await uploadToCloudinary(uploadData.file, setUploadProgress)

      onUploadResource({
        title: uploadData.title.trim(),
        description: uploadData.description.trim(),
        category: selectedCourseCategory.name,
        subcategory: uploadData.subcategory.trim(),
        fileUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        fileName: uploadData.file.name,
      })

      setUploadData({
        title: '',
        description: '',
        categoryId: '',
        subcategory: '',
        file: null,
      })
      setUploadError('')
      setUploadProgress(0)
    } catch (error) {
      setUploadError(error?.message || 'Failed to upload file to Cloudinary.')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleAdminLogout = () => {
    setActiveTab('overview')
    setUploadError('')
    setCourseCategoryError('')
    setCourseSubcategoryError('')
    setQuizCategoryError('')
    setQuizSubcategoryError('')
    setQuestionError('')
    onAdminLogout()
  }

  return (
    <section className="admin-page admin-dashboard" aria-labelledby="admin-heading">
      <header className="admin-hero">
        <p className="admin-tag">LearnSys Admin Panel</p>
        <h1 id="admin-heading">Dashboard Control Center</h1>
        <p>Manage resources, categories, and quiz content from one focused workspace.</p>
      </header>

      <div className="admin-shell">
          <aside className="admin-sidebar" aria-label="Admin dashboard navigation">
            <div className="admin-sidebar-header">
              <h2>Workspace</h2>
              <p>Logged in as admin</p>
            </div>

            <nav className="admin-sidebar-nav">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-nav-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <button type="button" className="btn btn-light admin-logout-btn" onClick={handleAdminLogout}>
              Admin Logout
            </button>
          </aside>

          <div className="admin-main">
            {activeTab === 'overview' ? (
              <section className="admin-panel" aria-label="Overview section">
                <div className="admin-panel-head">
                  <h2>Overview</h2>
                  <p>Quick snapshot of your current content inventory.</p>
                </div>

                <div className="admin-stats-grid">
                  <article className="admin-stat-card">
                    <h3>Total Courses</h3>
                    <p>{totalCourses}</p>
                  </article>
                  <article className="admin-stat-card">
                    <h3>Total Resources</h3>
                    <p>{totalResources}</p>
                  </article>
                  <article className="admin-stat-card">
                    <h3>Total Quiz Questions</h3>
                    <p>{totalQuizQuestions}</p>
                  </article>
                </div>

                <div className="admin-overview-grid">
                  <article className="admin-info-card">
                    <h3>Course Pipeline</h3>
                    <p>Upload fresh materials and keep the course library updated by category.</p>
                  </article>
                  <article className="admin-info-card">
                    <h3>Assessment Readiness</h3>
                    <p>Maintain a balanced quiz bank across quiz categories and subcategories.</p>
                  </article>
                </div>
              </section>
            ) : null}

            {activeTab === 'courseManagement' ? (
              <section className="admin-panel" aria-label="Course management section">
                <div className="admin-panel-head">
                  <h2>Course Management</h2>
                  <p>Upload new resources and maintain the existing course resource list.</p>
                </div>

                <form className="admin-form" onSubmit={handleUploadSubmit}>
                  <h3>Upload New Course Resource</h3>
                  <label htmlFor="resource-title">Title</label>
                  <input
                    id="resource-title"
                    name="title"
                    type="text"
                    value={uploadData.title}
                    onChange={handleUploadChange}
                    placeholder="Resource title"
                  />

                  <label htmlFor="resource-description">Description</label>
                  <textarea
                    id="resource-description"
                    name="description"
                    value={uploadData.description}
                    onChange={handleUploadChange}
                    placeholder="Short resource description"
                  />

                  <label htmlFor="resource-category">Course Category</label>
                  <select
                    id="resource-category"
                    name="categoryId"
                    value={uploadData.categoryId}
                    onChange={(event) => {
                      const nextCategoryId = event.target.value
                      const nextCategory = courseCategories.find((item) => item.id === nextCategoryId)

                      setUploadData((prev) => ({
                        ...prev,
                        categoryId: nextCategoryId,
                        subcategory: nextCategory?.subcategories[0] ?? '',
                      }))
                      setUploadError('')
                    }}
                    disabled={!courseCategories.length}
                  >
                    <option value="">Select category</option>
                    {courseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="resource-subcategory">Course Subcategory</label>
                  <select
                    id="resource-subcategory"
                    name="subcategory"
                    value={uploadData.subcategory}
                    onChange={handleUploadChange}
                    disabled={!selectedCourseCategory || !selectedCourseCategory.subcategories.length}
                  >
                    <option value="">Select subcategory</option>
                    {(selectedCourseCategory?.subcategories ?? []).map((subcategoryName) => (
                      <option key={subcategoryName} value={subcategoryName}>
                        {subcategoryName}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="resource-file">File</label>
                  <input id="resource-file" name="file" type="file" onChange={handleUploadChange} />

                  {uploadError ? <p className="auth-error">{uploadError}</p> : null}
                  {uploadLoading ? (
                    <p className="admin-upload-status">Uploading... {uploadProgress}%</p>
                  ) : null}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!courseCategories.length || uploadLoading}
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload Resource'}
                  </button>
                </form>

                <section className="admin-resource-list" aria-label="Uploaded resources">
                  <h3>Uploaded Resources</h3>
                  {resources.length === 0 ? (
                    <p>No uploaded resources yet.</p>
                  ) : (
                    <div className="admin-resource-grid">
                      {resources.map((resource) => (
                        <article key={resource.id} className="admin-resource-card">
                          <h3>{resource.title}</h3>
                          <p className="admin-resource-meta">
                            Category: {resource.category}
                          </p>
                          <p className="admin-resource-meta">
                            Subcategory: {resource.subcategory}
                          </p>
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => onDeleteResource(resource.id)}
                          >
                            Delete
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </section>
            ) : null}

            {activeTab === 'courseCategories' ? (
              <section className="admin-panel" aria-label="Course category management section">
                <div className="admin-panel-head">
                  <h2>Course Category Management</h2>
                  <p>Add and maintain course categories and subcategories.</p>
                </div>

                <CategoryManagerSection
                  title="Manage Course Categories"
                  emptyMessage="No course categories yet. Add one to begin managing subcategories."
                  addPlaceholder="New course category"
                  categoryList={courseCategories}
                  categoryName={courseCategoryName}
                  categoryError={courseCategoryError}
                  subcategoryError={courseSubcategoryError}
                  editingCategoryId={editingCourseCategoryId}
                  editingCategoryName={editingCourseCategoryName}
                  subcategoryInput={courseSubcategoryInput}
                  onCategoryNameChange={(event) => {
                    setCourseCategoryName(event.target.value)
                    setCourseCategoryError('')
                  }}
                  onAddCategory={handleAddCourseCategorySubmit}
                  onStartEdit={startCourseCategoryEdit}
                  onEditingCategoryNameChange={(event) => setEditingCourseCategoryName(event.target.value)}
                  onSaveEdit={saveCourseCategoryEdit}
                  onCancelEdit={cancelCourseCategoryEdit}
                  onDeleteCategory={removeCourseCategory}
                  onSubcategoryInputChange={handleCourseSubcategoryInputChange}
                  onAddSubcategory={addCourseSubcategory}
                  onDeleteSubcategory={removeCourseSubcategory}
                />
              </section>
            ) : null}

            {activeTab === 'quizManagement' ? (
              <section className="admin-panel" aria-label="Quiz management section">
                <div className="admin-panel-head">
                  <h2>Quiz Management</h2>
                  <p>Create quiz questions and review your current question bank.</p>
                </div>

                <section className="admin-quiz-panel" aria-label="Admin quiz manager">
                  <form className="admin-form" onSubmit={handleAdminQuestionSubmit}>
                    <h3>Add Quiz Question</h3>
                    <label htmlFor="admin-question">Question</label>
                    <textarea
                      id="admin-question"
                      name="question"
                      value={questionData.question}
                      onChange={handleQuestionFieldChange}
                      placeholder="Enter quiz question"
                    />

                    <label htmlFor="admin-question-category">Category</label>
                    <select
                      id="admin-question-category"
                      name="categoryId"
                      value={questionData.categoryId}
                      onChange={handleQuestionFieldChange}
                      disabled={!quizCategories.length}
                    >
                      <option value="">Select category</option>
                      {quizCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="admin-question-subcategory">Subcategory</label>
                    <select
                      id="admin-question-subcategory"
                      name="subcategory"
                      value={questionData.subcategory}
                      onChange={handleQuestionFieldChange}
                      disabled={!selectedQuizCategory || !selectedQuizCategory.subcategories.length}
                    >
                      <option value="">Select subcategory</option>
                      {(selectedQuizCategory?.subcategories ?? []).map((subcategoryName) => (
                        <option key={subcategoryName} value={subcategoryName}>
                          {subcategoryName}
                        </option>
                      ))}
                    </select>

                    <div className="admin-options-grid">
                      {['A', 'B', 'C', 'D'].map((key) => (
                        <label key={key} className="admin-option-field" htmlFor={`option-${key}`}>
                          Option {key}
                          <input
                            id={`option-${key}`}
                            type="text"
                            value={questionData.options[key]}
                            onChange={(event) => handleOptionChange(key, event.target.value)}
                            placeholder={`Enter option ${key}`}
                          />
                        </label>
                      ))}
                    </div>

                    <label htmlFor="correct-answer">Correct Answer</label>
                    <select
                      id="correct-answer"
                      name="correctAnswer"
                      value={questionData.correctAnswer}
                      onChange={handleQuestionFieldChange}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>

                    {questionError ? <p className="auth-error">{questionError}</p> : null}

                    <button type="submit" className="btn btn-primary" disabled={!quizCategories.length}>
                      Add Admin Question
                    </button>
                  </form>

                  <div className="admin-question-list">
                    <h3>Existing Questions</h3>
                    {adminQuizzes.length === 0 ? (
                      <p>No admin quiz questions yet.</p>
                    ) : (
                      <div className="admin-resource-grid">
                        {adminQuizzes.map((item) => (
                          <article key={item.id} className="admin-resource-card">
                            <h3>{item.question}</h3>
                            <p className="admin-resource-meta">
                              Category: {item.category} / {item.subcategory ?? 'General'}
                            </p>
                            <p>A. {item.options.A}</p>
                            <p>B. {item.options.B}</p>
                            <p>C. {item.options.C}</p>
                            <p>D. {item.options.D}</p>
                            <p className="admin-resource-meta">Correct: {item.correctAnswer}</p>
                            <button
                              type="button"
                              className="btn btn-light"
                              onClick={() => onDeleteAdminQuestion(item.id)}
                            >
                              Delete
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </section>
            ) : null}

            {activeTab === 'quizCategories' ? (
              <section className="admin-panel" aria-label="Quiz category management section">
                <div className="admin-panel-head">
                  <h2>Quiz Category Management</h2>
                  <p>Add and maintain quiz categories and subcategories.</p>
                </div>

                <CategoryManagerSection
                  title="Manage Quiz Categories"
                  emptyMessage="No quiz categories yet. Add one to begin managing subcategories."
                  addPlaceholder="New quiz category"
                  categoryList={quizCategories}
                  categoryName={quizCategoryName}
                  categoryError={quizCategoryError}
                  subcategoryError={quizSubcategoryError}
                  editingCategoryId={editingQuizCategoryId}
                  editingCategoryName={editingQuizCategoryName}
                  subcategoryInput={quizSubcategoryInput}
                  onCategoryNameChange={(event) => {
                    setQuizCategoryName(event.target.value)
                    setQuizCategoryError('')
                  }}
                  onAddCategory={handleAddQuizCategorySubmit}
                  onStartEdit={startQuizCategoryEdit}
                  onEditingCategoryNameChange={(event) => setEditingQuizCategoryName(event.target.value)}
                  onSaveEdit={saveQuizCategoryEdit}
                  onCancelEdit={cancelQuizCategoryEdit}
                  onDeleteCategory={removeQuizCategory}
                  onSubcategoryInputChange={handleQuizSubcategoryInputChange}
                  onAddSubcategory={addQuizSubcategory}
                  onDeleteSubcategory={removeQuizSubcategory}
                />
              </section>
            ) : null}
          </div>
        </div>
    </section>
  )
}

export default Admin
