$(function() {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if ($(".ft-krc-shell").length === 0) {
          var url = chrome.extension.getURL("../ft-krc.html");
          $("body").append("<div class='ft-krc-shell'><iframe src='"+ url + "' height='100%' width='100%'></iframe></div>");
          $(".ft-krc-shell").show(300);
        } else {
          $(".ft-krc-shell").toggle(300);
        }
    });
});
