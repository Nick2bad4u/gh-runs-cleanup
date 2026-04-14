# gh-runs-cleanup

`gh-runs-cleanup` is a GitHub CLI extension for safely cleaning up GitHub Actions workflow runs in bulk.

It is designed for repos that accumulate thousands of failed/cancelled runs and need controlled cleanup with clear filters and safety checks.

## Install

```bash
gh extension install Nick2bad4u/gh-runs-cleanup
```

## Usage

```bash
gh runs-cleanup --repo owner/repo --dry-run
gh runs-cleanup --repo owner/repo --status failure,cancelled --confirm
gh runs-cleanup --repo owner/repo --workflow CI --branch main --max-delete 100 --confirm
```

## Required argument

- `--repo <owner/name>`: target repository.

## Filters

- `--status <value[,value...]>` (repeatable; default `failure,cancelled`)
- `--workflow <name|id>`
- `--branch <name>`
- `--event <event>`
- `--user <login>`
- `--commit <sha>`
- `--created <date>`
- `--limit <n>` (default `200`)
- `--max-delete <n>`

## Execution flags

- `--dry-run`: preview matches without deleting
- `--confirm`: required to actually delete
- `--verbose`: print matched run details
- `--help`

## Exit codes

- `0`: success
- `1`: validation/auth/runtime error
- `2`: partial failure (some run deletions failed)

## Development

```bash
npm install
npm run lint
npm test
```
