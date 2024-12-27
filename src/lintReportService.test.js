const LintReport = require('./lintReport');
const LintReportService = require('./lintReportService');
const path = require('path');

jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('./lintReport');
jest.mock('path');

describe('LintReportService', () => {
  let octokit, context, lintReportService, lintReportInstance;

  beforeEach(() => {
    octokit = {};
    context = { payload: { pull_request: { number: 1 } } };
    lintReportInstance = {
      deleteExistingLintComments: jest.fn(),
      generateLintReport: jest.fn(),
      getChangedFiles: jest.fn(),
      getModifiedLines: jest.fn(),
      generateReportBody: jest.fn(),
      postLintReport: jest.fn(),
    };
    LintReport.mockImplementation(() => lintReportInstance);
    lintReportService = new LintReportService(octokit, context);
  });

  test('constructor initializes LintReport instance', () => {
    expect(lintReportService.lintReport).toBe(lintReportInstance);
  });

  test('handleLintReport calls necessary methods and handles no changed files', async () => {
    lintReportInstance.getChangedFiles.mockReturnValue([]);
    await lintReportService.handleLintReport(1);
    expect(lintReportInstance.deleteExistingLintComments).toHaveBeenCalledWith(
      1
    );
    expect(lintReportInstance.generateLintReport).toHaveBeenCalled();
    expect(lintReportInstance.getChangedFiles).toHaveBeenCalled();
  });

  test('handleLintReport processes lint results and posts report', async () => {
    lintReportInstance.getChangedFiles.mockReturnValue(['file1.ts']);
    lintReportInstance.generateLintReport.mockReturnValue([
      { filePath: 'file1.ts', messages: [{ line: 1, severity: 2 }] },
    ]);
    lintReportInstance.getModifiedLines.mockReturnValue([1]);
    lintReportInstance.generateReportBody.mockReturnValue('report body');

    await lintReportService.handleLintReport(1);

    expect(lintReportInstance.postLintReport).toHaveBeenCalledWith(
      1,
      'report body'
    );
  });

  test('getModifiedLines returns modified lines for changed files', () => {
    lintReportInstance.getModifiedLines.mockReturnValue([1, 2]);
    const changedFiles = ['file1.ts'];
    const modifiedLines = lintReportService.getModifiedLines(changedFiles);
    expect(modifiedLines).toEqual({ 'file1.ts': [1, 2] });
  });

  jest.mock('@actions/core');
  jest.mock('@actions/github');
  jest.mock('./lintReport');
  jest.mock('path');

  describe('LintReportService', () => {
    let octokit, context, lintReportService, lintReportInstance;

    beforeEach(() => {
      octokit = {};
      context = { payload: { pull_request: { number: 1 } } };
      lintReportInstance = {
        deleteExistingLintComments: jest.fn(),
        generateLintReport: jest.fn(),
        getChangedFiles: jest.fn(),
        getModifiedLines: jest.fn(),
        generateReportBody: jest.fn(),
        postLintReport: jest.fn(),
      };
      LintReport.mockImplementation(() => lintReportInstance);
      lintReportService = new LintReportService(octokit, context);
    });

    test('constructor initializes LintReport instance', () => {
      expect(lintReportService.lintReport).toBe(lintReportInstance);
    });

    test('handleLintReport calls necessary methods and handles no changed files', async () => {
      lintReportInstance.getChangedFiles.mockReturnValue([]);
      await lintReportService.handleLintReport(1);
      expect(
        lintReportInstance.deleteExistingLintComments
      ).toHaveBeenCalledWith(1);
      expect(lintReportInstance.generateLintReport).toHaveBeenCalled();
      expect(lintReportInstance.getChangedFiles).toHaveBeenCalled();
    });

    test('handleLintReport processes lint results and posts report', async () => {
      lintReportInstance.getChangedFiles.mockReturnValue(['file1.ts']);
      lintReportInstance.generateLintReport.mockReturnValue([
        { filePath: 'file1.ts', messages: [{ line: 1, severity: 2 }] },
      ]);
      lintReportInstance.getModifiedLines.mockReturnValue([1]);
      lintReportInstance.generateReportBody.mockReturnValue('report body');

      await lintReportService.handleLintReport(1);

      expect(lintReportInstance.postLintReport).toHaveBeenCalledWith(
        1,
        'report body'
      );
    });

    test('getModifiedLines returns modified lines for changed files', () => {
      lintReportInstance.getModifiedLines.mockReturnValue([1, 2]);
      const changedFiles = ['file1.ts'];
      const modifiedLines = lintReportService.getModifiedLines(changedFiles);
      expect(modifiedLines).toEqual({ 'file1.ts': [1, 2] });
    });

    test('getNewIssues returns new issues for modified lines', () => {
      path.relative.mockReturnValue('file1.ts');
      const lintResults = [
        {
          filePath: 'file1.ts',
          messages: [
            {
              ruleId: 'some rule',
              line: 1,
              severity: 2,
              message: 'rule violation',
            },
          ],
        },
      ];
      const modifiedLines = { 'file1.ts': [1] };
      const newIssues = lintReportService.getNewIssues(
        lintResults,
        modifiedLines
      );
      expect(newIssues).toEqual([
        {
          ruleId: 'some rule',
          filePath: 'file1.ts',
          line: 1,
          column: 0,
          message: 'rule violation',
          severity: 2,
        },
      ]);
    });

    test('getNewIssues returns empty array if no modified lines', () => {
      path.relative.mockReturnValue('file1.ts');
      const lintResults = [
        {
          filePath: 'file1.ts',
          messages: [
            {
              ruleId: 'some rule',
              line: 1,
              severity: 2,
              message: 'rule violation',
            },
          ],
        },
      ];
      const modifiedLines = { 'file1.ts': [] };
      const newIssues = lintReportService.getNewIssues(
        lintResults,
        modifiedLines
      );
      expect(newIssues).toEqual([]);
    });

    test('getNewIssues returns empty array if no messages in lint results', () => {
      path.relative.mockReturnValue('file1.ts');
      const lintResults = [
        {
          filePath: 'file1.ts',
          messages: [],
        },
      ];
      const modifiedLines = { 'file1.ts': [1] };
      const newIssues = lintReportService.getNewIssues(
        lintResults,
        modifiedLines
      );
      expect(newIssues).toEqual([]);
    });
  });
});
