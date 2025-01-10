const { execSync } = require('child_process');
const fs = require('fs');
const LintReport = require('./lintReport');

jest.mock('child_process');
jest.mock('fs');

describe('LintReport', () => {
  let octokit;
  let context;
  let lintReport;

  beforeEach(() => {
    octokit = {
      rest: {
        issues: {
          listComments: jest.fn(),
          deleteComment: jest.fn(),
          createComment: jest.fn(),
        },
      },
    };
    context = {
      repo: {
        owner: 'owner',
        repo: 'repo',
      },
      payload: {
        pull_request: {
          user: {
            login: 'user',
          },
        },
      },
    };
    lintReport = new LintReport(octokit, context);
  });

  describe('deleteExistingLintComments', () => {
    it('should delete existing lint comments', async () => {
      octokit.rest.issues.listComments.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            body: '🚨 **Lint Report**',
            user: { login: 'github-actions[bot]' },
          },
        ],
      });

      await lintReport.deleteExistingLintComments(1);

      expect(octokit.rest.issues.listComments).toHaveBeenCalled();
      expect(octokit.rest.issues.deleteComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        comment_id: 1,
      });
    });
  });

  describe('generateLintReport', () => {
    it('should generate lint report', () => {
      const lintReportData = [{ filePath: 'file.js', messages: [] }];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(lintReportData));

      const report = lintReport.generateLintReport();

      expect(execSync).toHaveBeenCalledWith(
        'npx eslint . -f json -o lint-report.json'
      );
      expect(report).toEqual(lintReportData);
    });
  });

  describe('getChangedFiles', () => {
    it('should return changed files', () => {
      execSync.mockReturnValueOnce('file1.ts\nfile2.tsx\nfile3.js');

      const changedFiles = lintReport.getChangedFiles();

      expect(execSync).toHaveBeenCalledWith(
        'git diff --name-only origin/main HEAD'
      );
      expect(changedFiles).toEqual(['file1.ts', 'file2.tsx']);
    });
  });

  describe('getModifiedLines', () => {
    it('should return modified lines', () => {
      const diffOutput = '@@ -1,2 +1,2 @@\n+line1\n+line2\n';
      execSync.mockReturnValueOnce(diffOutput);

      const modifiedLines = lintReport.getModifiedLines('file.ts');

      expect(execSync).toHaveBeenCalledWith(
        'git diff -U0 origin/main HEAD --ignore-space-at-eol -- file.ts'
      );
      expect(modifiedLines).toEqual([1, 2]);
    });
  });

  describe('postLintReport', () => {
    it('should post lint report', async () => {
      await lintReport.postLintReport(1, 'report');

      expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 1,
        body: 'report',
      });
    });
  });

  describe('generateReportBody', () => {
    it('should generate report body with new issues', () => {
      const newIssues = [
        {
          severity: 2,
          ruleId: 'rule1',
          filePath: 'file1.js',
          line: 1,
          column: 1,
          message: 'error',
        },
        {
          severity: 1,
          ruleId: 'rule2',
          filePath: 'file2.js',
          line: 2,
          column: 2,
          message: 'warning',
        },
      ];

      const reportBody = lintReport.generateReportBody(
        newIssues,
        context,
        0,
        0
      );

      expect(reportBody).toContain('🚨 **Lint Report**:');
      expect(reportBody).toContain('🛑 **Errors**: 1');
      expect(reportBody).toContain('⚠️ **Warnings**: 1');
      expect(reportBody).toContain('### New Issues:');
      expect(reportBody).toContain('- [rule1] file1.js:1:1 - error');
      expect(reportBody).toContain('- [rule2] file2.js:2:2 - warning');
    });

    it('should generate report body with no new issues', () => {
      const reportBody = lintReport.generateReportBody([], context, 0, 0);

      expect(reportBody).toContain('🚨 **Lint Report**:');
      expect(reportBody).toContain(
        '🎉 **Great Job!** No new lint issues were introduced in this pull request.'
      );
    });

    it('should include Boy Scout Rule if there are fixable errors or warnings', () => {
      const reportBody = lintReport.generateReportBody([], context, 1, 1);

      expect(reportBody).toContain('🛠️ **Boy Scout Rule**:');
      expect(reportBody).toContain(
        'resolve an additional **1 errors** and **1 warnings**'
      );
    });
  });
});
