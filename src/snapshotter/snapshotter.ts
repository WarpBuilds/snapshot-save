import { arch, platform } from 'os'
import { Logger } from './logger'
import { Warpbuild, WarpbuildOptions } from './warpbuild-client'
import { humanTime } from './human-time'
import { CommonsRunnerImageVersion, ResponseError } from '../warpbuild/src'
import { exec } from 'child_process'
import * as fs from 'fs'

export type SnapshotterOptions = {
  warpbuildToken: string
  warpbuildBaseURL: string
  log: Logger
}

export type saveSnapshotOptions = {
  runnerImageAlias: string
  waitTimeoutMinutes: number
}

export class Snapshotter {
  private snapshotterOptions: SnapshotterOptions
  private logger: Logger

  constructor(private readonly so: SnapshotterOptions) {
    this.snapshotterOptions = this.so
    this.logger = this.so.log
  }

  getArch(): string {
    // figure out the arch of the current system
    if (arch() === 'arm64') {
      return 'arm64'
    }
    if (arch() === 'x64') {
      return 'x64'
    }
    return ''
  }

  getOS(): string {
    // get the OS of the current system
    if (platform() === 'linux') {
      return 'ubuntu'
    }
    return ''
  }

  async saveSnapshot(opts: saveSnapshotOptions): Promise<void> {
    const wo: WarpbuildOptions = {
      token: this.snapshotterOptions.warpbuildToken,
      logger: this.logger,
      baseURL: this.snapshotterOptions.warpbuildBaseURL
    }

    const currOs = this.getOS()
    const currArch = this.getArch()
    this.logger.debug(`OS: ${currOs}`)
    this.logger.debug(`Arch: ${currArch}`)

    if (!currOs || !currArch) {
      this.logger.error(
        `Unsupported OS or architecture ${platform()} ${arch()}`
      )
      return
    }

    this.logger.info(`Running cleanup before snapshot`)
    const pwd = process.cwd()
    this.logger.debug(`Current working directory: ${pwd}`)

    const cleanupScript = `
#!/bin/bash

set -e

# Remove /var/lib/warpbuild-agentd/settings.json
sudo rm /var/lib/warpbuild-agentd/settings.json

echo "Cleanup complete"
`

    const cleanupScriptFile = 'warp-snp-cleanup.sh'
    fs.writeFileSync(cleanupScriptFile, cleanupScript)
    fs.chmodSync(cleanupScriptFile, '755')
    this.logger.debug(`Cleanup script: ${cleanupScriptFile}`)

    exec(`bash ./${cleanupScriptFile}`, (error, stdout, stderr) => {
      if (error) {
        this.logger.error(error.message)
        return
      }
      if (stderr) {
        this.logger.error(stderr)
        return
      }
      this.logger.debug(stdout)
    })

    const warpbuildClient = new Warpbuild(wo)

    this.logger.info(
      `Checking if snapshot alias '${opts.runnerImageAlias}' exists`
    )

    try {
      const requestOptions = {
        headers: {
          Authorization: `Bearer ${this.snapshotterOptions.warpbuildToken}`
        }
      }
      const images = await warpbuildClient.v1RunnerImagesAPI.listRunnerImages(
        {
          alias: opts.runnerImageAlias,
          type: ['warpbuild_snapshot_image']
        },
        requestOptions
      )
      let runnerImageID: string
      let versionID = 0
      let nextVersionID = 0
      this.logger.debug('Found the following runner images:')
      this.logger.debug(JSON.stringify(images, null, 2))
      if ((images.runner_images?.length ?? 0) > 0) {
        this.logger.info(
          `Snapshot alias '${opts.runnerImageAlias}' already exists`
        )
        this.logger.info(
          `Updating existing snapshot alias '${
            opts.runnerImageAlias
          }' to new snapshot`
        )
        runnerImageID = images.runner_images?.[0].id || ''
        const existingArch = images.runner_images?.[0].arch
        const existingOs = images.runner_images?.[0].os
        versionID =
          images.runner_images?.[0].warpbuild_snapshot_image?.version_id ?? 0
        nextVersionID = versionID + 1
        if (existingArch !== currArch) {
          throw new Error(
            `Updating existing snapshot alias '${
              opts.runnerImageAlias
            }' to new arch '${currArch}' from '${existingArch}' isn't supported'`
          )
        }
        if (existingOs !== currOs) {
          throw new Error(
            `Updating existing snapshot alias '${
              opts.runnerImageAlias
            }' to new os '${currOs}' from '${existingOs}' isn't supported'`
          )
        }

        await warpbuildClient.v1RunnerImagesAPI.updateRunnerImage(
          {
            id: runnerImageID,
            body: {
              warpbuild_snapshot_image: {
                snapshot_id: '',
                version_id: nextVersionID
              }
            }
          },
          requestOptions
        )
      } else {
        this.logger.info(
          `Creating new snapshot alias '${opts.runnerImageAlias}'`
        )
        const createRunnerImageResponse =
          await warpbuildClient.v1RunnerImagesAPI.createRunnerImage(
            {
              body: {
                type: 'warpbuild_snapshot_image',
                alias: opts.runnerImageAlias,
                arch: currArch,
                os: currOs,
                warpbuild_snapshot_image: {
                  snapshot_id: '',
                  version_id: nextVersionID
                }
              }
            },
            requestOptions
          )

        runnerImageID = createRunnerImageResponse.id
      }

      this.logger.info('Waiting for snapshot to be created')

      this.logger.info('Checking snapshot status')

      const retryCount = 0
      const maxRetryCount = 10
      const waitInterval = 5000
      const humanWaitingTime = humanTime(waitInterval)
      const waitTimeout = 1000 * 60 * opts.waitTimeoutMinutes
      const startTime = new Date().getTime()
      while (true) {
        const elapsedTime = Date.now() - startTime
        const humanElapsedTime = humanTime(elapsedTime)
        this.logger.info(`Elapsed time: ${humanElapsedTime}`)

        if (elapsedTime > waitTimeout) {
          throw new Error('Snapshot creation timed out')
        }

        this.logger.debug(`Fetching runner image versions for ${runnerImageID}`)
        // fetch all the runner image version for this runner image
        const runnerImageVersions =
          await warpbuildClient.v1RunnerImagesVersionsAPI.listRunnerImageVersions(
            {
              runner_image_id: runnerImageID
            },
            requestOptions
          )

        let latestRunnerImageVersion: CommonsRunnerImageVersion | undefined =
          undefined
        for (const runnerImageVersion of runnerImageVersions.runner_image_versions ||
          []) {
          if (runnerImageVersion.version_time_id === nextVersionID) {
            latestRunnerImageVersion = runnerImageVersion
          }
        }

        if (!latestRunnerImageVersion) {
          if (retryCount < maxRetryCount) {
            this.logger.info(
              `No runner image version found for runner image ${runnerImageID}`
            )
            this.logger.info(`Waiting for time duration ${humanWaitingTime}`)
            await new Promise(resolve => setTimeout(resolve, waitInterval))
          } else {
            throw new Error(
              `No runner image version found for runner image ${runnerImageID}`
            )
          }
        }

        this.logger.debug(JSON.stringify(latestRunnerImageVersion, null, 2))

        if (latestRunnerImageVersion?.status === 'available') {
          this.logger.info('Snapshot created')
          break
        }

        if (latestRunnerImageVersion?.status === 'failed') {
          throw new Error('Snapshot creation failed')
        }

        if (latestRunnerImageVersion?.status === 'pending') {
          this.logger.info('Snapshot creation pending')
          this.logger.info(`Waiting for time duration ${humanWaitingTime}`)
          await new Promise(resolve => setTimeout(resolve, waitInterval))
        }
      }
    } catch (error: any) {
      if (error instanceof ResponseError) {
        this.logger.error(
          `Error: ${error.response.status} ${JSON.stringify(error.response)}`
        )
        return Promise.reject(error.message)
      }

      this.logger.info(`Error: ${error}`)
      this.logger.info(`Error Typeof: ${typeof error}`)

      return Promise.reject(error)
    }
  }
}
