import { useState } from 'react'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

function Admin({
  categories,
  adminQuizzes,
  resources,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onAddSubcategory,
  onDeleteSubcategory,
  onAddAdminQuestion,
  onDeleteAdminQuestion,
  onUploadResource,
  onDeleteResource,
}) {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [subcategoryInput, setSubcategoryInput] = useState({})
  const [subcategoryError, setSubcategoryError] = useState('')
  const [questionError, setQuestionError] = useState('')

  const [questionData, setQuestionData] = useState({
    question: '',
    categoryId: '',
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

  const selectedCategory = categories.find((item) => item.id === uploadData.categoryId)

  const isDuplicateCategoryName = (name, ignoreId = null) => {
    return categories.some(
      (item) =>
        item.id !== ignoreId && item.name.toLowerCase() === name.trim().toLowerCase(),
    )
  }

  const handleCredentialChange = (event) => {
    const { name, value } = event.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
    setLoginError('')
  }

  const handleAdminLogin = (event) => {
    event.preventDefault()

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setLoginError('Please enter admin username and password.')
      return
    }

    if (
      credentials.username.trim() !== ADMIN_USERNAME ||
      credentials.password !== ADMIN_PASSWORD
    ) {
      setLoginError('Invalid admin credentials.')
      return
    }

    setAdminLoggedIn(true)
    setCredentials({ username: '', password: '' })
    setLoginError('')
  }

  const handleAddCategorySubmit = (event) => {
    event.preventDefault()

    const normalizedName = categoryName.trim()
    if (!normalizedName) {
      setCategoryError('Category name is required.')
      return
    }

    if (isDuplicateCategoryName(normalizedName)) {
      setCategoryError('Category name already exists.')
      return
    }

    onAddCategory(normalizedName)
    setCategoryName('')
    setCategoryError('')
  }

  const startCategoryEdit = (category) => {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name)
    setCategoryError('')
  }

  const saveCategoryEdit = (categoryId) => {
    const normalizedName = editingCategoryName.trim()
    if (!normalizedName) {
      setCategoryError('Category name is required.')
      return
    }

    if (isDuplicateCategoryName(normalizedName, categoryId)) {
      setCategoryError('Category name already exists.')
      return
    }

    onRenameCategory(categoryId, normalizedName)
    setEditingCategoryId(null)
    setEditingCategoryName('')
    setCategoryError('')
  }

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null)
    setEditingCategoryName('')
    setCategoryError('')
  }

  const removeCategory = (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}"? Resources in this category will become Uncategorized.`,
    )

    if (!confirmed) {
      return
    }

    onDeleteCategory(category.id)
  }

  const handleSubcategoryInputChange = (categoryId, value) => {
    setSubcategoryInput((prev) => ({
      ...prev,
      [categoryId]: value,
    }))
    setSubcategoryError('')
  }

  const addSubcategory = (category) => {
    const rawValue = subcategoryInput[category.id] ?? ''
    const normalizedName = rawValue.trim()

    if (!normalizedName) {
      setSubcategoryError('Subcategory name is required.')
      return
    }

    const duplicate = category.subcategories.some(
      (item) => item.toLowerCase() === normalizedName.toLowerCase(),
    )
    if (duplicate) {
      setSubcategoryError('Subcategory already exists for this category.')
      return
    }

    onAddSubcategory(category.id, normalizedName)
    setSubcategoryInput((prev) => ({
      ...prev,
      [category.id]: '',
    }))
    setSubcategoryError('')
  }

  const removeSubcategory = (category, subcategoryName) => {
    onDeleteSubcategory(category.id, subcategoryName)
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
    setQuestionData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

    if (!categories.length) {
      setQuestionError('Create categories before adding admin quiz questions.')
      return
    }

    const selectedQuestionCategory = categories.find(
      (item) => item.id === questionData.categoryId,
    )

    const optionsFilled = ['A', 'B', 'C', 'D'].every(
      (key) => questionData.options[key].trim().length > 0,
    )

    if (!questionData.question.trim() || !selectedQuestionCategory || !optionsFilled) {
      setQuestionError('Question, category, and all options are required.')
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
    })

    setQuestionData({
      question: '',
      categoryId: '',
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

  const handleUploadSubmit = (event) => {
    event.preventDefault()

    if (!categories.length) {
      setUploadError('Create at least one category before uploading resources.')
      return
    }

    if (!uploadData.title.trim() || !uploadData.description.trim() || !uploadData.file) {
      setUploadError('Please complete title, description, and file upload.')
      return
    }

    if (!selectedCategory || !uploadData.subcategory.trim()) {
      setUploadError('Please complete title, description, category, subcategory, and file upload.')
      return
    }

    onUploadResource({
      title: uploadData.title.trim(),
      description: uploadData.description.trim(),
      category: selectedCategory.name,
      subcategory: uploadData.subcategory.trim(),
      file: uploadData.file,
    })

    setUploadData({
      title: '',
      description: '',
      categoryId: '',
      subcategory: '',
      file: null,
    })
    setUploadError('')
  }

  const handleAdminLogout = () => {
    setAdminLoggedIn(false)
    setUploadError('')
    setCategoryError('')
    setSubcategoryError('')
    setQuestionError('')
  }

  return (
    <section className="admin-page" aria-labelledby="admin-heading">
      <header className="admin-hero">
        <p className="admin-tag">Content Management</p>
        <h1 id="admin-heading">Admin Upload Panel</h1>
        <p>Upload learning resources and manage available course files.</p>
      </header>

      {!adminLoggedIn ? (
        <form className="admin-form" onSubmit={handleAdminLogin}>
          <h2>Admin Login</h2>
          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            name="username"
            type="text"
            value={credentials.username}
            onChange={handleCredentialChange}
            placeholder="Enter admin username"
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleCredentialChange}
            placeholder="Enter admin password"
          />

          {loginError ? <p className="auth-error">{loginError}</p> : null}

          <button type="submit" className="btn btn-primary">
            Login as Admin
          </button>
        </form>
      ) : (
        <>
          <div className="admin-actions-row">
            <p>Logged in as admin.</p>
            <button type="button" className="btn btn-light" onClick={handleAdminLogout}>
              Admin Logout
            </button>
          </div>

          <section className="admin-category-panel" aria-label="Manage categories">
            <h2>Manage Categories</h2>

            <form className="admin-inline-form" onSubmit={handleAddCategorySubmit}>
              <input
                type="text"
                value={categoryName}
                onChange={(event) => {
                  setCategoryName(event.target.value)
                  setCategoryError('')
                }}
                placeholder="New category name"
              />
              <button type="submit" className="btn btn-primary">
                Add Category
              </button>
            </form>

            {categoryError ? <p className="auth-error">{categoryError}</p> : null}
            {subcategoryError ? <p className="auth-error">{subcategoryError}</p> : null}

            {categories.length === 0 ? (
              <p>No categories yet. Add one to begin managing subcategories.</p>
            ) : (
              <div className="admin-category-grid">
                {categories.map((category) => (
                  <article key={category.id} className="admin-category-card">
                    {editingCategoryId === category.id ? (
                      <div className="admin-category-edit">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(event) => setEditingCategoryName(event.target.value)}
                          placeholder="Category name"
                        />
                        <div className="admin-small-actions">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => saveCategoryEdit(category.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={cancelCategoryEdit}
                          >
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
                            onClick={() => startCategoryEdit(category)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => removeCategory(category)}
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
                              onClick={() => removeSubcategory(category, subcategoryName)}
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
                        onChange={(event) =>
                          handleSubcategoryInputChange(category.id, event.target.value)
                        }
                        placeholder="New subcategory"
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => addSubcategory(category)}
                      >
                        Add Subcategory
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-quiz-panel" aria-label="Admin quiz manager">
            <h2>Manage Quiz Questions</h2>

            <form className="admin-form" onSubmit={handleAdminQuestionSubmit}>
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
                disabled={!categories.length}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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

              <button type="submit" className="btn btn-primary" disabled={!categories.length}>
                Add Admin Question
              </button>
            </form>

            <div className="admin-question-list">
              {adminQuizzes.length === 0 ? (
                <p>No admin quiz questions yet.</p>
              ) : (
                <div className="admin-resource-grid">
                  {adminQuizzes.map((item) => (
                    <article key={item.id} className="admin-resource-card">
                      <h3>{item.question}</h3>
                      <p className="admin-resource-meta">Category: {item.category}</p>
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

          <form className="admin-form" onSubmit={handleUploadSubmit}>
            <h2>Upload Resource</h2>
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

            <label htmlFor="resource-category">Category</label>
            <select
              id="resource-category"
              name="categoryId"
              value={uploadData.categoryId}
              onChange={(event) => {
                const nextCategoryId = event.target.value
                const nextCategory = categories.find((item) => item.id === nextCategoryId)

                setUploadData((prev) => ({
                  ...prev,
                  categoryId: nextCategoryId,
                  subcategory: nextCategory?.subcategories[0] ?? '',
                }))
                setUploadError('')
              }}
              disabled={!categories.length}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <label htmlFor="resource-subcategory">Subcategory</label>
            <select
              id="resource-subcategory"
              name="subcategory"
              value={uploadData.subcategory}
              onChange={handleUploadChange}
              disabled={!selectedCategory || !selectedCategory.subcategories.length}
            >
              <option value="">Select subcategory</option>
              {(selectedCategory?.subcategories ?? []).map((subcategoryName) => (
                <option key={subcategoryName} value={subcategoryName}>
                  {subcategoryName}
                </option>
              ))}
            </select>

            <label htmlFor="resource-file">File</label>
            <input id="resource-file" name="file" type="file" onChange={handleUploadChange} />

            {uploadError ? <p className="auth-error">{uploadError}</p> : null}

            <button type="submit" className="btn btn-primary" disabled={!categories.length}>
              Upload Resource
            </button>
          </form>

          <section className="admin-resource-list" aria-label="Uploaded resources">
            <h2>Uploaded Resources</h2>
            {resources.length === 0 ? (
              <p>No uploaded resources yet.</p>
            ) : (
              <div className="admin-resource-grid">
                {resources.map((resource) => (
                  <article key={resource.id} className="admin-resource-card">
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                    <p className="admin-resource-meta">
                      {resource.category} / {resource.subcategory}
                    </p>
                    <p className="admin-file-name">{resource.fileName}</p>
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
        </>
      )}
    </section>
  )
}

export default Admin
