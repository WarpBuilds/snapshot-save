import { arch, platform } from 'os'
import { Logger } from './logger'
import { Warpbuild, WarpbuildOptions } from './warpbuild-client'

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
    if (platform() === 'darwin') {
      return 'mac'
    }
    return ''
  }

  async saveSnapshot(opts: saveSnapshotOptions): Promise<void> {
    const wo: WarpbuildOptions = {
      token: this.snapshotterOptions.warpbuildToken,
      logger: this.logger,
      baseURL: this.snapshotterOptions.warpbuildBaseURL
    }

    const warpbuildClient = new Warpbuild(wo)

    this.logger.info(
      `Checking if snapshot alias '${opts.runnerImageAlias}' exists`
    )

    const currOs = this.getOS()
    const currArch = this.getArch()
    this.logger.info(`OS: ${currOs}`)
    this.logger.info(`Arch: ${currArch}`)

    const requestOptions = {
      headers: {
        Authorization: `Bearer ${this.snapshotterOptions.warpbuildToken}`
      }
    }
    const images = await warpbuildClient.v1RunnerImagesAPI.listRunnerImages(
      {
        alias: opts.runnerImageAlias,
        exclude_warpbuild_managed: true
      },
      requestOptions
    )
    let runnerImageID: string
    this.logger.debug('Found the following runner images:')
    this.logger.debug(JSON.stringify(images, null, 2))
    if (images.runner_images?.length || 0 > 0) {
      this.logger.info(
        `Snapshot alias '${opts.runnerImageAlias}' already exists`
      )
      this.logger.info(
        `Updating existing snapshot alias '${
          opts.runnerImageAlias
        }' to new snapshot`
      )
      runnerImageID = images.runner_images?.[0].id || ''

      await warpbuildClient.v1RunnerImagesAPI.updateRunnerImage(
        {
          id: runnerImageID,
          body: {
            warpbuild_snapshot_image: {
              snapshot_id: ''
            }
          }
        },
        requestOptions
      )
    } else {
      this.logger.info(`Creating new snapshot alias '${opts.runnerImageAlias}'`)
      const createRunnerImageResponse =
        await warpbuildClient.v1RunnerImagesAPI.createRunnerImage(
          {
            body: {
              type: 'warpbuild_snapshot_image',
              alias: opts.runnerImageAlias,
              arch: currArch,
              os: currOs,
              warpbuild_snapshot_image: {
                snapshot_id: ''
              }
            }
          },
          requestOptions
        )

      runnerImageID = createRunnerImageResponse.id
    }

    this.logger.info('Waiting for snapshot to be created')

    this.logger.info('Waiting for 10 seconds before checking snapshot status')
    await new Promise(resolve => setTimeout(resolve, 10000))

    const retryCount = 0
    const maxRetryCount = 10
    const waitInterval = 5000
    const waitTimeout = 1000 * 60 * opts.waitTimeoutMinutes
    const startTime = new Date().getTime()
    while (Date.now() - startTime < waitTimeout) {
      this.logger.debug(`Fetching runner image versions for ${runnerImageID}`)
      // fetch all the runner image version for this runner image
      const runnerImageVersions =
        await warpbuildClient.v1RunnerImagesVersionsAPI.listRunnerImageVersions(
          {
            runner_image_id: runnerImageID
          },
          requestOptions
        )
      const latestRunnerImageVersion =
        runnerImageVersions.runner_image_versions?.[0]

      if (!latestRunnerImageVersion) {
        if (retryCount < maxRetryCount) {
          this.logger.info(
            `No runner image version found for runner image ${runnerImageID}`
          )
          this.logger.info(`Waiting for time duration ${waitInterval}ms`)
          await new Promise(resolve => setTimeout(resolve, waitInterval))
        } else {
          throw new Error(
            `No runner image version found for runner image ${runnerImageID}`
          )
        }
      }

      if (latestRunnerImageVersion?.status === 'available') {
        this.logger.info('Snapshot created')
        break
      }

      if (latestRunnerImageVersion?.status === 'failed') {
        throw new Error('Snapshot creation failed')
      }

      if (latestRunnerImageVersion?.status === 'pending') {
        this.logger.info('Snapshot creation pending')
        this.logger.info(`Waiting for time duration ${waitInterval}ms`)
        await new Promise(resolve => setTimeout(resolve, waitInterval))
      }
    }
  }
}
