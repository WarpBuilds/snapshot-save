import * as core from '@actions/core'
import { wait } from './wait'
import { AWSClient, Log } from './snapshotter'
import { Snapshotter } from './snapshotter/snapshotter'

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
    if (runnerImageAlias === "") {
      throw new Error("alias is not set")
    }

    let waitTimeoutMinutes: number = parseInt(core.getInput('wait-timeout-minutes'))
    if (waitTimeoutMinutes === 0) {
      waitTimeoutMinutes = 30
    }

    const warpbuildToken: string = process.env.WARPBUILD_RUNNER_VERIFICATION_TOKEN || ""
    if (warpbuildToken === "") {
      throw new Error("WARPBUILD_RUNNER_VERIFICATION_TOKEN is not set")
    }

    let logger = new Log();
    let snapshotter = new Snapshotter({
      log: logger,
      warpbuildBaseURL: warpbuildBaseURL,
      warpbuildToken: warpbuildToken,
    })

    await snapshotter.saveSnapshot({
      runnerImageAlias: runnerImageAlias,
      waitTimeoutMinutes: waitTimeoutMinutes,
    })

  } catch (error) {
    if (failOnError) {
      // Fail the workflow run if an error occurs
      if (error instanceof Error) core.setFailed(error.message)
    } else {
      // Log the error message
      if (error instanceof Error) core.warning(error.message)
    }
  }
}
