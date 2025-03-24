// content.js
function injectScript(file, node) {
    const th = document.getElementsByTagName(node)[0];
    const s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}
injectScript( chrome.runtime.getURL('prism.js'), 'body');
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "insertText") {
        // Find the note input in the popup (you might need to adjust the selector)
        const noteInput = document.querySelector('#noteInput');  // adjust the selector to work in the popup

        if (noteInput) {
            noteInput.value = request.text; // Insert the text
            noteInput.focus(); // Focus on the input
        }
    }
});