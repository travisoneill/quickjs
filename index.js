'use-strict';

document.addEventListener('DOMContentLoaded', setupUI);

function setupUI() {
  document.getElementById('add-test').addEventListener('click', _kill(addTest));
  document.getElementById('remove-test').addEventListener('click', _kill(removeTest));
  document.getElementById('run').addEventListener('click', _kill(runTests));
  document.getElementById('save').addEventListener('click', _kill(buildQuery));

  const queryParams = parseQuery(window.location.search);
  setupEditor('js-setup', 'javascript', queryParams.js);
  setupEditor('html-setup', 'html', queryParams.html);
  queryParams.tests.forEach(test => addTest(test.code));
}

function buildQuery() {
  const setupQuery = [];
  const setupHTML = encodeURI(getCode('html-setup'));
  const setupJS = encodeURI(getCode('js-setup'));
  if (setupHTML) {
    setupQuery.push(`html=}}${setupHTML}{{`);
  }
  if (setupJS) {
    setupQuery.push(`js=}}${setupJS}{{`)
  }
  const testIDs = [...document.getElementsByClassName('test')].map(t => t.id);
  const testQuery = testIDs.map(id => `${id}=}}${encodeURI(getCode(id))}{{`);
  const queryItems = setupQuery.concat(testQuery);
  const queryString = queryItems.length > 0 ? '?' + queryItems.join('&') : '';
  const { origin, pathname } = window.location;
  // alert(window.location.href + queryString);
  window.open(origin + pathname + queryString);
  // return `${setupQuery}&${testQuery}`;
}

function parseQuery(qs) {

  const queryDict = { tests: [], };

  if(!qs || qs === '?') {
    return queryDict;
  }

  const validKey = k => k === 'js' || k === 'html' || k.match(/^test-\d*$/);
  const validVal = v => v.replace(/\n/g, '').match(/^}}.*{{$/);

  const query = decodeURI(qs) + '&';
  let parsed = { key: '', value: '' };
  let state = 'key';
  let i = query[0] === '?' ? 1 : 0;
  while (i < query.length) {
    const [p2, p1, char, n1, n2] = new Array(5).fill(i - 2).map((n, i) => Math.max(0, n + i)).map(i => query[i]);

    if (char === '=' && state === 'key' && validKey(parsed.key) && n1 === '}' && n2 === '}') {
      state = 'value';
      i += 1;
      continue;
    }

    if (char === '&' && state === 'value' && validVal(parsed.value) && p1 === '{' && p2 === '{') {
      state = 'key';
      if (parsed.key.match(/^test-\d*$/)) {
        queryDict.tests.push({ id: parsed.key, code: parsed.value.slice(2, -2) });
      } else {
        queryDict[parsed.key] = parsed.value.slice(2, -2);
      }
      parsed = {key: '', value: ''};
      i += 1;
      continue;
    }

    parsed[state] += char;
    i += 1;
  }

  return queryDict;
}

const appendHTML = () => document.getElementById('test-html').innerHTML = getCode('html-setup');
const removeHTML = () => document.getElementById('test-html').innerHTML = '';
const getCode = id => ace.edit(document.getElementById(id)).session.getValue();

function runTests() {
  const btn = document.getElementById('run');
  btn.dsabled = true;
  appendHTML();
  let testQ = setupTestContext();
  for (var i = 0; i < testQ.length; i++) {
    const test = testQ[i];
    const results = test();
    console.log(`Test ${i}:`, results);
  }
  testQ.forEach(t => delete t);
  delete testQ;
  removeHTML();
  btn.disabled = false;
}

function setupTestContext() {
  const setupJS = getCode('js-setup');
  const _enclose = code => `() => {\n${code}\n}`;
  const _decorate = funcStr => makeRunner(funcStr, setupJS);
  const testIDs = [...document.getElementsByClassName('test')].map(t => t.id);
  const testCode = testIDs.map(getCode);
  const funcs = testCode.map(_enclose);
  const testRunners = funcs.map(_decorate);
  return testRunners;
}


function makeRunner(funcStr, setupCode) {
  return _runner;

  function _runner(...args) {
    const func = eval(`${setupCode};${funcStr}`);

    const __runTest = (...args) => {
      let total = 0;
      const runTimes = [];
      while (total < 1000) {
        const t0 = Date.now();
        func(...args);
        const runTime = Date.now() - t0;
        total += runTime;
        runTimes.push(runTime);
      }
      return runTimes;
    }

    return __runTest(...args);
  }

}

function setupEditor(id, lang, value='') {
  const comment = { html: '<!--HTML-->\n', javascript: '// JavaScript\n', };
  value = value || comment[lang];
  const editor = ace.edit(id);
  editor.$blockScrolling = Infinity;
  editor.setTheme('ace/theme/twilight');
  editor.getSession().setMode(`ace/mode/${lang}`);
  editor.setValue(value);
}

let nTest = -1;
function addTest(code='') {
  nTest += 1;
  const newTest = HTMLtag({ type: 'div', cls: 'test', id: `test-${nTest}` });
  document.getElementById('tests').appendChild(newTest);
  setupEditor(`test-${nTest}`, 'javascript', code);
}

function removeTest() {
  if (nTest < 0) {
    return;
  }
  const editor = document.getElementById(`test-${nTest}`);
  ace.edit(editor).destroy();
  editor.remove();
  nTest -= 1;
}

function HTMLtag({ type, id, cls }) {
  const tag = document.createElement(type);
  tag.id = id;
  tag.className = cls;
  return tag;
}

function _kill(func) {
  return _wrapped;

  function _wrapped(e) {
    e.preventDefault();
    e.stopPropagation();
    func();
  }
}
