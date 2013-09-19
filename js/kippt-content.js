// http://code.google.com/chrome/extensions/messaging.html
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.method == 'get_selection'){
            sendResponse({note: document.getSelection().toString()});
        }
    }
);
