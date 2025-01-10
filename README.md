# ESLint Report Action

> **Note:** This repository is currently a work in progress and is not functional. Please do not use it yet.

This GitHub Action runs ESLint on your codebase and posts the results as a comment on the pull request.


## Features

- Automatically runs ESLint on your codebase.
- Posts a detailed lint report as a comment on the pull request.
- Deletes previous lint comments to keep the conversation clean.

## Usage

To use this action, create a workflow file (e.g., `.github/workflows/lint.yml`) in your repository with the following content:

```yaml
name: Lint

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run ESLint and Comment on PR
        uses: learnship/eslint-report@v1.0.5
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```