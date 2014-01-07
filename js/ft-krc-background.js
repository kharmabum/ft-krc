// Keyboard shortcut
chrome.commands.onCommand.addListener(function(command) {
  toggle();
});

// Click on browser action button
chrome.browserAction.onClicked.addListener(function(tab) {
  toggle();
});

// Chrome Message Passing
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method === 'createNewClip') {
        createClipInBackground(request.data);
    } else if (request.method === 'openTab') {
        chrome.tabs.create({url: request.url});
    } else if (request.method === 'getActiveTab') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {method: 'getSelection'}, function(selection) {
                chrome.tabs.sendMessage(tabs[0].id, {method: 'activeTabInfo', tab:tabs[0], selection: selection});
            });
        });
    } else if (request.method === 'toggle') {
        toggle();
    }
});

function toggle() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {method: "toggle"});
  });
}

var createClipInBackground = function (msg) {
    // Helper function for clip creation
    var createNewClip = function(msg) {
        // Remove variable 'type', added by Chrome
        delete msg.type;
        var isFavorite = msg['is_favorite'];
        delete msg['is_favorite'];

        var type;
        if (!msg.id) {
            // Create new
            type = 'POST';
            url = 'https://kippt.com/api/clips/';
        } else {
            // Update
            type = 'PUT';
            url = 'https://kippt.com/api/clips/'+msg.id+'/';
        }

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: JSON.stringify(msg)
        })
        .done(function(data){
            // Clear page cache
            localStorage.removeItem('cache-title');
            localStorage.removeItem('cache-notes');
            // Set favorite if selected
            if (isFavorite) {
                $.ajax({
                    url:  'https://kippt.com' + data['resource_uri'] + 'favorite/',
                    type: 'POST',
                    dataType: 'json',
                });
            }
        })
        .fail(function(jqXHR, textStatus){
            alert( "Something went wrong when saving. Try again or contact hello@kippt.com");
        });
    };

    // New list
    if (msg['new_list']) {
        $.ajax({
            url: 'https://kippt.com/api/lists/',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(msg['new_list'])
        })
        .done(function(data){
            // Create clip with new list
            msg['list'] = data.id;
            createNewClip(msg);
        })
        .fail(function(){
            alert( "Something went wrong when saving. Try again or contact hello@kippt.com");
        });

    // Existing list
    } else {
        createNewClip(msg);
    }
};




