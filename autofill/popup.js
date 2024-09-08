document.getElementById('autofillButton').addEventListener('click', () => {
    const assignmentKey = document.getElementById('assignmentSelect').value;
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "runAutofill", assignmentKey: assignmentKey});
    });
  });