async function mapWithConcurrency(items, concurrency, mapper) {
  const safeItems = Array.isArray(items) ? items : []
  const safeConcurrency = Math.max(1, Number(concurrency) || 1)

  if (!safeItems.length) {
    return []
  }

  const results = new Array(safeItems.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < safeItems.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(safeItems[currentIndex], currentIndex)
    }
  }

  const workerCount = Math.min(safeConcurrency, safeItems.length)
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))

  return results
}

module.exports = {
  mapWithConcurrency,
}
