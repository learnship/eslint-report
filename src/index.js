const LintReportService = require('./lintReportService');
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);
    const context = github.context;
    const prNumber = context.payload.pull_request.number;

    const lintReportService = new LintReportService(octokit, context);
    await lintReportService.handleLintReport(prNumber);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
