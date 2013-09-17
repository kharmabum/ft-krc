$(function() {
  if ($("#ft-krc-shell").length === 0) {
    var url = chrome.extension.getURL("../ft-krc.html");
    $("body").append("<div id=ft-krc-shell><iframe src='"+ url + "' height='100%' width='100%'></iframe></div>");
    setTimeout(function(){$("#ft-krc-shell").show(300);},300);
  } else {
    $("#ft-krc-shell").toggle(300);
  }
});
