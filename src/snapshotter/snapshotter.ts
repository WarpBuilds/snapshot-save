import { arch, platform } from 'os'
import { Logger } from './logger'
import { Warpbuild, WarpbuildOptions } from './warpbuild-client'
import { humanTime } from './human-time'
import { CommonsRunnerImageVersion } from '../warpbuild/src'
import { spawn } from 'child_process'
import * as fs from 'fs'

export type SnapshotterOptions = {
  warpbuildToken: string
  warpbuildBaseURL: string
  log: Logger
}

export type saveSnapshotOptions = {
  runnerImageAlias: string
  waitTimeoutMinutes: number
  skipPresave?: boolean
}

export class Snapshotter {
  private snapshotterOptions: SnapshotterOptions
  private logger: Logger

  constructor(private readonly so: SnapshotterOptions) {
    this.snapshotterOptions = this.so
    this.logger = this.so.log
  }

  getSupportedArch(): string {
    if (arch() === 'arm64') {
      return 'arm64'
    }
    if (arch() === 'x64') {
      return 'x64'
    }
    return ''
  }

  getSupportedOS(): string {
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

    const currOs = this.getSupportedOS()
    const currArch = this.getSupportedArch()
    this.logger.debug(`OS: ${currOs}`)
    this.logger.debug(`Arch: ${currArch}`)

    if (!currOs || !currArch) {
      this.logger.error(
        `Unsupported OS or architecture ${platform()} ${arch()}`
      )
      return
    }

    if (!opts.skipPresave) {
      this.logger.info(`Running presave before snapshot`)
      const pwd = process.cwd()
      this.logger.debug(`Current working directory: ${pwd}`)

      const presaveScript = `
#!/bin/bash

set -e

echo "Saving environment variables to /etc/environment"

printenv | grep -v '^GITHUB_' | grep -v '^WARP_' | grep -v '^ACTIONS_' | grep -v '^INPUT_' | grep -v '^WARPBUILD_' | grep -v '^RUNNER_' | grep -v '^_' | grep -v '^USER$' | grep -v '^INVOCATION_ID$' | grep -v '^SYSTEMD_EXEC_PID$' | grep -v '^SUDO_USER$' | grep -v '^SUDO_GID$' | grep -v '^SUDO_UID$' | grep -v '^SHELL$' | grep -v '^SHLVL$' | grep -v '^XDG_' | grep -v '^JOURNAL_STREAM$' | grep -v '^HOME$' | sort | while IFS= read -r line; do
  [[ $line == *=* ]] || continue        # skip malformed lines (no '=')
  key=$(echo "$line" | cut -d= -f1)
  value=$(echo "$line" | cut -d= -f2-)
  if grep -q "^\${key}=" /etc/environment; then
    sudo sed -i "s|^\${key}=.*|\${key}=\${value}|" /etc/environment
  else
    printf '%s=%q\n' "$key" "$value" | sudo tee -a /etc/environment > /dev/null
  fi
done

# Remove PATH from /runner/.env
sed -i '/^PATH=/d' /runner/.env

# Validation functions
validate_env_file() {
  local file=$1
  [ ! -f "$file" ] && return 0

  # First, validate format strictly - each non-comment line must be KEY=VALUE
  local line_num=0
  local has_invalid=false
  while IFS= read -r line || [ -n "$line" ]; do
    line_num=$((line_num + 1))
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # Must match: non-empty KEY (starts with letter/underscore, followed by alphanumeric/underscore), =, optional VALUE
    if ! [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=[[:space:]]* ]]; then
      if [ "$has_invalid" = false ]; then
        echo ""
        echo "❌ Validation failed for: $file"
        echo "   The file contains lines that do not follow the format: KEY=value"
        echo ""
        echo "   Invalid lines:"
        has_invalid=true
      fi
      printf "   Line %d: %s\n" "$line_num" "$line"
    fi
  done < "$file"

  if [ "$has_invalid" = true ]; then
    echo ""
    return 1
  fi

  # Then verify it can actually be sourced/parsed
  local output
  output=$(env -i bash -c "set -a; source \"$file\"; set +a" 2>&1) || {
    echo ""
    echo "❌ Validation failed for: $file"
    echo "   The file cannot be parsed as an environment file."
    echo ""
    echo "   Error details:"
    echo "$output" | head -5 | sed 's/^/   /'
    echo ""
    return 1
  }
  
  echo "Validation successful for environment file: $file"
}

validate_bashrc_file() {
  local file=$1
  [ ! -f "$file" ] && return 0

  local output
  output=$(bash -n "$file" 2>&1) || {
    echo ""
    echo "❌ Validation failed for: $file"
    echo "   The file contains bash syntax errors and cannot be parsed."
    echo "   Please check the syntax of your bash commands."
    echo ""
    echo "   Error details:"
    echo "$output" | head -5 | sed 's/^/   /'
    echo ""
    return 1
  }
    
  echo "Validation successful for bashrc file: $file"
}

# Validate files
validate_env_file "/etc/environment" || exit 1
validate_env_file "/runner/.env" || exit 1
validate_bashrc_file "$HOME/.bashrc" || exit 1
validate_bashrc_file "/root/.bashrc" || exit 1
validate_bashrc_file "/etc/bash.bashrc" || exit 1
 
# Remove /var/lib/warpbuild-agentd/settings.json
sudo rm /var/lib/warpbuild-agentd/settings.json

# This command forces a write of all buffered I/O data to the disks. 
# Do this at the end
echo "Flushing file system buffers..."
sync
   
# Pause for a few seconds to ensure all I/O operations are complete
# sleep 5

echo "Presave complete"
`

      const presaveScriptFile = 'warp-snp-presave.sh'
      fs.writeFileSync(presaveScriptFile, presaveScript)
      fs.chmodSync(presaveScriptFile, '755')
      this.logger.debug(`Presave script: ${presaveScriptFile}`)

      // Check if the file exists and has the correct permissions
      try {
        fs.accessSync(presaveScriptFile, fs.constants.X_OK)
        this.logger.debug(`${presaveScriptFile} is executable.`)
      } catch (err) {
        this.logger.error(
          `${presaveScriptFile} is not executable or not found: ${err}`
        )
        return
      }

      try {
        // Use spawn instead of exec for better control over output
        const presaveProcess = spawn(`bash`, [`./${presaveScriptFile}`], {
          stdio: 'inherit' // Use 'inherit' to show the output directly
        })

        presaveProcess.on('error', error => {
          this.logger.error(`Failed to start presave script: ${error.message}`)
        })

        presaveProcess.on('exit', code => {
          if (code === 0) {
            this.logger.info('Presave script executed successfully.')
          } else {
            this.logger.error(`Presave script exited with code ${code}`)
            throw new Error(`Presave script failed with exit code ${code}`)
          }
        })

        // Wait for the presave process to finish before proceeding
        await new Promise(resolve => {
          presaveProcess.on('close', resolve)
        })
      } catch (err) {
        this.logger.error(`Error running presave script: ${err}`)
      }
    } else {
      this.logger.info(`Skipping presave step`)
    }

    const warpbuildClient = new Warpbuild(wo)

    this.logger.info(
      `Checking if snapshot alias '${opts.runnerImageAlias}' exists`
    )

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
  }
}
