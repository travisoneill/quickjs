'use-strict';

document.addEventListener('DOMContentLoaded', setupUI);

function setupUI() {
  document.getElementById('add-test').addEventListener('click', stop(addTest));
  document.getElementById('remove-test').addEventListener('click', stop(removeTest));
  document.getElementById('run').addEventListener('click', stop(runTests));
  document.getElementById('save').addEventListener('click', stop(save));
  document.getElementById('clone').addEventListener('click', stop(clone));
  document.getElementById('get-url').addEventListener('click', stop(shortenURL));

  const queryParams = parseQuery(window.location.search);
  setupEditor('js-setup', 'javascript', queryParams.js);
  setupEditor('html-setup', 'html', queryParams.html);
  queryParams.tests.forEach(test => addTest(test.code));
}

const webURL = 'https://travisoneill.github.io/quickjs';
const apiURL = 'https://quickjsv000.appspot.com/api';

const save = () => window.location.search = buildQuery();
const clone = () => window.open(`${webURL}/${buildQuery()}`, '_blank');

async function shortenURL() {
  const query = buildQuery();
  const res = await fetch(apiURL + query);
  const json = await res.json();
  const slug = JSON.parse(json).id.replace('https://goo.gl/', '');
  prompt('Shortened URL:', `${webURL}/?${slug}`);
}

function buildQuery() {
  const setupQuery = [];
  const setupHTML = encodeURI(getCode('html-setup'));
  const setupJS = encodeURI(getCode('js-setup'));
  if (setupHTML) {
    setupQuery.push(`html=}}${setupHTML}{{`);
  }
  if (setupJS) {
    setupQuery.push(`js=}}${setupJS}{{`);
  }
  const testIDs = [...document.getElementsByClassName('test')].map(t => t.id);
  const testQuery = testIDs.map(id => `${id}=}}${encodeURI(getCode(id))}{{`);
  const queryItems = setupQuery.concat(testQuery);
  const queryString = queryItems.length > 0 ? '?' + queryItems.join('&') : '';
  return queryString;
}

function parseQuery(qs) {
  const googlURL = (qs.match(/^\?[a-zA-Z0-9]{6}$/) || [])[0];
  if (googlURL) {
    window.open(`https://goo.gl/${googlURL.replace('?', '')}`, '_self');
    return;
  }

  const queryDict = { tests: [], };
  if(!qs || qs === '?') {
    return queryDict;
  }

  const _validKey = k => k === 'js' || k === 'html' || k.match(/^test-\d*$/);
  const _validVal = v => v.replace(/\n/g, '').match(/^}}.*{{$/);

  const query = decodeURI(qs) + '&';
  let parsed = { key: '', value: '' };
  let state = 'key';
  var i = query[0] === '?' ? 1 : 0;
  for (i; i < query.length; i++) {
    const [p2, p1, char, n1, n2] = new Array(5).fill(i - 2).map((n, i) => Math.max(0, n + i)).map(i => query[i]);

    if (char === '=' && state === 'key' && _validKey(parsed.key) && n1 === '}' && n2 === '}') {
      state = 'value';
      continue;
    }

    if (char === '&' && state === 'value' && _validVal(parsed.value) && p1 === '{' && p2 === '{') {
      state = 'key';
      if (parsed.key.match(/^test-\d*$/)) {
        queryDict.tests.push({ id: parsed.key, code: parsed.value.slice(2, -2) });
      } else {
        queryDict[parsed.key] = parsed.value.slice(2, -2);
      }
      parsed = {key: '', value: ''};
      continue;
    }

    parsed[state] += char;
  }

  return queryDict;
}

const getCode = id => ace.edit(document.getElementById(id)).session.getValue();

function empty(id) {
  const $node = document.getElementById(id);
  while ($node.firstChild) {
    $node.removeChild($node.firstChild);
  }
  return $node;
}

// TODO: run tests in parallel w/ webworkers
function runTests() {
  const $btn = document.getElementById('run');
  $btn.disabled = true;
  empty('test-html').innerHTML = getCode('html-setup');
  const $results = empty('result-display');
  const testQ = setupTestContext();
  for (var i = 0; i < testQ.length; i++) {
    const test = testQ[i];
    const iterations = test();
    $results.innerHTML += displayResult(iterations, i);
  }
  empty('test-html');
  $btn.disabled = false;
}

function displayResult(iterations, idx) {
  const symbols = ['', 'm', 'μ', 'n'];
  let i = 0;
  let runtime = 1 / iterations;
  while (runtime < 10) {
    runtime *= 1000;
    i += 1;
  }
  const result = `${runtime >>> 0} ${symbols[i]}s`;
  return resultTemplate(iterations, result, idx);
}

const resultTemplate = (iterations, runtime, idx) => {
  return (`
    <div class="result" id="result${idx}">
      <span>Test ${idx}:</span><br/>
      <span>Iterations: ${iterations}</span><br/>
      <span>Mean Runtime: ${runtime}</span>
    </div>
  `);
}

function setupTestContext() {
  const setupJS = getCode('js-setup');
  const _enclose = code => `() => {\n${code}\n}`;
  const _buildRunners = funcStr => makeRunner(funcStr, setupJS);
  const testIDs = [...document.getElementsByClassName('test')].map(t => t.id);
  const testCode = testIDs.map(getCode);
  const funcs = testCode.map(_enclose);
  return funcs.map(_buildRunners);
}


function makeRunner(funcStr, setupCode) {
  return _runner;

  function _runner() {
    // TODO: get this to work w/o evaling setup code each iteration
    const func = eval(`${setupCode};${funcStr}`);

    const __runTest = () => {
      let time = 0;
      let iterations = 0;
      while (time < 1000) {
        const t0 = Date.now();
        func();
        const runTime = Date.now() - t0;
        time += runTime;
        iterations += 1;
      }
      return iterations;
    }

    return __runTest();
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

function stop(func) {
  return _wrapped;

  function _wrapped(e) {
    e.preventDefault();
    e.stopPropagation();
    func();
  }
}
