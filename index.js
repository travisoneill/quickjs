'use-strict';

document.addEventListener('DOMContentLoaded', setupUI);

function setupUI() {
  document.getElementById('add-test').addEventListener('click', _kill(addTest));
  document.getElementById('remove-test').addEventListener('click', _kill(removeTest));
  document.getElementById('run').addEventListener('click', _kill(runTests));
  setupEditor('js-setup', 'javascript');
  setupEditor('html-setup', 'html');
}

function runTests() {
  testSetup();
}

function testSetup() {
  appendHtml();
}

function appendHtml() {
  const htmlInput = document.getElementById('html-setup');
  const html = ace.edit(htmlInput).session.getValue();
  document.getElementById('test-html').innerHTML += html;
}

function executeJavascript() {
  const jsCode = document.getElementById('js-setup');
}

function setupEditor(id, lang) {
  const editor = ace.edit(id);
  editor.setTheme('ace/theme/twilight');
  editor.getSession().setMode(`ace/mode/${lang}`);
  editor.setValue(lang);
  editor.$blockScrolling = Infinity;
}

let nTest = 0;
function addTest() {
  nTest += 1;
  const newTest = HTMLtag({ type: 'textarea', cls: 'test', id: `test-${nTest}` });
  document.getElementById('tests').appendChild(newTest);
}

function removeTest() {
  if (nTest < 1) {
    return;
  }
  document.getElementById(`test-${nTest}`).remove();
  nTest -= 1;
}

function HTMLtag({ type, id, cls }) {
  const tag = document.createElement(type);
  tag.id = id;
  tag.className = cls;
  return tag;
}

function _kill(func, ...args) {
  return _wrapped;

  function _wrapped(e) {
    e.preventDefault();
    e.stopPropagation();
    func(...args);
  }
}
