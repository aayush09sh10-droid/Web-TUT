const fs = require('fs')

async function removeFiles(paths) {
  await Promise.all(
    paths.filter(Boolean).map((filePath) => fs.promises.unlink(filePath).catch(() => {}))
  )
}

module.exports = {
  removeFiles,
}
