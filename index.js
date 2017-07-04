'use-strict';

document.addEventListener('DOMContentLoaded', setupUI);

function setupUI() {
  document.getElementById('add-test').addEventListener('click', killEvt(addTest));
  document.getElementById('remove-test').addEventListener('click', killEvt(removeTest));
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

function killEvt(func) {
  return _wrapped;

  function _wrapped(e) {
    e.preventDefault();
    e.stopPropagation();
    func();
  }
}
