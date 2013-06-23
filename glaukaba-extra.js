var isOn = 0;
var updaterTimer;
var updaterTimeLeft;
var timeLeft = 15;
var modified;
var newPosts;
var postsAdded = 0;
var numberOfPosts = 0;
var settings = ['qRep', 'inlineExpansion', 'threadUpdater', 'quotePreview', 'replyHiding', 'threadHiding', 'anonymize', 'inlineQuote', 'expandPosts', 'expandThreads', 'replyBacklinking', 'expandFilename', 'fixedNav', 'markPosts', 'reverseImgSearch', 'reverseImgSearchLinks'];
var hasCaptcha = 0;
var postsInTitle = 0;
var finalDivScrollPos;
var ext = ".html";
var yourPosts = new Array();
var replytemplatever = 1;
if (typeof sessionStorage['yourPosts'] != 'undefined') {
  yourPosts = JSON.parse(sessionStorage['yourPosts']);
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
  if ((localStorage.getItem('reverseImgSearchLinks') == null) || (localStorage.getItem('reverseImgSearchLinks') == ''))
    $('#reverseImgSearchLinks').val("# Remove the hash sign from the services you'd like to use.\n\n# reverse image search\n#//www.google.com/searchbyimage?image_url=%tn\n#//tineye.com/search?url=%tn\n#//3d.iqdb.org/?url=%tn\n#//regex.info/exif.cgi?imgurl=%img\n\n# uploaders:\n#//imgur.com/upload?url=%img\n#//ompldr.org/upload?url1=%img");
}

function imgExpPrep() {
  $("body").on("click", "a.thumbLink", function (e) {
    expandImage(this);
    e.preventDefault();
  });
}

function qrPrep() {
  var board = boardDir;
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
    if ($(postlink).attr('class') != 'backlink') {
      href = $(postlink).attr('href');
      parentnum = href.substr(href.lastIndexOf('/') + 1, href.indexOf('#') - (href.lastIndexOf('/') + 1)).replace('.html', '');
      quoted = href.substr(href.indexOf('#') + 1);
      jsonlink = noExt == 1 ? href.substr(0, href.indexOf('#') + 1) + '.json' : href.substr(0, href.indexOf('#') + 1).replace('.html', '.json');
    } else {
      quoted = $(postlink).attr('id').replace('backlink', '');
    }
    if ($('#reply' + quoted).length == 0) {
      cachedposts = getCache(parentnum);
      if (cachedposts) {
        $(cachedposts.posts).each(function (i, item) {
          if (item.no == quoted) {
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
              makeReply(item, function (post) {
                appendPreview(post, quoted);
                previewinprogress.resolve();
              });
            }
          });
        });
      }
    } else {
      post = $('#reply' + quoted).clone();
      $(post).attr('id', 'qp_' + $(post).attr('id'));
      $(post).css('position', 'absolute');
      $(post).css('border', "1px solid #9E9E9E");
      $(post).find('div[id^=iq]').remove();
      if ($(post).find('a.thumbLink').children('img.expandedThumb').length)
        $(post).find('a.thumbLink').each(function (e) {
          expandImage(this)
        });
      $(document).mousemove(function (e) {
        previewOffsetY = $(post).height();
        $(post).css('top', (e.pageY - (previewOffsetY + 10)) + "px");
        $(post).css('left', (e.pageX + 50) + "px");
      });
      if ($('#qp_reply' + quoted).length == 0)
        $('body').append(post);
      previewinprogress.resolve();
    }
  });
  $('.thread').on('mouseout', 'a.postlink, a.backlink', function () {
    href = $(this).attr('href');
    quoted = href.substr(href.indexOf('#') + 1);
    if ($(previewinprogress).length <= 0)
      return;
    $.when(previewinprogress).then(function () {
      $('div[id^=qp_]').remove();
    });
  });
}

function appendPreview(post, quoted) {
  post = $(post).children('.reply');
  $(post).attr('id', 'qp_' + $(post).attr('id'));
  $(post).css('position', 'absolute');
  $(post).css('border', "1px solid #9E9E9E");
  $(document).mousemove(function (e) {
    previewOffsetY = $(post).height();
    $(post).css('top', (e.pageY - (previewOffsetY + 10)) + "px");
    $(post).css('left', (e.pageX + 50) + "px");
  });
  if ($('#qp_reply' + quoted).length == 0)
    $('body').append(post);
}

function inlineQuote() {
  $(".thread").on("click", "a.postlink, a.backlink", function (e) {
    $('div[id^=qp_]').remove();
    postlink = this;
    e.preventDefault();
    inlineinprogress = $.Deferred();
    if ($(postlink).attr('class') != 'backlink') {
      href = $(postlink).attr('href');
      parentnum = href.substr(href.lastIndexOf('/') + 1, href.indexOf('#') - (href.lastIndexOf('/') + 1)).replace('.html', '');
      quoted = href.substr(href.indexOf('#') + 1);
      jsonlink = noExt == 1 ? href.substr(0, href.indexOf('#') + 1) + '.json' : href.substr(0, href.indexOf('#') + 1).replace('.html', '.json');
    } else {
      quoted = $(postlink).attr('id').replace('backlink', '');
    }
    if (($(postlink).next('#iq_reply' + quoted).length == 0) && ($(postlink).parent().parent().parent('.parentPost, .reply').children('#iq_reply' + quoted).length == 0)) {
      if ($('#reply' + quoted).length == 0) {
        cachedposts = getCache(parentnum);
        if (cachedposts) {
          $(cachedposts.posts).each(function (i, item) {
            if (item.no == quoted) {
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
                makeReply(item, function (post) {
                  appendInlineQuote(quoted, post, postlink);
                  inlineinprogress.resolve();
                });
              }
            });
          });
        }
      } else {
        post = $('#reply' + quoted).clone();
        $(post).attr('id', 'iq_' + $(post).attr('id'));
        $(post).css('border', "1px solid #9E9E9E");
        $(post).find('div[id^=iq]').remove();
        if ($(post).find('a.thumbLink').children('img.expandedThumb').length) {
          $(post).find('a.thumbLink').each(function (e) {
            expandImage(this)
          });
        }
        if ($(postlink).next('#iq_reply' + quoted).length == 0)
          if ($(postlink).attr('class') != 'backlink')
            $(postlink).after(post);
          else {
            if (isMobile()) {
              $(post).css('box-sizing', 'border-box');
            }
            $(postlink).parent().parent().parent().children('blockquote').before(post);
          }
        inlineinprogress.resolve();
      }
    } else {
      if ($(postlink).attr('class') != 'backlink')
        $(postlink).next('#iq_reply' + quoted).remove();
      else
        $(postlink).parent().parent().parent().children('#iq_reply' + quoted).remove();
    }
  });
}

function appendInlineQuote(quoted, post, postlink) {
  post = $(post).children('.reply');
  $(post).attr('id', 'iq_' + $(post).attr('id'));
  $(post).css('border', "1px solid #9E9E9E");
  if ($(postlink).next('#iq_reply' + quoted).length == 0)
    $(postlink).after(post);
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
  if (document.body.className != "indexpage")
    return;
  if ($('#postFormToggle').css('display') == 'none') {
    $('.parentPost').each(function () {
      var parentpost = this;
      if ($(parentpost).children('.fileinfo').length != 0) {
        $(parentpost).children('.fileinfo').children('span.filesize').before("<a class=\"hidePostButton hideThreadButton\" href=\"javascript:void(0)\">[ - ]</a> ");
      } else {
        $(parentpost).children('.parentPostInfo').children('input[name="delete"]').before("<a class=\"hidePostButton hideThreadButton noFileInfo\" href=\"javascript:void(0)\">[ - ]</a> ");
      }
      if (localStorage["threadHidden" + $(parentpost).attr('id')] == 'true') {
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
      hidePost(this.nextElementSibling.id)
    }
  });
}

function postExpansionPrep() {
  if (document.body.className == "threadpage")
    return;
  var links = document.getElementsByClassName("abbrev");
  for (var i = 0; i < links.length; i++) {
    var child = links[i].firstElementChild;
    if (!child)
      continue;
    child.addEventListener("click", function (e) {
      expandPost(this);
      e.preventDefault();
    }, true);
  }
}

function threadExpansionPrep() {
  if (document.body.className == "threadpage")
    return;
  var links = $('.omittedposts.desktop');
  if ($('#postFormToggle').css('display') == 'none') {
    for (var i = 0; i < links.length; i++) {
      var opid = $(links[i]).prev('.parentContainer').children('.parentPost').attr('id');
      links[i].outerHTML = "<span class='omittedposts processed'><a style='text-decoration: none;' href='javascript:void(0)' onclick=expandThread('" + opid + "',0)>+ " + links[i].innerHTML.replace("Reply", "here") + "</a></span>"
    }
  } else {
    return;
  }
}

function backlinkPrep() {
  var postlinks = $('.postlink');
  var bls = $('.backlink').length;
  $(postlinks).each(function (taargus) {
    if (($(this).parent('.capcodeReplies').length == 0) && ($(this).attr('href').indexOf("#") != -1)) {
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
      if ($(posts).find("#backlink" + postLinkContainerNum).length == 0)
        $(posts).find('.rightblock').append(backlink);
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
  if (filename != undefined) {
    var oldName = $(filename).text();
    if (mode == 0) {
      $(filename).text($(filename).attr("title"));
      $(filename).attr("title", oldName);
    } else {
      $(filename).text($(filename).attr("title"));
      $(filename).attr("title", oldName);
    }
  } else {
    $(".filesize").on("mouseover", "a", function () {
      expandFilename(this, 0)
    });
    $(".filesize").on("mouseout", "a", function () {
      expandFilename(this, 1)
    });
  }
}

function toggleThread(button) {
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
}

function markPosts() {
  var postlinks = $('.postlink');
  for (var i = 0; i < postlinks.length; i++) {
    var jsonObject = {
      "parent": $('#post_form').children('input[name="parent"]').attr('value'),
      "num": $(postlinks[i]).text().replace(">>", "")
    }
    for (var a = 0; a < yourPosts.length; a++) {
      if (jsonObject.num == yourPosts[a].num) {
        $(postlinks[i]).text($(postlinks[i]).text() + " (You)");
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
        $('.reply.newPost').attr('class', 'reply');
        $('.reply.unreadMarker').attr('class', 'reply');
        $('.reply.newPost.highlight').attr('class', 'reply highlight');
      }
    }
  }
}
$(document).scroll(function () {
  titleFactory()
});

function doIt(again) {
  if (noExt == 1) {
    ext = "";
  }
  if ($('body').attr('class')) {
    if (!again) {
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
      highlightPosts();
    }
    if (localStorage.getItem('markPosts') == 'true') {
      markPosts();
    }
    if (localStorage.getItem('replyHiding') == 'true') {
      hideReplyPrep();
    }
    if (localStorage.getItem('threadHiding') == 'true') {
      hideThreadPrep();
    }
    if (localStorage.getItem('anonymize') == 'true') {
      anonymize();
    }
    if (localStorage.getItem('expandPosts') == 'true') {
      postExpansionPrep();
    }
    if (localStorage.getItem('expandThreads') == 'true') {
      threadExpansionPrep();
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

function makeReverseSearchLinks() {
  if (localStorage['reverseImgSearchLinks'] == null)
    return;
  links = localStorage['reverseImgSearchLinks'].split('\n');
  $('.thumbLink').each(function (i, img) {
    $(links).each(function (a, link) {
      if ((link.indexOf('#') != 0) && (link.length > 1)) {
        link = link.replace('%tn', encodeURIComponent(domain.substr(0, domain.length - 1).replace('//', 'http://') + $(img).children('img').attr('src')));
        link = link.replace('%img', encodeURIComponent(domain.substr(0, domain.length - 1).replace('//', 'http://') + $(img).attr('href')));
        link = link.replace('%md5', encodeURIComponent($(img).children('img').attr('data-md5')));
        reallink = document.createElement('a');
        reallink.href = link;
        linktext = reallink.host.substr(0, reallink.host.lastIndexOf('.')).replace('www.', '');
        reallink = ' <a target="_blank" class="reverseimglink" href="' + reallink + '">' + linktext + '</a>';
        if ($(img).parent('.reply, .parentPost').length != 0)
          $(img).parent().children('.fileinfo').children('.filesize').append(reallink);
        else
          $(img).parentsUntil('.reply, .parentPost').last().parent().children('.fileinfo').children('.filesize').append(reallink);
      }
    });
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

function expandThread(parentDivId, mode) {
  var board = boardDir;
  var threadLink = boardPath + "res/" + parentDivId.replace("parent", "") + ext;
  if (mode == 0) {
    $.get(threadLink, function (data) {
      var loadedThread = $(data).find(".replyContainer");
      var omittext = $($('#' + parentDivId).next()).html();
      omittext = omittext.replace("+", "-");
      omittext = omittext.replace(",0", ",1");
      $($('#' + parentDivId).siblings()).hide();
      $($(loadedThread)).insertAfter('#' + parentDivId);
      hideReplyPrep();
    });
  } else {
    $.get(window.location.href, function (data) {});
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

function recaptchaRefresh() {
  if (hasCaptcha == 1) {
    Recaptcha.reload("t");
    document.getElementById("recaptcha_image").addEventListener("DOMNodeInserted", function (e) {
      document.getElementById("qrCaptcha").innerHTML = document.getElementById("recaptchaContainer").innerHTML;
    }, false);
  }
}

function quickReply(refLink, board) {
  var ref = refLink.innerHTML.replace("No.", ">>");
  var _div = document.createElement('div');
  _div.id = "quickReply";
  var parent;
  var addons;
  var uploadField = $('#uploadField');
  if (document.getElementById("recaptchaContainer")) {
    if (hasPass == 0) {
      document.getElementById("recaptcha_reload_btn").href = "javascript:recaptchaRefresh();";
      var recaptchaInsert = document.createElement('div');
      recaptchaInsert.id = "recaptchaInsert";
      recaptchaInsert.innerHTML = document.getElementById("recaptchaContainer").innerHTML;
      hasCaptcha = 1;
    } else {
      var recaptchaInsert = document.createElement('div');
      recaptchaInsert.id = "recaptchaInsert";
    }
  } else {
    var recaptchaInsert = document.createElement('div');
    recaptchaInsert.id = "recaptchaInsert";
  }
  if (document.getElementsByName("admin")[0]) {
    var addons = '<div class="postTableContainer"><div class="postBlock">Options</div><div class="postSpacer"></div><div class="postField"><label>Self Format<input type="checkbox" name="no_format" value="1"></label> <label> Use Capcode<input type="checkbox" name="capcode" value="1"></label></div></div><input type="hidden" name="no_captcha" value="1">' + document.getElementsByName("admin")[0].outerHTML;
  } else {
    var addons = '';
  }
  parent = $(refLink).parentsUntil("div.thread").parent()[0].firstElementChild.firstElementChild.id.replace("parent", "");
  if (document.getElementById("quickReply") == null) {
    var margintop = $(".topNavContainer").css('display') == 'none' ? '0px' : "30px";
    $(_div).css('margin-top', margintop);
    document.body.appendChild(_div);
    _div.innerHTML += '<span>Quick Reply</span><a href="javascript:void(0)" style="float: right" onclick="closeQuickReply();">[ x ]</a><form id="qrActualForm" action="/' + board + '/wakaba.pl" method="post" enctype="multipart/form-data"> <input type="hidden" name="task" value="post"> <input type="hidden" name="parent" value=' + parent + '> <input type="hidden" name="ajax" value=1> <div class="trap">Leave these fields empty (spam trap): <input type="text" name="name" autocomplete="off"><input type="text" name="link" autocomplete="off"></div> <div id="qrPostForm"> <div class="postTableContainer"> <div class="postBlock">Name</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field1" id="qrField1"></div> </div> <div class="postTableContainer"> <div class="postBlock">Link</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field2" id="qrField2"></div> </div> <div class="postTableContainer"> <div class="postBlock">Subject</div> <div class="postSpacer"></div> <div class="postField"> <input type="text" name="field3" class="postInput" id="qrField3"> <input type="submit" id="qrField3s" value="Submit" onclick=""> </div> </div> <div class="postTableContainer"> <div class="postBlock">Comment</div> <div class="postSpacer"></div> <div class="postField"><textarea name="field4" class="postInput" id="qrField4"></textarea></div> </div> <div class="postTableContainer" id="qrCaptcha">' + recaptchaInsert.innerHTML + '</div> <div class="postTableContainer">' + uploadField.html() + '</div> <div class="postTableContainer"> <div class="postBlock">Password</div> <div class="postSpacer"></div> <div class="postField"><input type="password" class="postInput" id="qrPassword" name="password"> (for post and file deletion)</div> </div> ' + addons + ' <div class="postTableContainer"> </div> <div id="qrErrorStatus" style="color:red"></div> </div> </form>';
    document.getElementById("qrField4").value += ref + "\n";
    setQrInputs("qrPostForm");
    formStuff();
  } else {
    document.getElementById("qrField4").value += ref + "\n";
  }
  if (isMobile()) {
    $("#quickReply").css('position', 'absolute');
    $("#quickReply").css('top', window.pageYOffset);
  }
}

function setSubmitText() {
  document.getElementById("qrField3s").value = "Submitting...";
}

function formStuff() {
  $('#qrActualForm').submit(function (e) {
    var form = this;
    var action = $(this).attr('action');
    var formData = new FormData(this)
    e.preventDefault();
    document.getElementById("qrField3s").value = "Submitting...";
    var oReq = new XMLHttpRequest();
    oReq.onload = ajaxSuccess;
    oReq.open("post", form.action, true);
    oReq.send(new FormData(form));
  });
}

function ajaxSuccess() {
  var yourPost = this.getResponseHeader('Your-Post');
  var data = this.responseText;
  if (data.indexOf("errorMessage") == -1) {
    yourPost = JSON.parse(yourPost);
    yourPosts.push(yourPost);
    sessionStorage["yourPosts"] = JSON.stringify(yourPosts);
    document.getElementById("qrErrorStatus").innerHTML = "";
    closeQuickReply();
    if (hasCaptcha == 1) {
      Recaptcha.reload("t");
    }
  } else {
    $responseObj = $(data);
    document.getElementById("qrErrorStatus").innerHTML = $responseObj.filter('#errorMessage').html();
    document.getElementById("qrField3s").value = "Try again";
    recaptchaRefresh();
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
    document.getElementById("qrErrorStatus").innerHTML = "";
    closeQuickReply();
    if (hasCaptcha == 1) {
      Recaptcha.reload("t");
    }
  } else {
    document.getElementById("qrErrorStatus").innerHTML = "Something went wrong.";
    document.getElementById("qrField3s").value = "Try again";
    recaptchaRefresh();
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
  document.getElementById("quickReply").innerHTML = "";
  document.body.removeChild(document.getElementById("quickReply"));
}

function expandImage(thumbLink) {
  var image = thumbLink.firstElementChild;
  var fullImage = document.createElement('img');
  fullImage.src = thumbLink.href;
  var dicks = 0;
  if (image.className.indexOf("expandedThumb") == -1) {
    var pageWidth = window.innerWidth;
    var offset = findPos(image);
    image.src = thumbLink.href;
    image.removeAttribute("style");
    image.className += " expandedThumb";
    image.onload = function () {
      if (image.naturalWidth > pageWidth - offset) {
        var difference = image.naturalWidth - (pageWidth - offset);
        if (isMobile()) {
          $(image).css('cssText', "width:" + ($(image).parentsUntil('.thread').parent().width() - (offset + 10)) + "px !important");
        } else {
          image.style.width = (image.naturalWidth - difference) - 100 + "px";
        }
      }
    }
  } else {
    var thumbFname = thumbLink.href.substring(thumbLink.href.lastIndexOf("src/") + 4, thumbLink.href.lastIndexOf("src/") + 17);
    image.src = boardPath + "thumb/" + thumbFname + "s.jpg";
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
    url: boardPath + 'res/' + $('.parentPost').attr('id').replace('parent', '') + '.json',
    success: function (data, status, xhrobj) {
      if (modified != xhrobj.getResponseHeader('Last-Modified')) {
        modified = xhrobj.getResponseHeader('Last-Modified');
        $.ajax({
          type: 'GET',
          dataType: 'json',
          url: boardPath + 'res/' + $('.parentPost').attr('id').replace('parent', '') + '.json',
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
                  $('.reply').last().attr('class', 'reply unreadMarker');
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
  if (data.image) {
    var tnfname = data.image.substring(0, data.image.lastIndexOf(".")) + "s.jpg";
    tnfname = tnfname.replace("src/", "thumb/");
    data.tnfname = tnfname;
    if (data.filename.length > 25) {
      data.filename = data.filename.substring(0, 25) + '(...)' + data.filename.substring(data.filename.lastIndexOf("."));
    }
  }
  if ((localStorage['replytemplate'] != null) && (localStorage['replytemplate_ver'] == replytemplatever)) {
    $(reply).jqoteapp(localStorage['replytemplate'], data);
    $(reply).find('.reply').attr('class', 'reply newPost');
    callback(reply.firstElementChild);
  } else {
    $.ajax({
      type: 'GET',
      url: domain + 'js/reply-template',
      success: function (tpl) {
        localStorage['replytemplate'] = tpl;
        localStorage['replytemplate_ver'] = replytemplatever;
        $(reply).jqoteapp(tpl, data);
        $(reply).find('.reply').attr('class', 'reply newPost');
        callback(reply.firstElementChild);
      }
    });
  }
}

function hidePost(replyDivId) {
  var dengus = document.createElement("div");
  dengus.innerHTML = "Post Hidden";
  dengus.setAttribute("id", "postStub" + replyDivId.substring(5));
  $(dengus).css('display', 'inline');
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
}

function hideThread(thread, parentPost, filesize) {
  console.log(thread);
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
    for (var i = 0; i < document.getElementsByClassName('hat').length; i++) {
      document.getElementsByClassName('hat')[i].innerHTML = "<img src='" + domain + "img/partyhat.gif' style='position:absolute; margin-top:-100px;'/>"
    }
    document.getElementById("announcement").childNodes[1].innerHTML += "<br /><br /><a href='javascript:void(0)' onclick='birthday(1,1)'>Enable Party Hard mode</a>";
  }
  if (birthday == 1) {
    if (play == 1) {
      play = 0;
      document.body.innerHTML += "<audio controls='controls' autoplay='autoplay' loop='loop'><source src='http://onlinebargainshrimptoyourdoor.com/asdf.ogg' type='audio/ogg'></audio>";
    }
    window.setTimeout("birthday(1,0)", 30);
    var index = Math.round(Math.random() * 5);
    var ColorValue = "FFFFFF";
    var ColorValue2 = "000000";
    if (index == 1) {
      ColorValue = "RED";
      ColorValue2 = "BLUE";
    }
    if (index == 2) {
      ColorValue = "PURPLE";
      ColorValue2 = "GREEN";
    }
    if (index == 3) {
      ColorValue = "BLUE";
      ColorValue2 = "RED";
    }
    if (index == 4) {
      ColorValue = "GREEN";
      ColorValue2 = "PURPLE";
    }
    if (index == 5) {
      ColorValue = "BLACK";
      ColorValue2 = "WHITE";
    }
    document.body.style.background = ColorValue2;
    for (var i = 0; i < document.getElementsByClassName('reply').length; i++) {
      document.getElementsByClassName('reply')[i].style.background = ColorValue;
    }
  }
}

function partyHard() {
  birthday = 1;
}

function twitterPost(domain, post, parent) {
  if (parent == 0) {
    parent = post;
  }
  var board = boardDir;
  window.open("https://twitter.com/share?url=http://" + encodeURI(domain + "/" + board + "/res/" + parent + ext) + "%23" + post);
}

function facebookPost(domain, post, parent) {
  if (parent == 0) {
    parent = post;
  }
  var board = boardDir;
  window.open("http://www.facebook.com/sharer.php?u=http://" + domain + "/" + board + "/res/" + parent + ext + "%23" + post);
}