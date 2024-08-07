import { AWSClient } from "./aws-client";
import { Logger } from "./logger";
import { Warpbuild, WarpbuildOptions } from "./warpbuild-client";

export type SnapshotterOptions = {
  warpbuildToken: string;
  warpbuildBaseURL: string;
  log: Logger;
}

export type saveSnapshotOptions = {
  runnerImageAlias: string;
  waitTimeoutMinutes: number;
}

export class Snapshotter {
  private snapshotterOptions: SnapshotterOptions;
  private logger: Logger;

  constructor(private readonly so: SnapshotterOptions) {
    this.snapshotterOptions = this.so;
    this.logger = this.so.log;
  }

  public async saveSnapshot(opts: saveSnapshotOptions): Promise<void> {
    let awsClient = new AWSClient();
    let volumes = await awsClient.getAttachedVolumes();
    if (volumes.length > 1) {
      throw new Error("Multiple volumes found. Only single volume is supported for snapshotting.");
    }
    let volumeId = volumes[0].VolumeId;

    let wo: WarpbuildOptions = {
      token: this.snapshotterOptions.warpbuildToken,
      logger: this.logger,
      baseURL: this.snapshotterOptions.warpbuildBaseURL,
    };

    let warpbuildClient = new Warpbuild(wo);

    this.logger.info("Checking if snapshot alias '" + opts.runnerImageAlias + "' exists");

    let images = await warpbuildClient.v1RunnerImagesAPI.listRunnerImages({
      alias: opts.runnerImageAlias
    });
    let runnerImageID: string;
    if (images.data.runner_images?.length || 0 > 0) {
      this.logger.info("Snapshot alias '" + opts.runnerImageAlias + "' already exists");
      this.logger.info("Updating existing snapshot alias '" + opts.runnerImageAlias + "' to new snapshot");
      runnerImageID = images.data.runner_images?.[0].id || "";


      await warpbuildClient.v1RunnerImagesAPI.updateRunnerImage({
        id: runnerImageID,
        body: {
          warpbuild_snapshot_image: {
            volume_id: volumeId,
            snapshot_id: "",
          }
        }
      });

    } else {
      this.logger.info("Creating new snapshot alias '" + opts.runnerImageAlias + "'");
      let createRunnerImageResponse = await warpbuildClient.v1RunnerImagesAPI.createRunnerImage({
        body: {
          alias: opts.runnerImageAlias,
          warpbuild_snapshot_image: {
            volume_id: volumeId,
            snapshot_id: "",
          }
        }
      });

      runnerImageID = createRunnerImageResponse.data.id;
    }

    this.logger.info("Waiting for snapshot to be created");

    this.logger.info("Waiting for 10 seconds before checking snapshot status");
    await new Promise(resolve => setTimeout(resolve, 10000));

    let retryCount = 0;
    let maxRetryCount = 10;
    let waitInterval = 5000;
    let waitTimeout = 1000 * 60 * opts.waitTimeoutMinutes;
    let startTime = new Date().getTime();
    while (Date.now() - startTime < waitTimeout) {
      // fetch all the runner image version for this runner image
      let runnerImageVersions = await warpbuildClient.v1RunnerImagesVersionsAPI.
        listRunnerImageVersions({
          runnerImageId: runnerImageID
        });
      let latestRunnerImageVersion = runnerImageVersions.data.runner_image_versions?.[0];

      if (!latestRunnerImageVersion) {
        if (retryCount < maxRetryCount) {
          this.logger.info("No runner image version found for runner image " + runnerImageID);
          this.logger.info("Waiting for time duration " + waitInterval + "ms");
          await new Promise(resolve => setTimeout(resolve, waitInterval));
        } else {
          throw new Error("No runner image version found for runner image " + runnerImageID);
        }
      }

      if (latestRunnerImageVersion?.status === "available") {
        this.logger.info("Snapshot created");
        break;
      }

      if (latestRunnerImageVersion?.status === "failed") {
        throw new Error("Snapshot creation failed");
      }

      if (latestRunnerImageVersion?.status === "pending") {
        this.logger.info("Snapshot creation pending");
        this.logger.info("Waiting for time duration " + waitInterval + "ms");
        await new Promise(resolve => setTimeout(resolve, waitInterval));
      }

    }

  }

}
