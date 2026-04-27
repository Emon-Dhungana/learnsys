import { useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import AdminAuthModal from './components/AdminAuthModal'
import PreferencesModal from './components/PreferencesModal'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Admin from './pages/Admin'
import QuizPage from './pages/QuizPage'
import TypingPage from './pages/TypingPage'
import { db } from './firebase'
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

const normalizeTypingStats = (value) => {
  const safeValue = value && typeof value === 'object' ? value : {}

  const history = Array.isArray(safeValue.history)
    ? safeValue.history
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => ({
          id: typeof item.id === 'string' && item.id.trim() ? item.id : `typing-${index + 1}`,
          timestamp: Number.isFinite(item.timestamp) ? item.timestamp : Date.now(),
          language: item.language === 'nepali' ? 'nepali' : 'english',
          durationSeconds: Number(item.durationSeconds) || 0,
          wpm: Number(item.wpm) || 0,
          accuracy: Number(item.accuracy) || 0,
          errorCount: Number(item.errorCount) || 0,
          totalKeystrokes: Number(item.totalKeystrokes) || 0,
        }))
    : []

  const weakKeyCounts =
    safeValue.weakKeyCounts && typeof safeValue.weakKeyCounts === 'object'
      ? safeValue.weakKeyCounts
      : {}

  const incorrectPatterns =
    safeValue.incorrectPatterns && typeof safeValue.incorrectPatterns === 'object'
      ? safeValue.incorrectPatterns
      : {}

  const handStats = safeValue.handStats && typeof safeValue.handStats === 'object' ? safeValue.handStats : {}

  return {
    history,
    weakKeyCounts,
    incorrectPatterns,
    handStats: {
      left: {
        total: Number(handStats?.left?.total) || 0,
        errors: Number(handStats?.left?.errors) || 0,
      },
      right: {
        total: Number(handStats?.right?.total) || 0,
        errors: Number(handStats?.right?.errors) || 0,
      },
      other: {
        total: Number(handStats?.other?.total) || 0,
        errors: Number(handStats?.other?.errors) || 0,
      },
    },
  }
}

const normalizeCourseProgress = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const normalized = {}

  Object.entries(value).forEach(([resourceId, progress]) => {
    if (!resourceId || !progress || typeof progress !== 'object') {
      return
    }

    normalized[resourceId] = {
      viewed: Boolean(progress.viewed),
      downloaded: Boolean(progress.downloaded),
      viewedAt: Number(progress.viewedAt) || null,
      downloadedAt: Number(progress.downloadedAt) || null,
    }
  })

  return normalized
}

const getCreatedAtMs = (value) => {
  if (Number.isFinite(value)) {
    return value
  }

  if (value && typeof value.toMillis === 'function') {
    return value.toMillis()
  }

  if (value && Number.isFinite(value.seconds)) {
    return value.seconds * 1000
  }

  return null
}

function App() {
  const ADMIN_USERNAME = 'admin'
  const ADMIN_PASSWORD = 'admin123'
  const userStorageKey = 'learnsys_user'
  const adminStorageKey = 'learnsys_admin'
  const courseCategoriesStorageKey = 'learnsys_course_categories'
  const quizCategoriesStorageKey = 'learnsys_quiz_categories'
  const uploadedResourcesStorageKey = 'learnsys_uploaded_resources'
  const typingStatsStorageKey = 'learnsys_typing_stats'
  const courseProgressStorageKey = 'learnsys_course_progress'

  const readStoredUser = () => {
    try {
      const storedUser = localStorage.getItem(userStorageKey)
      return storedUser ? JSON.parse(storedUser) : null
    } catch {
      return null
    }
  }

  const readStoredArray = (key) => {
    try {
      const storedValue = localStorage.getItem(key)
      if (!storedValue) {
        return []
      }

      const parsed = JSON.parse(storedValue)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const readStoredObject = (key, fallback = {}) => {
    try {
      const storedValue = localStorage.getItem(key)
      if (!storedValue) {
        return fallback
      }

      const parsed = JSON.parse(storedValue)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }

  const normalizeCategoryList = (value, prefix) => {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((item, index) => {
        // Backward compatibility: older builds stored category names as strings.
        if (typeof item === 'string') {
          const trimmedName = item.trim()
          if (!trimmedName) {
            return null
          }

          return {
            id: `${prefix}-${index + 1}`,
            name: trimmedName,
            subcategories: [],
          }
        }

        if (!item || typeof item !== 'object') {
          return null
        }

        const trimmedName = typeof item.name === 'string' ? item.name.trim() : ''
        if (!trimmedName) {
          return null
        }

        const subcategories = Array.isArray(item.subcategories)
          ? item.subcategories
              .filter((subcat) => typeof subcat === 'string' && subcat.trim())
              .map((subcat) => subcat.trim())
          : []

        return {
          id:
            typeof item.id === 'string' && item.id.trim()
              ? item.id
              : `${prefix}-${index + 1}`,
          name: trimmedName,
          subcategories,
        }
      })
      .filter(Boolean)
  }

  const navigate = useNavigate()
  const [courseCategories, setCourseCategories] = useState(() =>
    normalizeCategoryList(readStoredArray(courseCategoriesStorageKey), 'course'),
  )
  const [quizCategories, setQuizCategories] = useState(() =>
    normalizeCategoryList(readStoredArray(quizCategoriesStorageKey), 'quiz'),
  )
  const [currentUser, setCurrentUser] = useState(() => readStoredUser())
  const [userPreferencesByUsername, setUserPreferencesByUsername] = useState(() => {
    const storedUser = readStoredUser()
    if (!storedUser?.username) {
      return {}
    }

    return {
      [storedUser.username]: storedUser.preferences ?? {
        categories: [],
        subcategories: [],
      },
    }
  })
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [authView, setAuthView] = useState('login')
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSessionRestored, setIsSessionRestored] = useState(false)
  const [adminAuthError, setAdminAuthError] = useState('')
  const [adminQuizzes, setAdminQuizzes] = useState([])
  const [adminQuizLoading, setAdminQuizLoading] = useState(false)
  const [adminQuizError, setAdminQuizError] = useState('')
  const [adminUsers, setAdminUsers] = useState([])
  const [adminUsersLoading, setAdminUsersLoading] = useState(false)
  const [adminUsersError, setAdminUsersError] = useState('')
  const [userQuizzes, setUserQuizzes] = useState([])
  const [quizSessionState, setQuizSessionState] = useState(null)
  const [typingSessionState, setTypingSessionState] = useState(null)
  const [typingStatsByUsername, setTypingStatsByUsername] = useState(() =>
    readStoredObject(typingStatsStorageKey, {}),
  )
  const [courseProgressByUsername, setCourseProgressByUsername] = useState(() =>
    readStoredObject(courseProgressStorageKey, {}),
  )
  const restoredUserStateForRef = useRef(null)
  const [uploadedResources, setUploadedResources] = useState(() =>
    readStoredArray(uploadedResourcesStorageKey),
  )
  const [isAppDataRestored, setIsAppDataRestored] = useState(false)

  const navLinks = ['Home', 'Courses', 'Quiz', 'Typing', 'Dashboard']

  const getUserStateDocId = (username) => encodeURIComponent(username.trim().toLowerCase())

  useEffect(() => {
    const storedAdmin = localStorage.getItem(adminStorageKey)

    console.log('storedAdmin value:', storedAdmin)

    const timeoutId = window.setTimeout(() => {
      const storedUser = readStoredUser()

      if (storedUser?.username) {
        setCurrentUser(storedUser)
        setUserPreferencesByUsername({
          [storedUser.username]: storedUser.preferences ?? {
            categories: [],
            subcategories: [],
          },
        })
      }

      if (storedAdmin === 'true') {
        setIsAdmin(true)
      }

      console.log('isAdmin after restore:', storedAdmin === 'true')
      setIsSessionRestored(true)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const sanitizePreferences = (preferences, nextCategories = courseCategories) => {
    const validCategories = new Set(nextCategories.map((item) => item.name))
    const validSubcategories = new Set(
      nextCategories.flatMap((item) => item.subcategories ?? []),
    )

    return {
      categories: (preferences?.categories ?? []).filter((item) => validCategories.has(item)),
      subcategories: (preferences?.subcategories ?? []).filter((item) => validSubcategories.has(item)),
    }
  }

  useEffect(() => {
    localStorage.setItem(courseCategoriesStorageKey, JSON.stringify(courseCategories))
  }, [courseCategories])

  useEffect(() => {
    localStorage.setItem(quizCategoriesStorageKey, JSON.stringify(quizCategories))
  }, [quizCategories])

  useEffect(() => {
    localStorage.setItem(uploadedResourcesStorageKey, JSON.stringify(uploadedResources))
  }, [uploadedResources])

  useEffect(() => {
    localStorage.setItem(typingStatsStorageKey, JSON.stringify(typingStatsByUsername))
  }, [typingStatsByUsername])

  useEffect(() => {
    localStorage.setItem(courseProgressStorageKey, JSON.stringify(courseProgressByUsername))
  }, [courseProgressByUsername])

  useEffect(() => {
    let isCancelled = false
    const username = currentUser?.username

    if (!username) {
      restoredUserStateForRef.current = null
      return () => {
        isCancelled = true
      }
    }

    const restoreUserState = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'user_state', getUserStateDocId(username)))

        if (isCancelled) {
          return
        }

        if (!snapshot.exists()) {
          restoredUserStateForRef.current = username
          return
        }

        const data = snapshot.data()
        const restoredTypingStats = normalizeTypingStats(data?.typingStats)
        const restoredCourseProgress = normalizeCourseProgress(data?.courseProgress)

        setTypingStatsByUsername((prev) => ({
          ...prev,
          [username]: restoredTypingStats,
        }))

        setCourseProgressByUsername((prev) => ({
          ...prev,
          [username]: restoredCourseProgress,
        }))
      } catch (error) {
        console.error('Failed to restore user state from Firestore:', error)
      } finally {
        if (!isCancelled) {
          restoredUserStateForRef.current = username
        }
      }
    }

    restoreUserState()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.username])

  useEffect(() => {
    let isCancelled = false

    const restoreAppData = async () => {
      try {
        const [courseCategoriesDoc, quizCategoriesDoc, resourcesDoc] = await Promise.all([
          getDoc(doc(db, 'app_state', 'course_categories')),
          getDoc(doc(db, 'app_state', 'quiz_categories')),
          getDoc(doc(db, 'app_state', 'resources')),
        ])

        if (isCancelled) {
          return
        }

        if (courseCategoriesDoc.exists()) {
          const courseData = courseCategoriesDoc.data()
          const firestoreCourseCategories = normalizeCategoryList(
            courseData?.items ?? courseData?.categories,
            'course',
          )
          setCourseCategories(firestoreCourseCategories)
        }

        if (quizCategoriesDoc.exists()) {
          const quizData = quizCategoriesDoc.data()
          const firestoreQuizCategories = normalizeCategoryList(
            quizData?.items ?? quizData?.categories,
            'quiz',
          )
          setQuizCategories(firestoreQuizCategories)
        }

        if (resourcesDoc.exists()) {
          const firestoreResources = resourcesDoc.data()?.items
          if (Array.isArray(firestoreResources)) {
            setUploadedResources(firestoreResources)
          }
        }
      } catch (error) {
        console.error('Failed to restore app state from Firestore:', error)
      } finally {
        if (!isCancelled) {
          setIsAppDataRestored(true)
        }
      }
    }

    queueMicrotask(restoreAppData)

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAppDataRestored) {
      return
    }

    const normalizedCourseCategories = normalizeCategoryList(courseCategories, 'course')

    setDoc(doc(db, 'app_state', 'course_categories'), {
      items: normalizedCourseCategories,
      categories: normalizedCourseCategories,
      updatedAt: Date.now(),
    }).catch((error) => {
      console.error('Failed to sync course categories to Firestore:', error)
    })
  }, [courseCategories, isAppDataRestored])

  useEffect(() => {
    if (!isAppDataRestored) {
      return
    }

    const normalizedQuizCategories = normalizeCategoryList(quizCategories, 'quiz')

    setDoc(doc(db, 'app_state', 'quiz_categories'), {
      items: normalizedQuizCategories,
      categories: normalizedQuizCategories,
      updatedAt: Date.now(),
    }).catch((error) => {
      console.error('Failed to sync quiz categories to Firestore:', error)
    })
  }, [quizCategories, isAppDataRestored])

  useEffect(() => {
    if (!isAppDataRestored) {
      return
    }

    setDoc(doc(db, 'app_state', 'resources'), {
      items: uploadedResources,
      updatedAt: Date.now(),
    }).catch((error) => {
      console.error('Failed to sync resources to Firestore:', error)
    })
  }, [uploadedResources, isAppDataRestored])

  useEffect(() => {
    const username = currentUser?.username
    if (!username || restoredUserStateForRef.current !== username) {
      return
    }

    const safeTypingStats = normalizeTypingStats(typingStatsByUsername[username] ?? defaultTypingStats())
    const safeCourseProgress = normalizeCourseProgress(courseProgressByUsername[username] ?? {})

    setDoc(
      doc(db, 'user_state', getUserStateDocId(username)),
      {
        username,
        usernameLower: username.toLowerCase(),
        typingStats: safeTypingStats,
        courseProgress: safeCourseProgress,
        updatedAt: Date.now(),
      },
      { merge: true },
    ).catch((error) => {
      console.error('Failed to sync user state to Firestore:', error)
    })
  }, [currentUser?.username, typingStatsByUsername, courseProgressByUsername])

  const sanitizePreferenceMap = (preferenceMap, nextCategories) => {
    const nextMap = {}

    Object.entries(preferenceMap).forEach(([username, preferences]) => {
      nextMap[username] = sanitizePreferences(preferences, nextCategories)
    })

    return nextMap
  }

  const openAuth = (view) => {
    setAuthView(view)
    setIsAuthOpen(true)
  }

  const closeAuth = () => {
    setIsAuthOpen(false)
  }

  const handleLogin = async ({ identifier, password }) => {
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const isEmailLogin = normalizedIdentifier.includes('@')

    try {
      const userQuery = query(
        collection(db, 'users'),
        where(isEmailLogin ? 'emailLower' : 'usernameLower', '==', normalizedIdentifier),
        limit(1),
      )
      const snapshot = await getDocs(userQuery)

      if (snapshot.empty) {
        return {
          success: false,
          error: 'No account found with that email/username.',
        }
      }

      const userDoc = snapshot.docs[0]
      const userData = userDoc.data()

      if (userData.password !== password) {
        return {
          success: false,
          error: 'Invalid password.',
        }
      }

      const existingPreferences = sanitizePreferences(
        userPreferencesByUsername[userData.username] ?? {
          categories: [],
          subcategories: [],
        },
      )

      const nextUser = {
        username: userData.username,
        email: userData.email,
        createdAtMs: getCreatedAtMs(userData.createdAtMs ?? userData.createdAt),
        preferences: existingPreferences,
      }

      setCurrentUser(nextUser)
      setUserPreferencesByUsername((prev) => ({
        ...prev,
        [userData.username]: existingPreferences,
      }))

      localStorage.setItem(userStorageKey, JSON.stringify(nextUser))
      setIsAuthOpen(false)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to login. Please try again.',
      }
    }
  }

  const handleSignup = async ({ username, email, password }) => {
    const normalizedUsername = username.trim()
    const usernameLower = normalizedUsername.toLowerCase()
    const normalizedEmail = email.trim()
    const emailLower = normalizedEmail.toLowerCase()

    const createdAtMs = Date.now()

    try {
      const duplicateQuery = query(
        collection(db, 'users'),
        where('usernameLower', '==', usernameLower),
        limit(1),
      )
      const duplicateSnapshot = await getDocs(duplicateQuery)

      if (!duplicateSnapshot.empty) {
        return {
          success: false,
          error: 'Username already exists. Please choose another username.',
        }
      }

      await addDoc(collection(db, 'users'), {
        username: normalizedUsername,
        usernameLower,
        email: normalizedEmail,
        emailLower,
        password,
        createdAtMs,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to create account. Please try again.',
      }
    }

    const defaultPreferences = sanitizePreferences({
      categories: [],
      subcategories: [],
    })

    const nextUser = {
      username: normalizedUsername,
      email: normalizedEmail,
      createdAtMs,
      preferences: defaultPreferences,
    }

    setCurrentUser(nextUser)
    localStorage.setItem(userStorageKey, JSON.stringify(nextUser))
    setUserPreferencesByUsername((prev) => ({
      ...prev,
      [normalizedUsername]: nextUser.preferences,
    }))
    setIsPreferencesOpen(true)
    setIsAuthOpen(false)

    return { success: true }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsAdmin(false)
    setIsPreferencesOpen(false)
    restoredUserStateForRef.current = null
    localStorage.removeItem(userStorageKey)
    localStorage.removeItem(adminStorageKey)
    navigate('/')
  }

  const openAdminAuth = () => {
    setAdminAuthError('')
    setIsAdminAuthOpen(true)
  }

  const closeAdminAuth = () => {
    setIsAdminAuthOpen(false)
    setAdminAuthError('')
  }

  const handleAdminAuth = async ({ username, password }) => {
    const normalizedUsername = username.trim()

    if (!normalizedUsername || !password) {
      setAdminAuthError('Please enter admin username and password.')
      return
    }

    if (normalizedUsername !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setAdminAuthError('Invalid admin credentials.')
      return
    }

    setIsAdmin(true)
    setAdminAuthError('')
    setIsAdminAuthOpen(false)
    localStorage.setItem(adminStorageKey, 'true')
    await Promise.all([loadAdminQuizzes(), loadAdminUsers()])
    navigate('/admin')
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem(adminStorageKey)
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
      if (!currentUser && !isAdmin) {
        openAuth('login')
        return
      }

      navigate('/quiz')
      return
    }

    if (link === 'Typing') {
      if (!currentUser && !isAdmin) {
        openAuth('login')
        return
      }

      navigate('/typing')
      return
    }

    if (link === 'Dashboard' && isAdmin) {
      navigate('/admin')
      return
    }

    if (!currentUser) {
      openAuth('login')
      return
    }

    navigate('/dashboard')
  }

  const handleUploadResource = ({
    title,
    description,
    category,
    subcategory,
    fileUrl,
    publicId,
    resourceType,
    fileName,
  }) => {
    const newResource = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      subcategory,
      fileName,
      fileType: resourceType || 'raw',
      publicId,
      fileUrl,
    }

    setUploadedResources((prev) => [newResource, ...prev])
  }

  const loadAdminQuizzes = useCallback(async () => {
    setAdminQuizLoading(true)
    setAdminQuizError('')

    try {
      const snapshot = await getDocs(collection(db, 'quizzes'))
      const firestoreQuizzes = snapshot.docs
        .map((quizDoc) => {
          const data = quizDoc.data()
          return {
            id: quizDoc.id,
            question: data.question ?? '',
            options: data.options ?? { A: '', B: '', C: '', D: '' },
            correctAnswer: data.correctAnswer ?? 'A',
            category: data.category ?? 'Uncategorized',
            subcategory: data.subcategory ?? 'General',
            createdAt: data.createdAt ?? null,
          }
        })
        .sort((a, b) => {
          const aValue = a.createdAt?.seconds ?? 0
          const bValue = b.createdAt?.seconds ?? 0
          return bValue - aValue
        })

      setAdminQuizzes(firestoreQuizzes)
    } catch (error) {
      setAdminQuizError(error?.message || 'Failed to fetch quizzes from Firestore.')
    } finally {
      setAdminQuizLoading(false)
    }
  }, [])

  const loadAdminUsers = useCallback(async () => {
    setAdminUsersLoading(true)
    setAdminUsersError('')

    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const users = snapshot.docs
        .map((userDoc) => {
          const data = userDoc.data()
          return {
            id: userDoc.id,
            username: data.username ?? 'Unknown',
            email: data.email ?? '',
            createdAtMs: getCreatedAtMs(data.createdAtMs ?? data.createdAt),
          }
        })
        .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0))

      setAdminUsers(users)
    } catch (error) {
      setAdminUsersError(error?.message || 'Failed to fetch registered users from Firestore.')
    } finally {
      setAdminUsersLoading(false)
    }
  }, [])

  const handleDeleteRegisteredUser = async (userId, username) => {
    if (!userId || !username) {
      return
    }

    setAdminUsersError('')

    try {
      await deleteDoc(doc(db, 'users', userId))

      await deleteDoc(doc(db, 'user_state', getUserStateDocId(username))).catch(() => {})

      setTypingStatsByUsername((prev) => {
        const next = { ...prev }
        delete next[username]
        return next
      })

      setCourseProgressByUsername((prev) => {
        const next = { ...prev }
        delete next[username]
        return next
      })

      setUserPreferencesByUsername((prev) => {
        const next = { ...prev }
        delete next[username]
        return next
      })

      if (currentUser?.username === username) {
        setCurrentUser(null)
        setIsPreferencesOpen(false)
        restoredUserStateForRef.current = null
        localStorage.removeItem(userStorageKey)
        navigate('/')
      }

      await loadAdminUsers()
    } catch (error) {
      setAdminUsersError(error?.message || 'Failed to delete user account.')
    }
  }

  useEffect(() => {
    const username = currentUser?.username
    if (!username || currentUser?.createdAtMs) {
      return
    }

    let isCancelled = false

    const loadMemberSince = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, 'users'), where('usernameLower', '==', username.toLowerCase()), limit(1)),
        )

        if (isCancelled || snapshot.empty) {
          return
        }

        const data = snapshot.docs[0].data()
        const createdAtMs = getCreatedAtMs(data.createdAtMs ?? data.createdAt)
        if (!createdAtMs) {
          return
        }

        setCurrentUser((prev) => {
          if (!prev || prev.username !== username) {
            return prev
          }

          const nextUser = {
            ...prev,
            createdAtMs,
          }
          localStorage.setItem(userStorageKey, JSON.stringify(nextUser))
          return nextUser
        })
      } catch {
        // Non-blocking enhancement for legacy sessions without createdAt.
      }
    }

    loadMemberSince()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.username, currentUser?.createdAtMs])

  const handleAddAdminQuestion = async (questionInput) => {
    setAdminQuizError('')

    try {
      await addDoc(collection(db, 'quizzes'), {
        question: questionInput.question,
        options: questionInput.options,
        correctAnswer: questionInput.correctAnswer,
        category: questionInput.category,
        subcategory: questionInput.subcategory,
        createdAt: serverTimestamp(),
      })

      await loadAdminQuizzes()
    } catch (error) {
      setAdminQuizError(error?.message || 'Failed to save quiz to Firestore.')
      throw error
    }
  }

  const handleDeleteAdminQuestion = async (questionId) => {
    setAdminQuizError('')

    try {
      await deleteDoc(doc(db, 'quizzes', questionId))
      await loadAdminQuizzes()
    } catch (error) {
      setAdminQuizError(error?.message || 'Failed to delete quiz from Firestore.')
    }
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
          language: result.language ?? 'english',
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

  const handleMarkCourseViewed = (resourceId) => {
    if (!currentUser?.username || !resourceId) {
      return
    }

    setCourseProgressByUsername((prev) => {
      const currentProgress = prev[currentUser.username] ?? {}
      const currentResourceProgress = currentProgress[resourceId] ?? {
        viewed: false,
        downloaded: false,
        viewedAt: null,
        downloadedAt: null,
      }

      return {
        ...prev,
        [currentUser.username]: {
          ...currentProgress,
          [resourceId]: {
            ...currentResourceProgress,
            viewed: true,
            viewedAt: Date.now(),
          },
        },
      }
    })
  }

  const handleMarkCourseDownloaded = (resourceId) => {
    if (!currentUser?.username || !resourceId) {
      return
    }

    setCourseProgressByUsername((prev) => {
      const currentProgress = prev[currentUser.username] ?? {}
      const currentResourceProgress = currentProgress[resourceId] ?? {
        viewed: false,
        downloaded: false,
        viewedAt: null,
        downloadedAt: null,
      }

      return {
        ...prev,
        [currentUser.username]: {
          ...currentProgress,
          [resourceId]: {
            ...currentResourceProgress,
            downloaded: true,
            downloadedAt: Date.now(),
          },
        },
      }
    })
  }

  const handleAddCourseCategory = (name) => {
    const nextCategory = {
      id: crypto.randomUUID(),
      name,
      subcategories: [],
    }

    setCourseCategories((prev) => [...prev, nextCategory])
  }

  const handleRenameCourseCategory = (categoryId, nextName) => {
    const currentCategory = courseCategories.find((item) => item.id === categoryId)
    if (!currentCategory) {
      return
    }

    const previousName = currentCategory.name
    const nextCategories = courseCategories.map((item) =>
      item.id === categoryId ? { ...item, name: nextName } : item,
    )

    setCourseCategories(nextCategories)

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

  const handleDeleteCourseCategory = (categoryId) => {
    const currentCategory = courseCategories.find((item) => item.id === categoryId)
    if (!currentCategory) {
      return
    }

    const nextCategories = courseCategories.filter((item) => item.id !== categoryId)

    setCourseCategories(nextCategories)

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

  const handleAddCourseSubcategory = (categoryId, subcategoryName) => {
    const nextCategories = courseCategories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: [...item.subcategories, subcategoryName],
          }
        : item,
    )

    setCourseCategories(nextCategories)
  }

  const handleDeleteCourseSubcategory = (categoryId, subcategoryName) => {
    const category = courseCategories.find((item) => item.id === categoryId)
    if (!category) {
      return
    }

    const nextCategories = courseCategories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: item.subcategories.filter((subcat) => subcat !== subcategoryName),
          }
        : item,
    )

    setCourseCategories(nextCategories)

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

  const handleAddQuizCategory = (name) => {
    const nextCategory = {
      id: crypto.randomUUID(),
      name,
      subcategories: [],
    }

    setQuizCategories((prev) => [...prev, nextCategory])
  }

  const handleRenameQuizCategory = async (categoryId, nextName) => {
    const currentCategory = quizCategories.find((item) => item.id === categoryId)
    if (!currentCategory) {
      return
    }

    const previousName = currentCategory.name
    const nextCategories = quizCategories.map((item) =>
      item.id === categoryId ? { ...item, name: nextName } : item,
    )

    setQuizCategories(nextCategories)

    try {
      const snapshot = await getDocs(
        query(collection(db, 'quizzes'), where('category', '==', previousName)),
      )
      const batch = writeBatch(db)

      snapshot.docs.forEach((quizDoc) => {
        batch.update(quizDoc.ref, { category: nextName })
      })

      await batch.commit()
      await loadAdminQuizzes()
    } catch (error) {
      setAdminQuizError(error?.message || 'Failed to update quiz category in Firestore.')
    }
  }

  const handleDeleteQuizCategory = async (categoryId) => {
    const currentCategory = quizCategories.find((item) => item.id === categoryId)
    if (!currentCategory) {
      return
    }

    const nextCategories = quizCategories.filter((item) => item.id !== categoryId)

    setQuizCategories(nextCategories)

    try {
      const snapshot = await getDocs(
        query(collection(db, 'quizzes'), where('category', '==', currentCategory.name)),
      )
      const batch = writeBatch(db)

      snapshot.docs.forEach((quizDoc) => {
        batch.update(quizDoc.ref, { category: 'Uncategorized', subcategory: 'General' })
      })

      await batch.commit()
      await loadAdminQuizzes()
    } catch (error) {
      setAdminQuizError(error?.message || 'Failed to reset quiz category in Firestore.')
    }
  }

  const handleAddQuizSubcategory = (categoryId, subcategoryName) => {
    const nextCategories = quizCategories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: [...item.subcategories, subcategoryName],
          }
        : item,
    )

    setQuizCategories(nextCategories)
  }

  const handleDeleteQuizSubcategory = async (categoryId, subcategoryName) => {
    const category = quizCategories.find((item) => item.id === categoryId)
    if (!category) {
      return
    }

    const nextCategories = quizCategories.map((item) =>
      item.id === categoryId
        ? {
            ...item,
            subcategories: item.subcategories.filter((subcat) => subcat !== subcategoryName),
          }
        : item,
    )

    setQuizCategories(nextCategories)

    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'quizzes'),
          where('category', '==', category.name),
          where('subcategory', '==', subcategoryName),
        ),
      )
      const batch = writeBatch(db)

      snapshot.docs.forEach((quizDoc) => {
        batch.update(quizDoc.ref, { subcategory: 'General' })
      })

      await batch.commit()
      await loadAdminQuizzes()
    } catch (error) {
      setAdminQuizError(error?.message || 'Failed to reset quiz subcategory in Firestore.')
    }
  }

  const handleDeleteResource = (resourceId) => {
    setUploadedResources((prev) => prev.filter((item) => item.id !== resourceId))
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

    localStorage.setItem(
      userStorageKey,
      JSON.stringify({
        ...currentUser,
        preferences: normalizedPreferences,
      }),
    )

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
        isAdmin={isAdmin}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
        onNavClick={handleNavClick}
      />

      <main>
        <Routes>
          <Route path="/" element={<Home onOpenAdminAuth={openAdminAuth} />} />
          <Route
            path="/courses"
            element={
              <Courses
                resources={uploadedResources}
                courseCategories={courseCategories}
                userPreferences={currentUser?.preferences}
                resourceProgress={
                  currentUser?.username ? courseProgressByUsername[currentUser.username] ?? {} : {}
                }
                onResourceView={handleMarkCourseViewed}
                onResourceDownload={handleMarkCourseDownloaded}
              />
            }
          />
          <Route
            path="/admin"
            element={
              isSessionRestored ? (
                <ProtectedRoute isAllowed={isAdmin} redirectPath="/">
                  <Admin
                    courseCategories={courseCategories}
                    quizCategories={quizCategories}
                    adminQuizzes={adminQuizzes}
                    adminQuizLoading={adminQuizLoading}
                    adminQuizError={adminQuizError}
                    adminUsers={adminUsers}
                    adminUsersLoading={adminUsersLoading}
                    adminUsersError={adminUsersError}
                    resources={uploadedResources}
                    onAddCourseCategory={handleAddCourseCategory}
                    onRenameCourseCategory={handleRenameCourseCategory}
                    onDeleteCourseCategory={handleDeleteCourseCategory}
                    onAddCourseSubcategory={handleAddCourseSubcategory}
                    onDeleteCourseSubcategory={handleDeleteCourseSubcategory}
                    onAddQuizCategory={handleAddQuizCategory}
                    onRenameQuizCategory={handleRenameQuizCategory}
                    onDeleteQuizCategory={handleDeleteQuizCategory}
                    onAddQuizSubcategory={handleAddQuizSubcategory}
                    onDeleteQuizSubcategory={handleDeleteQuizSubcategory}
                    onAddAdminQuestion={handleAddAdminQuestion}
                    onDeleteAdminQuestion={handleDeleteAdminQuestion}
                    onLoadAdminQuizzes={loadAdminQuizzes}
                    onLoadAdminUsers={loadAdminUsers}
                    onDeleteRegisteredUser={handleDeleteRegisteredUser}
                    onUploadResource={handleUploadResource}
                    onDeleteResource={handleDeleteResource}
                    onAdminLogout={handleAdminLogout}
                  />
                </ProtectedRoute>
              ) : null
            }
          />
          <Route
            path="/quiz"
            element={
              <QuizPage
                user={currentUser}
                quizCategories={quizCategories}
                adminQuizzes={adminQuizzes}
                  adminQuizLoading={adminQuizLoading}
                  adminQuizError={adminQuizError}
                userQuizzes={userQuizzes}
                quizSessionState={quizSessionState}
                  onLoadAdminQuizzes={loadAdminQuizzes}
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
                isAllowed={Boolean(currentUser) || isAdmin}
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
                  typingStats={
                    currentUser
                      ? typingStatsByUsername[currentUser.username] ?? defaultTypingStats()
                      : defaultTypingStats()
                  }
                  courseProgress={
                    currentUser?.username ? courseProgressByUsername[currentUser.username] ?? {} : {}
                  }
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

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        error={adminAuthError}
        onClose={closeAdminAuth}
        onSubmit={handleAdminAuth}
      />

      <PreferencesModal
        key={`${currentUser?.username ?? 'guest'}-${isPreferencesOpen ? 'open' : 'closed'}`}
        isOpen={isPreferencesOpen}
        user={currentUser}
        courseCategories={courseCategories}
        onClose={() => setIsPreferencesOpen(false)}
        onSave={handleSavePreferences}
      />
    </div>
  )
}

export default App
