function children(domNode) {
  function* depthFirstTraversal(node) {
    yield node;

    // Traverse shadow DOM
    if (node.shadowRoot) {
      for (const child of depthFirstTraversal(node.shadowRoot)) {
        yield child;
      }
    }

    // Traverse iframes
    if (node.tagName?.toLowerCase() === "iframe" && node.contentDocument) {
      for (const child of depthFirstTraversal(
        node.contentDocument.documentElement
      )) {
        yield child;
      }
    }

    let child = node.firstChild;
    while (child) {
      for (const descendant of depthFirstTraversal(child)) {
        yield descendant;
      }
      child = child.nextSibling;
    }
  }

  return Array.from(depthFirstTraversal(domNode));
}

function enterScore(rubricItemNode, scoreIndex) {
  const scoreNodes = children(rubricItemNode).filter(
    (node) => node.getAttribute?.("role") === "radio"
  );
  const scoreNode = scoreNodes[scoreIndex];
  scoreNode.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  );
  scoreNode.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    })
  );
}

function addFeedback(editorId, feedback) {
  window.postMessage({ type: 'SET_EDITOR_CONTENT', editorId: editorId, content: feedback }, '*');
}

function getEditor(node) {
  const editorNode = children(node).find((x) => x.id === "tinymce");
  return editorNode ? editorNode.dataset.id : null;
}

const assignments = {
  discussion1: {
    feedbacks: [
      { scoreIndex: 0, feedback: "Post was adequately organized and contained rich and significant details" },
      { scoreIndex: 1, feedback: "Post was submitted on time" },
      { scoreIndex: 0, feedback: "Responses to classmates were relevant with clarifying explanation and detail" },
      { scoreIndex: 0, feedback: "Post contained no noticeable mechanical issues" },
    ],
    mainFeedback: `<p>Great job on the discussion post. You submitted your initial discussion post on time and also responded to two of your classmates. I enjoyed reading your thoughts!</p>`
  },
  module1: {
    feedbacks: [
      { scoreIndex: 0, feedback: "Screenshot shows successful access to the mongo shell" },
      { scoreIndex: 0, feedback: "Screenshot shows successful retrieval of a document" },
      { scoreIndex: 0, feedback: "Screenshot shows successful attempt to find the size of a single document" },
      { scoreIndex: 0, feedback: "Screenshot shows successful attempt to find the size of the emails collection" },
    ],
    mainFeedback: `<p>Nice job, Nathaniel! You successfully accessed the shell and were able to query the size of one document as well as the size of the emails collection. Keep up the good work.</p>

<p>A couple of issues that I noticed:</p>
<ul>
    <li>I didn’t see a screenshot for the last requirement. I do not allow resubmissions, so on future assignments make sure to review all requirements before submitting. If it's helpful, you can copy and paste in the assignment requirements into your submission document, which can make it easier to check if something has accidentally been omitted.</li>
    <li>Try to crop out anything that's not the terminal window from your screenshots.</li>
    <li>Please make sure to include your SNHU username in each screenshot. Check out my Module 1 announcement for instructions on how to do this.</li>
    <li>On the last requirement you seemed to be querying for the size of each email individually, rather than the collection as a whole. The correct answer should have been a single number that represents the size of the entire emails collection.</li>
</ul>

<p>Please email me if you have any questions. Good luck on the next assignment!</p>`
  }
}

async function runAutofill(assignmentKey) {
  const assignment = assignments[assignmentKey];
  if (!assignment) {
    console.error(`Assignment "${assignmentKey}" not found`);
    return;
  }

  const nodes = children(document.body);

  const rubricDisclosureNode = nodes.find((node) =>
    node.classList?.contains("d2l-collapsible-panel-header")
  );
  rubricDisclosureNode.click();
  await new Promise((r) => setTimeout(r, 500));

  const rubricNode = nodes.find(
    (node) => node.tagName?.toLowerCase() === "d2l-rubric-criteria-group-mobile"
  );

  const rubricItemNodes = children(rubricNode).filter(
    (x) => x.tagName?.toLowerCase() === "d2l-rubric-criterion-mobile"
  );
  for (const [i, itemNode] of rubricItemNodes.entries()) {
    const { scoreIndex, feedback } = assignment.feedbacks[i];
    enterScore(itemNode, scoreIndex);

    const feedbackDisclosureNode = children(itemNode).find(
      (x) => x.tagName?.toLowerCase() === "d2l-button-subtle"
    );
    feedbackDisclosureNode.click();
    await new Promise((r) => setTimeout(r, 500));

    const editorId = getEditor(itemNode);
    if (editorId) {
      addFeedback(editorId, feedback);
    }
  }

  const mainFeedbackNode = nodes.find(
    (node) =>
      node.tagName?.toLowerCase() ===
      "d2l-consistent-evaluation-right-panel-feedback"
  );
  const editor = getEditor(mainFeedbackNode);
  addFeedback(editor, assignment.mainFeedback);
}

function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  (document.head || document.documentElement).appendChild(script);
}

// Inject the script when the content script loads
injectScript();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "runAutofill") {
    await runAutofill(request.assignmentKey);
  }
});