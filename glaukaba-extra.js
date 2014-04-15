var isOn = 0;
var updaterTimer;
var updaterTimeLeft;
var timeLeft = 15;
var modified;
var newPosts;
var postsAdded = 0;
var numberOfPosts = 0;
var settings = ['qRep', 'inlineExpansion', 'threadUpdater', 'quotePreview', 'replyHiding', 'threadHiding', 'anonymize', 'inlineQuote', 'expandPosts', 'expandThreads', 'replyBacklinking', 'expandFilename', 'fixedNav', 'markPosts', 'reverseImgSearch', 'reverseImgSearchLinks', 'embedMedia'];
var hasCaptcha = 0;
var postsInTitle = 0;
var finalDivScrollPos;
var ext = ".html";
var yourPosts = new Array();
var replytemplatever = 12;
var qrtemplatever = 1.6;
var filtered = new Array();

var observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.addedNodes) {
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        var node = mutation.addedNodes[i];
        if ($(node).hasClass('post')) {
          if (localStorage['filters'] !== undefined) {
            checkFiltered(node);
          }
        } else if ((sitevars.captcha == 1) && (sitevars.admin === undefined) && (document.qrform !== undefined)) {
          if (node.id == 'recaptcha_challenge_field') {
            document.getElementById('qr-captcha-image').innerHTML = document.getElementById('recaptcha_image').innerHTML;
            document.qrform.recaptcha_challenge_field.value = document.post_form.recaptcha_challenge_field.value;
          }
        }
      }
    }
  });
});

observer.observe(document, {
  childList: true,
  subtree: true
});

if (sessionStorage['yourPosts'] !== undefined) {
  yourPosts = JSON.parse(sessionStorage['yourPosts']);
}

function checkFiltered(post) {
  var filters = JSON.parse(localStorage['filters']);

  for (var i = 0; i < filters.length; i++) {
    switch (filters[i].type) {
    case "name":
      doFilter(post, filters[i], '.postername');
      break;
    case "trip":
      doFilter(post, filters[i], '.postertrip');
      break;
    case "subject":
      doFilter(post, filters[i], '.replytitle');
      break;
    case "fname":
      doFilter(post, filters[i], '.filename', 'title');
      break;
    case "md5":
      doFilter(post, filters[i], '.thumb', 'data-md5');
      break;
    case "com":
      doFilter(post, filters[i], 'blockquote');
      break;
    }
  }
}

function doFilter(post, filter, selector, attrib) {
  var matched = 0;
  if (filter.regex == 0) {
    if ($(post).find(selector).length > 0) {
      if (attrib === undefined) {
        matched = $(post).find(selector).text().indexOf(filter.val);
      } else {
        matched = $(post).find(selector).attr(attrib).indexOf(filter.val);
      }

      if (matched != -1) {
        if ($(post).hasClass('reply')) {
          hidePost(post.id, post);
        } else {
          toggleThread(null, post);
        }
        filtered.push(post.id);
      }
    }
  } else {
    var regexp = new RegExp(filter.val);
    if ($(post).find(selector).length > 0) {
      if (attrib === undefined) {
        matched = $(post).find(selector).text().search(regexp);
      } else {
        matched = $(post).find(selector).attr(attrib).search(regexp);
      }

      if (matched != -1) {
        if ($(post).hasClass('reply')) {
          hidePost(post.id, post);
        } else {
          toggleThread(null, post);
        }
        filtered.push(post.id);
      }
    }
  }
}

function isMobile() {
  return ($('#postFormToggle').css('display') == 'none' ? false : true);
}

function setQrInputs() {
  document.getElementById("qrField1").value = get_cookie("name");
  document.getElementById("qrField2").value = get_cookie("email");
  document.getElementById("qrPassword").value = get_password("password");
}

function toggleFeature(feature, value) {
  localStorage.setItem(feature, value);
  if (localStorage['showtooltip'] === undefined) {
    localStorage['showtooltip'] = 0;
  }
}

function addFilter(type, postid) {
  var filters = localStorage['filters'] === undefined ? [] : JSON.parse(localStorage['filters']);
  var val = "";

  switch (type) {
  case "name":
    val = $('#' + postid).find('.postername').text();
    break;
  case "trip":
    val = $('#' + postid).find('.postertrip').text();
    break;
  case "subject":
    val = $('#' + postid).find('.replytitle').text();
    break;
  case "fname":
    val = $('#' + postid).find('.filename').attr('title');
    break;
  case "md5":
    val = $('#' + postid).find('.thumb').attr('data-md5');
    break;
  case "com":
    val = $('#' + postid).find('blockquote').text();
    break;
  }

  filters.push({
    "num": 0,
    "type": type,
    "val": $.trim(val),
    "regex": 0
  });

  filters[filters.length - 1].num = filters.length > 1 ? filters[filters.length - 2].num + 1 : filters[filters.length - 1].num + 1;
  localStorage['filters'] = JSON.stringify(filters);
  alert('Filter added.');
}

function saveFilter() {
  if (document.addfilter.filtertype.value == 0) {
    alert('Select a type');
    return;
  }

  var filters = localStorage['filters'] === undefined ? [] : JSON.parse(localStorage['filters']);
  if (document.addfilter.filternum.value == 0) {
    filters.push({
      "num": 0,
      "type": document.addfilter.filtertype.value,
      "val": $.trim(document.addfilter.filtervalue.value),
      "regex": document.addfilter.regex.checked
    });

    filters[filters.length - 1].num = filters.length > 1 ? filters[filters.length - 2].num + 1 : filters[filters.length - 1].num + 1;
    $('.filter-list').append($('#filter-row-template').jqote(filters[filters.length - 1]));
  } else {
    for (var i = 0; i < filters.length; i++) {
      if (filters[i].num == document.addfilter.filternum.value) {
        filters.splice(i, 1, {
          "num": document.addfilter.filternum.value,
          "type": document.addfilter.filtertype.value,
          "val": $.trim(document.addfilter.filtervalue.value),
          "regex": document.addfilter.regex.checked
        });
        $('tr#listRow' + document.addfilter.filternum.value).replaceWith($('#filter-row-template').jqote(filters[i]));
        break;
      }
    }
  }

  $('.filter-default').remove();
  $('.add-filter').toggle();
  document.addfilter.reset();
  document.addfilter.filternum.value = 0; // can't reset() hidden inputs
  localStorage['filters'] = JSON.stringify(filters);
}

function editFilter(num) {
  var filters = JSON.parse(localStorage['filters']);
  var filter = {};

  for (var i = 0; i < filters.length; i++) {
    if (filters[i].num == num) {
      filter = filters[i];
    }
  }

  console.log(filter);
  document.addfilter.filternum.value = filter.num;
  document.addfilter.filtertype.value = filter.type;
  document.addfilter.filtervalue.value = filter.val;
  document.addfilter.regex.checked = filter.regex == true ? true : false;
  $('.add-filter').show();
}

function removeFilter(num) {
  var filters = JSON.parse(localStorage['filters']);

  for (var i = 0; i < filters.length; i++) {
    if (filters[i].num == num) {
      filters.splice(i, 1);
      break;
    }
  }

  localStorage['filters'] = JSON.stringify(filters);
  $('tr#listRow' + num).remove();
}

function loadSavedSettings() {
  for (var i = 0; i < settings.length; i++) {
    if ($('#' + settings[i]).is('input')) {
      if ((localStorage.getItem(settings[i]) == 'false') || (localStorage.getItem(settings[i]) == null)) {
        document.getElementById(settings[i]).checked = "";
      } else {
        document.getElementById(settings[i]).checked = "checked";
      }
    } else {
      document.getElementById(settings[i]).value = localStorage.getItem(settings[i]);
    }
  }
  if ((localStorage.getItem('reverseImgSearchLinks') == null) || (localStorage.getItem('reverseImgSearchLinks') == '')) {
    $('#reverseImgSearchLinks').val("# Remove the hash sign from the services you'd like to use.\n\n# reverse image search\n#//www.google.com/searchbyimage?image_url=%tn\n#//tineye.com/search?url=%tn\n#//3d.iqdb.org/?url=%tn\n#//regex.info/exif.cgi?imgurl=%img\n\n# uploaders:\n#//imgur.com/upload?url=%img\n#//ompldr.org/upload?url1=%img");
  }

  if (localStorage['filters'] !== undefined) {
    $('.filter-default').remove();
    $(JSON.parse(localStorage['filters'])).each(function (i, filter) {
      $('.filter-list').append($('#filter-row-template').jqote(filter));
    });
  }

  $('.tooltip').hide();
}

function imgExpPrep() {
  $("body").on("click", "a.thumbLink", function (e) {
    expandImage(this);
    return false;
  });
}

function qrPrep() {
  var board = sitevars.boarddir;
  $("body").on("click", "a.refLinkInner", function (e) {
    quickReply(this, board);
    e.preventDefault();
  });
}
var previewinprogress;

function quotePreview() {
  $('.thread').on('mouseover', 'a.postlink, a.backlink', function () {
    previewinprogress = $.Deferred();
    $('div[id^=qp_]').remove();
    postlink = this;
    postlinkid = "postlink" + Math.floor((Math.random()*100000)+1);
    crossboard = '';
    if ($(postlink).html().replace(/[^\/]/g, "").length == 2) {
      if ($(postlink).html().replace(/[^0-9]/g, "").length > 0) {
        crossboard = $(postlink).html().replace(/[0-9]*/g, "");
        crossboard = crossboard.replace(/&gt;*/g, "");
        crossboard = crossboard.replace(/[\/]*/g, "");
      } else {
        crossboard = $(postlink).html().replace(/&gt;*/g, "");
        crossboard = crossboard.replace(/[\/]*/g, "");
        return;
      }
    }
    if ($(postlink).attr('class') != 'backlink') {
	  $(postlink).attr('id',postlinkid);
      href = $(postlink).attr('href');
      parentnum = href.substr(href.lastIndexOf('/') + 1, href.indexOf('#') - (href.lastIndexOf('/') + 1)).replace('.html', '');
      quoted = href.substr(href.indexOf('#') + 1);
      if (href.indexOf('#') == -1) {
        quoted = href.substr(href.lastIndexOf('/') + 1).replace('.html', '');
        if (sitevars.noext == 1) {
          jsonlink = href + '.json';
        } else {
          jsonlink = href.replace('.html', '.json');
        }
      } else {
        if (sitevars.noext == 1) {
          jsonlink = href.substr(0, (href.indexOf('#'))) + '.json';
        } else {
          jsonlink = href.substr(0, href.indexOf('#') + 1).replace('.html', '.json');
        }
      }
    } else {
      quoted = $(postlink).attr('id').replace('backlink', '');
    }
    if ($('#reply' + quoted + ",#parent" + quoted).length == 0) {
      cachedposts = getCache(parentnum);
      if (cachedposts) {
        $(cachedposts.posts).each(function (i, item) {
          if (item.no == quoted) {
            item.crossboard = crossboard;
            makeReply(item, function (post) {
              appendPreview(post, quoted);
              previewinprogress.resolve();
            });
          }
        });
      } else {
        $.getJSON(jsonlink, function (data) {
          setCache(parentnum, data);
          $(data.posts).each(function (i, item) {
            if (item.no == quoted) {
              item.crossboard = crossboard;
              makeReply(item, function (post) {
				if($('#' + postlinkid + ':hover').length != 0) {
				//if($(postlink + ':hover').length != 0) {
				  appendPreview(post, quoted);
			    }
			    previewinprogress.resolve();
              });
            }
          });
        });
      }
    } else {
      post = $('#reply' + quoted + ",#parent" + quoted).clone();
      $(post).attr('class',$(post).attr('class').replace('parentPost','reply'));
      $(post).attr('id', 'qp_' + $(post).attr('id'));
      $(post).css('position', 'absolute');
      $(post).css('display', 'block');
      $(post).css('border', "1px solid #9E9E9E");
      $(post).find('div[id^=iq]').remove();
      if ($(post).find('a.thumbLink').children('img.expandedThumb').length) $(post).find('a.thumbLink').each(function (e) {
        expandImage(this)
      });
      $(document).mousemove(function (e) {
        previewOffsetY = $(post).height();
        $(post).css('top', (e.pageY - (previewOffsetY + 10)) + "px");
        $(post).css('left', (e.pageX + 50) + "px");
      });
      if ($('#qp_reply' + quoted).length == 0) $('body').append(post);
      previewinprogress.resolve();
    }
  });
  $('.thread').on('mouseout', 'a.postlink, a.backlink', function () {
    $(document).off('mousemove');
    href = $(this).attr('href');
    quoted = href.substr(href.indexOf('#') + 1);
    if ($(previewinprogress).length <= 0) return;
    $.when(previewinprogress).then(function () {
      $('div[id^=qp_]').remove();
    });
  });
}

function appendPreview(post, quoted) {
  post = $(post).children('.reply');
  $(post).attr('id', 'qp_' + $(post).attr('id').replace('parent','reply'));
  $(post).css('position', 'absolute');
  $(post).css('border', "1px solid #9E9E9E");
  $(post).css('display', 'block');
  $(post).addClass('qp_reply');
  $(document).mousemove(function (e) {
    previewOffsetY = $(post).height();
    $(post).css('top', (e.pageY - (previewOffsetY + 10)) + "px");
    $(post).css('left', (e.pageX + 50) + "px");
  });
  if ($('#qp_reply' + quoted).length == 0) $('body').append(post);
}

function inlineQuote() {
  $(".thread").on("click", "a.postlink, a.backlink", function (e) {
    $('div[id^=qp_]').remove();
    postlink = this;
    e.preventDefault();
    inlineinprogress = $.Deferred();
    crossboard = '';
    if ($(postlink).html().replace(/[^\/]/g, "").length == 2) {
      if ($(postlink).html().replace(/[^0-9]/g, "").length > 0) {
        crossboard = $(postlink).html().replace(/[0-9]*/g, "");
        crossboard = crossboard.replace(/&gt;*/g, "");
        crossboard = crossboard.replace(/[\/]*/g, "");
      } else {
        crossboard = $(postlink).html().replace(/&gt;*/g, "");
        crossboard = crossboard.replace(/[\/]*/g, "");
        window.location.href = sitevars.domain + crossboard;
      }
    }
    if ($(postlink).attr('class') != 'backlink') {
      href = $(postlink).attr('href');
      parentnum = href.substr(href.lastIndexOf('/') + 1, href.indexOf('#') - (href.lastIndexOf('/') + 1)).replace('.html', '');
      quoted = href.substr(href.indexOf('#') + 1);
      if (href.indexOf('#') == -1) {
        quoted = href.substr(href.lastIndexOf('/') + 1).replace('.html', '');
        if (sitevars.noext == 1) {
          jsonlink = href + '.json';
        } else {
          jsonlink = href.replace('.html', '.json');
        }
      } else {
        if (sitevars.noext == 1) {
          jsonlink = href.substr(0, (href.indexOf('#'))) + '.json';
        } else {
          jsonlink = href.substr(0, href.indexOf('#') + 1).replace('.html', '.json');
        }
      }
    } else {
      quoted = $(postlink).attr('id').replace('backlink', '');
    }
    if (($(postlink).next('#iq_reply' + quoted).length == 0) && ($(postlink).parent().parent().parent('.parentPost, .reply').children('#iq_reply' + quoted).length == 0)) {
      if ($('#reply' + quoted + ",#parent" + quoted).length == 0) {
        cachedposts = getCache(parentnum);
        if (cachedposts) {
          $(cachedposts.posts).each(function (i, item) {
            if (item.no == quoted) {
              item.crossboard = crossboard;
              makeReply(item, function (post) {
                appendInlineQuote(quoted, post, postlink);
                inlineinprogress.resolve();
              });
            }
          });
        } else {
          $.getJSON(jsonlink, function (data) {
            setCache(parentnum, data);
            $(data.posts).each(function (i, item) {
              if (item.no == quoted) {
                item.crossboard = crossboard;
                makeReply(item, function (post) {
                  appendInlineQuote(quoted, post, postlink);
                  inlineinprogress.resolve();
                });
              }
            });
          });
        }
      } else {
        post = $('#reply' + quoted + ",#parent" + quoted).clone();
		$(post).attr('class',$(post).attr('class').replace('parentPost','reply'));
        $(post).attr('id', 'iq_' + $(post).attr('id').replace('parent','reply'));
        $(post).css('border', "1px solid #9E9E9E");
        $(post).find('div[id^=iq]').remove();
        if ($(post).find('a.thumbLink').children('img.expandedThumb').length) {
          $(post).find('a.thumbLink').each(function (e) {
            expandImage(this)
          });
        }
        if ($(postlink).next('#iq_reply' + quoted).length == 0)
          if ($(postlink).attr('class') != 'backlink') $(postlink).after(post);
          else {
            if (isMobile()) {
              $(post).css('box-sizing', 'border-box');
            }
            $(postlink).parent().parent().parent().children('blockquote').before(post);
          }
        inlineinprogress.resolve();
      }
    } else {
      if ($(postlink).attr('class') != 'backlink') $(postlink).next('#iq_reply' + quoted).remove();
      else $(postlink).parent().parent().parent().children('#iq_reply' + quoted).remove();
    }
  });
}

function appendInlineQuote(quoted, post, postlink) {
  post = $(post).children('.reply');
  $(post).attr('id', 'iq_' + $(post).attr('id'));
  $(post).css('border', "1px solid #9E9E9E");
  if ($(postlink).next('#iq_reply' + quoted).length == 0) $(postlink).after(post);
}

function updaterPrep() {
  if (postsAdded < 1) {
    if (document.body.className == "replypage") {
      var updateLink = document.createElement('a');
      updateLink.innerHTML = "<a style='position: fixed; padding: 5px; right: 0; bottom:0;' id='threadUpdaterButton' href='javascript:void(0)' onclick='threadUpdater()'>Auto update</a>";
      document.body.appendChild(updateLink);
    }
  }
}

function hideThreadPrep() {
  if (document.body.className != "indexpage") return;
  if ($('#postFormToggle').css('display') == 'none') {
    $('.parentPost').each(function () {
      var parentpost = this;
      if ($(parentpost).children('.fileinfo').length != 0) {
        $(parentpost).children('.fileinfo').children('span.filesize').before("<a class=\"hidePostButton hideThreadButton\" href=\"javascript:void(0)\">[ - ]</a> ");
      } else {
        $(parentpost).children('.parentPostInfo').children('input[name="delete"]').before("<a class=\"hidePostButton hideThreadButton noFileInfo\" href=\"javascript:void(0)\">[ - ]</a> ");
      }
      if (localStorage["threadHidden" + $(parentpost).attr('id')] == 'true') {
        console.log(filtered.indexOf($(parentpost).attr('id')));
        if (filtered.indexOf($(parentpost).attr('id')) != -1) return;
        toggleThread($(parentpost).find('.hideThreadButton').last());
      }
    });
    $('.hideThreadButton').on('click', function () {
      toggleThread(this);
    });
  } else {
    $('.mobilePostReplyLink').children('a.button').after('<a class="button hidePostButton" href="javascript:void(0)">Hide</a>');
    $('.hidePostButton.button').on('click', function () {
      var parentPost = $(this).parentsUntil('.thread').last().children().first().attr('id').replace('parent', '');
      hideThreadMobile(this, parentPost);
    });
    $('.hidePostButton.button').each(function () {
      var parentPost = $(this).parentsUntil('.thread').last().children().first().attr('id').replace('parent', '');
      if (localStorage.getItem("thread" + parentPost + "Hidden") == 'true') {
        if (filtered.indexOf('parent' + $(parentPost).attr('id')) != -1) return;
        hideThreadMobile(this, parentPost);
      }
    });
  }
}

function hideReplyPrep() {
  doubledashes = $('.doubledash:not(.processed)');
  doubledashes.html("<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>");
  doubledashes.attr('class', 'doubledash processed');
  doubledashes.bind('click', function () {
    hidePost(this.nextElementSibling.id)
  });
  doubledashes.each(function (e) {
    if (localStorage.getItem(this.nextElementSibling.id + "Hidden") == 'true') {
      if (filtered.indexOf(this.nextElementSibling.id) != -1) return;
      hidePost(this.nextElementSibling.id);
    }
  });
}

function postExpansionPrep() {
  if (document.body.className == "threadpage") return;
  var links = document.getElementsByClassName("abbrev");
  for (var i = 0; i < links.length; i++) {
    var child = links[i].firstElementChild;
    if (!child) continue;
    child.addEventListener("click", function (e) {
      expandPost(this);
      e.preventDefault();
    }, true);
  }
}

function backlinkPrep() {
  var postlinks = $('.postlink');
  var bls = $('.backlink').length;
  $(postlinks).each(function (taargus) {
    if (($(this).parent('.capcodeReplies').length == 0) && ($(this).attr('href').indexOf("#") != -1) && ($(this).attr('href').indexOf('http') == -1)) {
      var postNum = $(this).text().replace(">>", "");
      postNum = postNum.replace(" (OP)", "");
      postNum = postNum.replace(" (You)", "");
      postNum = postNum.replace(" (Cross-Thread)", "");
      var posts = $('#reply' + postNum + ", #parent" + postNum);
      var postLinkContainerNum = $(this).parents(".reply, .parent").last().attr('id').replace("reply", "");
      postLinkContainerNum.replace("parent", "");
      var backlink = document.createElement("a");
      backlink.innerHTML = "&gt;&gt;" + postLinkContainerNum;
      backlink.href = "javascript:void(0);"
      backlink.id = "backlink" + postLinkContainerNum;
      backlink.className = "backlink";
      backlink.style.paddingRight = "3px";
      if ($(posts).find("#backlink" + postLinkContainerNum).length == 0) $(posts).find('.rightblock').append(backlink);
    }
  });
}

function highlightPosts(identifier) {
  if (identifier != undefined) {
    $(".reply.highlight").attr("class", "reply");
    if (identifier.className == "postername") {
      if (identifier.firstElementChild != null) {
        if (identifier.firstElementChild.className == "adminName") {
          var thread = $(identifier).parentsUntil("div.thread").parent()[0];
          $(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class', 'reply highlight');
        }
      } else if (identifier.nextElementSibling.className == "postertrip") {
        identifier = identifier.nextElementSibling;
        var thread = $(identifier).parentsUntil("div.thread").parent()[0];
        $(thread).children("div.replyContainer").children('div.reply:contains("' + $(identifier).text() + '")').attr('class', 'reply highlight');
      } else {
        console.log("Nothing to identify by");
      }
    } else if (identifier.className == "postertrip") {
      if (identifier.firstElementChild != null) {
        if (identifier.firstElementChild.className == "adminTrip") {
          var thread = $(identifier).parentsUntil("div.thread").parent()[0];
          $(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class', 'reply highlight');
        }
      } else {
        var thread = $(identifier).parentsUntil("div.thread").parent()[0];
        $(thread).children("div.replyContainer").children('div.reply:contains("' + $(identifier).text() + '")').attr('class', 'reply highlight');
      }
    } else if (identifier.className == "posteridnum") {
      var thread = $(identifier).parentsUntil("div.thread").parent()[0];
      $(thread).children("div.replyContainer").children('div.reply:contains(' + $(identifier).text() + ')').attr('class', 'reply highlight');
    }
  } else {
    $("body").on("click", "span.postername", function () {
      highlightPosts(this)
    });
    $("body").on("click", "span.postertrip", function () {
      highlightPosts(this)
    });
    $("body").on("click", "span.posteridnum", function () {
      highlightPosts(this)
    });
  }
}

function expandFilename(filename, mode) {
  if (typeof filename !== 'undefined') {
    var oldName = $(filename).text();
    if (mode == 0) {
      $(filename).text($(filename).attr("title"));
      $(filename).attr("title", oldName);
    } else {
      $(filename).text($(filename).attr("title"));
      $(filename).attr("title", oldName);
    }
  } else {
    $(".thread").on("mouseover", ".filesize > a:first-child", function () {
      expandFilename(this, 0)
    });
    $(".thread").on("mouseout", ".filesize > a:first-child", function () {
      expandFilename(this, 1)
    });
  }
}

function toggleThread(button, firstpost) {
  if (firstpost === undefined) {
    var thread = $(button).parentsUntil('.thread').last().parent();
    var op = $(thread).children('.parentContainer').children('.parentPost');
    var opid = $(op).attr('id');
    if ($(button).attr('class').indexOf('revealThreadButton') == -1) {
      var poststub = "<a class='hidePostButton revealThreadButton' id='threadHidden" + opid + "' href='javascript:void(0)'>[ + ] Thread Hidden</a>";
      $(thread).children('.replyContainer, .parentContainer, .omittedposts').css('display', 'none');
      $(thread).append(poststub);
      localStorage["threadHidden" + opid] = true;
      $('.revealThreadButton').on('click', function () {
        thread = $(this).parent();
        op = $(thread).children('.parentContainer').children('.parentPost');
        opid = $(op).attr('id');
        $('#threadHidden' + opid).remove();
        $(thread).children('.replyContainer, .parentContainer, .omittedposts').css('display', 'block');
        localStorage.removeItem("threadHidden" + opid);
      });
    }
  } else {
    var thread = firstpost.parentElement.parentElement;
    var poststub = "<a class='hidePostButton revealThreadButton' id='threadHidden" + firstpost.id + "' href='javascript:void(0)'>[ + ] Thread Hidden</a>";
    $(thread).children('.replyContainer, .parentContainer, .omittedposts').css('display', 'none');
    $(thread).append(poststub);
    $('.revealThreadButton').on('click', function () {
      thread = $(this).parent();
      op = $(thread).children('.parentContainer').children('.parentPost');
      opid = $(op).attr('id');
      $('#threadHidden' + opid).remove();
      $(thread).children('.replyContainer, .parentContainer, .omittedposts').css('display', 'block');
    });
  }
}

function markPosts() {
  var postlinks = $('.postlink');
  for (var i = 0; i < postlinks.length; i++) {
    var jsonObject = {
      "parent": $('#post_form').children('input[name="parent"]').attr('value'),
      "num": $(postlinks[i]).text().replace(">>", "")
    }
    for (var a = 0; a < yourPosts.length; a++) {
      if (yourPosts[a] !== null) {
        if (jsonObject.num == yourPosts[a].num) {
          $(postlinks[i]).text($(postlinks[i]).text() + " (You)");
        }
      }
    }
  }
}

function fixedNav() {
  if (window.location.href.indexOf("admin") == -1) {
    $('.topNavContainer').css('display', 'block');
    $('.logo').css('margin-top', '25px');
  }
}

function titleFactory(mode) {
  if (mode == 1) {
    finalDivScrollPos = $('.reply.newPost').last().scrollTop();
    document.title = "(" + postsInTitle + ") " + $(".parentPost").children('blockquote').first().text();
    return;
  } else if (isOn == 1) {
    if ($('.newPost').last().length) {
      if (($(document).scrollTop() - 100) > ($('.newPost').last().offset().top - $(window).height())) {
        postsInTitle = 0;
        document.title = "(" + postsInTitle + ") " + $(".parentPost").children('blockquote').first().text();
        $('.unreadMarker').css('box-shadow', '');
        $('.reply.newPost').attr('class', 'reply post');
        $('.reply.unreadMarker').attr('class', 'reply post');
        $('.reply.newPost.highlight').attr('class', 'reply highlight');
      }
    }
  }
}
$(document).scroll(function () {
  titleFactory()
});

function doIt(again) {
  if (sitevars.noext == 1) {
    ext = "";
  }
  if ($('body').attr('class')) {
    if (!again) {
      if (/WebKit/.test(navigator.userAgent) == false) {
        $('.post').each(function (i, v) {
          if (localStorage['filters'] !== undefined) {
            checkFiltered(v);
          }
        });
      }
      if (localStorage.getItem('qRep') == 'true') {
        qrPrep();
      }
      if (localStorage.getItem('quotePreview') == 'true') {
        quotePreview();
      }
      if (localStorage.getItem('inlineExpansion') == 'true') {
        imgExpPrep();
      }
      if (localStorage.getItem('expandFilename') == 'true') {
        expandFilename();
      }
      if (localStorage.getItem('fixedNav') == 'true') {
        fixedNav();
      }
      if (localStorage.getItem('inlineQuote') == 'true') {
        inlineQuote();
      }
      if (localStorage.getItem('threadUpdater') == 'true') {
        updaterPrep();
      }
      if (localStorage.getItem('expandThreads') == 'true') {
        expandThread(1);
      }
      if (localStorage.getItem('threadHiding') == 'true') {
        hideThreadPrep();
      }

      if (localStorage['showtooltip'] === undefined) {
        $('a[onclick="toggleNavMenu(this,0);"]').each(function (i, v) {
          if ($(v).is(':visible')) {
            $('body').append('<div id="tooltip' + i + '" class="tooltip" style="z-index:9002;font-weight:bold;position:absolute;background:#65b1eb;color:#444;border-radius:2px;padding:10px 15px;right:0">Change your settings.</div>');
            $('body').append('<div id="tooltiparrow' + i + '" class="tooltip" style="z-index:9002;position:absolute;width:0;height:0;border-left: 5px solid transparent;border-right: 5px solid transparent;border-bottom: 5px solid #65b1eb;"></div>');
            $('#tooltip' + i).css('right', $(window).width() - $(v).offset().left - $(v).width() - 5 + 'px');
            $('#tooltip' + i).css('top', $(v).offset().top + $(v).height() + 10 + 'px');

            $('#tooltiparrow' + i).css('left', ($(v).offset().left + $(v).width() / 2) + 'px');
            $('#tooltiparrow' + i).css('top', $(v).offset().top + $(v).height() + 5 + 'px');
            $('.footer').css('margin-bottom', '15px');

            if (isMobile()) {
              if (i == 1) {
                $('#tooltiparrow' + i).css('top', $(v).offset().top + $(v).height() + 10 + 'px');
                $('#tooltip' + i).css('top', $(v).offset().top + $(v).height() + 15 + 'px');
              }
              $('#tooltip' + i).css('right', $(window).width() - $(v).offset().left - $(v).width() + 'px');
              $('#tooltiparrow' + i).css('left', ($(v).offset().left + $(v).width() / 2.5) + 'px');
              $('.tooltip').css('z-index', 0);
              $('#tooltip' + i).addClass('mobile');
              $('#tooltiparrow' + i).addClass('mobile');
            }
          }
        });

        if (isMobile()) {
          $('body').append('<div id="tooltippost" class="tooltip" style="z-index:9002;font-weight:bold;position:absolute;background:#65b1eb;color:#444;border-radius:2px;padding:10px 15px">Try tapping on a post for additional options.</div>');
          $('body').append('<div id="tooltiparrowpost" class="tooltip" style="z-index:9002;position:absolute;width:0;height:0;border-left: 5px solid transparent;border-right: 5px solid transparent;border-bottom: 5px solid #65b1eb;"></div>');
          $('#tooltippost').css('left', '50%');
          $('#tooltippost').css('width', '250px');
          $('#tooltippost').css('margin-left', '-140px');
          $('#tooltippost').css('top', $('.mobilePostReplyLink').first().offset().top + $('.mobilePostReplyLink').first().height() + 10 + 'px');

          $('#tooltiparrowpost').css('left', '50%');
          $('#tooltiparrowpost').css('top', $('.mobilePostReplyLink').first().offset().top + $('.mobilePostReplyLink').first().height() + 5 + 'px');
        }
      }

      highlightPosts();
      threadGallery();
    }

    if (localStorage.getItem('embedMedia') == 'true') {
      embedMedia();
    }
    if (localStorage.getItem('markPosts') == 'true') {
      markPosts();
    }
    if (localStorage.getItem('replyHiding') == 'true') {
      hideReplyPrep();
    }
    if (localStorage.getItem('anonymize') == 'true') {
      anonymize();
    }
    if (localStorage.getItem('expandPosts') == 'true') {
      postExpansionPrep();
    }
    if (localStorage.getItem('inlineQuote') == 'true') {
      $('a.postlink').removeAttr("onclick");
    }
    if (localStorage.getItem('replyBacklinking') == 'true') {
      backlinkPrep();
    }
    if (localStorage.getItem('reverseImgSearch') == 'true') {
      makeReverseSearchLinks();
    }
    prettyPrint();
  }
}
var postsfetched = [];

function getCache(parentnum) {
  if ($(postsfetched[parentnum]).length == 0) {
    return null;
  } else {
    return postsfetched[parentnum];
  }
}

function setCache(parentnum, posts) {
  postsfetched[parentnum] = posts;
}

function threadGallery() {
  $('.gallerylink').on('click', function () {
    var thumblinks = $('.thumbLink');
    $('body').append('<div id="gallery-overlay" class="overlay" style="display:block;text-align:center;"></div>');

    if ($('.topNavContainer').css('display') == 'block') {
      $('#gallery-overlay').css('margin-top', '35px');
    }

    thumblinks.each(function (i, v) {
      var tba = ['<a target="_blank" href="' + $(v).attr('href') + '" class="galleryimage" style="text-decoration:none">', '<img style="display:inline-block;margin: 15px;vertical-align: top;box-shadow: 0 0 2px rgba(0,0,0,0.5);max-width:150px" src="' + $(v).children('img').attr('src') + '">', '</a>'].join('\n');
      $('#gallery-overlay').append(tba);
    });
    /*$('.galleryimage').on('click', function(e) {
		  e.preventDefault();
	  });*/
  });

  $(document).mouseup(function (e) {
    var container = $("#gallery-overlay");
    if ($('#gallery-overlay').css('display') == "block") {
      if (container.has(e.target).length === 0) {
        $('#gallery-overlay').css('display', 'none');
        $('#gallery-overlay').remove();
      }
    }
  });
}

function makeReverseSearchLinks() {
  if (localStorage['reverseImgSearchLinks'] == null) return;
  links = localStorage['reverseImgSearchLinks'].split('\n');
  $('.thumbLink').each(function (i, img) {
    append = 0;
    if ($(img).parent('.reply, .parentPost').length != 0) {
      append = 1 ? ($(img).parent().children('.fileinfo').children('.filesize').children('.reverseimglink').length == 0) : 0;
    } else {
      append = 1 ? $(img).parentsUntil('.reply, .parentPost').last().parent().children('.fileinfo').children('.filesize').children('.reverseimglink').length == 0 : 0;
    }
    $(links).each(function (a, link) {
      if ((link.indexOf('#') != 0) && (link.length > 1)) {
        link = link.replace('%tn', encodeURIComponent(sitevars.domain.substr(0, sitevars.domain.length - 1).replace('//', 'http://') + $(img).children('img').attr('src')));
        link = link.replace('%img', encodeURIComponent(sitevars.domain.substr(0, sitevars.domain.length - 1).replace('//', 'http://') + $(img).attr('href')));
        link = link.replace('%md5', encodeURIComponent($(img).children('img').attr('data-md5')));
        reallink = document.createElement('a');
        reallink.href = link;
        linktext = reallink.host.substr(0, reallink.host.lastIndexOf('.')).replace('www.', '');
        reallink = ' <a target="_blank" class="reverseimglink" href="' + reallink + '">' + linktext + '</a>';
        if ($(img).parent('.reply, .parentPost').length != 0) {
          if (append) {
            $(img).parent().children('.fileinfo').children('.filesize').append(reallink);
          }
        } else {
          if (append) {
            $(img).parentsUntil('.reply, .parentPost').last().parent().children('.fileinfo').children('.filesize').append(reallink);
          }
        }
      }
    });
  });
}

function embedMedia() {
  var links = [];
  var re = /^(?:www\.)?youtu(?:be)?\.[a-z.]{2,6}$/;
  $('blockquote').find('a').not('postlink').each(function (i, v) {
    if (re.test(v.host)) {
      $(v).on('click', function (e) {
        e.preventDefault();
        if ($(v).next('.embed').length == 0) {
          var id = v.href.match(/(?:\/watch\?v\=|\.be\/)(.{11})/);
          $(v).after('<div class="embed"><iframe width="560" height="315" src="//www.youtube.com/embed/' + id[1] + '" frameborder="0" allowfullscreen></iframe></div>');
          if (isMobile()) {
            $('.embed').children('iframe').attr('height', '');
            $('.embed').children('iframe').width($('.embed').parentsUntil('.post').parent().width() - $('.embed').offset().left - 5);
          }
        } else {
          $(v).next('.embed').remove();
        }
      });
    }
  });
}

function expandPost(link) {
  if (link.hash) {
    $.get(link, function (data) {
      var loadedPost = $(data).find("#reply" + link.hash.replace("#", ""));
      document.getElementById("reply" + link.hash.replace("#", "")).lastElementChild.innerHTML = $(loadedPost).find("blockquote").last().html();
    });
  } else {
    $.get(link, function (data) {
      var loadedPost = $(data).find("#parent" + link.pathname.substring(link.pathname.lastIndexOf("/") + 1).replace('.html', ''));
      document.getElementById("parent" + link.pathname.substring(link.pathname.lastIndexOf("/") + 1).replace('.html', '')).lastElementChild.innerHTML = $(loadedPost).find("blockquote").last().html();
    });
  }
}

function expandThread(init, link) {
  if (!isMobile()) {
    if (typeof link !== 'undefined') {
      id = $(link).parent().parent().children('.parentContainer').last().children('.parentPost').last().attr('id').replace(/[^0-9]*/g, '');
      threadurl = sitevars.boardpath + 'res/' + id + '.json';
      console.log(threadurl);
      expansioninprogress = $.Deferred();
      $(link).parent().parent().children('.replyContainer').remove();
      $.getJSON(threadurl, function (data) {
        $(data.posts).each(function (i, item) {
          makeReply(item, function (post) {
            if (item.no != $(link).parent().parent().find('.parentPost').attr('id').replace(/[^0-9]*/g, '')) {
              $(link).parent().parent().append(post);
            }
          });
        });
        $(link).parent().remove();
        expansioninprogress.resolve();
      });
      $.when(expansioninprogress).then(function () {
        doIt(1);
      });
    } else {
      $('.omittedposts').each(function () {
        $(this).html('<a class="expandthread" href="javascript:void(0)">+ ' + $(this).html().replace('Reply', 'here') + '</a>');
      });
      $('.thread').on('click', '.expandthread', function (e) {
        expandThread(0, this);
      });
    }
  }
}

function anonymize() {
  names = document.getElementsByClassName('postername');
  names2 = document.getElementsByClassName('commentpostername');
  for (var i = 0; i < names.length; i++) {
    names[i].innerHTML = "Anonymous";
    if (names[i].nextElementSibling != null) {
      if (names[i].nextElementSibling.className == "postertrip") {
        names[i].nextElementSibling.outerHTML = "";
      }
    }
  }
  for (var i = 0; i < names2.length; i++) {
    names2[i].innerHTML = "Anonymous";
    if (names2[i].nextElementSibling != null) {
      if (names2[i].nextElementSibling.className == "postertrip") {
        names2[i].nextElementSibling.outerHTML = "";
      }
    }
  }
}

function quickReply(refLink, board) {
  var data = {};

  if (document.getElementById("qr-form") == null) {
    data.parent = $(refLink).parentsUntil("div.thread").parent()[0].firstElementChild.firstElementChild.id.replace("parent", "");

    data.ref = ">>" + refLink.innerHTML.replace('No.', '') + "\n";
    data.action = sitevars.self;
    data.password = document.getElementById('password').value;

    if ((sitevars.captcha !== undefined && sitevars.admin === undefined)) {
      if (hasPass == 0) {
        data.captcha = 1;
      }
    }

    if (sitevars.admin !== undefined) {
      data.admin = document.getElementsByName("admin")[0].value;
    }

    if ((localStorage['qrtemplate'] != null) && (localStorage['qrtemplate_ver'] == qrtemplatever)) {
      $('body').jqoteapp(localStorage['qrtemplate'], data);

      if (isMobile()) {
        $("#qr-form").css('position', 'absolute');
        $("#qr-form").css('top', window.pageYOffset);
      } else if ($(".topNavContainer").css('display') != "none") {
        $("#qr-form").css('margin-top', '35px');
      }

      formStuff();
    } else {
      $.ajax({
        type: 'GET',
        url: sitevars.domain + 'js/qr-template',
        success: function (tpl) {
          localStorage['qrtemplate_ver'] = qrtemplatever;
          localStorage['qrtemplate'] = tpl;

          $('body').jqoteapp(tpl, data);

          if (isMobile()) {
            $("#qr-form").css('position', 'absolute');
            $("#qr-form").css('top', window.pageYOffset);
          } else if ($(".topNavContainer").css('display') != "none") {
            $("#qr-form").css('margin-top', '35px');
          }

          formStuff();
        }
      });
    }
  } else {
    if (document.qrform.parent.value != $(refLink).parentsUntil("div.thread").parent()[0].firstElementChild.firstElementChild.id.replace("parent", "")) {
      closeQuickReply();
      quickReply(refLink, board);
    } else {
      document.qrform.field4.value += ">>" + refLink.innerHTML.replace('No.', '') + "\n";
      if (isMobile()) {
        $("#qr-form").css('top', window.pageYOffset);
      }
    }
  }
}

function setSubmitText() {
  document.getElementById("qrfield3s").value = "...";
}

function submitPost(form) {
  setSubmitText();
  var oReq = new XMLHttpRequest();
  oReq.onload = ajaxSuccess;
  oReq.open("post", sitevars.self, true);
  oReq.send(form);
}

function formStuff() {
  $('#qr-form').parent().submit(function (e) {
    e.preventDefault();
    var form = this;
    var formdata = new FormData(form);

    if ((sitevars.preval !== undefined) && (hasPass != 1) && (sitevars.admin === undefined)) {
      var prevalreq = {
        task: "preval",
        challenge: form.recaptcha_challenge_field.value,
        response: form.recaptcha_response_field.value,
        parent: $(form).find('input[name=parent]').val()
      };

      prevalreq = JSON.stringify(prevalreq);

      $.ajax({
        url: sitevars.self,
        type: "POST",
        data: prevalreq,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
          if (data.key !== undefined) {
            formdata.append('preval', data.key);
            submitPost(formdata);
          } else {
            if (data.error !== undefined) {
              document.getElementById("qr-error").innerHTML = data.error;
            }
            document.getElementById("qrfield3s").value = "Submit";

            if ((sitevars.captcha == 1) && (sitevars.admin === undefined)) {
              Recaptcha.reload("t");
            }
          }
        }
      });
    } else {
      submitPost(formdata);
    }
  });
}

function ajaxSuccess() {
  var yourPost = this.responseText;
  var data = this.responseText;
  if (data.indexOf("errorMessage") == -1) {
    yourPost = JSON.parse(yourPost);
    yourPosts.push(yourPost);
    sessionStorage["yourPosts"] = JSON.stringify(yourPosts);
    document.getElementById("qr-error").innerHTML = "";
    closeQuickReply();
    if ((sitevars.captcha == 1) && (sitevars.admin === undefined)) {
      Recaptcha.reload("t");
    }
  } else {
    $responseObj = $(data);
    document.getElementById("qr-error").innerHTML = $responseObj.filter('#errorMessage').html();
    document.getElementById("qrfield3s").value = "Submit";

    if ((sitevars.captcha == 1) && (sitevars.admin === undefined)) {
      Recaptcha.reload("t");
    }
  }
}

function qrAjaxSubmit() {
  $(document).ready(function () {
    var options = {
      error: showResponse,
      success: showResponse
    };
  });
}

function showResponse(responseText, statusText, xhr, $form) {
  if (responseText.indexOf("errorMessage") == -1) {
    document.getElementById("qr-error").innerHTML = "";
    closeQuickReply();
    if ((sitevars.captcha == 1) && (sitevars.admin === undefined)) {
      Recaptcha.reload("t");
    }
  } else {
    document.getElementById("qr-error").innerHTML = "Something went wrong.";
    document.getElementById("qrfield3s").value = "Try again";
  }
}

function deleteAjaxSubmit() {
  $(document).ready(function () {
    $('#delform').ajaxForm(function () {
      console.log("Deleted?");
    });
  });
}

function closeQuickReply() {
  $('#qr-form').parent().remove();
}

function expandImage(thumbLink) {
  var image = thumbLink.firstElementChild;
  var fullImage = document.createElement('img');
  fullImage.src = thumbLink.href;
  var dicks = 0;
  if (image.className.indexOf("expandedThumb") == -1) {
    var pageWidth = window.innerWidth;
    var offset = findPos(image);
    if(thumbLink.href.indexOf('.webm') == -1) {
      image.src = thumbLink.href;
      image.removeAttribute("style");
      image.className += " expandedThumb";
      image.onload = function () {
        if (image.naturalWidth > pageWidth - offset) {
          var difference = image.naturalWidth - (pageWidth - offset);
          if (isMobile()) {
            $(image).css('cssText', "width:" + ($(image).parentsUntil('.post').parent().width() - 20) + "px!important");
          } else {
            image.style.width = (image.naturalWidth - difference) - 100 + "px";
          }
        }
      }
    }
    else {
      $(image).replaceWith(function() {
        var video = document.createElement('video');
        var naturalwidth = $(thumbLink).attr('data-width');
        $(video).attr('src', thumbLink.href);
        $(video).attr('autoplay', true);
        $(video).attr('loop', true);
        $(video).addClass('thumb');
        $(video).addClass('expandedThumb');

        if ($(image).hasClass('opThumb')) {
          $(video).addClass('opThumb');
        }

        if (naturalwidth > pageWidth - offset) {
          var difference = naturalwidth - (pageWidth - offset);
          if (isMobile()) {
            var mobilewidth = ($(image).parentsUntil('.post').parent().width() - 20);
            $(video).css('cssText', "width:" + mobilewidth + "px!important");
            $(video).attr('width',mobilewidth)
          } else {
            video.style.width = (naturalwidth - difference) - 100 + "px";
            $(video).attr('width',video.style.width);
          }
        }

        if((isMobile()) && (/WebKit/.test(navigator.userAgent)))
          video.play();

        return video;
      });
    }
  } else {
    var thumbFname = thumbLink.href.substring(thumbLink.href.lastIndexOf("src/") + 4, thumbLink.href.lastIndexOf("src/") + 17);
    if(thumbLink.href.indexOf('.webm') != -1) {
      $(image).replaceWith(function() {
        var replacement = document.createElement('img');
        var sizefactor = 1;
        $(replacement).addClass('thumb');
        if ($(image).hasClass('opThumb')) {
          $(replacement).addClass('opThumb');
        }
        else {
          $(replacement).addClass('replythumb');
          sizefactor = .504
        }
        replacement.src = sitevars.boardpath + 'thumb/' + thumbFname + 's.jpg';
        replacement.style.width = $(thumbLink).attr('data-tnwidth') * sizefactor + "px";
        replacement.style.height = $(thumbLink).attr('data-tnheight') * sizefactor + "px";

        return replacement;
      });
    }
    else {
      image.src = image.src.replace(/src\/[0-9]*\.[a-z]{3,4}/, 'thumb/' + thumbFname + 's.jpg');
    }
    image.removeAttribute("style");
    dicks = 1;
    if (image.className.indexOf("opThumb") == -1) {
      image.className = "thumb replyThumb";
      image.onload = function () {
        if (dicks) {
          image.style.width = image.naturalWidth * .504 + "px";
          image.style.height = image.naturalHeight * .504 + "px";
          dicks = 0;
        }
      }
      if (window.pageYOffset > findPosY(image)) {
        window.scroll(0, findPosY(image) - 75);
      }
    } else {
      image.className = "thumb opThumb";
      if (window.pageYOffset > findPosY(image)) {
        window.scroll(0, findPosY(image) - 75);
      }
    }
  }

  return true;
}

function expandAllImages() {
  $('a.thumbLink').each(function (e) {
    expandImage(this)
  });
}

function threadUpdater() {
  if (isOn == 0) {
    console.log("Thread updater started.");
    updateThread();
    updaterCounter();
    isOn = 1;
  } else {
    console.log("Thread updater stopped");
    clearTimeout(updaterTimer);
    clearTimeout(updaterTimeLeft);
    isOn = 0;
    document.getElementById("threadUpdaterButton").innerHTML = "Auto update";
  }
}

function updaterCounter() {
  if (timeLeft == 0) {
    timeLeft = 15;
  }
  timeLeft--;
  document.getElementById("threadUpdaterButton").innerHTML = "-" + timeLeft;
  updaterTimeLeft = setTimeout("updaterCounter()", 1000);
}

function updateThread() {
  $.ajax({
    type: 'HEAD',
    dataType: 'json',
    url: sitevars.boardpath + 'res/' + $('.parentPost').attr('id').replace('parent', '') + '.json',
    success: function (data, status, xhrobj) {
      if (modified != xhrobj.getResponseHeader('Last-Modified')) {
        modified = xhrobj.getResponseHeader('Last-Modified');
        $.ajax({
          type: 'GET',
          dataType: 'json',
          url: sitevars.boardpath + 'res/' + $('.parentPost').attr('id').replace('parent', '') + '.json',
          success: function (data, status, xhrobj) {
            var newPosts = [];
            var lastPost = $('.reply, .parentPost').last().attr('id').replace("reply", "");
            lastPost = lastPost.replace("parent", "")
            var deferreds = $(data.posts).map(function (i, post) {
              if (post.no > lastPost) {
                var deferred = $.Deferred();
                makeReply(post, function (reply) {
                  newPosts.push(reply);
                  deferred.resolve();
                });
                return deferred;
              }
            });
            $.when.apply(null, deferreds).then(function () {
              if (newPosts.length > 0) {
                if (postsInTitle == 0) {
                  $('.reply').last().attr('class', 'reply unreadMarker post');
                  $('.reply').last().css('box-shadow', '0 3px red');
                }
                $('.thread').append(newPosts);
                postsInTitle = $('.reply.newPost').length;
                titleFactory(1);
                doIt(1);
              }
            });
          }
        });
      }
      clearTimeout(updaterTimer);
      clearTimeout(updaterTimeLeft);
      timeLeft = 0;
      updaterTimer = setTimeout("updateThread()", 15000);
      updaterCounter();
    }
  });
}

function makeReply(data, callback) {
  var reply = document.createElement('div');
  if (data.crossboard) {
    data.boarddir = sitevars.boarddir.replace(sitevars.boarddir, data.crossboard);
    data.boardpath = sitevars.boardpath.replace(sitevars.boarddir, data.crossboard);
  } else {
    data.boarddir = sitevars.boarddir;
    data.boardpath = sitevars.boardpath;
  }
  if (data.image) {
    var tnfname = data.image.substring(0, data.image.lastIndexOf(".")) + "s.jpg";
    tnfname = tnfname.replace("src/", "thumb/");
    data.tnfname = tnfname;
    if (data.filename.length > 25) {
      data.filenameabbr = data.filename.substring(0, 25) + '(...)' + data.filename.substring(data.filename.lastIndexOf("."));
    } else {
      data.filenameabbr = data.filename;
    }
  }
  if ((localStorage['replytemplate'] != null) && (localStorage['replytemplate_ver'] == replytemplatever)) {
    $(reply).jqoteapp(localStorage['replytemplate'], data);
    $(reply).find('.reply').attr('class', 'reply newPost post');
    callback(reply.firstElementChild);
  } else {
    $.ajax({
      type: 'GET',
      url: sitevars.domain + 'js/reply-template',
      success: function (tpl) {
        localStorage['replytemplate'] = tpl;
        localStorage['replytemplate_ver'] = replytemplatever;
        $(reply).jqoteapp(tpl, data);
        $(reply).find('.reply').attr('class', 'reply post');
        callback(reply.firstElementChild);
      }
    });
  }
}

function hidePost(replyDivId, replyDiv) {
  var dengus = document.createElement("div");
  dengus.innerHTML = "Post Hidden";
  dengus.setAttribute("id", "postStub" + replyDivId.substring(5));
  $(dengus).css('display', 'inline');

  if (replyDiv === undefined) {
    if ((document.getElementById(replyDivId).style.display == "inline-block") || (document.getElementById(replyDivId).style.display == "")) {
      document.getElementById(replyDivId).style.display = "none";
      document.getElementById("replyContainer" + replyDivId.substring(5)).appendChild(dengus);
      document.getElementById(replyDivId).previousElementSibling.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a>";
      localStorage.setItem(replyDivId + "Hidden", "true");
    } else {
      document.getElementById(replyDivId).style.display = "inline-block";
      document.getElementById(replyDivId).previousElementSibling.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>";
      document.getElementById("replyContainer" + replyDivId.substring(5)).removeChild(document.getElementById("postStub" + replyDivId.substring(5)));
      localStorage.removeItem(replyDivId + "Hidden");
    }
  } else {
    if (replyDiv.style.display == "inline-block" || replyDiv.style.display == "") {
      replyDiv.style.display = "none";
      replyDiv.parentElement.appendChild(dengus);
      replyDiv.previousElementSibling.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a>";
      //localStorage.setItem(replyDiv.id + "Hidden", "true");
    } else {
      replyDiv.style.display = "inline-block";
      replyDiv.previousElementSibling.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>";
      replyDiv.parentElement.removeChild(document.getElementById("postStub" + replyDiv.id.substring(5)));
      //localStorage.removeItem(replyDiv.id + "Hidden");
    }
  }
}

function hideThread(thread, parentPost, filesize) {
  var dengus = document.createElement("div");
  dengus.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a> Thread Hidden";
  dengus.setAttribute("id", "postStub" + $(parentPost).attr('id').substring(6));
  dengus.onclick = function () {
    hideThread(thread, parentPost, filesize);
  }
  if ($(thread).css('display') != 'none') {
    $(thread).after(dengus);
    $(thread).css('display', 'none')
    localStorage.setItem("thread" + $(parentPost).attr('id').substring(6) + "Hidden", "true");
  } else {
    $(thread).css('display', 'block')
    document.getElementById("postStub" + $(parentPost).attr('id').substring(6)).outerHTML = "";
    localStorage.removeItem("thread" + $(parentPost).attr('id').substring(6) + "Hidden");
  }
}

function hideThreadMobile(button, threadnum) {
  var thread = $(button).parentsUntil('.thread').last().parent();
  if ($(thread).css('display') != 'none') {
    $(thread).css('display', 'none');
    var dengus = document.createElement("div");
    dengus.innerHTML = '<a href="javascript:void(0)" class="hidePostButton hiddenPostButton button">Thread Hidden</a>';
    dengus.setAttribute("id", "postStub" + threadnum);
    dengus.onclick = function () {
      hideThreadMobile(button, threadnum);
    };
    $(dengus).css('text-align', 'center');
    $(thread).before(dengus);
    localStorage.setItem("thread" + threadnum + "Hidden", "true");
  } else {
    localStorage.removeItem("thread" + threadnum + "Hidden");
    $('#postStub' + threadnum).remove();
    console.log('#postStub' + threadnum);
    $(thread).css('display', 'block');
  }
}

function birthday(birthday, play) {
  if (birthday == 0) {
    $('.fileinfo').before("<img src='" + sitevars.domain + "img/partyhat.gif' style='position:absolute;margin:-100px 0 0 0'/>");
    $('#announcement').children().not('hr').last().after("<h4><a href='javascript:void(0)' onclick='birthday(1,1)'>Enable Party Hard mode</a></h4>");
  }
  if (birthday == 1) {
    if (play == 1) {
      play = 0;
      document.body.innerHTML += "<audio controls='controls' autoplay='autoplay' loop='loop'><source src='http://onlinebargainshrimptoyourdoor.com/asdf.ogg' type='audio/ogg'></audio>";
    }
    document.body.style.background = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    $('.reply').css('background', '#' + (Math.random() * 0xFFFFFF << 0).toString(16));
    window.setTimeout("birthday(1,0)", 30);
  }
}

function twitterPost(post, parent) {
  if (parent == 0) {
    parent = post;
  }
  var board = sitevars.boarddir;
  window.open("https://twitter.com/share?url=http://" + encodeURI(sitevars.domain + "/" + board + "/res/" + parent + ext) + "%23" + post);
}

function facebookPost(post, parent) {
  if (parent == 0) {
    parent = post;
  }
  var board = sitevars.boarddir;
  window.open("http://www.facebook.com/sharer.php?u=http://" + sitevars.domain + "/" + board + "/res/" + parent + ext + "%23" + post);
}
