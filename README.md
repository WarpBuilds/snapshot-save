# WarpSnapshot GitHub Action

<img src="images/logo.svg" alt="WarpSnapshot Logo" width="100"/>

WarpSnapshot enables you to capture snapshots of your runner VMs at any point in
your workflow, allowing you to reuse them for faster consecutive runs.

Snapshots are temporary and will be deleted after 15 days.

## Prerequisites

- **Supported Platforms:** Snapshot Runners are supported only on WarpBuild's managed (stock) Ubuntu runners.
- **Unsupported Platforms:** BYOC runners, custom cloud runners, container-based runner images, Windows runners, and macOS runners are not supported.

If you include snapshot labels (`snapshot.enabled=true` or `snapshot.key=<alias>`) on an unsupported runner type, the labels will be silently ignored and the job will run normally without snapshot functionality.

## Limitations

- **/tmp** directory will not persist state since this directory is cleaned on reboots.

## Usage

Enable snapshots for your runner by adding `snapshot.enabled=true` or `snapshot.key=<alias>` to the `runs-on` label in your workflow.

- `snapshot.enabled=true` — Enables the snapshot feature on the runner. The runner always boots from the base image. Use `snapshot-save` action to capture a snapshot at the desired point in your workflow.
- `snapshot.key=<alias>` — Enables the snapshot feature and boots from an existing snapshot if one is available for the given alias. If no snapshot exists yet, the runner boots from the base image.

If the runner machine is made from a snapshot, it will have an environment
variable `WARPBUILD_SNAPSHOT_KEY` set to the alias of the snapshot.

### Inputs

- **alias** (Required): A unique alias for the snapshot. This helps identify and
  manage your snapshots effectively.

- **fail-on-error** (Optional): If set to `true`, the action will fail if any
  error occurs during the snapshot process. Default is `true`.

- **wait-timeout-minutes** (Optional): The maximum time (in minutes) to wait for
  the snapshot to be created. Default is `30` minutes.

### Example 1: Clean snapshot creation on main

On `main`, the runner uses `snapshot.enabled=true` to boot from the base image
and creates a fresh snapshot via the `snapshot-save` action. On feature branches,
it uses `snapshot.key` to boot from the existing snapshot for faster runs.

```yaml
jobs:
  build:
    runs-on: >-
      ${{ github.ref == 'refs/heads/main'
        && 'warp-ubuntu-latest-x64-2x;snapshot.enabled=true'
        || 'warp-ubuntu-latest-x64-2x;snapshot.key=my-project-snapshot' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      # Your build and test steps here
      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm test

      # Cleanup and snapshot creation only on main
      - name: Cleanup credentials
        if: github.ref == 'refs/heads/main'
        run: |
          rm -rf $HOME/.ssh $HOME/.aws
          git clean -ffdx

      - name: Save snapshot
        if: github.ref == 'refs/heads/main'
        uses: WarpBuilds/snapshot-save@v1
        with:
          alias: "my-project-snapshot"
          fail-on-error: true
          wait-timeout-minutes: 60
```

### Example 2: Incremental snapshots on feature branches

This workflow creates and updates snapshots on every push, so each run builds on
the previous one. Useful when you want each feature branch run to incrementally
cache build artifacts and dependencies.

```yaml
jobs:
  build:
    runs-on: warp-ubuntu-latest-x64-2x;snapshot.key=my-project-snapshot
    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      # Your build and test steps here
      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm test

      # Cleanup credentials before snapshotting
      - name: Cleanup credentials
        run: |
          rm -rf $HOME/.ssh $HOME/.aws
          git clean -ffdx

      - name: Save snapshot
        uses: WarpBuilds/snapshot-save@v1
        with:
          alias: "my-project-snapshot"
          fail-on-error: true
          wait-timeout-minutes: 60
```

On the first run, no snapshot exists for the alias yet, so the runner boots from
the base image. The `snapshot-save` action creates a snapshot at the end.
Subsequent runs boot from the latest snapshot, incrementally building on the
previous state.

### Cleanup

It's strongly recommended to add a cleanup step to remove credentials and
sensitive information before creating a snapshot.

**Common cleanup commands:**

```bash
rm -rf $HOME/.ssh $HOME/.aws
git clean -ffdx
```

**Remove untracked files and directories:**

It might be useful to remove some secret files that were added during the job,
before making a snapshot.

- _git clean_: removes untracked files from the local git repo.
- _-f (force)_: forces the removal of files and directories.
- _-f (force again)_: if `git config clean.requireForce true` is present, some files
  may not be removed without this flag.
- _-d (directories)_: removes directories not just files.
- _-x (ignore .gitignore)_: removes files and directories that are ignored by git.

## Security

### Public Repositories

When using public repositories, ensure that no sensitive information (such as
cloud credentials) is stored in the snapshot. This is crucial as others may
access the snapshot using the alias in a PR workflow run.

### Private Repositories

WarpBuild currently provisions runners at the organization level, and GitHub may
allocate a runner intended for snapshot jobs to different jobs within the
organization. This could lead to exposure of sensitive information to other
users in the organization. It is recommended to use the cleanup script to remove
sensitive data before creating a snapshot.

## Additional Notes

- Snapshot runners are only supported on WarpBuild's managed (stock) Ubuntu runners. Snapshot labels on any other runner type are silently ignored.
- Boot times for snapshot runners can be slower than the default runners and take 45-60s.

## Author

This action was created by [WarpBuild](https://warpbuild.com).

## License

This project is licensed under the [MIT License](LICENSE).
