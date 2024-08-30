# WarpSnapshot GitHub Action

<img src="images/logo.svg" alt="WarpSnapshot Logo" width="100"/>

WarpSnapshot allows you to take snapshots of your runner VMs at any point in the
workflow, enabling you to re-use them for faster consecutive workflow runs.

## Prerequisites

- This action is only supported on [WarpBuild](https://warpbuild.com) Linux
  runners.
- Container based runner images are not supported.
- Mac runners are not supported.

## Usage

To use the WarpSnapshot action in your workflow, add the following step to your
`.github/workflows/{workflow_name}.yml` file, preferably at the end:

```yaml
jobs:
  build:
    runs-on: warp-ubuntu-latest-x64-2x;wb.snapshot.key=unique-snapshot-alias
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        ........
        ........
      - name: Create snapshot
        uses: WarpBuild/WarpSnapshot@v1
        with:
          alias: 'unique-snapshot-alias'
          fail-on-error: true
          wait-timeout-minutes: 60
```

### Inputs

- **alias** (Required): A unique alias for the snapshot. This helps identify and
  manage your snapshots effectively.

- **fail-on-error** (Optional): If set to `true`, the action will fail if any
  error occurs during the snapshot process. Default is `true`.

- **wait-timeout-minutes** (Optional): The maximum time to wait for the snapshot
  to be created. Default is `30` minutes.

### Conditional snapshot usage

`runs-on` field in the workflow file can be used to conditionally use snapshot
runners.

```yaml
jobs:
  build:
    runs-on: ${{ contains(github.event.head_commit.message, '[warp-no-snapshot]') && 'warp-ubuntu-latest-x64-2x' || 'warp-ubuntu-latest-x64-2x;wb.snapshot.key=unique-snapshot-alias' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        ........
        ........
      - name: Create snapshot
        uses: WarpBuild/WarpSnapshot@v1
        with:
          alias: 'unique-snapshot-alias'
```

### Complex conditionals

You can use complex conditionals as well to determine if the runner should be
stock or snapshot.

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
        ........
        ........
      - name: Create snapshot
        uses: WarpBuild/WarpSnapshot@v1
        with:
          alias: 'unique-snapshot-alias'
```

## Security

## Benchmarks

## FAQ

## Author

This action was created by [WarpBuild](https://warpbuild.com).

## License

This project is licensed under the [MIT License](LICENSE).
