import { useCallback, useEffect, useMemo, useState } from 'react'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'
import { getWorksheetNames, parseQuizFile } from '../utils/quizImport'

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
  adminQuizLoading,
  adminQuizError,
  adminQuestionPage,
  adminQuestionTotal,
  adminQuestionPageLoading,
  adminQuestionPageError,
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
  onImportAdminQuestions,
  onDeleteAdminQuestion,
  onUpdateAdminQuestion,
  onLoadAdminQuestionPage,
  onFindAdminQuestionDuplicates,
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
  const [importCategoryId, setImportCategoryId] = useState('')
  const [importSubcategory, setImportSubcategory] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importWorksheets, setImportWorksheets] = useState([])
  const [importWorksheet, setImportWorksheet] = useState('')
  const [importPreview, setImportPreview] = useState(null)
  const [importError, setImportError] = useState('')
  const [importValidOnly, setImportValidOnly] = useState(false)
  const [skipImportDuplicates, setSkipImportDuplicates] = useState(true)
  const [importingQuestions, setImportingQuestions] = useState(false)
  const [importProgress, setImportProgress] = useState({ completed: 0, total: 0 })
  const [importSummary, setImportSummary] = useState(null)
  const [questionSearch, setQuestionSearch] = useState('')
  const [questionCategory, setQuestionCategory] = useState('')
  const [questionSubcategory, setQuestionSubcategory] = useState('')
  const [questionDateFilter, setQuestionDateFilter] = useState('all')
  const [questionFromDate, setQuestionFromDate] = useState('')
  const [questionToDate, setQuestionToDate] = useState('')
  const [questionSort, setQuestionSort] = useState('newest')
  const [questionPageSize, setQuestionPageSize] = useState(25)
  const [questionPageNumber, setQuestionPageNumber] = useState(1)
  const [questionPageHasMore, setQuestionPageHasMore] = useState(false)
  const [questionPageCursors, setQuestionPageCursors] = useState([])
  const [questionLastCursor, setQuestionLastCursor] = useState(null)
  const [questionDetail, setQuestionDetail] = useState(null)
  const [questionEditing, setQuestionEditing] = useState(null)
  const [questionEditError, setQuestionEditError] = useState('')
  const [importDuplicateCount, setImportDuplicateCount] = useState(0)

  const selectedCourseCategory = courseCategories.find((item) => item.id === uploadData.categoryId)
  const selectedQuizCategory = quizCategories.find((item) => item.id === questionData.categoryId)
  const selectedImportCategory = quizCategories.find((item) => item.id === importCategoryId)
  const visibleImportDuplicateCount = importPreview && selectedImportCategory && importSubcategory
    ? importDuplicateCount
    : 0
  const totalCourses = new Set(
    resources.map((resource) => resource.title.trim().toLowerCase()),
  ).size
  const totalResources = resources.length
  const totalQuizQuestions = adminQuestionTotal
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
    let cancelled = false
    const validRows = importPreview?.rows.filter((row) => row.valid) ?? []
    if (!selectedImportCategory || !importSubcategory || !validRows.length) {
      return undefined
    }

    onFindAdminQuestionDuplicates(selectedImportCategory.name, importSubcategory, validRows)
      .then((count) => {
        if (!cancelled) setImportDuplicateCount(count)
      })
      .catch(() => {
        if (!cancelled) setImportDuplicateCount(0)
      })

    return () => { cancelled = true }
  }, [importPreview, importSubcategory, onFindAdminQuestionDuplicates, selectedImportCategory])

  const selectedQuestionCategory = quizCategories.find((item) => item.name === questionCategory)
  const availableQuestionSubcategories = questionCategory
    ? selectedQuestionCategory?.subcategories ?? []
    : [...new Set(quizCategories.flatMap((item) => item.subcategories))]

  const visibleQuestionPage = useMemo(() => {
    const queryText = questionSearch.trim().toLowerCase()
    if (!queryText) return adminQuestionPage
    return adminQuestionPage.filter((item) => item.question.toLowerCase().includes(queryText))
  }, [adminQuestionPage, questionSearch])

  const loadQuestionPage = useCallback(async (cursor = null, pageNumber = 1) => {
    if (pageNumber === 1) setQuestionPageCursors([])
    const result = await onLoadAdminQuestionPage({
      category: questionCategory,
      subcategory: questionSubcategory,
      dateFilter: questionDateFilter,
      fromDate: questionFromDate,
      toDate: questionToDate,
      sort: questionSort,
      pageSize: questionPageSize,
      cursor,
    })
    setQuestionPageHasMore(result.hasMore)
    setQuestionPageNumber(pageNumber)
    setQuestionLastCursor(result.lastDoc)
    return result
  }, [onLoadAdminQuestionPage, questionCategory, questionDateFilter, questionFromDate, questionPageSize, questionSort, questionSubcategory, questionToDate])

  useEffect(() => {
    onLoadAdminUsers()
  }, [onLoadAdminUsers])

  useEffect(() => {
    if (activeTab !== 'quizManagement') return
    Promise.resolve().then(() => loadQuestionPage(null, 1))
  }, [activeTab, loadQuestionPage])

  const formatQuestionDate = (value) => {
    const timestamp = value?.toDate ? value.toDate() : value ? new Date(value) : null
    return timestamp && !Number.isNaN(timestamp.getTime())
      ? timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Unknown'
  }

  const clearQuestionFilters = () => {
    setQuestionSearch('')
    setQuestionCategory('')
    setQuestionSubcategory('')
    setQuestionDateFilter('all')
    setQuestionFromDate('')
    setQuestionToDate('')
    setQuestionSort('newest')
    setQuestionPageNumber(1)
    setQuestionPageCursors([])
    setQuestionLastCursor(null)
  }

  const goToNextQuestionPage = async () => {
    const result = await loadQuestionPage(questionLastCursor, questionPageNumber + 1)
    if (questionLastCursor && result.questions.length) {
      setQuestionPageCursors((prev) => [...prev, questionLastCursor])
    }
  }

  const goToPreviousQuestionPage = () => {
    if (questionPageNumber <= 1) return
    const previousCursor = questionPageCursors[questionPageNumber - 2] ?? null
    loadQuestionPage(previousCursor, questionPageNumber - 1)
  }

  const startQuestionEdit = (item) => {
    setQuestionEditing({
      ...item,
      options: { ...item.options },
    })
    setQuestionEditError('')
    setQuestionDetail(null)
  }

  const submitQuestionEdit = async (event) => {
    event.preventDefault()
    if (!questionEditing?.question.trim() || !questionEditing.options.A.trim() || !questionEditing.options.B.trim() || !questionEditing.options.C.trim() || !questionEditing.options.D.trim()) {
      setQuestionEditError('Question text and all four options are required.')
      return
    }

    try {
      await onUpdateAdminQuestion(questionEditing.id, {
        question: questionEditing.question.trim(),
        options: Object.fromEntries(Object.entries(questionEditing.options).map(([key, value]) => [key, value.trim()])),
        correctAnswer: questionEditing.correctAnswer,
        category: questionEditing.category,
        subcategory: questionEditing.subcategory,
      })
      setQuestionEditing(null)
      await loadQuestionPage(questionPageCursors[questionPageNumber - 1] ?? null, questionPageNumber)
    } catch {
      setQuestionEditError('Unable to update this question.')
    }
  }

  const deleteQuestionAndRefresh = async (questionId) => {
    await onDeleteAdminQuestion(questionId)
    await loadQuestionPage(questionPageCursors[questionPageNumber - 1] ?? null, questionPageNumber)
  }

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

  const resetImport = () => {
    setImportFile(null)
    setImportWorksheets([])
    setImportWorksheet('')
    setImportPreview(null)
    setImportError('')
    setImportSummary(null)
    setImportProgress({ completed: 0, total: 0 })
  }

  const parseImportFile = async (file, worksheetName = '') => {
    if (!file) {
      return
    }

    setImportFile(file)
    setImportError('')
    setImportSummary(null)
    try {
      const worksheets = await getWorksheetNames(file)
      if (!worksheets.length) {
        throw new Error('The uploaded workbook has no worksheets.')
      }
      const selectedWorksheet = worksheetName || worksheets[0]
      const preview = await parseQuizFile(file, selectedWorksheet)
      setImportWorksheets(worksheets)
      setImportWorksheet(selectedWorksheet)
      setImportPreview(preview)
    } catch (error) {
      setImportPreview(null)
      setImportWorksheets([])
      setImportWorksheet('')
      setImportError(error?.message || 'Unable to read this file. Please check its format.')
    }
  }

  const handleImportFileChange = (event) => {
    parseImportFile(event.target.files?.[0] ?? null)
  }

  const handleImportWorksheetChange = (event) => {
    const nextWorksheet = event.target.value
    setImportWorksheet(nextWorksheet)
    if (importFile) {
      parseImportFile(importFile, nextWorksheet)
    }
  }

  const handleImportSubmit = async () => {
    if (!selectedImportCategory || !importSubcategory || !importPreview) {
      setImportError('Select a category, subcategory, and valid file before importing.')
      return
    }

    if (importPreview.invalid > 0 && !importValidOnly) {
      setImportError('Fix invalid rows or explicitly choose to import valid rows only.')
      return
    }

    const rows = importPreview.rows.filter((row) => row.valid)
    if (!rows.length) {
      setImportError('There are no valid questions to import.')
      return
    }

    try {
      setImportingQuestions(true)
      setImportError('')
      setImportProgress({ completed: 0, total: rows.length })
      const result = await onImportAdminQuestions({
        category: selectedImportCategory.name,
        subcategory: importSubcategory,
        rows,
        skipDuplicates: skipImportDuplicates,
        onProgress: (completed, total) => setImportProgress({ completed, total }),
      })
      setImportSummary({ ...result, total: rows.length })
      await loadQuestionPage(null, 1)
    } catch {
      setImportError('Import failed. Please check the admin connection and try again.')
    } finally {
      setImportingQuestions(false)
    }
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
      await loadQuestionPage(null, 1)

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

                <section className="admin-surface admin-import-surface" aria-label="Bulk question import workspace">
                  <div className="admin-surface-head">
                    <h3>Import Questions</h3>
                    <p>Upload one CSV or Excel worksheet into one selected category and subcategory.</p>
                  </div>

                  <div className="admin-import-controls">
                    <label htmlFor="import-question-category">Category</label>
                    <select
                      id="import-question-category"
                      value={importCategoryId}
                      onChange={(event) => {
                        setImportCategoryId(event.target.value)
                        setImportSubcategory('')
                        setImportError('')
                      }}
                      disabled={importingQuestions}
                    >
                      <option value="">Select category</option>
                      {quizCategories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>

                    <label htmlFor="import-question-subcategory">Subcategory</label>
                    <select
                      id="import-question-subcategory"
                      value={importSubcategory}
                      onChange={(event) => setImportSubcategory(event.target.value)}
                      disabled={!selectedImportCategory || importingQuestions}
                    >
                      <option value="">Select subcategory</option>
                      {(selectedImportCategory?.subcategories ?? []).map((subcategoryName) => (
                        <option key={subcategoryName} value={subcategoryName}>{subcategoryName}</option>
                      ))}
                    </select>
                  </div>

                  <label
                    className="admin-import-dropzone"
                    htmlFor="quiz-import-file"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      parseImportFile(event.dataTransfer.files?.[0] ?? null)
                    }}
                  >
                    <strong>Drop CSV, XLSX, or XLS here</strong>
                    <span>or choose a file from your device</span>
                    <input
                      id="quiz-import-file"
                      type="file"
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleImportFileChange}
                      disabled={importingQuestions}
                    />
                    {importFile ? <em className="admin-file-name">{importFile.name}</em> : null}
                  </label>

                  {importWorksheets.length > 1 ? (
                    <label htmlFor="import-worksheet">
                      Worksheet
                      <select id="import-worksheet" value={importWorksheet} onChange={handleImportWorksheetChange}>
                        {importWorksheets.map((worksheetName) => (
                          <option key={worksheetName} value={worksheetName}>{worksheetName}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {importError ? <p className="auth-error">{importError}</p> : null}

                  {importPreview ? (
                    <div className="admin-import-preview">
                      <div className="admin-import-summary">
                        <span>{importPreview.total} total</span>
                        <span className="is-valid">{importPreview.valid} valid</span>
                        <span className={importPreview.invalid ? 'is-invalid' : ''}>{importPreview.invalid} invalid</span>
                        {visibleImportDuplicateCount ? <span className="is-warning">{visibleImportDuplicateCount} possible duplicates</span> : null}
                      </div>

                      {importPreview.invalid ? (
                        <label className="admin-import-checkbox">
                          <input
                            type="checkbox"
                            checked={importValidOnly}
                            onChange={(event) => setImportValidOnly(event.target.checked)}
                            disabled={importingQuestions}
                          />
                          I understand and want to import valid rows only.
                        </label>
                      ) : null}

                      {visibleImportDuplicateCount ? (
                        <label className="admin-import-checkbox">
                          <input
                            type="checkbox"
                            checked={skipImportDuplicates}
                            onChange={(event) => setSkipImportDuplicates(event.target.checked)}
                            disabled={importingQuestions}
                          />
                          Skip questions that already exist in this category and subcategory.
                        </label>
                      ) : null}

                      <div className="admin-import-table-wrap">
                        <table className="admin-import-table">
                          <thead>
                            <tr><th>#</th><th>Question</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Answer</th><th>Status</th></tr>
                          </thead>
                          <tbody>
                            {importPreview.rows.slice(0, 50).map((row) => (
                              <tr key={row.rowNumber} className={row.valid ? '' : 'is-invalid'}>
                                <td>{row.rowNumber}</td>
                                <td>{row.question}</td>
                                <td>{row.options.A}</td>
                                <td>{row.options.B}</td>
                                <td>{row.options.C}</td>
                                <td>{row.options.D}</td>
                                <td>{row.correctAnswer}</td>
                                <td>{row.valid ? 'Valid' : row.errors.join('; ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {importPreview.rows.length > 50 ? <p className="admin-import-note">Showing the first 50 rows of the preview.</p> : null}
                    </div>
                  ) : null}

                  {importingQuestions ? (
                    <p className="admin-upload-status">Importing questions... {importProgress.completed} / {importProgress.total}</p>
                  ) : null}
                  {importSummary ? (
                    <p className="admin-import-complete">Import complete: {importSummary.imported} imported, {importSummary.skipped} skipped.</p>
                  ) : null}

                  <div className="admin-small-actions">
                    <button type="button" className="btn btn-light admin-mini-btn" onClick={resetImport} disabled={importingQuestions}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary admin-mini-btn"
                      onClick={handleImportSubmit}
                      disabled={importingQuestions || !importPreview || !selectedImportCategory || !importSubcategory || !importPreview.valid || (importPreview.invalid > 0 && !importValidOnly)}
                    >
                      {importingQuestions ? 'Importing...' : 'Import Questions'}
                    </button>
                  </div>
                </section>

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

                <section className="admin-question-list" aria-label="Question bank">
                  <div className="admin-question-list-head">
                    <div>
                      <h3>Question Bank</h3>
                      <p>{questionSearch.trim() ? `${visibleQuestionPage.length} questions found on this page` : `${adminQuestionTotal.toLocaleString()} total questions`}</p>
                    </div>
                    <div className="admin-small-actions">
                      <button type="button" className="btn btn-light admin-mini-btn" onClick={clearQuestionFilters}>Clear Filters</button>
                      <button type="button" className="btn btn-primary admin-mini-btn" onClick={() => setActiveTab('quizManagement')}>Import Questions</button>
                    </div>
                  </div>

                  <div className="admin-question-filters">
                    <input
                      type="search"
                      value={questionSearch}
                      onChange={(event) => setQuestionSearch(event.target.value)}
                      placeholder="Search loaded questions..."
                      aria-label="Search loaded questions"
                    />
                    <select value={questionCategory} onChange={(event) => {
                      setQuestionCategory(event.target.value)
                      setQuestionSubcategory('')
                    }}>
                      <option value="">All categories</option>
                      {quizCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                    </select>
                    <select value={questionSubcategory} onChange={(event) => setQuestionSubcategory(event.target.value)} disabled={!availableQuestionSubcategories.length}>
                      <option value="">All subcategories</option>
                      {availableQuestionSubcategories.map((subcategoryName) => <option key={subcategoryName} value={subcategoryName}>{subcategoryName}</option>)}
                    </select>
                    <select value={questionDateFilter} onChange={(event) => setQuestionDateFilter(event.target.value)}>
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last7">Last 7 days</option>
                      <option value="last30">Last 30 days</option>
                      <option value="month">This month</option>
                      <option value="year">This year</option>
                      <option value="custom">Custom range</option>
                    </select>
                    <select value={questionSort} onChange={(event) => setQuestionSort(event.target.value)}>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="order">Question order</option>
                      <option value="categoryAsc">Category A-Z</option>
                      <option value="categoryDesc">Category Z-A</option>
                      <option value="subcategoryAsc">Subcategory A-Z</option>
                      <option value="subcategoryDesc">Subcategory Z-A</option>
                    </select>
                  </div>

                  {questionDateFilter === 'custom' ? (
                    <div className="admin-question-date-range">
                      <label>From <input type="date" value={questionFromDate} onChange={(event) => setQuestionFromDate(event.target.value)} /></label>
                      <label>To <input type="date" value={questionToDate} onChange={(event) => setQuestionToDate(event.target.value)} /></label>
                    </div>
                  ) : null}

                  {adminQuestionPageError ? <p className="auth-error">{adminQuestionPageError}</p> : null}
                  {adminQuestionPageLoading ? <p className="admin-upload-status">Loading questions...</p> : null}
                  {!adminQuestionPageLoading && !visibleQuestionPage.length ? (
                    <div className="admin-question-empty"><strong>No questions found</strong><span>Try changing your filters or clear the current search.</span></div>
                  ) : (
                    <div className="admin-question-table-wrap">
                      <table className="admin-question-table">
                        <thead><tr><th>#</th><th>Question</th><th>Category</th><th>Subcategory</th><th>Answer</th><th>Added</th><th>Actions</th></tr></thead>
                        <tbody>
                          {visibleQuestionPage.map((item, index) => (
                            <tr key={item.id}>
                              <td>{(questionPageNumber - 1) * questionPageSize + index + 1}</td>
                              <td><button type="button" className="admin-question-link" onClick={() => setQuestionDetail(item)}>{item.question}</button></td>
                              <td>{item.category}</td>
                              <td>{item.subcategory}</td>
                              <td><span className="admin-answer-badge">{item.correctAnswer}</span></td>
                              <td>{formatQuestionDate(item.createdAt)}</td>
                              <td><div className="admin-small-actions"><button type="button" className="btn btn-light admin-mini-btn" onClick={() => setQuestionDetail(item)}>View</button><button type="button" className="btn btn-light admin-mini-btn" onClick={() => startQuestionEdit(item)}>Edit</button><button type="button" className="btn btn-light admin-mini-btn is-danger" onClick={() => { if (window.confirm('Delete this question?')) deleteQuestionAndRefresh(item.id) }}>Delete</button></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="admin-question-pagination"><span>Page {questionPageNumber} of {Math.max(1, Math.ceil(adminQuestionTotal / questionPageSize))}</span><label>Rows <select value={questionPageSize} onChange={(event) => setQuestionPageSize(Number(event.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button type="button" className="btn btn-light admin-mini-btn" onClick={goToPreviousQuestionPage} disabled={questionPageNumber === 1 || adminQuestionPageLoading}>Previous</button><button type="button" className="btn btn-light admin-mini-btn" onClick={goToNextQuestionPage} disabled={!questionPageHasMore || adminQuestionPageLoading}>Next</button></div>
                </section>

                {questionDetail ? (
                  <div className="admin-question-modal-overlay" role="presentation" onClick={() => setQuestionDetail(null)}>
                    <article className="admin-question-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                      <div className="admin-question-modal-head"><h3>Question</h3><button type="button" className="btn btn-light admin-mini-btn" onClick={() => setQuestionDetail(null)}>Close</button></div>
                      <p className="admin-question-detail-text">{questionDetail.question}</p>
                      <div className="admin-question-options">{['A', 'B', 'C', 'D'].map((key) => <p key={key}><strong>{key}.</strong> {questionDetail.options[key]}</p>)}</div>
                      <p><strong>Correct answer:</strong> {questionDetail.correctAnswer}</p><p><strong>Category:</strong> {questionDetail.category} / {questionDetail.subcategory}</p><p><strong>Order:</strong> {questionDetail.order ?? 'Legacy'}</p><p><strong>Added:</strong> {formatQuestionDate(questionDetail.createdAt)}</p>
                      <div className="admin-small-actions"><button type="button" className="btn btn-primary admin-mini-btn" onClick={() => startQuestionEdit(questionDetail)}>Edit</button><button type="button" className="btn btn-light admin-mini-btn is-danger" onClick={() => { if (window.confirm('Delete this question?')) { deleteQuestionAndRefresh(questionDetail.id); setQuestionDetail(null) } }}>Delete</button></div>
                    </article>
                  </div>
                ) : null}

                {questionEditing ? (
                  <div className="admin-question-modal-overlay" role="presentation">
                    <form className="admin-question-modal admin-form" onSubmit={submitQuestionEdit}>
                      <div className="admin-question-modal-head"><h3>Edit Question</h3><button type="button" className="btn btn-light admin-mini-btn" onClick={() => setQuestionEditing(null)}>Cancel</button></div>
                      <label>Question<textarea value={questionEditing.question} onChange={(event) => setQuestionEditing((prev) => ({ ...prev, question: event.target.value }))} /></label>
                      <div className="admin-options-grid">{['A', 'B', 'C', 'D'].map((key) => <label key={key} className="admin-option-field">Option {key}<input value={questionEditing.options[key]} onChange={(event) => setQuestionEditing((prev) => ({ ...prev, options: { ...prev.options, [key]: event.target.value } }))} /></label>)}</div>
                      <label>Correct answer<select value={questionEditing.correctAnswer} onChange={(event) => setQuestionEditing((prev) => ({ ...prev, correctAnswer: event.target.value }))}><option>A</option><option>B</option><option>C</option><option>D</option></select></label>
                      {questionEditError ? <p className="auth-error">{questionEditError}</p> : null}<button type="submit" className="btn btn-primary admin-mini-btn">Save Changes</button>
                    </form>
                  </div>
                ) : null}
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
