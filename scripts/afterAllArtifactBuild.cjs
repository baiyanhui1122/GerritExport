const path = require('node:path')
const { rcedit } = require('rcedit')

exports.default = async function afterAllArtifactBuild(context) {
  if (!Array.isArray(context.artifactPaths)) return []

  const iconPath = path.join(process.cwd(), 'build', 'app-icon.ico')
  const exePaths = context.artifactPaths.filter((artifactPath) => artifactPath.toLowerCase().endsWith('.exe'))

  for (const exePath of exePaths) {
    await rcedit(exePath, {
      icon: iconPath
    })
  }

  return context.artifactPaths
}
