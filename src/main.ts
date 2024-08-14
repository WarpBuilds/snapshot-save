import * as core from '@actions/core'
import { Snapshotter, Log } from './snapshotter'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  let failOnError: boolean
  failOnError = core.getBooleanInput('fail-on-error')
  if (failOnError === undefined) {
    failOnError = true
  }

  try {
    const warpbuildBaseURL: string = core.getInput('warpbuild-base-url')

    const runnerImageAlias: string = core.getInput('alias')
    if (runnerImageAlias === '') {
      throw new Error('alias is not set')
    }

    let waitTimeoutMinutes: number = parseInt(
      core.getInput('wait-timeout-minutes')
    )
    if (waitTimeoutMinutes === 0) {
      waitTimeoutMinutes = 30
    }

    const warpbuildToken: string =
      process.env.WARPBUILD_RUNNER_VERIFICATION_TOKEN || ''
    if (warpbuildToken === '') {
      throw new Error('WARPBUILD_RUNNER_VERIFICATION_TOKEN is not set')
    }

    const logger = new Log()
    const snapshotter = new Snapshotter({
      log: logger,
      warpbuildBaseURL,
      warpbuildToken
    })

    await snapshotter.saveSnapshot({
      runnerImageAlias,
      waitTimeoutMinutes
    })
  } catch (error) {
    if (failOnError) {
      // Fail the workflow run if an error occurs
      throw error
      // if (error instanceof Error) core.setFailed(error.message)
    } else {
      // Log the error message
      if (error instanceof Error) {
        core.setFailed(error.message)
      } else {
        throw error
      }
      // if (error instanceof Error) core.warning(error.message)
    }
  }
}
