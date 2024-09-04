import * as core from '@actions/core'
import { Snapshotter, Log } from './snapshotter'
import { ResponseError } from './warpbuild/src'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const failOnError = core.getBooleanInput('fail-on-error')

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
      process.env.WARPBUILD_RUNNER_VERIFICATION_TOKEN ?? ''
    if (!warpbuildToken) {
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
  } catch (error: unknown) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    if (error instanceof ResponseError) {
      try {
        const data = await error.response.json()
        errorMessage = data['description'] ?? data['message'] ?? errorMessage
      } catch (jsonError: unknown) {
        if (jsonError instanceof Error) {
          errorMessage = `Failed to parse error response: ${jsonError.message}`
        }
      }
    }

    if (failOnError) {
      core.setFailed(errorMessage)
    } else {
      core.warning(errorMessage)
    }
  }
}
