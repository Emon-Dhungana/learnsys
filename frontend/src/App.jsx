import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import PreferencesModal from './components/PreferencesModal'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Admin from './pages/Admin'
import QuizPage from './pages/QuizPage'
import TypingPage from './pages/TypingPage'
import './App.css'

const defaultTypingStats = () => ({
  history: [],
  weakKeyCounts: {},
  incorrectPatterns: {},
  handStats: {
    left: { total: 0, errors: 0 },
    right: { total: 0, errors: 0 },
    other: { total: 0, errors: 0 },
  },
})

function App() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [userPreferencesByUsername, setUserPreferencesByUsername] = useState({})
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [authView, setAuthView] = useState('login')
  const [adminQuizzes, setAdminQuizzes] = useState([])
  const [userQuizzes, setUserQuizzes] = useState([])
  const [quizSessionState, setQuizSessionState] = useState(null)
  const [typingSessionState, setTypingSessionState] = useState(null)
  const [typingStatsByUsername, setTypingStatsByUsername] = useState({})
  const [uploadedResources, setUploadedResources] = useState([])
  const resourcesRef = useRef(uploadedResources)

  const navLinks = ['Home', 'Courses', 'Quiz', 'Typing', 'Dashboard']

  const sanitizePreferences = (preferences, nextCategories = categories) => {
    const validCategories = new Set(nextCategories.map((item) => item.name))
    const validSubcategories = new Set(
      nextCategories.flatMap((item) => item.subcategories ?? []),
    )

    return {
      categories: (preferences?.categories ?? []).filter((item) => validCategories.has(item)),
      subcategories: (preferences?.subcategories ?? []).filter((item) => validSubcategories.has(item)),
    }
  }

  const sanitizePreferenceMap = (preferenceMap, nextCategories) => {
    const nextMap = {}

    Object.entries(preferenceMap).forEach(([username, preferences]) => {
      nextMap[username] = sanitizePreferences(preferences, nextCategories)
    })

    return nextMap
  }

  useEffect(() => {
    resourcesRef.current = uploadedResources
  }, [uploadedResources])

  useEffect(() => {
    return () => {
      resourcesRef.current.forEach((resource) => {
        URL.revokeObjectURL(resource.fileUrl)
      })
    }
  }, [])

  const openAuth = (view) => {
    setAuthView(view)
    setIsAuthOpen(true)
  }

  const closeAuth = () => {
    setIsAuthOpen(false)
  }

  const handleLogin = ({ identifier }) => {
    const username = identifier.includes('@') ? identifier.split('@')[0] : identifier
    const existingPreferences = sanitizePreferences(userPreferencesByUsername[username] ?? {
      categories: [],
      subcategories: [],
    })

    setCurrentUser({
      username,
      preferences: existingPreferences,
    })

    if (!userPreferencesByUsername[username]) {
      setIsPreferencesOpen(true)
    }

    setIsAuthOpen(false)
  }

  const handleSignup = ({ username }) => {
    const defaultPreferences = sanitizePreferences({
      categories: [],
      subcategories: [],
    })

    const nextUser = {
      username,
      preferences: defaultPreferences,
    }

    setCurrentUser(nextUser)
    setUserPreferencesByUsername((prev) => ({
      ...prev,
      [username]: nextUser.preferences,
    }))
    setIsPreferencesOpen(true)
    setIsAuthOpen(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsPreferencesOpen(false)
    navigate('/')
  }

  const handleNavClick = (link) => {
    if (link === 'Home') {
      navigate('/')
      return
    }

    if (link === 'Courses') {
      navigate('/courses')
      return
    }

    if (link === 'Quiz') {
      if (!currentUser) {
        openAuth('login')
        return
      }

      navigate('/quiz')
      return
    }

    if (link === 'Typing') {
      if (!currentUser) {
        openAuth('login')
        return
      }

      navigate('/typing')
      return
    }

    if (!currentUser) {
      openAuth('login')
      return
    }

    navigate('/dashboard')
  }

  const handleUploadResource = ({ title, description, category, subcategory, file }) => {
    const newResource = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      subcategory,
      fileName: file.name,
      fileType: file.type || 'Unknown file type',
      fileUrl: URL.createObjectURL(file),
    }

    setUploadedResources((prev) => [newResource, ...prev])
  }

  const handleAddAdminQuestion = (questionInput) => {
    const newQuestion = {
      id: crypto.randomUUID(),
      question: questionInput.question,
      options: questionInput.options,
      correctAnswer: questionInput.correctAnswer,
      category: questionInput.category,
    }

    setAdminQuizzes((prev) => [newQuestion, ...prev])
  }

  const handleDeleteAdminQuestion = (questionId) => {
    setAdminQuizzes((prev) => prev.filter((item) => item.id !== questionId))
  }

  const handleSaveUserQuiz = (quizInput) => {
    if (!currentUser) {
      return
    }

    if (quizInput.id) {
      setUserQuizzes((prev) =>
        prev.map((item) =>
          item.id === quizInput.id
            ? {
                ...item,
                title: quizInput.title,
                questions: quizInput.questions,
              }
            : item,
        ),
      )
      return
    }

    const newQuiz = {
      id: crypto.randomUUID(),
      owner: currentUser.username,
      title: quizInput.title,
      questions: quizInput.questions,
    }

    setUserQuizzes((prev) => [newQuiz, ...prev])
  }

  const handleDeleteUserQuiz = (quizId) => {
    setUserQuizzes((prev) => prev.filter((item) => item.id !== quizId))
  }

  const handleSaveTypingResult = (result) => {
    if (!currentUser) {
      return
    }

    setTypingStatsByUsername((prev) => {
      const current = prev[currentUser.username] ?? defaultTypingStats()

      const nextWeakKeyCounts = { ...current.weakKeyCounts }
      Object.entries(result.weakKeyCounts ?? {}).forEach(([key, count]) => {
        nextWeakKeyCounts[key] = (nextWeakKeyCounts[key] ?? 0) + count
      })

      const nextIncorrectPatterns = { ...current.incorrectPatterns }
      Object.entries(result.incorrectPatterns ?? {}).forEach(([pattern, count]) => {
        nextIncorrectPatterns[pattern] = (nextIncorrectPatterns[pattern] ?? 0) + count
      })

      const nextHandStats = {
        left: {
          total: current.handStats.left.total + (result.handStats?.left?.total ?? 0),
          errors: current.handStats.left.errors + (result.handStats?.left?.errors ?? 0),
        },
        right: {
          total: current.handStats.right.total + (result.handStats?.right?.total ?? 0),
          errors: current.handStats.right.errors + (result.handStats?.right?.errors ?? 0),
        },
        other: {
          total: current.handStats.other.total + (result.handStats?.other?.total ?? 0),
          errors: current.handStats.other.errors + (result.handStats?.other?.errors ?? 0),
        },
      }

      const nextHistory = [
        ...current.history,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          durationSeconds: result.durationSeconds,
          wpm: result.wpm,
          accuracy: result.accuracy,
          errorCount: result.errorCount,
          totalKeystrokes: result.totalKeystrokes,
        },
      ]

      return {
        ...prev,
        [currentUser.username]: {
          history: nextHistory,
          weakKeyCounts: nextWeakKeyCounts,
          incorrectPatterns: nextIncorrectPatterns,
          handStats: nextHandStats,
        },
      }
    })
  }

  const handleAddCategory = (name) => {
    const nextCategory = {
      id: crypto.randomUUID(),
      name,
      subcategories: [],
    }

    setCategories((prev) => [...prev, nextCategory])
  }

  const handleRenameCategory = (categoryId, nextName) => {
    const currentCategory = categories.find((item) => item.id === categoryId)
    if (!currentCategory) {
      return
    }

    const previousName = currentCategory.name
    const nextCategories = categories.map((item) =>
      item.id === categoryId ? { ...item, name: nextName } : item,
    )

    setCategories(nextCategories)

    setUploadedResources((prev) =>
      prev.map((resource) =>
        resource.category === previousName
          ? { ...resource, category: nextName }
          : resource,
      ),
    )

    setUserPreferencesByUsername((prev) => {
      const renamed = {}

      Object.entries(prev).forEach(([username, preferences]) => {
        const renamedCategories = (preferences.categories ?? []).map((categoryName) =>
          categoryName === previousName ? nextName : categoryName,
        )
        renamed[username] = sanitizePreferences(
          {
            ...preferences,
            categories: renamedCategories,
          },
          nextCategories,
        )
      })

      return renamed
    })

    setCurrentUser((prev) => {
      if (!prev) {
        return prev
      }

      const nextPreferences = sanitizePreferences(
        {
          ...prev.preferences,
          categories: (prev.preferences?.categories ?? []).map((categoryName) =>
            categoryName === previousName ? nextName : categoryName,
          ),
        },
        nextCategories,
      )

      return {
        ...prev,
        preferences: nextPreferences,
      }
    })
  }

  const handleDeleteCategory = (categoryId) => {
    const currentCategory = categories.find((item) => item.id === categoryId)
    if (!currentCategory) {
      return
    }

    const nextCategories = categories.filter((item) => item.id !== categoryId)

    setCategories(nextCategories)

    setUploadedResources((prev) =>
      prev.map((resource) =>
        resource.category === currentCategory.name
          ? { ...resource, category: 'Uncategorized', subcategory: 'General' }
          : resource,
      ),
    )

    setUserPreferencesByUsername((prev) => sanitizePreferenceMap(prev, nextCategories))

    setCurrentUser((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        preferences: sanitizePreferences(prev.preferences, nextCategories),
      }
    })
  }

  const handleAddSubcategory = (categoryId, subcategoryName) => {
    const nextCategories = categories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: [...item.subcategories, subcategoryName],
          }
        : item,
    )

    setCategories(nextCategories)
  }

  const handleDeleteSubcategory = (categoryId, subcategoryName) => {
    const category = categories.find((item) => item.id === categoryId)
    if (!category) {
      return
    }

    const nextCategories = categories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: item.subcategories.filter((subcat) => subcat !== subcategoryName),
          }
        : item,
    )

    setCategories(nextCategories)

    setUploadedResources((prev) =>
      prev.map((resource) =>
        resource.category === category.name && resource.subcategory === subcategoryName
          ? { ...resource, subcategory: 'General' }
          : resource,
      ),
    )

    setUserPreferencesByUsername((prev) => sanitizePreferenceMap(prev, nextCategories))

    setCurrentUser((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        preferences: sanitizePreferences(prev.preferences, nextCategories),
      }
    })
  }

  const handleDeleteResource = (resourceId) => {
    setUploadedResources((prev) => {
      const target = prev.find((item) => item.id === resourceId)
      if (target) {
        URL.revokeObjectURL(target.fileUrl)
      }

      return prev.filter((item) => item.id !== resourceId)
    })
  }

  const handleSavePreferences = (preferences) => {
    if (!currentUser) {
      return
    }

    const normalizedPreferences = sanitizePreferences(preferences)

    setCurrentUser((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        preferences: normalizedPreferences,
      }
    })

    setUserPreferencesByUsername((prev) => ({
      ...prev,
      [currentUser.username]: normalizedPreferences,
    }))
    setIsPreferencesOpen(false)
  }

  const openPreferences = () => {
    if (!currentUser) {
      return
    }

    setIsPreferencesOpen(true)
  }

  return (
    <div className="app-shell">
      <Navbar
        links={navLinks}
        user={currentUser}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
        onNavClick={handleNavClick}
      />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/courses"
            element={
              <Courses
                resources={uploadedResources}
                categories={categories}
                userPreferences={currentUser?.preferences}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <Admin
                categories={categories}
                adminQuizzes={adminQuizzes}
                resources={uploadedResources}
                onAddCategory={handleAddCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddSubcategory={handleAddSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                onAddAdminQuestion={handleAddAdminQuestion}
                onDeleteAdminQuestion={handleDeleteAdminQuestion}
                onUploadResource={handleUploadResource}
                onDeleteResource={handleDeleteResource}
              />
            }
          />
          <Route
            path="/quiz"
            element={
              <QuizPage
                user={currentUser}
                categories={categories}
                adminQuizzes={adminQuizzes}
                userQuizzes={userQuizzes}
                quizSessionState={quizSessionState}
                onRequireAuth={() => openAuth('login')}
                onSaveUserQuiz={handleSaveUserQuiz}
                onDeleteUserQuiz={handleDeleteUserQuiz}
                onUpdateQuizSession={setQuizSessionState}
              />
            }
          />
          <Route
            path="/typing"
            element={
              <ProtectedRoute
                isAllowed={Boolean(currentUser)}
                onUnauthorized={() => openAuth('login')}
                redirectPath="/"
              >
                <TypingPage
                  user={currentUser}
                  typingSessionState={typingSessionState}
                  typingStats={
                    currentUser
                      ? typingStatsByUsername[currentUser.username] ?? defaultTypingStats()
                      : defaultTypingStats()
                  }
                  onRequireAuth={() => openAuth('login')}
                  onUpdateTypingSession={setTypingSessionState}
                  onSaveTypingResult={handleSaveTypingResult}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                isAllowed={Boolean(currentUser)}
                onUnauthorized={() => openAuth('login')}
                redirectPath="/"
              >
                <Dashboard
                  user={currentUser}
                  resources={uploadedResources}
                  onEditPreferences={openPreferences}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        view={authView}
        onClose={closeAuth}
        onSwitchView={setAuthView}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />

      <PreferencesModal
        key={`${currentUser?.username ?? 'guest'}-${isPreferencesOpen ? 'open' : 'closed'}`}
        isOpen={isPreferencesOpen}
        user={currentUser}
        categories={categories}
        onClose={() => setIsPreferencesOpen(false)}
        onSave={handleSavePreferences}
      />
    </div>
  )
}

export default App
