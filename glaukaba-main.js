!
function (r, t) {
  "use strict";
  var d = t.support.touch = !! ("ontouchstart" in window || window.DocumentTouch && r instanceof DocumentTouch),
    e = "._tap",
    i = "tap",
    f = 40,
    l = 400,
    a = "clientX clientY screenX screenY pageX pageY".split(" "),
    s = function (n, e) {
      var c;
      return c = Array.prototype.indexOf ? n.indexOf(e) : t.inArray(e, n)
    },
    n = {
      $el: null,
      x: 0,
      y: 0,
      count: 0,
      cancel: !1,
      start: 0
    },
    u = function (o, i) {
      var n = i.originalEvent,
        c = t.Event(n),
        r = n.changedTouches ? n.changedTouches[0] : n;
      c.type = o;
      for (var e = 0, u = a.length; u > e; e++) c[a[e]] = r[a[e]];
      return c
    },
    g = function (t) {
      var o = t.originalEvent,
        e = t.changedTouches ? t.changedTouches[0] : o.changedTouches[0],
        i = Math.abs(e.pageX - n.x),
        a = Math.abs(e.pageY - n.y),
        r = Math.max(i, a);
      return Date.now() - n.start < l && f > r && !n.cancel && 1 === n.count && c.isTracking
    },
    c = {
      isEnabled: !1,
      isTracking: !1,
      enable: function () {
        return this.isEnabled ? this : (this.isEnabled = !0, t(r.body).on("touchstart" + e, this.onTouchStart).on("touchend" + e, this.onTouchEnd).on("touchcancel" + e, this.onTouchCancel), this)
      },
      disable: function () {
        return this.isEnabled ? (this.isEnabled = !1, t(r.body).off("touchstart" + e, this.onTouchStart).off("touchend" + e, this.onTouchEnd).off("touchcancel" + e, this.onTouchCancel), this) : this
      },
      onTouchStart: function (e) {
        var o = e.originalEvent.touches;
        if (n.count = o.length, !c.isTracking) {
          c.isTracking = !0;
          var i = o[0];
          n.cancel = !1, n.start = Date.now(), n.$el = t(e.target), n.x = i.pageX, n.y = i.pageY
        }
      },
      onTouchEnd: function (t) {
        g(t) && n.$el.trigger(u(i, t)), c.onTouchCancel(t)
      },
      onTouchCancel: function () {
        c.isTracking = !1, n.cancel = !0
      }
    };
  if (t.event.special[i] = {
    setup: function () {
      c.enable()
    }
  }, !d) {
    var o = [],
      h = function (n) {
        var e = n.originalEvent;
        if (!(n.isTrigger || s(o, e) >= 0)) {
          o.length > 3 && o.splice(0, o.length - 3), o.push(e);
          var c = u(i, n);
          t(n.target).trigger(c)
        }
      };
    t.event.special[i] = {
      setup: function () {
        t(this).on("click" + e, h)
      },
      teardown: function () {
        t(this).off("click" + e, h)
      }
    }
  }
}(document, jQuery);

var openMenu;
var hasPass = 0;

function get_cookie(name) {
  with(document.cookie) {
    var regexp = new RegExp("(^|;\\s+)" + name + "=(.*?)(;|$)");
    var hit = regexp.exec(document.cookie);
    if (hit && hit.length > 2) return unescape(hit[2]);
    else return '';
  }
};

function set_cookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = "; expires=" + date.toGMTString();
  } else expires = "";
  document.cookie = name + "=" + value + expires + "; path=/";
}

function get_password(name) {
  var pass = get_cookie(name);
  if (pass) return pass;
  var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var pass = '';
  for (var i = 0; i < 8; i++) {
    var rnd = Math.floor(Math.random() * chars.length);
    pass += chars.substring(rnd, rnd + 1);
  }
  return (pass);
}

function hide_captcha() {
  var pass = get_cookie("wakapass");
  if (pass) {
    var taargus = pass.split("##");
    if (taargus[2] == 1) {
      var logouturl = sitevars.boardpath + "wakaba.pl?task=logout&type=pass";
      if (sitevars.noext == 1) {
        logouturl = sitevars.domain + "pass/logout";
      }
      $($("#recaptchaContainer").children(".colspan").children('.postField')).html('<div style="padding: 5px;">You are using a ' + sitevars.sitename + ' pass. [<a href="' + logouturl + '">Logout</a>]</div>');
      hasPass = 1;
    } else {
      hasPass = 0;
    }
  }
}

function insert(text) {
  var textarea = document.getElementById("field4");
  if (textarea) {
    if (textarea.createTextRange && textarea.caretPos) {
      var caretPos = textarea.caretPos;
      caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == " " ? text + " " : text;
    } else if (textarea.setSelectionRange) {
      var start = textarea.selectionStart;
      var end = textarea.selectionEnd;
      textarea.value = textarea.value.substr(0, start) + text + textarea.value.substr(end);
      textarea.setSelectionRange(start + text.length, start + text.length);
    } else {
      textarea.value += text + " ";
    }
    textarea.focus();
  }
}

function highlight(post) {
  var cells = document.getElementsByTagName("div");
  for (var i = 0; i < cells.length; i++)
  if (cells[i].className == "reply highlight") cells[i].className = "reply";
  var reply = document.getElementById("reply" + post);
  if (reply) {
    reply.className = "reply highlight";
    var match = /^([^#]*)/.exec(document.location.toString());
    document.location = match[1] + "#" + post;
    return false;
  }
  return true;
}

function set_stylesheet(styletitle, norefresh) {
  set_cookie("wakabastyle", styletitle, 365);
  var links = document.getElementsByTagName("link");
  var found = false;
  for (var i = 0; i < links.length; i++) {
    var rel = links[i].getAttribute("rel");
    var title = links[i].getAttribute("title");
    if (rel.indexOf("style") != -1 && title) {
      links[i].disabled = true;
      if (styletitle == title) {
        links[i].disabled = false;
        found = true;
      }
    }
  }
  if (!found) set_preferred_stylesheet();
}

function set_preferred_stylesheet() {
  var links = document.getElementsByTagName("link");
  for (var i = 0; i < links.length; i++) {
    var rel = links[i].getAttribute("rel");
    var title = links[i].getAttribute("title");
    if (rel.indexOf("style") != -1 && title) links[i].disabled = (rel.indexOf("alt") != -1);
  }
}

function get_active_stylesheet() {
  var links = document.getElementsByTagName("link");
  for (var i = 0; i < links.length; i++) {
    var rel = links[i].getAttribute("rel");
    var title = links[i].getAttribute("title");
    if (rel.indexOf("style") != -1 && title && !links[i].disabled) return title;
  }
  return null;
}

function get_preferred_stylesheet() {
  var links = document.getElementsByTagName("link");
  for (var i = 0; i < links.length; i++) {
    var rel = links[i].getAttribute("rel");
    var title = links[i].getAttribute("title");
    if (rel.indexOf("style") != -1 && rel.indexOf("alt") == -1 && title) return title;
  }
  return null;
}

function set_inputs(id) {
  with(document.getElementById(id)) {
    if (!field1.value) field1.value = get_cookie("name");
    if (!field2.value) field2.value = get_cookie("email");
    if (!password.value) password.value = get_password("password");
  }
}

function set_delpass(id) {
  with(document.getElementById(id)) password.value = get_cookie("password");
}

function setPostInputs() {
  document.getElementById("field1").value = get_cookie("name");
  document.getElementById("field2").value = get_cookie("email");
}

function setDelPass() {
  document.getElementById("delPass").value = get_password("password");
}

function do_ban(el) {
  var reason = prompt("Give a reason for this ban:");
  if (reason) document.location = el.href + "&comment=" + encodeURIComponent(reason);
  return false;
}
window.onunload = function (e) {
  if (style_cookie) {
    var title = get_active_stylesheet();
    set_cookie(style_cookie, title, 365);
  }
}
window.onload = function (e) {
  var match;
  if (match = /#i([0-9]+)/.exec(document.location.toString())) if (!document.getElementById("field4").value) insert(">>" + match[1]);
  if (match = /#([0-9]+)/.exec(document.location.toString())) highlight(match[1]);
  if (window.location.href.indexOf("admin") == -1) {
    $("#boardList").children().each(function (option) {
      if ($(this).text() == "Select a board") {
        $("#boardList").prop("selectedIndex", $(this).prop("index"));
      }
    });
  }
  if (document.getElementById("styleSelector")) {
    var styles = new Array();
    styles = document.getElementById("styleSelector").options;
    for (var i = 0; i < styles.length; i++) {
      if (get_active_stylesheet() == styles[i].value) {
        document.getElementById("styleSelector").selectedIndex = styles[i].index;
      }
    }
  }
  $('.thread').on('tap', '.post, .post > blockquote', function (event) {
    if (isMobile()) {
      if ($(this).hasClass('post') && (event.target == this)) {
        $(this).parent().children('.mobile-post-menu').toggle();
      } else if (event.target.nodeName == "BLOCKQUOTE") {
        $(this).parent().parent().children('.mobile-post-menu').toggle();
      }
      $('#tooltippost,#tooltiparrowpost').hide();
    }
  });
  $('.thread').on('tap', '.filter-button', function () {
    $(this).parent().children('.mobile-delete-menu').hide()
    $(this).parent().children('.mobile-filter-menu').toggle();
  });
  $('.thread').on('tap', '.delete-button', function () {
    $(this).parent().children('.mobile-filter-menu').hide();
    $(this).parent().children('.mobile-delete-menu').toggle();
  });
  $('.pass-field').val(get_password("password"));

  doIt();
  prettyPrint();
  hide_captcha();
}

if (style_cookie) {
  var cookie = get_cookie(style_cookie);
  var title = cookie ? cookie : get_preferred_stylesheet();
  set_stylesheet(title);
}

function preventDef(event) {
  event.preventDefault();
}

function toggleNavMenu(link, mode) {
  if (mode == 0) {
    document.getElementById("overlay").style.display = "block";
    $('.topNavRight').children('a').outerHTML = '<a href="javascript:void(0)" onclick="toggleNavMenu(this,1);">Board Options</a>';
    loadSavedSettings();
    setTab(1);
  } else {
    document.getElementById("overlay").style.display = "none";
    $('.topNavRight').children('a').outerHTML = '<a href="javascript:void(0)" onclick="toggleNavMenu(this,0);">Board Options</a>';
  }
}

function setTab(page) {
  $('.optionspage').hide();
  $('#optionspage' + page).show();
}

function togglePostMenu(button) {
  var menuid = $(button).attr('id');
  menuid = menuid.replace(/[^0-9]*/g, '');
  post = $(button).parentsUntil('.post').parent();

  if (isMobile()) {
    menu = $(post).find('#postMenu' + menuid + 'Mobile');
    if ($(menu).css('display') != 'block') {
      $(menu).css('display', 'block');
    } else {
      $('.postMenu').css('display', 'none');
    }
  } else {
    menu = $(post).find('#postMenu' + menuid);
    if ($(menu).css('display') != 'block') {
      $(menu).css('display', 'block');
      $(menu).css('left', findPos(button));
    } else {
      $('.postMenu').css('display', 'none');
    }
  }
}

$(document).mouseup(function (e) {
  var container = $("#overlay");
  var menus = $("div.postMenu");
  if (document.getElementById("overlay").style.display == "block") {
    if (container.has(e.target).length === 0) {
      toggleNavMenu(document.getElementsByClassName('topNavRight')[0].firstElementChild, 1);
    }
  }
  if (menus.has(e.target).length === 0) {
    var openMenus = $("div.postMenu:visible");
    if (openMenus.length > 0) {
      var buttonID = $(openMenus).attr("id").replace("Menu", "MenuButton");
      if ($("#" + buttonID).has(e.target).length === 0) {
        openMenus.hide();
      }
    }
  }
});

function reportPostPopup(post) {
  reportWindow = window.open(sitevars.boardpath + 'wakaba.pl?task=report&num=' + post, '', 'width=405px,height=215px,scrollbars=no');
}

function findPos(obj) {
  var curleft = curtop = 0;
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
    } while (obj = obj.offsetParent);
    return curleft;
  }
}

function findPosY(obj) {
  var curleft = curtop = 0;
  if (obj.offsetParent) {
    do {
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    return curtop;
  }
}

function showSub(menu) {
  menu.lastElementChild.style.top = 0;
  menu.lastElementChild.style.top = $(menu).position().top + "px";
  menu.lastElementChild.style.display = "block";
  if (menu.nextElementSibling.className == "hasSubMenu") {
    if (menu.nextElementSibling.lastElementChild.style.display == "block") {
      menu.nextElementSibling.lastElementChild.style.display = "none";
    }
  } else {
    if (menu.previousElementSibling.lastElementChild.style.display == "block") {
      menu.previousElementSibling.lastElementChild.style.display = "none";
    }
  }
}

function closeSub(menu) {
  if (menu.nextElementSibling.className == "hasSubMenu") {
    if (menu.nextElementSibling.lastElementChild.style.display == "block") {
      menu.nextElementSibling.lastElementChild.style.display = "none";
    }
  } else if (menu.previousElementSibling.className == "hasSubMenu") {
    if (menu.previousElementSibling.lastElementChild.style.display == "block") {
      menu.previousElementSibling.lastElementChild.style.display = "none";
    }
  } else if (menu.previousElementSibling.previousElementSibling.className == "hasSubMenu") {
    if (menu.previousElementSibling.previousElementSibling.lastElementChild.style.display == "block") {
      menu.previousElementSibling.previousElementSibling.lastElementChild.style.display = "none";
    }
  }
}

function deletePost(num, fileonly) {
  var board = sitevars.boarddir;
  fileonly = fileonly == 1 ? "&fileonly=1" : "";
  var deletionurl = isMobile() ? sitevars.boardpath + "wakaba.pl?task=delete&delete=" + num + "&password=" + $('#mobile-delpass-' + num).val() + fileonly : sitevars.boardpath + "wakaba.pl?task=delete&delete=" + num + "&password=" + $('#delPass').val() + fileonly;
  $.ajax({
    type: 'GET',
    url: deletionurl,
    success: function (data) {
      if ($(data).filter('#errorMessage').length > 0) {
        alert($(data).filter('#errorMessage').text());
      } else {
        alert("Post deleted.");
      }
    }
  });
}

function togglePostForm() {
  var postFormStatus = $("#postForm").css('display');
  if (postFormStatus == "none") {
    $("#postForm").css('display', 'table');
  } else {
    $("#postForm").css('display', 'none');
  }
}
