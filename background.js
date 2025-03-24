// background.js
chrome.contextMenus.create({
    id: "addNote",
    title: "Add to My Dev Notes",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "addNote") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getSelectedTextAndOpenPopup
        });
    }
});

function getSelectedTextAndOpenPopup() {
    const selectedText = window.getSelection().toString();
    chrome.runtime.sendMessage({ action: "openPopupWithText", text: selectedText });
}