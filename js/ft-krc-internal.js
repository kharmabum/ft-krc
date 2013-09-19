// https://github.com/kippt/kippt-chrome/blob/master/js/kippt_extension.js

var spinner_opts = {
  lines: 9,
  length: 2,
  width: 2,
  radius: 3,
  rotate: 0,
  color: '#111',
  speed: 1,
  trail: 27,
  shadow: false,
  hwaccel: false,
  className: 'spinner',
  zIndex: 2e9,
  top: 'auto',
  left: 'auto'
};

Kippt = {};
Kippt.closePopover = function() {
    window.close();
};

Kippt.openTab = function(url) {
    chrome.tabs.create({url: url});
};

Kippt.getUserData = function () {
    $.ajax({
        url: 'https://kippt.com/api/account/?include_data=services',
        type: "GET",
        dataType: 'json'
    })
    .done(function(data){
        Kippt.userId = data['id'];
        localStorage.setItem('kipptUserId', data['id']);

        $.each(data.services, function(name, connected) {
            if (connected) {
                $("#kippt-actions ." + name).toggleClass("connected", connected);
                $("#kippt-actions ." + name).css('display', 'inline-block');
            }
        });
    })
    .fail(function(jqXHR, textStatus){
        // Logged out user, open login page
        Kippt.openTab('https://kippt.com/login/');
        Kippt.closePopover();
    });
};

Kippt.setClipData = function (response) {

    var selected_note = (response) ? response.note : '';
    var kippt_url = 'https://kippt.com/extensions/new';
    var tab_url = tab.url;
    var tab_title = tab.title;

    $('#id_title').val(tab_title.trim());
    $('#id_url').val(tab_url);
    $('#id_notes').val(selected_note.trim());

    // Get from cache
    if (localStorage.getItem('cache-title'))
        $('#id_title').val( localStorage.getItem('cache-title') );
    if (localStorage.getItem('cache-notes'))
        $('#id_notes').val( localStorage.getItem('cache-notes') );

    // Cache title & notes on change
    $('#id_title').on('keyup change cut paste', function(e){
        localStorage.setItem('cache-title', $('#id_title').val());
    });
    $('#id_notes').on('keyup change cut paste', function(e){
        localStorage.setItem('cache-notes', $('#id_notes').val());
    });
};

Kippt.fetchLists = function () {
    var listCache = localStorage.getItem('kipptListCache');
    if (listCache) {
        Kippt.updateLists(JSON.parse(listCache));
    }
    $.getJSON(
        'https://kippt.com/api/lists/?limit=0&include_data=user',
        function(response) {
            var responseJSON = JSON.stringify(response.objects);
            // Update only if lists have changed
            if (responseJSON !== listCache) {
                // Update UI
                Kippt.updateLists(response.objects);
                // Save to cache
                localStorage.setItem('kipptListCache', responseJSON);
            }
        }
    );
};

Kippt.updateLists = function (data) {
    var existingSelection = $('#id_list option:selected').val();

    // Clear loading
    $('#id_list').html('');
    for (var i in data) {
        var list = data[i], title;

        // Add user to title if not the current user
        if (Kippt.userId && Kippt.userId != list['user']['id'])
            title = list['title'] + ' (' + list['user']['username'] + ')';
        else
            title = list['title'];
        $('#id_list').append(new Option(title, list['id']));
    }

    // Set default selection
    if (!existingSelection)
        $('#id_list option').first().attr('selected', 'selected');
    else
        $('#id_list option[value='+existingSelection+']').attr('selected', 'selected');

    // Add new list creation option w/ event handler
    $('#id_list').append('<option id="new-list-toggle">-- New list --</option>');
    $('#id_list').on('change', function(){
        if ($(this).children("option#new-list-toggle:selected").length) {
            $('#id_list').hide();
            $('#new_list').css('display', 'inline-block');
            $('#id_new_list').focus();
        }
    });
};

Kippt.checkForClipDuplicates = function () {
    var spinner = new Spinner(spinner_opts).spin();
    $('.existing .loading').append(spinner.el);
    $.ajax({
        url: 'https://kippt.com/api/clips/?include_data=list&url='+escape(tab.url),
        type: "GET",
        dataType: 'json'
    })
    .done(function(response){
        $('.existing .loading').hide();
        if (response.meta.total_count) {
            var duplicate = response.objects[0];
            $('.existing a').show();
            $('.existing a').click(function(e){
                existingClipId = duplicate.id;
                $('#id_title').val(duplicate.title);
                $('#id_notes').val(duplicate.notes);
                $('#id_list option[value='+duplicate.list.id+']').attr('selected', 'selected');
                $('.existing').hide();
            });
        }
    });
};

$(function() {

    chrome.tabs.getSelected(null, function(tab) {

        // Empty tab - open Kippt.com
        if (tab.url.indexOf('chrome://') === 0) {
            chrome.tabs.update(tab.id, {url: 'https://kippt.com/'});
            Kippt.closePopover();
            return;
        }

        chrome.tabs.sendRequest(tab.id, {helper: 'get_note'}, function(response) {
            // TODO: focus on tags field by default
            $('textarea').focus();

            Kippt.getUserData();
            Kippt.setClipData(response);
            Kippt.checkForClipDuplicates();
            Kippt.fetchLists();

            ///////////////////////////
            // Handle save
            /////////////////////////////
            $('#submit_clip').click(function(e){
                // Data
                var data = {
                    url: tab.url,
                    title: $('#id_title').val(),
                    notes: $('#id_notes').val(),
                    list: $('#id_list option:selected').val(),
                    source: 'chrome_v1.1'
                };

                // Favorite
                if ($('#id_is_favorite').is(':checked'))
                    data.is_favorite = true;


                if (existingClipId) {
                    data.id = existingClipId;
                }

                // New list
                if ($('#id_new_list').val()) {
                    data['new_list'] = {};
                    data['new_list']['title'] = $('#id_new_list').val();
                    if ($('#id_private').is(':checked'))
                        data['new_list'].is_private = true;
                    else
                        data['new_list'].is_private = false;
                }

                // Shares
                var services = [];
                $('.share:checked').each(function(i, elem){
                    services.push($(elem).data('service'));
                });
                data['share'] = services;

                // Save to Kippt in background
                chrome.extension.sendRequest({method: 'createNewClip', data: data});
                Kippt.closePopover();
            });

            ///////////////////////////
            // Save on 'Enter'
            ///////////////////////////
            $(document).on("keydown", function(e){
              if (e.which == 13 && e.metaKey) {
                e.preventDefault();
                $('#submit_clip').click();
              }
            });

            ///////////////////////////
            // Connect Services
            ///////////////////////////
            $(document).on("click", "#kippt-actions > div:not(.connected)", function() {
                Kippt.openTab("https://kippt.com/accounts/settings/connections/");
                Kippt.closePopover();
            });

            ///////////////////////////
            // Configure share tooltips
            ///////////////////////////
            $("#kippt-actions > div").tipsy({
                gravity: "sw",
                title: function() {
                    var el = $(this);
                    if (el.hasClass("connected")) {
                        return "Share on " + el.attr("data-service-name");
                    }
                    else {
                        return "Click to connect with " + el.attr("data-service-name");
                    }
                }
            });
        });
    });
});
