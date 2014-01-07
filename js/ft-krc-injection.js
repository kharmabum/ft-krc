$(function() {

    var isVisible = false;
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.method === "toggle") {
                if ($(".ft-krc-shell").length === 0) {
                    var url = chrome.extension.getURL("../ft-krc.html");
                    $("body").append("<div class='ft-krc-shell'><iframe src='" + url + "' height='100%' width='100%' name='ft-krc'></iframe></div>");
                    $(".ft-krc-shell").animate({ 'height': "360px" }, 200);
                    isVisible = true;
                } else {
                    if (isVisible) {
                        $(".ft-krc-shell").animate({ 'height': "0px" }, 100);
                        isVisible = false;
                    } else {
                        $(".ft-krc-shell").animate({ 'height': "360px" }, 200);
                        isVisible = true;
                    }
                }
            } else if (request.method === "getSelection"){
                sendResponse({note: document.getSelection().toString()});
            }
        }
    );
});
