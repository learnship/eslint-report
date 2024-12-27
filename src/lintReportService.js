const LintReport = require('./lintReport');
const path = require('path');

class LintReportService {
  constructor(octokit, context) {
    this.lintReport = new LintReport(octokit, context);
  }

  async handleLintReport(prNumber) {
    await this.lintReport.deleteExistingLintComments(prNumber);

    const lintResults = this.lintReport.generateLintReport();
    const changedFiles = this.lintReport.getChangedFiles();

    if (changedFiles.length === 0) {
      console.log('No changed TypeScript files.');
      return;
    }

    const modifiedLines = this.getModifiedLines(changedFiles);
    const newIssues = this.getNewIssues(lintResults, modifiedLines);

    const scoutFixableErrors = newIssues.filter(
      (issue) => issue.severity === 2
    ).length;
    const scoutFixableWarnings = newIssues.filter(
      (issue) => issue.severity === 1
    ).length;

    const reportBody = this.lintReport.generateReportBody(
      newIssues,
      this.lintReport.context,
      scoutFixableErrors,
      scoutFixableWarnings
    );

    await this.lintReport.postLintReport(prNumber, reportBody);
  }

  getModifiedLines(changedFiles) {
    const modifiedLines = {};
    for (const file of changedFiles) {
      modifiedLines[file] = this.lintReport.getModifiedLines(file);
    }
    return modifiedLines;
  }

  getNewIssues(lintResults, modifiedLines) {
    const newIssues = [];
    lintResults.forEach((result) => {
      const filePath = path.relative(process.cwd(), result.filePath);
      const fileModifiedLines = modifiedLines[filePath];

      if (!fileModifiedLines) {
        return;
      }

      result.messages.forEach((message) => {
        if (fileModifiedLines.includes(message.line)) {
          newIssues.push({
            ruleId: message.ruleId || 'unknown',
            filePath,
            line: message.line,
            column: message.column || 0,
            message: message.message || '',
            severity: message.severity,
          });
        }
      });
    });
    return newIssues;
  }
}

module.exports = LintReportService;
