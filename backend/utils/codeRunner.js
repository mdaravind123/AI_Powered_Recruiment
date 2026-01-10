import axios from 'axios';

// Map friendly language names to Piston languages
const LANGUAGE_MAP = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp'
};

/**
 * Executes code against a single stdin using Piston API.
 * Returns { stdout, stderr }.
 */
export async function runSingle({ language, code, stdin }) {
  const lang = LANGUAGE_MAP[language] || language;
  const payload = {
    language: lang,
    version: '*',
    files: [{ name: 'Main', content: code }],
    stdin
  };
  const { data } = await axios.post('https://emkc.org/api/v2/piston/execute', payload, {
    timeout: 30000
  });
  const stdout = (data?.run?.stdout ?? '').toString();
  const stderr = (data?.run?.stderr ?? '').toString();
  return { stdout, stderr };
}

/**
 * Execute code across multiple test cases.
 * testCases: Array<{ input, expectedOutput }>
 * Returns array of { input, expectedOutput, stdout, stderr, passed }.
 */
export async function runAgainstTestCases({ language, code, testCases }) {
  const results = [];
  for (const tc of testCases) {
    try {
      const { stdout, stderr } = await runSingle({ language, code, stdin: tc.input ?? '' });
      const normOut = stdout.replace(/\r\n/g, '\n').trim();
      const normExp = (tc.expectedOutput ?? '').replace(/\r\n/g, '\n').trim();
      const passed = stderr ? false : normOut === normExp;
      results.push({ input: tc.input ?? '', expectedOutput: tc.expectedOutput ?? '', stdout, stderr, passed });
    } catch (err) {
      results.push({ input: tc.input ?? '', expectedOutput: tc.expectedOutput ?? '', stdout: '', stderr: err.message || 'Execution error', passed: false });
    }
  }
  return results;
}

export default { runSingle, runAgainstTestCases };
