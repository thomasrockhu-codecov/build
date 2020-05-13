require('../utils/polyfills')

// This needs to be done before `chalk` is loaded.
// Note: `chalk` is also required by some of our dependencies.
// eslint-disable-next-line import/order
const { setColorLevel } = require('../log/colors')
setColorLevel()

require('../error/process')

const { getChildEnv } = require('../env/main')
const { removeErrorColors } = require('../error/colors')
const { reportBuildError } = require('../error/monitor/report')
const { startErrorMonitor } = require('../error/monitor/start')
const { installLocalPluginsDependencies } = require('../install/local')
const { logBuildStart, logBuildError, logBuildSuccess } = require('../log/main')
const { logOldCliVersionError } = require('../log/old_version')
const { startTimer, endTimer } = require('../log/timer')
const { startUtils } = require('../plugins/child/utils')
const { loadPlugins } = require('../plugins/load')
const { getPluginsOptions } = require('../plugins/options')
const { startPlugins, stopPlugins } = require('../plugins/spawn')
const { trackBuildComplete } = require('../telemetry/complete')

const { getCommands, runCommands } = require('./commands')
const { normalizeFlags, loadConfig } = require('./config')
const { doDryRun } = require('./dry')
const { reportStatuses } = require('./status')

/**
 * Netlify Build
 * @param  {object} flags - build configuration CLI flags
 * @param  {string} [flags.config] - Netlify config file path
 * @param  {string} [flags.cwd] - Current directory
 * @param  {string} [flags.token] - Netlify API token for authentication
 * @param  {string} [flags.siteId] - Netlify Site ID
 * @param  {string} [flags.context] - Build context
 * @param  {boolean} [flags.dry] - printing commands without executing them
 */
const build = async function(flags) {
  const buildTimer = startTimer()

  logBuildStart()

  const flagsA = normalizeFlags(flags)
  const errorMonitor = startErrorMonitor(flagsA)

  try {
    const {
      netlifyConfig,
      configPath,
      buildDir,
      nodePath,
      token,
      api,
      dry,
      siteInfo,
      constants,
      context,
      branch,
      mode,
    } = await loadConfig(flagsA)

    try {
      const pluginsOptions = await getPluginsOptions({ netlifyConfig, buildDir, constants, mode })
      await installLocalPluginsDependencies({ pluginsOptions, buildDir, mode })

      const { commandsCount, error, statuses } = await buildRun({
        pluginsOptions,
        netlifyConfig,
        configPath,
        buildDir,
        nodePath,
        token,
        dry,
        siteInfo,
        constants,
        context,
        branch,
        mode,
        errorMonitor,
        api,
      })

      if (dry) {
        return true
      }

      await reportStatuses(statuses)

      if (error !== undefined) {
        throw error
      }

      logBuildSuccess()
      const duration = endTimer(buildTimer, 'Netlify Build')
      await trackBuildComplete({ commandsCount, netlifyConfig, duration, siteInfo, mode })
      return true
    } catch (error) {
      await logOldCliVersionError(mode)
      throw error
    }
  } catch (error) {
    removeErrorColors(error)
    await reportBuildError(error, errorMonitor)
    logBuildError(error)
    return false
  }
}

const buildRun = async function({
  pluginsOptions,
  netlifyConfig,
  configPath,
  buildDir,
  nodePath,
  token,
  dry,
  siteInfo,
  constants,
  context,
  branch,
  mode,
  errorMonitor,
  api,
}) {
  const utilsData = await startUtils(buildDir)
  const childEnv = await getChildEnv({ netlifyConfig, buildDir, context, branch, siteInfo, mode })
  const childProcesses = await startPlugins({ pluginsOptions, buildDir, nodePath, childEnv })

  try {
    return await executeCommands({
      pluginsOptions,
      childProcesses,
      netlifyConfig,
      utilsData,
      configPath,
      buildDir,
      nodePath,
      childEnv,
      token,
      dry,
      constants,
      errorMonitor,
      api,
    })
  } finally {
    await stopPlugins(childProcesses)
  }
}

const executeCommands = async function({
  pluginsOptions,
  childProcesses,
  netlifyConfig,
  utilsData,
  configPath,
  buildDir,
  nodePath,
  childEnv,
  token,
  dry,
  constants,
  errorMonitor,
  api,
}) {
  const pluginsCommands = await loadPlugins({
    pluginsOptions,
    childProcesses,
    netlifyConfig,
    utilsData,
    token,
    constants,
  })

  const { commands, commandsCount } = getCommands(pluginsCommands, netlifyConfig)

  if (dry) {
    doDryRun({ commands, commandsCount, configPath })
    return {}
  }

  return runCommands({
    commands,
    configPath,
    buildDir,
    nodePath,
    childEnv,
    errorMonitor,
    api,
  })
}

module.exports = build
