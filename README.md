# ESLint Report Action

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
        uses: learnship/eslint-report@1.0.3
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}