const MAX_TREE_DEPTH = 4
const MIN_SAMPLES_TO_SPLIT = 2

const toFiniteNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0)

const giniImpurity = (rows) => {
  if (rows.length === 0) {
    return 0
  }

  const positiveCount = rows.filter((row) => row.label).length
  const probability = positiveCount / rows.length
  return 1 - probability * probability - (1 - probability) * (1 - probability)
}

const majorityLabel = (rows) => {
  const positiveCount = rows.filter((row) => row.label).length
  return positiveCount >= rows.length - positiveCount
}

const getCandidateSplits = (rows, feature) => {
  const values = [...new Set(rows.map((row) => row.features[feature]))]

  if (values.length < 2) {
    return []
  }

  if (values.every((value) => typeof value === 'number')) {
    return values
      .sort((a, b) => a - b)
      .slice(0, -1)
      .map((value, index, sortedValues) => ({
        type: 'numeric',
        value: (value + sortedValues[index + 1]) / 2,
      }))
  }

  return values.map((value) => ({ type: 'categorical', value }))
}

const splitRows = (rows, feature, split) => {
  if (split.type === 'numeric') {
    return [
      rows.filter((row) => row.features[feature] <= split.value),
      rows.filter((row) => row.features[feature] > split.value),
    ]
  }

  return [
    rows.filter((row) => row.features[feature] === split.value),
    rows.filter((row) => row.features[feature] !== split.value),
  ]
}

const buildTree = (rows, features, depth) => {
  const label = majorityLabel(rows)

  if (
    rows.length < MIN_SAMPLES_TO_SPLIT ||
    depth >= MAX_TREE_DEPTH ||
    rows.every((row) => row.label === rows[0].label)
  ) {
    return { type: 'leaf', label }
  }

  const parentImpurity = giniImpurity(rows)
  let bestSplit = null
  let bestGain = 0

  features.forEach((feature) => {
    getCandidateSplits(rows, feature).forEach((split) => {
      const [leftRows, rightRows] = splitRows(rows, feature, split)
      if (leftRows.length === 0 || rightRows.length === 0) {
        return
      }

      const weightedImpurity =
        (leftRows.length / rows.length) * giniImpurity(leftRows) +
        (rightRows.length / rows.length) * giniImpurity(rightRows)
      const gain = parentImpurity - weightedImpurity

      if (gain > bestGain) {
        bestGain = gain
        bestSplit = { feature, split, leftRows, rightRows }
      }
    })
  })

  if (!bestSplit) {
    return { type: 'leaf', label }
  }

  return {
    type: 'node',
    feature: bestSplit.feature,
    split: bestSplit.split,
    left: buildTree(bestSplit.leftRows, features, depth + 1),
    right: buildTree(bestSplit.rightRows, features, depth + 1),
  }
}

const predictTree = (node, features) => {
  if (node.type === 'leaf') {
    return node.label
  }

  const featureValue = features[node.feature]
  const goesLeft =
    node.split.type === 'numeric'
      ? featureValue <= node.split.value
      : featureValue === node.split.value

  return predictTree(goesLeft ? node.left : node.right, features)
}

const getResourceFeatures = (resource, context) => {
  const preferredCategories = context.preferences?.categories ?? []
  const preferredSubcategories = context.preferences?.subcategories ?? []
  const averageRating = toFiniteNumber(context.averageRatings?.[resource.id])
  const userRating = toFiniteNumber(context.userRatings?.[resource.id])
  const progress = context.progress?.[resource.id] ?? {}

  return {
    category: resource.category ?? 'Uncategorized',
    subcategory: resource.subcategory ?? 'General',
    categoryPreferred: preferredCategories.includes(resource.category),
    subcategoryPreferred: preferredSubcategories.includes(resource.subcategory),
    averageRating,
    userRating,
    viewed: Boolean(progress.viewed),
    downloaded: Boolean(progress.downloaded),
  }
}

export const trainRecommendationTree = (resources, context = {}) => {
  const rows = resources.map((resource) => {
    const features = getResourceFeatures(resource, context)
    return {
      features,
      label:
        features.categoryPreferred ||
        features.subcategoryPreferred ||
        features.averageRating >= 4 ||
        features.userRating >= 4,
    }
  })

  if (rows.length === 0) {
    return null
  }

  const features = Object.keys(rows[0].features)
  return buildTree(rows, features, 0)
}

export const getRecommendationPredictions = (resources, context = {}) => {
  const tree = trainRecommendationTree(resources, context)

  return resources.reduce((predictions, resource) => {
    const features = getResourceFeatures(resource, context)
    predictions[resource.id] = tree ? predictTree(tree, features) : false
    return predictions
  }, {})
}

const getLearnerProfile = (username, context) => ({
  preferences: context.preferencesByUsername?.[username] ?? { categories: [], subcategories: [] },
  ratings: context.ratingsByUsername?.[username] ?? {},
  progress: context.progressByUsername?.[username] ?? {},
})

const getLearnerVector = (profile, resources) => {
  const vector = []
  const categories = new Set()
  const subcategories = new Set()

  resources.forEach((resource) => {
    categories.add(resource.category ?? 'Uncategorized')
    subcategories.add(resource.subcategory ?? 'General')
  })

  categories.forEach((category) => {
    vector.push(profile.preferences.categories?.includes(category) ? 1 : 0)
  })
  subcategories.forEach((subcategory) => {
    vector.push(profile.preferences.subcategories?.includes(subcategory) ? 1 : 0)
  })

  resources.forEach((resource) => {
    const rating = toFiniteNumber(profile.ratings?.[resource.id])
    const progress = profile.progress?.[resource.id] ?? {}
    vector.push(rating / 5)
    vector.push(progress.viewed ? 0.35 : 0)
    vector.push(progress.downloaded ? 0.5 : 0)
  })

  return vector
}

const cosineSimilarity = (left, right) => {
  let dotProduct = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  left.forEach((value, index) => {
    dotProduct += value * right[index]
    leftMagnitude += value * value
    rightMagnitude += right[index] * right[index]
  })

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude)
}

const getLearnerSignal = (profile, resource) => {
  const rating = toFiniteNumber(profile.ratings?.[resource.id])
  const progress = profile.progress?.[resource.id] ?? {}
  const categoryMatch = profile.preferences.categories?.includes(resource.category)
  const subcategoryMatch = profile.preferences.subcategories?.includes(resource.subcategory)

  return Math.min(
    1,
    rating / 5 +
      (progress.viewed ? 0.35 : 0) +
      (progress.downloaded ? 0.5 : 0) +
      (categoryMatch ? 0.2 : 0) +
      (subcategoryMatch ? 0.2 : 0),
  )
}

export const getKnnRecommendationScores = (resources, context = {}) => {
  const usernames = [
    ...new Set([
      ...Object.keys(context.preferencesByUsername ?? {}),
      ...Object.keys(context.ratingsByUsername ?? {}),
      ...Object.keys(context.progressByUsername ?? {}),
    ]),
  ].filter((username) => username !== context.currentUsername)

  if (!context.currentUsername || usernames.length === 0 || resources.length === 0) {
    return {}
  }

  const currentProfile = getLearnerProfile(context.currentUsername, context)
  const currentVector = getLearnerVector(currentProfile, resources)
  const neighbors = usernames
    .map((username) => {
      const profile = getLearnerProfile(username, context)
      return {
        profile,
        similarity: cosineSimilarity(currentVector, getLearnerVector(profile, resources)),
      }
    })
    .filter((neighbor) => neighbor.similarity > 0)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, context.k ?? 3)

  if (neighbors.length === 0) {
    return {}
  }

  return resources.reduce((scores, resource) => {
    const weightedSignal = neighbors.reduce(
      (sum, neighbor) => sum + neighbor.similarity * getLearnerSignal(neighbor.profile, resource),
      0,
    )
    const similarityTotal = neighbors.reduce((sum, neighbor) => sum + neighbor.similarity, 0)
    scores[resource.id] = similarityTotal > 0 ? weightedSignal / similarityTotal : 0
    return scores
  }, {})
}
