var isOn = 0;
var updaterTimer;
var updaterTimeLeft;
var timeLeft = 30;
var req = new XMLHttpRequest();
var modified;
var newPosts;
var postsAdded = 0;
var numberOfPosts = 0;
var settings = ['qRep', 'inlineExpansion', 'threadUpdater', 'quotePreview', 'replyHiding', 'threadHiding', 'anonymize', 'inlineQuote', 'expandPosts', 'expandThreads', 'replyBacklinking', 'expandFilename', 'fixedNav'];
var hasCaptcha = 0;
var postsInTitle = 0;
var finalDivScrollPos;
var ext = ".html";

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
    if ((localStorage.getItem(settings[i]) == 'false') || (localStorage.getItem(settings[i]) == null)) {
      document.getElementById(settings[i]).checked = "";
    } else {
      document.getElementById(settings[i]).checked = "checked";
    }
  }
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

function quotePreviewPrep() {
  $("body").on("mouseover", "a.postlink", function () {
    quotePreview(this, 0)
  });
  $("body").on("mouseout", "a.postlink", function () {
    quotePreview(this, 1)
  });
}

function inlineQuotePrep() {
  $("a.postlink").removeAttr("onclick");
  $("body").on("click", "a.postlink", function (e) {
    inlineQuote(this, this.href, 0);
    e.preventDefault();
  });
}

function updaterPrep() {
  if (postsAdded < 1) {
    if (document.body.className == "replypage") {
      req = new XMLHttpRequest();
      req.open('HEAD', document.location, false);
      req.send(null);
      modified = req.getResponseHeader("Last-Modified");
      var updateLink = document.createElement('a');
      updateLink.innerHTML = "<a style='position: fixed; padding: 5px; right: 0; bottom:0;' id='threadUpdaterButton' href='javascript:void(0)' onclick='updateThread()'>Auto update</a>";
      var modifiedDiv = document.createElement('div');
      modifiedDiv.setAttribute("id", "lastModified");
      modifiedDiv.style.display = "none";
      modifiedDiv.innerHTML = modified;
      document.body.appendChild(modifiedDiv);
      document.body.appendChild(updateLink);
    }
  }
}

function hideThreadPrep() {
  if (document.body.className) return;
  var threads = document.getElementsByClassName('thread');
  for (var i = 0; i < threads.length; i++) {
    (function (e) {
      var parentPost = threads[e].firstElementChild;
      var filesize = $(parentPost).children('.filesize')[0];
      if (!filesize) {
        var filesize = $(parentPost).children('.parentPostInfo')[0];
      }
      var hideButton = document.createElement("a");
      hideButton.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a> ";
      hideButton.addEventListener("click", function () {
        hideThread(threads[e], parentPost, hideButton)
      });
      $(filesize).before(hideButton);
      if (localStorage.getItem("thread" + parentPost.id.substring(6) + "Hidden") == 'true') {
        hideThread(threads[e], parentPost, filesize);
      }
    })(i);
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

function threadExpansionPrep() {
  if (document.body.className == "threadpage") return;
  var links = document.getElementsByClassName("omittedposts");
  for (var i = 0; i < links.length; i++) {
    links[i].outerHTML = "<span class='omittedposts processed'><a style='text-decoration: none;' href='javascript:void(0)' onclick=expandThread('" + links[i].previousElementSibling.id + "',0)>+ " + links[i].innerHTML.replace("Reply", "here") + "</a></span>"
  }
}

function backlinkPrep() {
  var postlinks = $('.postlink');
  $(postlinks).each(function (taargus) {
    if (($(this).parent('.capcodeReplies').length == 0) && ($(this).attr('href').indexOf("..") == -1)) {
      var postNum = $(this).text().replace(">>", "");
      var posts = $('#reply' + postNum + ", #parent" + postNum);
      var postLinkContainerNum = $(this).parents(".reply, .parent").last().attr('id').replace("reply", "");
      postLinkContainerNum.replace("parent", "");
      var backlink = document.createElement("a");
      backlink.innerHTML = "&gt;&gt;" + postLinkContainerNum;
      backlink.href = "javascript:void(0);"
      backlink.id = "backlink" + postLinkContainerNum;
      backlink.style.paddingRight = "3px";
      if (localStorage.getItem('quotePreview') == 'true') {
        $(backlink).bind("mouseover", "a.postlink", function () {
          quotePreview(this, 0)
        });
        $(backlink).bind("mouseout", "a.postlink", function () {
          quotePreview(this, 1)
        });
      }
      if (localStorage.getItem('inlineQuote') == 'true') {
        $(backlink).bind('click', function (a) {
          inlineQuote(this, this.href, 0, 1);
          a.preventDefault();
        });
      }
      if ($(posts).children("#backlink" + postLinkContainerNum).length == 0) {
        $(posts).children('.postMenu').after(backlink);
      }
    }
  });
}

function highlightPosts(identifier) {
  if (identifier != undefined) {
    $(".reply.highlight").attr("class", "reply");
    if (identifier.className == "postername") {
      if (identifier.firstElementChild != null) {
        if (identifier.firstElementChild.className == "adminName") {
          console.log($(identifier).text());
          var thread = $(identifier).parentsUntil("div.thread").parent()[0];
          $(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class', 'reply highlight');
        }
      } else if (identifier.nextElementSibling.className == "postertrip") {
        identifier = identifier.nextElementSibling;
        console.log($(identifier).text());
        var thread = $(identifier).parentsUntil("div.thread").parent()[0];
        $(thread).children("div.replyContainer").children('div.reply:contains("' + $(identifier).text() + '")').attr('class', 'reply highlight');
      } else {
        console.log("Nothing to identify by");
      }
    } else if (identifier.className == "postertrip") {
      if (identifier.firstElementChild != null) {
        if (identifier.firstElementChild.className == "adminTrip") {
          console.log($(identifier).text());
          var thread = $(identifier).parentsUntil("div.thread").parent()[0];
          $(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class', 'reply highlight');
        }
      } else {
        console.log($(identifier).text());
        var thread = $(identifier).parentsUntil("div.thread").parent()[0];
        $(thread).children("div.replyContainer").children('div.reply:contains("' + $(identifier).text() + '")').attr('class', 'reply highlight');
      }
    } else if (identifier.className == "id") {
      console.log($(identifier).text());
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
    $("body").on("click", "span.id", function () {
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

function fixedNav() {
  if (window.location.href.indexOf("admin") == -1) {
    $('.topNavContainer').css('display', 'block');
    $('.logo').css('margin-top', '25px');
  }
}

function titleFactory(mode) {
  if (mode == 1) {
    finalDivScrollPos = $('.reply.newPost').last().scrollTop();
    console.log(finalDivScrollPos);
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
        quotePreviewPrep();
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
      highlightPosts();
    }
    if (localStorage.getItem('replyHiding') == 'true') {
      hideReplyPrep();
    }
    if (localStorage.getItem('threadUpdater') == 'true') {
      updaterPrep();
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
    if (localStorage.getItem('replyBacklinking') == 'true') {
      backlinkPrep();
    }
    if (localStorage.getItem('inlineQuote') == 'true') {
      $("a.postlink").removeAttr("onclick");
      inlineQuotePrep();
    }
    prettyPrint();
  }
}

function expandPost(link) {
  if (link.hash) {
    $.get(link, function (data) {
      var loadedPost = $(data).find("#reply" + link.hash.replace("#", ""));
      document.getElementById("reply" + link.hash.replace("#", "")).lastElementChild.innerHTML = $(loadedPost).find("blockquote").last().html();
    });
  } else {
    $.get(link, function (data) {
      var loadedPost = $(data).find("#parent" + link.pathname.substring(link.pathname.lastIndexOf("/") + 1));
      document.getElementById("parent" + link.pathname.substring(link.pathname.lastIndexOf("/") + 1)).lastElementChild.innerHTML = $(loadedPost).find("blockquote").last().html();
    });
  }
}

function expandThread(parentDivId, mode) {
  var board = boardDir;
  var threadLink = boardPath + "res/" + parentDivId.replace("parent", "") + ext;
  console.log(board);
  console.log(window.location.hostname);
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
  parent = $(refLink).parentsUntil("div.thread").parent()[0].firstElementChild.id.replace("parent", "");
  console.log(parent);
  if (document.getElementById("quickReply") == null) {
    document.body.appendChild(_div);
    _div.innerHTML += '<span>Quick Reply</span><a href="javascript:void(0)" style="float: right" onclick="closeQuickReply();">[ x ]</a><form id="qrActualForm" action="/' + board + '/wakaba.pl" method="post" enctype="multipart/form-data"> <input type="hidden" name="task" value="post"> <input type="hidden" name="parent" value=' + parent + '> <div class="trap">Leave these fields empty (spam trap): <input type="text" name="name" autocomplete="off"><input type="text" name="link" autocomplete="off"></div> <div id="qrPostForm"> <div class="postTableContainer"> <div class="postBlock">Name</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field1" id="qrField1"></div> </div> <div class="postTableContainer"> <div class="postBlock">Link</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field2" id="qrField2"></div> </div> <div class="postTableContainer"> <div class="postBlock">Subject</div> <div class="postSpacer"></div> <div class="postField"> <input type="text" name="field3" class="postInput" id="qrField3"> <input type="submit" id="qrField3s" value="Submit" onclick="setSubmitText();"> </div> </div> <div class="postTableContainer"> <div class="postBlock">Comment</div> <div class="postSpacer"></div> <div class="postField"><textarea name="field4" class="postInput" id="qrField4"></textarea></div> </div> <div class="postTableContainer" id="qrCaptcha">' + recaptchaInsert.innerHTML + '</div> <div class="postTableContainer">' + uploadField.html() + '</div> <div class="postTableContainer"> <div class="postBlock">Password</div> <div class="postSpacer"></div> <div class="postField"><input type="password" class="postInput" id="qrPassword" name="password"> (for post and file deletion)</div> </div> ' + addons + ' <div class="postTableContainer"> </div> <div id="qrErrorStatus" style="color:red"></div> </div> </form>';
    document.getElementById("quickReply").childNodes[2].childNodes[7].childNodes[7].childNodes[5].childNodes[0].value += ref + "\n";
    setQrInputs("qrPostForm");
    qrAjaxSubmit();
  } else {
    document.getElementById("quickReply").childNodes[2].childNodes[7].childNodes[7].childNodes[5].childNodes[0].value += ref + "\n";
  }
}

function setSubmitText() {
  document.getElementById("qrField3s").value = "Submitting...";
}

function qrAjaxSubmit() {
  $(document).ready(function () {
    var options = {
      error: showResponse,
      success: showResponse
    };
    $('#qrActualForm').ajaxForm(options);
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
    console.log(responseText);
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
        image.style.width = (image.naturalWidth - difference) - 100 + "px";;
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

function quotePreview(reference, mode) {
  var referenceWork = reference.innerHTML.replace(" (OP)", "");
  var referenceWork = referenceWork.replace(" (Cross-thread)", "");
  if (document.getElementById("parent" + referenceWork.substring(8)) == null) {
    var referencedPostNumber = "reply" + referenceWork.substring(8);
  } else {
    var referencedPostNumber = "parent" + referenceWork.substring(8);
  }
  var post = $('#' + referencedPostNumber);
  if (document.getElementById(referencedPostNumber) != null) {
    if (mode == 0) {
      var div = document.createElement('div');
      div.id = "quotePreview" + referencedPostNumber;
      div.className = "reply";
      div.style.position = "absolute";
      div.style.display = "block";
      div.style.border = "1px solid #9E9E9E";
      div.innerHTML = post.html();
      if ((post.offset().top + post.height() >= $(window).scrollTop()) && (post.offset().top <= $(window).scrollTop() + $(window).height())) {
        if (post.attr('class') == "reply") {
          post.attr('class', 'reply highlight');
        }
      }
      var previewOffsetY = $(div).height();
      var previewOffsetX = $(div).width();
      $(reference).mousemove(function (e) {
        div.style.top = (e.pageY - (previewOffsetY + 20)) + "px";
        div.style.left = (e.pageX + 50) + "px";
        if ((($(div).width() + (e.pageX + 50)) >= $(window).width())) {
          div.style.width = ($(div).width() - (($(div).width() + e.pageX + 50) - $(window).width())) + "px";
        }
      });
      if (document.getElementById(div.id) == null) {
        $(div).find('div[id^=inlineQuote]').remove();
        $(div).find('div[id^=backlinkInlineQuote]').remove();
        if ($(div).find('a.thumbLink').children('img.expandedThumb').length) {
          $(div).find('a.thumbLink').each(function (e) {
            expandImage(this)
          });
        }
        document.body.appendChild(div);
      }
    }
    if (mode == 1) {
      if (post.attr('class') == "reply highlight") {
        post.attr('class', 'reply');
      }
      document.body.removeChild(document.body.lastElementChild);
    }
  } else {
    if (mode == 0) {
      var div = document.createElement('div');
      div.id = "quotePreview" + referencedPostNumber;
      div.className = "reply";
      div.style.position = "absolute";
      div.style.border = "1px solid #9E9E9E";
      var json = reference.href.replace(/#.*/i, "");
      json = json.replace(/.html/i, "");
      $.getJSON(json + ".json", function (data) {
        $.each(data.posts, function (index, post) {
          if (post.no == referencedPostNumber.replace("reply", "")) {
            $(div).html($(makeReply(post)).children('.reply').last().html());
          }
        });
        $(div).children('.replyPostInfo').children('span').after("&nbsp;");
      });
      var previewOffsetY = div.offsetHeight;
      $(document).mousemove(function (e) {
        div.style.top = (e.pageY - (previewOffsetY + 10)) + "px";
        div.style.left = (e.pageX + 50) + "px";
      });
      if (document.getElementById(div.id) == null) {
        document.body.appendChild(div);
      }
    }
    if (mode == 1) {
      document.body.removeChild(document.body.lastElementChild);
    }
  }
}

function inlineQuote(reference, url, mode, backlink) {
  var referenceWork = reference.innerHTML.replace(" (OP)", "");
  var referenceWork = referenceWork.replace(" (Cross-thread)", "");
  var div;
  if (document.getElementById("parent" + referenceWork.substring(8)) == null) {
    var referencedPostNumber = "reply" + referenceWork.substring(8);
  } else {
    var referencedPostNumber = "parent" + referenceWork.substring(8);
  }
  var alreadyQuote = $(reference.parentElement.parentElement.parentElement).find("#inlineQuote" + referencedPostNumber).attr('id');
  if (backlink == 1) {
    var alreadyQuote = $(reference.parentElement.parentElement.parentElement).find("#backlinkInlineQuote" + referencedPostNumber).attr('id');
  }
  if (document.getElementById(referencedPostNumber) != null) {
    if (alreadyQuote == undefined) {
      var referencedPost = document.getElementById(referencedPostNumber);
      div = $("#" + referencedPostNumber).clone(true, true);
      $(div).find('div[id^=inlineQuote]').remove();
      $(div).find('div[id^=backlinkInlineQuote]').remove();
      $(div).find('.postMenuButton').remove();
      $(div).find('.postMenu').remove();
      if ($(div).find('a.thumbLink').children('img.expandedThumb').length) {
        $(div).find('a.thumbLink').each(function (e) {
          expandImage(this)
        });
      }
      $(div).attr("id", "inlineQuote" + referencedPostNumber);
      $(div).css("border", "1px solid #9E9E9E");
      $(div).css("display", "table");
      if ($('body').find("#quotePreview" + referencedPostNumber).length) {
        $(div).removeClass('highlight');
      }
      if (backlink == 1) {
        if ($(reference).nextUntil('blockquote').length == 0) {
          $(div).attr("id", "backlinkInlineQuote" + referencedPostNumber);
          $(reference).after(div);
        } else {
          $(div).attr("id", "backlinkInlineQuote" + referencedPostNumber);
          $(reference).nextUntil('blockquote').last().after(div);
        }
      } else {
        $(reference).after(div);
      }
    } else {
      var quoteParent = $('#inlineQuote' + referencedPostNumber).parent();
      var inlineQuoteId = $('#inlineQuote' + referencedPostNumber).attr('id');
      quoteParent.attr('id', inlineQuoteId + "parentElem");
      if (backlink == 1) {
        $("#backlinkInlineQuote" + referencedPostNumber).remove();
      } else {
        $($(reference).next()).remove();
      }
    }
  } else {
    if (alreadyQuote == undefined) {
      var json = reference.href.replace(/#.*/i, "");
      json = json.replace(/.html/i, "");
      $.getJSON(json + ".json", function (data) {
        $.each(data.posts, function (index, post) {
          if (post.no == referencedPostNumber.replace("reply", "")) {
            div = document.createElement('div');
            $(div).html($(makeReply(post)).children('.reply').last().html());
          }
        });
        $(div).attr("id", "inlineQuote" + referencedPostNumber);
        $(div).children('.replyPostInfo').children('span').after("&nbsp;");
        $(div).css("border", "1px solid #9E9E9E");
        $(div).css("display", "table");
        $(div).find('.postMenuButton').remove();
        $(div).find('.postMenu').remove();
        $(reference).after(div);
      });
    } else {
      $($(reference).next()).remove();
    }
  }
}

function threadUpdater() {
  req = new XMLHttpRequest();
  var json = boardPath + "res/" + $(".parentPost").attr("id").replace("parent", "") + ".json";
  req.open('HEAD', json, false);
  req.send(null);
  modified = req.getResponseHeader("Last-Modified");
  if (document.getElementById("lastModified").innerHTML == modified) {
    console.log("No new posts");
  } else {
    document.getElementById("lastModified").innerHTML = modified;
    console.log("New post!");
    postsAdded++;
    $.getJSON(json, function (data) {
      var lastPost = $('.thread').last().children().last('.reply').attr('id').replace("replyContainer", "");
      lastPost = lastPost.replace("parent", "")
      var newPosts = [];
      $.each(data.posts, function (index, post) {
        if (post.no > lastPost) {
          newPosts.push(makeReply(post));
        }
      });
      if (postsInTitle == 0) {
        $('.thread').last().children().last().children('.reply').attr('class', 'reply unreadMarker');
        $('.thread').last().children().last().children('.reply').css('box-shadow', '0 3px red');
      }
      $(newPosts).find('.replyPostInfo').children('span').after("&nbsp;");
      $('.thread').append(newPosts);
      postsInTitle = $('.reply.newPost').length;
      titleFactory(1);
      doIt(1);
    });
  }
  updaterTimer = setTimeout("threadUpdater()", 15000);
}

function updateThread() {
  if (isOn == 0) {
    console.log("Thread updater started.");
    threadUpdater();
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

function makeReply(post) {
  var board = boardDir;
  var doubledash = document.createElement('div');
  doubledash.setAttribute("class", "doubledash");
  doubledash.innerHTML = "&gt;&gt;";
  var replyContainer = document.createElement('div');
  replyContainer.setAttribute("id", "replyContainer" + post.no);
  replyContainer.setAttribute("class", "replyContainer");
  var reply = document.createElement('div');
  reply.setAttribute("id", "reply" + post.no);
  reply.setAttribute("class", "reply newPost");
  var a = document.createElement('a');
  a.setAttribute("id", post.no);
  var replyPostInfo = document.createElement('div');
  replyPostInfo.setAttribute("class", "replyPostInfo");
  var delCheckbox = document.createElement('input');
  delCheckbox.setAttribute('type', 'checkbox');
  delCheckbox.setAttribute('name', 'delete');
  delCheckbox.setAttribute('value', post.no);
  $(replyPostInfo).append(delCheckbox);
  var replytitle = document.createElement('span');
  replytitle.setAttribute('class', 'replytitle');
  replytitle.innerHTML = post.sub;
  $(replyPostInfo).append(replytitle);
  var postername = document.createElement('span');
  postername.setAttribute('class', 'postername');
  postername.innerHTML = post.name;
  $(replyPostInfo).append(postername);
  var postertrip = document.createElement('span');
  postertrip.setAttribute('class', 'postertrip');
  postertrip.innerHTML = post.trip;
  if (post.trip != "") {
    $(replyPostInfo).append(postertrip);
  }
  var datespan = document.createElement('span');
  datespan.setAttribute('class', 'date');
  datespan.innerHTML = post.now;
  $(replyPostInfo).append(datespan);
  var idspan = document.createElement('span');
  idspan.setAttribute('class', 'id');
  idspan.innerHTML = post.id;
  if (post.id != null) {
    $(replyPostInfo).append(idspan);
  }
  var refLink = document.createElement('span');
  refLink.setAttribute('class', 'reflink');
  var refLinkInner = document.createElement('a');
  refLinkInner.setAttribute('class', 'refLinkInner');
  refLinkInner.setAttribute('href', 'javascript:insert(\'&gt;&gt;' + post.no + "\')");
  refLinkInner.innerHTML = "No." + post.no;
  $(refLink).append(refLinkInner);
  $(replyPostInfo).append(refLink);
  var postMenuButton = document.createElement('a');
  postMenuButton.setAttribute("id", "postMenuButton" + post.no);
  postMenuButton.setAttribute("class", "postMenuButton");
  postMenuButton.setAttribute("href", "javascript:void(0)");
  postMenuButton.setAttribute("onclick", "togglePostMenu('postMenu" + post.no + "','postMenuButton" + post.no + "',0);");
  postMenuButton.innerHTML = "[<span></span>]";
  var postMenu = document.createElement('div');
  postMenu.setAttribute("id", "postMenu" + post.no);
  postMenu.setAttribute("class", "postMenu");
  postMenu.setAttribute("style", "display:none");
  var menuReport = document.createElement('a');
  menuReport.setAttribute('onmouseover', 'closeSub(this);');
  menuReport.setAttribute('href', 'javascript:void(0)');
  menuReport.setAttribute('onclick', 'reportPostPopup(' + post.no + ',\'' + board + '\')');
  menuReport.setAttribute('class', 'postMenuItem');
  menuReport.innerHTML = "Report this post";
  $(postMenu).append(menuReport);
  var deleteMenu = document.createElement('div');
  deleteMenu.setAttribute('onmouseover', 'showSub(this);');
  deleteMenu.setAttribute('class', 'hasSubMenu');
  deleteMenu.innerHTML = "<span class='postMenuItem'>Delete</span><div onmouseover$(this).addClass('focused') class='postMenu subMenu' style='display:none';><a class='postMenuItem' href='javascript:void(0);' onclick='deletePost(" + post.no + ");'>Post</a><a class='postMenuItem' href='javascript:void(0);' onclick='deleteImage(" + post.no + ");'>Image</a></div>";
  $(postMenu).append(deleteMenu);
  var filterMenu = document.createElement('div');
  filterMenu.setAttribute('onmouseover', 'showSub(this);');
  filterMenu.setAttribute('class', 'hasSubMenu');
  filterMenu.innerHTML = "<span class='postMenuItem'>Filter</span><div class='postMenu subMenu' style='display:none'><a class='postMenuItem' href='javascript:void(0)'>Not yet implemented</a></div>";
  $(postMenu).append(filterMenu);
  if (social) {
    var facebookButton = document.createElement('div');
    facebookButton.setAttribute('onmouseover', 'closeSub(this)');
    facebookButton.setAttribute('href', 'javascript:void(0)');
    facebookButton.setAttribute('onclick', 'facebookPost(window.location.hostname,' + post.no + ',' + post.parent + ')');
    facebookButton.setAttribute('class', 'postMenuItem');
    facebookButton.innerHTML = "Post to Facebook";
    $(postMenu).append(facebookButton);
    var twitterButton = document.createElement('div');
    twitterButton.setAttribute('onmouseover', 'closeSub(this)');
    twitterButton.setAttribute('href', 'javascript:void(0)');
    twitterButton.setAttribute('onclick', 'twitterPost(window.location.hostname,' + post.no + ',' + post.parent + ')');
    twitterButton.setAttribute('class', 'postMenuItem');
    twitterButton.innerHTML = "Post to Twitter";
    $(postMenu).append(twitterButton);
  }
  var permaLink = document.createElement('a');
  permaLink.setAttribute('href', boardPath + '/res/' + post.parent + ext + '#' + post.no);
  permaLink.setAttribute('class', 'postMenuItem');
  permaLink.setAttribute('target', '_blank');
  permaLink.innerHTML = "Permalink";
  $(postMenu).append(permaLink);
  var blockquote = document.createElement('blockquote');
  blockquote.innerHTML = post.com;
  if (post.filename) {
    var fileSize = document.createElement('span');
    fileSize.setAttribute('class', 'filesize');
    var filename = post.filename.substring(0, post.filename.lastIndexOf("."));
    filename = filename.replace("src/", "");
    if (filename.length > 25) {
      filename = filename.substring(0, 25) + '(...)' + post.filename.substring(post.filename.lastIndexOf("."));
    } else {
      filename = post.filename;
    }
    fileSize.innerHTML = "File: <a target='_blank' href='" + boardPath + post.image + "'>" + filename + "</a> -(" + Math.round(post.fsize / 1000) + " KB, " + post.w + "x" + post.h + ")";
    var thumbLink = document.createElement('a');
    thumbLink.setAttribute('class', 'thumbLink');
    thumbLink.setAttribute('target', '_blank');
    thumbLink.setAttribute('href', boardPath + post.image);
    var thumbnail = document.createElement('img');
    thumbnail.setAttribute('class', 'thumb replyThumb');
    filename = post.image.substring(0, post.image.lastIndexOf(".")) + "s.jpg";
    filename = filename.replace("src/", "thumb/");
    thumbnail.setAttribute('src', boardPath + filename);
    thumbnail.setAttribute('alt', post.fsize);
    thumbnail.setAttribute('data-md5', post.md5);
    thumbnail.setAttribute('style', "width:" + post.tn_w * .504 + "px;height:" + post.tn_h * .504 + "px;");
    $(thumbLink).append(thumbnail);
  }
  $(replyContainer).append(doubledash);
  $(reply).append(a);
  $(replyPostInfo).append(postMenuButton);
  $(reply).append(replyPostInfo);
  $(reply).append(postMenu);
  if (post.filename) {
    $(reply).append("<br />");
    $(reply).append(fileSize);
    $(reply).append("<br />");
    $(reply).append(thumbLink);
  }
  $(reply).append(blockquote);
  $(replyContainer).append(reply);
  return replyContainer;
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
  var dengus = document.createElement("div");
  dengus.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a> Thread Hidden";
  dengus.setAttribute("id", "postStub" + parentPost.id.substring(6));
  dengus.onclick = function () {
    hideThread(thread, parentPost, filesize);
  };
  if ((thread.style.display == "block") || (thread.style.display == "")) {
    $(thread).after(dengus);
    thread.style.display = "none";
    localStorage.setItem("thread" + parentPost.id.substring(6) + "Hidden", "true");
  } else {
    thread.style.display = "block";
    document.getElementById("postStub" + parentPost.id.substring(6)).outerHTML = "";
    localStorage.removeItem("thread" + parentPost.id.substring(6) + "Hidden");
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