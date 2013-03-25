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
    console.log(pass);
    var taargus = pass.split("##");
    if (taargus[2] == 1) {
      var logoutUrl = domain + "auth/logout/";
      $($("#recaptchaContainer").children(".postField")[0]).html('<div style="padding: 5px;">You are using a ' + sitename + ' pass. [<a href="' + logoutUrl + '">Logout</a>]</div>');
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
  for (var i = 0; i < cells.length; i++) if (cells[i].className == "reply highlight") cells[i].className = "reply";
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
  document.getElementById("password").value = get_password("password");
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
    $('.topNavRight').children('a').outerHTML = '<a href="javascript:void(0)" onclick="toggleNavMenu(this,1);">Board Options</a>'
    loadSavedSettings();
  } else {
    document.getElementById("overlay").style.display = "none";
    $('.topNavRight').children('a').outerHTML = '<a href="javascript:void(0)" onclick="toggleNavMenu(this,0);">Board Options</a>'
  }
}

function togglePostMenu(button) {
  var menuName = $(button).attr('id');
  menuName = menuName.replace("Button", "");
  menuName = menuName.replace("Mobile", "");
  var status = $("#" + menuName).css("display");
  if (status == "none") {
    $("#" + menuName).css("display", "inline");
    if ($('.mobileParentPostInfo:visible').length > 0) {
      console.log($('.mobileParentPostInfo:visible').length);
      $("#" + menuName + "Mobile").css("display", "inline");
    }
  } else {
    $("div.postMenu").css("display", "none");
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
  reportWindow = window.open(boardPath + 'wakaba.pl?task=report&num=' + post, '', 'width=405px,height=215px,scrollbars=no');
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

function deletePost(postNumber) {
  var board = boardDir;
  window.location = boardPath + "wakaba.pl?task=delete&delete=" + postNumber + "&password=" + document.getElementById("delPass").value;
}

function deleteImage(postNumber) {
  var board = boardDir;
  window.location = boardPath + "wakaba.pl?task=delete&delete=" + postNumber + "&fileonly=1&password=" + document.getElementById("delPass").value;
}

function togglePostForm() {
  var postFormStatus = $("#postForm").css('display');
  if (postFormStatus == "none") {
    $("#postForm").css('display', 'block');
  } else {
    $("#postForm").css('display', 'none');
  }
}