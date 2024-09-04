# WarpSnapshot GitHub Action

<img src="images/logo.svg" alt="WarpSnapshot Logo" width="100"/>

WarpSnapshot enables you to capture snapshots of your runner VMs at any point in
your workflow, allowing you to reuse them for faster consecutive runs.

## Prerequisites

- Supported Platforms: WarpBuild Linux x64 and arm runners.
- Unsupported Platforms: Container image based runners and Mac runners are not
  supported.

## Usage

To incorporate WarpSnapshot into your workflow, add the following step to your
.github/workflows/{workflow_name}.yml file, ideally at the end of the job:

```yaml
jobs:
  build:
    runs-on: warp-ubuntu-latest-x64-2x;wb.snapshot.key=unique-snapshot-alias
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
      # Rest of your build steps
      - name: Create snapshot
        uses: WarpBuild/WarpSnapshot@v1
        with:
          alias: 'unique-snapshot-alias'
          fail-on-error: true
          wait-timeout-minutes: 60
```

Invoking the action creates the snapshot of the runner. To use the snapshot in
subsequent runs, specify the snapshot alias in the `runs-on` field of the job as
shown above.

### Inputs

- **alias** (Required): A unique alias for the snapshot. This helps identify and
  manage your snapshots effectively.

- **fail-on-error** (Optional): If set to `true`, the action will fail if any
  error occurs during the snapshot process. Default is `true`.

- **wait-timeout-minutes** (Optional): The maximum time (in minutes) to wait for
  the snapshot to be created. Default is `30` minutes.

### Conditional snapshot usage

You can conditionally utilize snapshot runners by configuring the `runs-on`
field in your workflow:

```yaml
jobs:
  build:
    runs-on:
      ${{ contains(github.event.head_commit.message, '[warp-no-snapshot]') &&
      'warp-ubuntu-latest-x64-2x' ||
      'warp-ubuntu-latest-x64-2x;wb.snapshot.key=unique-snapshot-alias' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        # Add your build and test steps here
      - name: Create snapshot
        uses: WarpBuild/WarpSnapshot@v1
        with:
          alias: 'unique-snapshot-alias'
```

The example above checks if the commit message contains `[warp-no-snapshot]`. If
it does, the job runs on a standard runner. Otherwise, it runs on a snapshot
runner with the specified alias.

### Complex conditionals

For more advanced scenarios, you can determine whether to use a standard or
snapshot runner based on branch protection or other conditions:

```yaml
jobs:
  determine-runner:
    runs-on: ubuntu-latest
    outputs:
      runner: ${{ steps.set-runner.outputs.runner }}
    steps:
      - name: Determine Branch Protection
        id: branch-protection
        run: |
          branch=$(echo "${{ github.ref }}" | sed 's|refs/heads/||')
          echo "Branch: $branch"
          response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/${{ github.repository }}/branches/$branch/protection")
          if [ $response -eq 200 ]; then
            echo "Branch is protected"
            echo "runner=warp-ubuntu-latest-x64-2x" >> $GITHUB_OUTPUT
          else
            echo "Branch is not protected"
            echo "runner=warp-ubuntu-latest-x64-8x" >> $GITHUB_OUTPUT
          fi
  build:
    needs: determine-runner
    runs-on: ${{ needs.determine-runner.outputs.runner }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        # Add your build and test steps here
      - name: Create snapshot
        uses: WarpBuild/WarpSnapshot@v1
        with:
          alias: 'unique-snapshot-alias'
```

### Cleanup script

It’s strongly recommended to add a cleanup step to remove credentials and
sensitive information before creating a snapshot. This can be achieved by adding
a cleanup script before the snapshot step:

```yaml
jobs:
  build:
    runs-on: warp-ubuntu-latest-x64-2x;wb.snapshot.key=unique-snapshot-alias
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        # Add your build and test steps here
      - name: Cleanup VM
        run: |
          rm -rf $HOME/.ssh
          rm -rf $HOME/.aws
      - name: Create snapshot
        uses: WarpBuild/WarpSnapshot@v1
        with:
          alias: 'unique-snapshot-alias'
          fail-on-error: true
          wait-timeout-minutes: 60
```

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

## Benchmarks

## Additional Resources

### BYOC (Bring Your Own Cloud)

Visit [WarpBuild Docs](https://docs.warpbuild.com/snapshot-runners/byoc) to
learn more about how you can use your BYOC runners with WarpSnapshot.

## Author

This action was created by [WarpBuild](https://warpbuild.com).

## License

This project is licensed under the [MIT License](LICENSE).
