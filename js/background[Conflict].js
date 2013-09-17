function toggle() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {directive: "toggle"}, function(response) { /* herp derp */ });
  });
}

chrome.commands.onCommand.addListener(function(command) {
  toggle();
});

chrome.browserAction.onClicked.addListener(function(tab) {
  toggle();
});
