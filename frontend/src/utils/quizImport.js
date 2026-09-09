import * as XLSX from 'xlsx'

const REQUIRED_COLUMNS = ['question', 'A', 'B', 'C', 'D', 'correctAnswer']
const OPTION_KEYS = ['A', 'B', 'C', 'D']

const normalizeHeader = (value) => String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

const headerKey = (value) => {
  const normalized = normalizeHeader(value)

  if (normalized === 'question') {
    return 'question'
  }

  if (normalized === 'correctanswer' || normalized === 'answer' || normalized === 'correct') {
    return 'correctAnswer'
  }

  if (normalized === 'a' || normalized === 'optiona') {
    return 'A'
  }

  if (normalized === 'b' || normalized === 'optionb') {
    return 'B'
  }

  if (normalized === 'c' || normalized === 'optionc') {
    return 'C'
  }

  if (normalized === 'd' || normalized === 'optiond') {
    return 'D'
  }

  return null
}

const asText = (value) => (value === null || value === undefined ? '' : String(value).trim())

const normalizeQuestionText = (value) => asText(value).toLowerCase().replace(/\s+/g, ' ')

export const getQuestionDuplicateKey = (category, subcategory, question) =>
  `${asText(category).toLowerCase()}|${asText(subcategory).toLowerCase()}|${normalizeQuestionText(question)}`

const createInvalidRow = (rowNumber, values, errors) => ({
  rowNumber,
  question: values.question,
  options: {
    A: values.A,
    B: values.B,
    C: values.C,
    D: values.D,
  },
  correctAnswer: values.correctAnswer,
  errors,
  valid: errors.length === 0,
})

const readSheetRows = (worksheet) => XLSX.utils.sheet_to_json(worksheet, {
  header: 1,
  defval: '',
  raw: false,
  blankrows: false,
})

export const getWorksheetNames = async (file) => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', bookSheets: true })
  return workbook.SheetNames
}

export const parseQuizFile = async (file, worksheetName) => {
  if (!file) {
    throw new Error('Please upload a CSV or Excel file.')
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellText: true, cellDates: false })
  const sheetName = worksheetName || workbook.SheetNames[0]

  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new Error('The selected worksheet is empty or unavailable.')
  }

  const rawRows = readSheetRows(workbook.Sheets[sheetName])
  if (!rawRows.length || rawRows.every((row) => row.every((value) => !asText(value)))) {
    throw new Error('The selected worksheet is empty.')
  }

  const headerRow = rawRows[0]
  const columnIndexes = {}
  const duplicateHeaders = []

  headerRow.forEach((value, index) => {
    const key = headerKey(value)
    if (!key) {
      return
    }

    if (Object.prototype.hasOwnProperty.call(columnIndexes, key)) {
      duplicateHeaders.push(String(value).trim() || key)
      return
    }

    columnIndexes[key] = index
  })

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !Object.prototype.hasOwnProperty.call(columnIndexes, column))
  if (missingColumns.length || duplicateHeaders.length) {
    const messages = []
    if (missingColumns.length) {
      messages.push(`Missing required columns: ${missingColumns.join(', ')}`)
    }
    if (duplicateHeaders.length) {
      messages.push(`Duplicate required columns: ${duplicateHeaders.join(', ')}`)
    }
    throw new Error(`${messages.join('. ')}. Expected: question | A | B | C | D | correctAnswer.`)
  }

  const rows = []
  const seenQuestionKeys = new Set()

  rawRows.slice(1).forEach((row, index) => {
    const values = {
      question: asText(row[columnIndexes.question]),
      A: asText(row[columnIndexes.A]),
      B: asText(row[columnIndexes.B]),
      C: asText(row[columnIndexes.C]),
      D: asText(row[columnIndexes.D]),
      correctAnswer: asText(row[columnIndexes.correctAnswer]).toUpperCase(),
    }

    if (Object.values(values).every((value) => !value)) {
      return
    }

    const errors = []
    if (!values.question) errors.push('Missing question')
    OPTION_KEYS.forEach((key) => {
      if (!values[key]) errors.push(`Missing option ${key}`)
    })
    if (!values.correctAnswer) {
      errors.push('Missing correct answer')
    } else if (!OPTION_KEYS.includes(values.correctAnswer)) {
      errors.push('Correct answer must be A, B, C, or D')
    }

    const duplicateKey = normalizeQuestionText(values.question)
    if (duplicateKey && seenQuestionKeys.has(duplicateKey)) {
      errors.push('Duplicate question in this file')
    } else if (duplicateKey) {
      seenQuestionKeys.add(duplicateKey)
    }

    rows.push({
      ...createInvalidRow(index + 2, values, errors),
      duplicateKey,
    })
  })

  if (!rows.length) {
    throw new Error('The selected worksheet does not contain any question rows.')
  }

  return {
    worksheetName: sheetName,
    rows,
    total: rows.length,
    valid: rows.filter((row) => row.valid).length,
    invalid: rows.filter((row) => !row.valid).length,
  }
}

export { OPTION_KEYS }
