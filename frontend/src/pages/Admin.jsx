import { useEffect, useMemo, useState } from 'react'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'courseManagement', label: 'Course Management' },
  { id: 'quizManagement', label: 'Quiz Management' },
  { id: 'userManagement', label: 'User Management' },
]

const ADMIN_ACTION_ICONS = {
  add: '＋',
  edit: '✎',
  delete: '🗑',
  save: '✓',
  cancel: '↩',
  upload: '⬆',
}

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
        <button type="submit" className="btn btn-primary admin-mini-btn">
          <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.add}</span>
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
                      className="btn btn-primary admin-mini-btn"
                      onClick={() => onSaveEdit(category.id)}
                    >
                      <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.save}</span>
                      Save
                    </button>
                    <button type="button" className="btn btn-light admin-mini-btn" onClick={onCancelEdit}>
                      <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.cancel}</span>
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
                      className="btn btn-light admin-mini-btn"
                      onClick={() => onStartEdit(category)}
                    >
                      <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.edit}</span>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-light admin-mini-btn is-danger"
                      onClick={() => onDeleteCategory(category)}
                    >
                      <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.delete}</span>
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
                        className="btn btn-light admin-mini-btn is-danger"
                        onClick={() => onDeleteSubcategory(category, subcategoryName)}
                      >
                        <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.delete}</span>
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
                  className="btn btn-primary admin-mini-btn"
                  onClick={() => onAddSubcategory(category)}
                >
                  <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.add}</span>
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
  adminQuizLoading,
  adminQuizError,
  adminUsers,
  adminUsersLoading,
  adminUsersError,
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
  onLoadAdminQuizzes,
  onLoadAdminUsers,
  onDeleteRegisteredUser,
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
  const [uploadFileInputKey, setUploadFileInputKey] = useState(0)
  const [userSearch, setUserSearch] = useState('')

  const selectedCourseCategory = courseCategories.find((item) => item.id === uploadData.categoryId)
  const selectedQuizCategory = quizCategories.find((item) => item.id === questionData.categoryId)
  const totalCourses = new Set(
    resources.map((resource) => resource.title.trim().toLowerCase()),
  ).size
  const totalResources = resources.length
  const totalQuizQuestions = adminQuizzes.length
  const totalRegisteredUsers = adminUsers.length

  const filteredAdminUsers = useMemo(() => {
    const queryText = userSearch.trim().toLowerCase()
    if (!queryText) {
      return adminUsers
    }

    return adminUsers.filter((userItem) => {
      const usernameMatch = (userItem.username ?? '').toLowerCase().includes(queryText)
      const emailMatch = (userItem.email ?? '').toLowerCase().includes(queryText)
      return usernameMatch || emailMatch
    })
  }, [adminUsers, userSearch])

  useEffect(() => {
    onLoadAdminQuizzes()
    onLoadAdminUsers()
  }, [onLoadAdminQuizzes, onLoadAdminUsers])

  const formatMemberSince = (createdAtMs) => {
    if (!createdAtMs) {
      return 'Unavailable'
    }

    return new Date(createdAtMs).toLocaleDateString()
  }

  const handleDeleteUser = (userItem) => {
    const confirmed = window.confirm(
      `Delete user "${userItem.username}"? This will remove their account and saved dashboard progress.`,
    )

    if (!confirmed) {
      return
    }

    onDeleteRegisteredUser(userItem.id, userItem.username)
  }

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

  const handleAdminQuestionSubmit = async (event) => {
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

    try {
      await onAddAdminQuestion({
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
    } catch {
      setQuestionError('Failed to save quiz question. Please try again.')
    }
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
        fileUrl: result.public_url || result.secure_url,
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
      setUploadFileInputKey((prev) => prev + 1)
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
                  <p>Quick snapshot of your platform and what to manage next.</p>
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
                  <article className="admin-stat-card">
                    <h3>Registered Users</h3>
                    <p>{totalRegisteredUsers}</p>
                  </article>
                </div>

                <div className="admin-overview-grid">
                  <article className="admin-info-card">
                    <h3>Course Pipeline</h3>
                    <p>Create categories first, then upload resources with clean metadata.</p>
                  </article>
                  <article className="admin-info-card">
                    <h3>Assessment Readiness</h3>
                    <p>Keep question quality high by balancing categories and subcategories.</p>
                  </article>
                  <article className="admin-info-card">
                    <h3>User Management</h3>
                    <p>Use the dedicated User Management tab to review and maintain accounts.</p>
                  </article>
                </div>
              </section>
            ) : null}

            {activeTab === 'courseManagement' ? (
              <section className="admin-panel" aria-label="Course management section">
                <div className="admin-panel-head">
                  <h2>Course Management</h2>
                  <p>Structure categories, upload resources, and maintain your course library in one flow.</p>
                </div>

                <div className="admin-surface-kpis">
                  <span className="admin-kpi-chip">{courseCategories.length} Categories</span>
                  <span className="admin-kpi-chip">{resources.length} Uploaded Resources</span>
                  <span className="admin-kpi-chip">{totalCourses} Unique Courses</span>
                </div>

                <div className="admin-vertical-stack admin-workflow-stack">
                  <section className="admin-surface" aria-label="Course category workspace">
                    <div className="admin-surface-head">
                      <h3>Category Workspace</h3>
                      <p>Create and maintain categories/subcategories before uploading resources.</p>
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

                  <section className="admin-surface" aria-label="Course upload workspace">
                    <div className="admin-surface-head">
                      <h3>Upload Workspace</h3>
                      <p>Publish resources with clear labels so users can find them quickly.</p>
                    </div>

                    <form className="admin-form admin-form-stack" onSubmit={handleUploadSubmit}>
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
                      <input
                        key={uploadFileInputKey}
                        id="resource-file"
                        name="file"
                        type="file"
                        onChange={handleUploadChange}
                      />

                      {uploadError ? <p className="auth-error">{uploadError}</p> : null}
                      {uploadLoading ? (
                        <p className="admin-upload-status">Uploading... {uploadProgress}%</p>
                      ) : null}

                      <button
                        type="submit"
                        className="btn btn-primary admin-mini-btn"
                        disabled={!courseCategories.length || uploadLoading}
                      >
                        <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.upload}</span>
                        {uploadLoading ? 'Uploading...' : 'Upload Resource'}
                      </button>
                    </form>
                  </section>
                </div>

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
                            className="btn btn-light admin-mini-btn is-danger"
                            onClick={() => onDeleteResource(resource.id)}
                          >
                            <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.delete}</span>
                            Delete
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </section>
            ) : null}

            {activeTab === 'quizManagement' ? (
              <section className="admin-panel" aria-label="Quiz management section">
                <div className="admin-panel-head">
                  <h2>Quiz Management</h2>
                  <p>Organize categories and build a high-quality question bank from one workflow.</p>
                </div>

                <div className="admin-surface-kpis">
                  <span className="admin-kpi-chip">{quizCategories.length} Quiz Categories</span>
                  <span className="admin-kpi-chip">{totalQuizQuestions} Question Bank Size</span>
                  <span className="admin-kpi-chip">Admin Maintained</span>
                </div>

                <div className="admin-workflow-grid admin-workflow-stack">
                  <section className="admin-surface" aria-label="Quiz category workspace">
                    <div className="admin-surface-head">
                      <h3>Category Workspace</h3>
                      <p>Keep quiz categories and subcategories clean for better coverage.</p>
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

                  <section className="admin-surface" aria-label="Quiz creation workspace">
                    <div className="admin-surface-head">
                      <h3>Question Creation Workspace</h3>
                      <p>Create questions with category mapping and option-level validation.</p>
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
                        {adminQuizError ? <p className="auth-error">{adminQuizError}</p> : null}
                        {adminQuizLoading ? <p>Loading quiz questions...</p> : null}

                        <button
                          type="submit"
                          className="btn btn-primary admin-mini-btn"
                          disabled={!quizCategories.length || adminQuizLoading}
                        >
                          <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.add}</span>
                          Add Admin Question
                        </button>
                      </form>
                    </section>
                  </section>
                </div>

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
                            className="btn btn-light admin-mini-btn is-danger"
                            disabled={adminQuizLoading}
                            onClick={() => onDeleteAdminQuestion(item.id)}
                          >
                              <span className="admin-action-icon" aria-hidden="true">{ADMIN_ACTION_ICONS.delete}</span>
                            Delete
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === 'userManagement' ? (
              <section className="admin-panel" aria-label="User management section">
                <div className="admin-panel-head">
                  <h2>User Management</h2>
                  <p>Review registered users, search quickly, and remove accounts when needed.</p>
                </div>

                <div className="admin-surface-kpis">
                  <span className="admin-kpi-chip">{totalRegisteredUsers} Total Users</span>
                  <span className="admin-kpi-chip">{filteredAdminUsers.length} Search Results</span>
                </div>

                <section className="admin-surface" aria-label="User records workspace">
                  <div className="admin-surface-head">
                    <h3>Registered User Records</h3>
                    <p>Find users by username or email and manage accounts safely.</p>
                  </div>

                  <div className="admin-user-toolbar">
                    <input
                      className="admin-user-search"
                      type="text"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search by username or email"
                    />
                  </div>

                  {adminUsersError ? <p className="auth-error">{adminUsersError}</p> : null}
                  {adminUsersLoading ? <p>Loading registered users...</p> : null}

                  {!adminUsersLoading && filteredAdminUsers.length === 0 ? (
                    <p>{userSearch.trim() ? 'No users match your search.' : 'No users registered yet.'}</p>
                  ) : (
                    <div className="admin-resource-grid">
                      {filteredAdminUsers.map((userItem) => (
                        <article key={userItem.id} className="admin-resource-card">
                          <h3>{userItem.username}</h3>
                          <p className="admin-resource-meta">Email: {userItem.email || 'N/A'}</p>
                          <p className="admin-resource-meta">
                            Member Since: {formatMemberSince(userItem.createdAtMs)}
                          </p>
                          <button
                            type="button"
                            className="btn btn-light admin-mini-btn is-danger"
                            onClick={() => handleDeleteUser(userItem)}
                          >
                            Delete User
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </section>
            ) : null}
          </div>
        </div>
    </section>
  )
}

export default Admin
