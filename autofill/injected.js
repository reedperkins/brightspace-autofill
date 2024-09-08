function getEditorContent(editorId) {
  const editor = tinymce.get(editorId);
  return editor ? editor.getContent() : null;
}

function setEditorContent(editorId, content) {
  const editor = tinymce.get(editorId);
  if (editor) {
    editor.setContent(content);
    editor.fire('input');
  }
}

window.addEventListener('message', function(event) {
  if (event.data.type === 'GET_EDITOR_CONTENT') {
    const content = getEditorContent(event.data.editorId);
    window.postMessage({ type: 'EDITOR_CONTENT', content: content }, '*');
  } else if (event.data.type === 'SET_EDITOR_CONTENT') {
    setEditorContent(event.data.editorId, event.data.content);
  }
});

console.log('TinyMCE interaction script injected');
