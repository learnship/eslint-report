const fs = require('fs');
const { execSync } = require('child_process');

class LintReport {
  constructor(octokit, context) {
    this.octokit = octokit;
    this.context = context;
  }

  async deleteExistingLintComments(prNumber) {
    let page = 1;
    let comments = [];
    let hasMoreComments = true;

    while (hasMoreComments) {
      const { data: currentPageComments } =
        await this.octokit.rest.issues.listComments({
          owner: this.context.repo.owner,
          repo: this.context.repo.repo,
          issue_number: prNumber,
          per_page: 100,
          page,
        });

      comments = comments.concat(currentPageComments);
      hasMoreComments = currentPageComments.length === 100;
      page++;
    }

    for (const comment of comments) {
      if (
        comment.body.includes('🚨 **Lint Report**') &&
        comment.user.login === 'github-actions[bot]'
      ) {
        await this.octokit.rest.issues.deleteComment({
          owner: this.context.repo.owner,
          repo: this.context.repo.repo,
          comment_id: comment.id,
        });
      }
    }
  }

  generateLintReport() {
    execSync('npx eslint . -f json -o lint-report.json');
    return JSON.parse(fs.readFileSync('./lint-report.json', 'utf-8'));
  }

  getChangedFiles() {
    return execSync('git diff --name-only origin/main HEAD')
      .toString()
      .trim()
      .split('\n')
      .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  }

  getModifiedLines(file) {
    const diffOutput = execSync(
      `git diff -U0 origin/main HEAD --ignore-space-at-eol -- ${file}`
    ).toString();
    const addedLines = [
      ...diffOutput.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm),
    ];
    return addedLines.flatMap((match) => {
      const start = parseInt(match[1], 10);
      const count = parseInt(match[2] || '1', 10);
      return Array.from({ length: count }, (_, i) => start + i);
    });
  }

  async postLintReport(prNumber, report) {
    await this.octokit.rest.issues.createComment({
      owner: this.context.repo.owner,
      repo: this.context.repo.repo,
      issue_number: prNumber,
      body: report,
    });
  }

  generateReportBody(
    newIssues,
    context,
    scoutFixableErrors,
    scoutFixableWarnings
  ) {
    let commentBody = '';

    if (newIssues.length > 0) {
      commentBody = `🚨 **Lint Report**:
      - 🛑 **Errors**: ${
        newIssues.filter((issue) => issue.severity === 2).length
      }
      - ⚠️ **Warnings**: ${
        newIssues.filter((issue) => issue.severity === 1).length
      }

      ### New Issues:
      \`\`\`
      ${newIssues
        .map(
          (issue) =>
            `- [${issue.ruleId}] ${issue.filePath}:${issue.line}:${issue.column} - ${issue.message}`
        )
        .join('\n')}
      \`\`\`
      @${context.payload.pull_request.user.login}, please address these issues`;

      if (scoutFixableErrors > 0 || scoutFixableWarnings > 0) {
        commentBody += ` and consider fixing additional ones to leave the code cleaner than you found it.`;
      } else {
        commentBody += `.`;
      }
    } else {
      commentBody = `🚨 **Lint Report**:
      - 🎉 **Great Job!** No new lint issues were introduced in this pull request.`;
      if (scoutFixableErrors > 0 || scoutFixableWarnings > 0) {
        commentBody += ` Consider fixing additional ones to leave the code cleaner than you found it.`;
      }
    }

    if (scoutFixableErrors > 0 || scoutFixableWarnings > 0) {
      commentBody += `\n
      🛠️ **Boy Scout Rule**:
      - The Boy Scout Rule encourages developers to leave the code cleaner than they found it. This means addressing not only the issues introduced in this PR but also improving nearby code when possible.
      - In this case, you could resolve an additional **${scoutFixableErrors} errors** and **${scoutFixableWarnings} warnings** in the modified files to improve overall code quality.
      `;
    }

    return commentBody;
  }
}

module.exports = LintReport;
