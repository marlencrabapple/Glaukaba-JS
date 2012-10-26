var isOn = 0;
var updaterTimer;
var updaterTimeLeft;
var timeLeft = 30;
var req = new XMLHttpRequest();
var modified;
var newPosts;
var postsAdded = 0;
var numberOfPosts = 0;
var settings = ['qRep','inlineExpansion','threadUpdater','quotePreview','replyHiding','threadHiding','anonymize','inlineQuote','expandPosts','expandThreads','replyBacklinking'];
var hasCaptcha = 0;
var postsInTitle=0;
var finalDivScrollPos;

function setQrInputs(){
	document.getElementById("qrField1").value=get_cookie("name");
	document.getElementById("qrField2").value=get_cookie("email");
	document.getElementById("qrPassword").value=get_password("password");
}

function toggleFeature(feature,value){
	localStorage.setItem(feature, value);
}

function loadSavedSettings(){
	//console.log(settings.length);
	
	for (var i = 0; i < settings.length; i++){
		if((localStorage.getItem(settings[i])=='false')||(localStorage.getItem(settings[i])==null)){
			document.getElementById(settings[i]).checked = "";
		}
		else{
			document.getElementById(settings[i]).checked = "checked";
		}
		//console.log(settings[i]+": "+localStorage.getItem(settings[i]));
		//console.log(i);
	}
}

// Image Expansion 2: Expandinated
function imgExpPrep(){
	//var images = document.getElementsByClassName('thumbLink');
	//var images = $("a.thumbLink");
	/*for (var i = 0; i < images.length; i++){
		if (images[i].className.indexOf("processed") == -1){
			$(images[i]).on('click',function(e){expandImage(this);e.preventDefault();});
			images[i].className += " processed";
		}
	}*/
	$("body").on("click","a.thumbLink",function(e){expandImage(this);e.preventDefault();});
}

function qrPrep(){
	//var refLinks = document.getElementsByClassName('refLinkInner');
	var board = document.getElementById('forJs').innerHTML;
	/*for (var i = 0; i < refLinks.length; i++ ){
		if (i == 0){i = numberOfPosts;}
		if (refLinks[i].className.indexOf("processed") == -1){
			$(refLinks[i]).on('click',function(e){quickReply(this,board);e.preventDefault();});
		}
		refLinks[i].className += " processed";
	}*/
	
	$("body").on("click","a.refLinkInner",function(e){quickReply(this,board);e.preventDefault();});
}

function quotePreviewPrep(){
	var varReferences = document.getElementsByClassName("postlink");
	
	/*for (var i = 0; i < varReferences.length; i++ ){
		if (varReferences[i].className.indexOf("processed") == -1){
			varReferences[i].setAttribute("class", "postlink processed");
			$(varReferences[i]).on('mouseover',function(e){quotePreview(this,0)});
			$(varReferences[i]).on('mouseout',function(e){quotePreview(this,1)});
			
			if(localStorage.getItem('inlineQuote')=='true'){	
				varReferences[i].onclick = "";
				varReferences[i].setAttribute("onclick","");
				$(varReferences[i]).on('click',function(e){inlineQuote(this,this.href,0); e.preventDefault();});
			}
			
			// For auto-updater (may be obsolete now)
			varReferences[i].innerHTML = varReferences[i].innerHTML.replace(" (OP)","");
			varReferences[i].innerHTML = varReferences[i].innerHTML.replace(" (Cross-thread)","");
					
			if (document.getElementById("parent" + varReferences[i].innerHTML.substring(8)) != null){
				varReferences[i].innerHTML += " (OP)";
			}
			else{
				if (document.getElementById("reply" + varReferences[i].innerHTML.substring(8)) == null){
					if (document.body.className == "replypage"){
						varReferences[i].innerHTML += " (Cross-thread)"
					}
				}
			}
		}
	}*/
	
	$("body").on("mouseover","a.postlink",function(){quotePreview(this,0)});
	$("body").on("mouseout","a.postlink",function(){quotePreview(this,1)});
	
	if(localStorage.getItem('inlineQuote')=='true'){
		//$(varReferences[i]).on('click',function(e){inlineQuote(this,this.href,0); e.preventDefault();});
		$("a.postlink").removeAttr("onclick");
		$("body").on("click","a.postlink",function(e){inlineQuote(this,this.href,0); e.preventDefault();});
	}
}

function updaterPrep(){
	if (postsAdded < 1){
		if(document.body.className=="replypage"){
			req = new XMLHttpRequest();
			req.open('HEAD', document.location, false);
			req.send(null);
			modified = req.getResponseHeader("Last-Modified");
			
			//currentPosts = document.getElementsByClassName("replyContainer");
			
			var updateLink = document.createElement('a');
			updateLink.innerHTML = "<a style='position: fixed; padding: 5px; right: 0; bottom:0;' id='threadUpdaterButton' href='javascript:void(0)' onclick='updateThread()'>Auto update</a>";
			
			var modifiedDiv = document.createElement('div');
			modifiedDiv.setAttribute("id","lastModified");
			modifiedDiv.style.display = "none";
			modifiedDiv.innerHTML = modified;
			
			document.body.appendChild(modifiedDiv);
			document.body.appendChild(updateLink);
		}
	}
}

function hideThreadPrep(){
	if (document.body.className)
        return;
	var threads = document.getElementsByClassName('thread');
	for (var i=0; i < threads.length; i++){
		(function(e) {
			var parentPost = threads[e].firstElementChild;
			//console.log(threads[e].firstElementChild);
			var filesize = parentPost.childNodes[5];
	
			if (filesize.className.indexOf("processed") == -1){
				filesize.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a> "+filesize.innerHTML;
				filesize.setAttribute("class", "filesize processed");
				filesize.addEventListener("click",function(){hideThread(threads[e],parentPost,filesize)});
				
				if(localStorage.getItem("thread"+parentPost.id.substring(6)+"Hidden")=='true'){
					hideThread(threads[e],parentPost,filesize);
				}
			}
		})(i);
	}
}

function hideReplyPrep(){
	//doubledashes = document.getElementsByClassName('doubledash');
	
	/*for (var i=0; i < doubledashes.length; i++){
		(function(e) {
			if (doubledashes[e].className.indexOf("processed") == -1){
				doubledashes[e].innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>";
				doubledashes[e].setAttribute("class", "doubledash processed");
				doubledashes[e].addEventListener("click",function(){hidePost(doubledashes[e].nextElementSibling.id)});
				
				if(localStorage.getItem(doubledashes[e].nextElementSibling.id+"Hidden")=='true'){
					hidePost(doubledashes[e].nextElementSibling.id);
				}
			}
		})(i);
	}*/
	doubledashes = $('.doubledash:not(.processed)');
	doubledashes.html("<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>");
	doubledashes.attr('class','doubledash processed');
	doubledashes.bind('click',function(){hidePost(this.nextElementSibling.id)});
	doubledashes.each(function(e){if(localStorage.getItem(this.nextElementSibling.id+"Hidden")=='true'){hidePost(this.nextElementSibling.id)}});
}

// alternate solution from Bergi @ stackoverflow
function postExpansionPrep(){
    if (document.body.className)
        return;
    var links = document.getElementsByClassName("abbrev");
    for (var i = 0; i < links.length; i++ ){
        var child = links[i].firstElementChild;
        if (!child) // could be null as well
            continue;
        child.addEventListener("click", function(e){
            expandPost(this);
            e.preventDefault();
        }, true);
        //console.log(child.href);
    }
}

function threadExpansionPrep(){
    if (document.body.className)
        return;
    var links = document.getElementsByClassName("omittedposts");
    for (var i = 0; i < links.length; i++ ){
		//links[i].innerHTML = links[i].innerHTML.replace("Reply","<a href='javascript:void(0)'>here</a>");
		links[i].outerHTML = "<span class='omittedposts processed'><a style='text-decoration: none;' href='javascript:void(0)' onclick=expandThread('"+links[i].previousElementSibling.id+"',0)>+ " + links[i].innerHTML.replace("Reply","here") + "</a></span>"
    }
}

function replyBacklinkingPrep(){
	var references = document.getElementsByClassName("postlink");
	var postNumbers = document.getElementsByClassName("refLinkInner");

	for (var i = 0; i < references.length; i++ ){	
		for (var a = 0; a < postNumbers.length; a++){
			var referencedPost = references[i].innerHTML.replace("&gt;&gt;","No.");
			referencedPost = referencedPost.replace(" (OP)","");
			//console.log(referencedPost);
			
			if (postNumbers[a].innerHTML.indexOf(referencedPost) != -1){
				//console.log(referencedPost);
				var backlink = document.createElement("a");
				
				var postReferenced = $(references[i]).parents().map(function(){
						return this.id;
					}).get().join(',');
					
				if(postReferenced.indexOf("reply")!=-1){
					var postReferencedId = "reply" + referencedPost.replace("No.","");
					postReferenced = postReferenced.split(',');
					for(var x = 0; x < postReferenced.length; x++){
						// works because reply123 always comes before replyContainer123 in the DOM tree
						if (postReferenced[x].indexOf("reply")!=-1){
							postReferenced = postReferenced[x];
						}
					}
					postReferenced = postReferenced.replace("reply","");
					//console.log(postReferenced);
				}
				else{
					var postReferencedId = "parent" + referencedPost.replace("No.","");
					postReferenced = postReferenced.split(',');
					for(var x = 0; x < postReferenced.length; x++){
						if (postReferenced[x].indexOf("parent")!=-1){
							postReferenced = postReferenced[x];
						}
					}
					postReferenced = postReferenced.replace("parent","");
				}
				
				if(document.getElementById("backlink" + postReferenced) == null){
					backlink.innerHTML = "&gt;&gt;" + postReferenced;
					backlink.href = "javascript:void(0);"
					backlink.id = "backlink" + postReferenced;
					backlink.style.paddingRight = "3px";
					
					$(backlink).bind('mouseover',function(e){quotePreview(this,0); e.preventDefault();});
					$(backlink).bind('mouseout',function(e){quotePreview(this,1); e.preventDefault();});
					
					if(localStorage.getItem('inlineQuote')=='true'){
						$(backlink).bind('click',function(a){inlineQuote(this,this.href,0,1);a.preventDefault();});
					}
					
					if(backlink.innerHTML.indexOf('inline')==-1){
						postNumbers[a].parentElement.parentElement.appendChild(backlink);
					}
				}
			}
		}
	}
}

// this is a "hybrid" function in that it handles both the prep and the actual function
function highlightPosts(identifier){
	if(identifier!=undefined){
		$(".reply.highlight").attr("class","reply");
		
		if(identifier.className=="postername"){
			if(identifier.firstElementChild!=null){
				if(identifier.firstElementChild.className=="adminName"){
					console.log($(identifier).text());
					var thread=$(identifier).parentsUntil("div.thread").parent()[0];
					$(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class','reply highlight');
				}
			}
			else if(identifier.nextElementSibling.className=="postertrip"){
				identifier = identifier.nextElementSibling;
				console.log($(identifier).text());
				var thread=$(identifier).parentsUntil("div.thread").parent()[0];
				//console.log(identifier);
				$(thread).children("div.replyContainer").children('div.reply:contains("'+$(identifier).text()+'")').attr('class','reply highlight');
			}
			else{
				console.log("Nothing to identify by");
			}
		}
		else if(identifier.className=="postertrip"){
			if(identifier.firstElementChild!=null){
				if(identifier.firstElementChild.className=="adminTrip"){
					console.log($(identifier).text());
					var thread=$(identifier).parentsUntil("div.thread").parent()[0];
					$(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class','reply highlight');
				}
			}
			else{
				console.log($(identifier).text());
				var thread=$(identifier).parentsUntil("div.thread").parent()[0];
				//console.log(identifier);
				$(thread).children("div.replyContainer").children('div.reply:contains("'+$(identifier).text()+'")').attr('class','reply highlight');
			}
		}
		else if(identifier.className=="id"){
			console.log($(identifier).text());
			var thread=$(identifier).parentsUntil("div.thread").parent()[0];
			$(thread).children("div.replyContainer").children('div.reply:contains('+$(identifier).text()+')').attr('class','reply highlight');
		}
	}
	else{
		$("body").on("click","span.postername",function(){highlightPosts(this)});
		$("body").on("click","span.postertrip",function(){highlightPosts(this)});
		$("body").on("click","span.id",function(){highlightPosts(this)});
		//console.log(identifier);
	}
}

// ENTERPRISE
function titleFactory(mode){
	if(mode==1){
		finalDivScrollPos=$('.reply.newPost').last().scrollTop();
		console.log(finalDivScrollPos);
		document.title="("+postsInTitle+") "+$(".parentPost").children('blockquote').first().text();
		return;
	}
	else if(isOn==1){
		//console.log(($(document).scrollTop()) + "/" + ($('.newPost').last().offset().top-$(window).height()));
		//console.log($('.newPost').last().height());
		//console.log($('.newPost').last());
		
		// checks if undefined
		if($('.newPost').last().length){
			if (($(document).scrollTop()-100) > ($('.newPost').last().offset().top-$(window).height())){
				postsInTitle=0;
				document.title="("+postsInTitle+") "+$(".parentPost").children('blockquote').first().text();
				$('.unreadMarker').css('box-shadow','');
				$('.reply.newPost').attr('class','reply');
				$('.reply.unreadMarker').attr('class','reply');
				$('.reply.newPost.highlight').attr('class','reply highlight');
				//console.log("asdf");
			}
		}
	}
	/*if (isOn==1){
	console.log(window.pageYOffset+"/"+(findPosY(document.getElementById("deleteForm"))-600));
		
		// needs something like waypoints
		if(window.pageYOffset>findPosY(document.getElementById("deleteForm"))-600){
			postsInTitle=0;
			document.title="("+postsInTitle+") "+$(".parentPost").children('blockquote').first().text();
			$('.reply.newPost').attr('class','reply');
			$('.reply.newPost.highlight').attr('class','reply highlight')
		}
	}
	*/
}

$(document).scroll(function(){titleFactory()});

function doIt(again){
	if (!again){
		if(localStorage.getItem('qRep')=='true'){ qrPrep(); }
		if(localStorage.getItem('quotePreview')=='true'){ quotePreviewPrep(); }
		if(localStorage.getItem('inlineExpansion')=='true'){ imgExpPrep(); }
		highlightPosts();
	}
	if(localStorage.getItem('replyHiding')=='true'){ hideReplyPrep(); }
	if(localStorage.getItem('threadUpdater')=='true'){ updaterPrep(); }
	if(localStorage.getItem('threadHiding')=='true'){ hideThreadPrep(); }
	if(localStorage.getItem('anonymize')=='true'){ anonymize(); }
	if(localStorage.getItem('expandPosts')=='true'){ postExpansionPrep(); }
	if(localStorage.getItem('expandThreads')=='true'){ threadExpansionPrep(); }
	if(localStorage.getItem('replyBacklinking')=='true'){ replyBacklinkingPrep(); }
	if(localStorage.getItem('inlineQuote')=='true'){ $("a.postlink").removeAttr("onclick"); }
	prettyPrint();
}

function expandPost(link){
	if(link.hash){
		$.get(link, function(data) {
			var loadedPost = $(data).find("#reply" + link.hash.replace("#",""));
			document.getElementById("reply" + link.hash.replace("#","")).lastElementChild.innerHTML = $(loadedPost).find("blockquote").last().html();
			//doIt();
		});
	}
	else{
		$.get(link, function(data) {
			var loadedPost = $(data).find("#parent" + link.pathname.substring(link.pathname.lastIndexOf("/")+1));
			document.getElementById("parent" + link.pathname.substring(link.pathname.lastIndexOf("/")+1)).lastElementChild.innerHTML = $(loadedPost).find("blockquote").last().html();
			//doIt();
		});
	}
}

function expandThread(parentDivId,mode){
	var board = document.getElementById('forJs').innerHTML;
	var threadLink = window.location.hostname + "/" + board + "/res/" + parentDivId.replace("parent","");
	
	if(mode == 0){
		$.get(threadLink, function(data){
			var loadedThread = $(data).find(".replyContainer");
			var omittext = $($('#'+parentDivId).next()).html();
			omittext = omittext.replace("+","-");
			omittext = omittext.replace(",0",",1");
			$($('#'+parentDivId).siblings()).hide();
			$($(loadedThread)).insertAfter('#'+parentDivId);
			//$($(omittext)).insertAfter('#'+parentDivId);
			hideReplyPrep();
		});
	}
	else{
		// disabled for now
		$.get(window.location.href, function(data){
			//var loadedThread = $($($(data).find("#" + parentDivId))).parent();
			//$(loadedThread).remove("#" + parentDivId);
			//$($(loadedThread)).insertAfter('#'+parentDivId);
			//$($('#'+parentDivId).parent()).remove();
		});
	}
}

function anonymize(){
	names = document.getElementsByClassName('postername');
	names2 = document.getElementsByClassName('commentpostername');
	
	for(var i=0; i<names.length; i++){
		names[i].innerHTML = "Anonymous";
		
		if(names[i].nextElementSibling!=null){
			if(names[i].nextElementSibling.className=="postertrip"){
				names[i].nextElementSibling.outerHTML = "";
			}
		}
	}
	
	for(var i=0; i<names2.length; i++){
		names2[i].innerHTML = "Anonymous";
		
		if(names2[i].nextElementSibling!=null){
			if(names2[i].nextElementSibling.className=="postertrip"){
				names2[i].nextElementSibling.outerHTML = "";
			}
		}
	}
}

function recaptchaRefresh(){
	if (hasCaptcha==1){
		Recaptcha.reload("t");
	
		// so much for bleeding edge
		document.getElementById("recaptcha_image").addEventListener("DOMNodeInserted", function(e) {
		  document.getElementById("qrCaptcha").innerHTML = document.getElementById("recaptchaContainer").innerHTML;
		}, false);
	}
}

function quickReply(refLink, board){
	var ref = refLink.innerHTML.replace("No.",">>"); // can't use refLink.text because of IE incompatibities
	var _div = document.createElement('div');
	_div.id = "quickReply";
	var parent;
	var addons;
	var uploadField = $('#uploadField');
	
	// tada! no more crashes in the admin panel. its a shit solution, but whatever
	if(document.getElementById("recaptchaContainer")){
		document.getElementById("recaptcha_reload_btn").href = "javascript:recaptchaRefresh();";
		var recaptchaInsert = document.createElement('div');
		recaptchaInsert.id = "recaptchaInsert";
		recaptchaInsert.innerHTML = document.getElementById("recaptchaContainer").innerHTML;
		hasCaptcha=1;
	}
	else{
		// its empty, but i ate too much bread and just want to get this over with.
		var recaptchaInsert = document.createElement('div');
		recaptchaInsert.id = "recaptchaInsert";
	}
	
	if(document.getElementsByName("admin")[0]){
		var addons = '<div class="postTableContainer"><div class="postBlock">Options</div><div class="postSpacer"></div><div class="postField"><label>Self Format<input type="checkbox" name="no_format" value="1"></label> <label> Use Capcode<input type="checkbox" name="capcode" value="1"></label></div></div><input type="hidden" name="no_captcha" value="1">' + document.getElementsByName("admin")[0].outerHTML;
	}
	else{
		var addons = '';
	}
	
	parent = $(refLink).parentsUntil("div.thread").parent()[0].firstElementChild.id.replace("parent","");
	console.log(parent);

	// needs to get admin and no captcha keys
	// this whole thing probably needs to be rewritten.
	if(document.getElementById("quickReply") == null){
		document.body.appendChild(_div);
		_div.innerHTML += '<span>Quick Reply</span><a href="javascript:void(0)" style="float: right" onclick="closeQuickReply();">[ x ]</a><form id="qrActualForm" action="/' + board + '/wakaba.pl" method="post" enctype="multipart/form-data"> <input type="hidden" name="task" value="post"> <input type="hidden" name="parent" value=' + parent + '> <div class="trap">Leave these fields empty (spam trap): <input type="text" name="name" autocomplete="off"><input type="text" name="link" autocomplete="off"></div> <div id="qrPostForm"> <div class="postTableContainer"> <div class="postBlock">Name</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field1" id="qrField1"></div> </div> <div class="postTableContainer"> <div class="postBlock">Link</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field2" id="qrField2"></div> </div> <div class="postTableContainer"> <div class="postBlock">Subject</div> <div class="postSpacer"></div> <div class="postField"> <input type="text" name="field3" class="postInput" id="qrField3"> <input type="submit" id="qrField3s" value="Submit" onclick="setSubmitText();"> </div> </div> <div class="postTableContainer"> <div class="postBlock">Comment</div> <div class="postSpacer"></div> <div class="postField"><textarea name="field4" class="postInput" id="qrField4"></textarea></div> </div> <div class="postTableContainer" id="qrCaptcha">' + recaptchaInsert.innerHTML + '</div> <div class="postTableContainer">'+ uploadField.html() +'</div> <div class="postTableContainer"> <div class="postBlock">Password</div> <div class="postSpacer"></div> <div class="postField"><input type="password" class="postInput" id="qrPassword" name="password"> (for post and file deletion)</div> </div> ' + addons + ' <div class="postTableContainer"> </div> <div id="qrErrorStatus" style="color:red"></div> </div> </form>';
		
		document.getElementById("quickReply").childNodes[2].childNodes[7].childNodes[7].childNodes[5].childNodes[0].value += ref+"\n";
		setQrInputs("qrPostForm");
		qrAjaxSubmit();
	}
	else{
		document.getElementById("quickReply").childNodes[2].childNodes[7].childNodes[7].childNodes[5].childNodes[0].value += ref+"\n";
	}
}

function setSubmitText(){
	document.getElementById("qrField3s").value = "Submitting...";
}

function qrAjaxSubmit(){
	//bind 'qrActualForm' and provide a simple callback function
	$(document).ready(function() { 
		var options= {
			error: showResponse,
			success: showResponse
		};
		
		$('#qrActualForm').ajaxForm(options);
	});
}

function showResponse(responseText, statusText, xhr, $form){
	if(responseText.indexOf("errorMessage")==-1){
		document.getElementById("qrErrorStatus").innerHTML="";
		closeQuickReply();
		if (hasCaptcha==1){
			Recaptcha.reload("t");
		}
	  }
	  else{
		console.log(responseText);
		document.getElementById("qrErrorStatus").innerHTML="Something went wrong.";
		document.getElementById("qrField3s").value = "Try again";
		recaptchaRefresh();
	  }
}

// this isn't in use
function deleteAjaxSubmit(){
	$(document).ready(function() {
		// bind 'qrActualForm' and provide a simple callback function
		$('#delform').ajaxForm(function() {
			console.log("Deleted?");
		});
	});
}

function closeQuickReply(){
	document.getElementById("quickReply").innerHTML = "";
	document.body.removeChild(document.getElementById("quickReply"));
}

function expandImage(thumbLink){
	var image = thumbLink.firstElementChild;
	var fullImage = document.createElement('img');
	fullImage.src = thumbLink.href;
	var dicks = 0; // some dickery to get image.onload working only when its supposed to
	
	if (image.className.indexOf("expandedThumb") == -1){
		var pageWidth = window.innerWidth;
		var offset = findPos(image);
		image.src = thumbLink.href;
		image.removeAttribute("style");
		image.className += " expandedThumb";
		
		image.onload = function(){
			if (image.naturalWidth > pageWidth-offset){
				var difference = image.naturalWidth - (pageWidth-offset);
				image.style.width = (image.naturalWidth - difference) - 100 + "px";;
			}
		}
	}
	else{
		var thumbFname = thumbLink.href.substring(thumbLink.href.lastIndexOf("src/") + 4,thumbLink.href.lastIndexOf("src/") + 17);
		image.src = boardPath + "thumb/" + thumbFname + "s.jpg";
		image.removeAttribute("style");
		dicks = 1;
		
		if (image.className.indexOf("opThumb") == -1){
			image.className = "thumb replyThumb";

			image.onload = function(){
				if (dicks){
					image.style.width = image.naturalWidth*.504+"px";
					image.style.height = image.naturalHeight*.504+"px";
					dicks = 0;
				}
			}
			// its PERFECT
			if(window.pageYOffset>findPosY(image)){
				window.scroll(0,findPosY(image)-75);
			}
		}
		else{
			image.className = "thumb opThumb";
			if(window.pageYOffset>findPosY(image)){
				window.scroll(0,findPosY(image)-75);
			}
		}
	}
}

// lol abstraction
function expandAllImages(){
	/*var images = document.getElementsByClassName("thumbLink");
	for (var i = 0; i < images.length; i++ ) {
		expandImage(images[i]);
	}*/
	$('a.thumbLink').each(function(e){expandImage(this)}); // thank you, cinco
}

function quotePreview(reference, mode){
	var referenceWork = reference.innerHTML.replace(" (OP)", "");
	var referenceWork = referenceWork.replace(" (Cross-thread)", "");
	
	if (document.getElementById("parent" + referenceWork.substring(8)) == null){
		var referencedPostNumber = "reply" + referenceWork.substring(8);
	}
	else{
		var referencedPostNumber = "parent" + referenceWork.substring(8);
	}
	
	var post = $('#'+referencedPostNumber);
	
	if (document.getElementById(referencedPostNumber) != null){
		if (mode == 0){
			var div = document.createElement('div');
			div.id = "quotePreview"+referencedPostNumber;
			div.className = "reply";
			div.style.position = "absolute";
			div.style.display = "block";
			div.style.border = "1px solid #9E9E9E";
			div.innerHTML = post.html();
			
			if((post.offset().top + post.height() >= $(window).scrollTop()) && (post.offset().top <= $(window).scrollTop() + $(window).height())){
				if(post.attr('class')=="reply"){
					post.attr('class','reply highlight');
				}
			}
			

			// helps with image resizing
			var previewOffsetY = $(div).height();
			var previewOffsetX = $(div).width();

			$(reference).mousemove(function(e){
				div.style.top = (e.pageY-(previewOffsetY+20))+"px";
				div.style.left = (e.pageX+50)+"px";
				if((($(div).width()+(e.pageX+50)) >= $(window).width())){
					div.style.width = ($(div).width()-(($(div).width() + e.pageX+50) - $(window).width()))+"px";
				}
			});
			
			// This is only appended when needed now. Should lower CPU usage.
			if(document.getElementById(div.id) == null){
				$(div).find('div[id^=inlineQuote]').remove();
				$(div).find('div[id^=backlinkInlineQuote]').remove();
				if($(div).find('a.thumbLink').children('img.expandedThumb').length){
					$(div).find('a.thumbLink').each(function(e){expandImage(this)}); //magic
				}
				document.body.appendChild(div);
			}
		}
		
		if (mode == 1){
			if(post.attr('class')=="reply highlight"){
				post.attr('class','reply');
			}
			document.body.removeChild(document.body.lastElementChild);
		}
	}
	else{
		if (mode == 0){
			var div = document.createElement('div');
			div.id = "quotePreview"+referencedPostNumber;
			div.className = "reply";
			div.style.position = "absolute";
			div.style.border = "1px solid #9E9E9E";
			
			var json = reference.href.replace(/#.*/i,"");
			json = json.replace(/.html/i,"");
			
			$.getJSON(json + ".json", function(data){
				$.each(data.posts, function(index, post){
					if(post.no == referencedPostNumber.replace("reply","")){
						$(div).html($(makeReply(post)).children('.reply').last().html());
					}
				});
				$(div).children('.replyPostInfo').children('span').after("&nbsp;");
			});
			
			var previewOffsetY = div.offsetHeight;
			//var previewOffsetX = document.getElementById(referencedPostNumber).offsetWidth;

			$(document).mousemove(function(e){
				div.style.top = (e.pageY-(previewOffsetY+10))+"px";
				div.style.left = (e.pageX+50)+"px";
			});
			
			if(document.getElementById(div.id) == null){		
				document.body.appendChild(div);
			}
			//$("#quotePreview" + referencedPostNumber).load(reference.href + ' #' + referencedPostNumber).html();
		}
		
		if (mode == 1){
			document.body.removeChild(document.body.lastElementChild); // This just looks simpler
		}
	}
}

function inlineQuote(reference, url, mode, backlink){
	var referenceWork = reference.innerHTML.replace(" (OP)", "");
	var referenceWork = referenceWork.replace(" (Cross-thread)", "");
	var div;
	
	if (document.getElementById("parent" + referenceWork.substring(8)) == null){
		var referencedPostNumber = "reply" + referenceWork.substring(8);
	}
	else{
		var referencedPostNumber = "parent" + referenceWork.substring(8);
	}
	
	var alreadyQuote = $(reference.parentElement.parentElement.parentElement).find("#inlineQuote"+referencedPostNumber).attr('id');

	if(backlink==1){
		var alreadyQuote = $(reference.parentElement.parentElement.parentElement).find("#backlinkInlineQuote"+referencedPostNumber).attr('id');
	}

	if (document.getElementById(referencedPostNumber) != null){
		if(alreadyQuote == undefined){
			//var referencedPost = document.getElementById(referencedPostNumber);
			div = $("#"+referencedPostNumber).clone(true,true);
			$(div).find('div[id^=inlineQuote]').remove(); // removes appended divs from the div we're appending. magic!
			$(div).find('div[id^=backlinkInlineQuote]').remove();
			
			// changes the size of appended images back to normal
			if($(div).find('a.thumbLink').children('img.expandedThumb').length){
				//expandImage($(div).find('a.thumbLink')[0]);
				$(div).find('a.thumbLink').each(function(e){expandImage(this)}); //magic
			}
			
			$(div).attr("id","inlineQuote"+referencedPostNumber);
			$(div).css("border","1px solid #9E9E9E");
			$(div).css("display","table");
			
			if(backlink==1){
				if($(reference).nextUntil('blockquote').length==0){
					$(div).attr("id","backlinkInlineQuote"+referencedPostNumber);
					$(reference).after(div);
				}
				else{
					$(div).attr("id","backlinkInlineQuote"+referencedPostNumber);
					$(reference).nextUntil('blockquote').last().after(div);
				}
			}
			else{
				$(reference).after(div);
			}
			
			if($('body').find("#quotePreview"+referencedPostNumber).length){

				$(div).removeClass('highlight');
			}
		}
		else{
			var quoteParent = $('#inlineQuote'+referencedPostNumber).parent();
			var inlineQuoteId = $('#inlineQuote'+referencedPostNumber).attr('id');
			quoteParent.attr('id',inlineQuoteId + "parentElem");
			
			if(backlink==1){
				$("#backlinkInlineQuote"+referencedPostNumber).remove();
				console.log("#backlinkInlineQuote"+referencedPostNumber);
			}
			else{
				$($(reference).next()).remove();
			}
		}
	}
	else{
		if(alreadyQuote == undefined){	
			var json = reference.href.replace(/#.*/i,"");
			json = json.replace(/.html/i,"");
			
			$.getJSON(json + ".json", function(data){
				$.each(data.posts, function(index, post){
					if(post.no == referencedPostNumber.replace("reply","")){
						div = document.createElement('div');
						$(div).html($(makeReply(post)).children('.reply').last().html());
					}
				});
				
				$(div).attr("id","inlineQuote"+referencedPostNumber);
				$(div).children('.replyPostInfo').children('span').after("&nbsp;");
				$(div).css("border","1px solid #9E9E9E");
				$(div).css("display","table");
				$(reference).after(div);
			});
		}
		else{
			$($(reference).next()).remove();
		}
	}
}

function threadUpdater(){
	req = new XMLHttpRequest();
	req.open('HEAD', document.location+".json", false);
	req.send(null);
	modified = req.getResponseHeader("Last-Modified");
	var json = document.location + ".json";

	if (document.getElementById("lastModified").innerHTML == modified){
		console.log("No new posts");
	}
	else{
		document.getElementById("lastModified").innerHTML = modified;
		console.log("New post!");
		postsAdded++;		
		$.getJSON(json, function(data){
			var lastPost = $('.thread').last().children().last('.reply').attr('id').replace("replyContainer","");
			var newPosts = [];
			
			$.each(data.posts, function(index, post){
				if(post.no > lastPost){
					newPosts.push(makeReply(post));
				}
			});
			
			if(postsInTitle==0){
				$('.thread').last().children().last().children('.reply').attr('class','reply unreadMarker');
				$('.thread').last().children().last().children('.reply').css('box-shadow','0 3px red');
			}
			
			$(newPosts).find('.replyPostInfo').children('span').after("&nbsp;");
			$('.thread').append(newPosts);
			postsInTitle = $('.reply.newPost').length;
			titleFactory(1);
			doIt(1);
		});
	}
	
	updaterTimer = setTimeout("threadUpdater()",15000);
}

function updateThread(){
	if(isOn == 0){
		console.log("Thread updater started.");
		threadUpdater();
		updaterCounter();
		isOn = 1;
	}
	else{
		console.log("Thread updater stopped");
		clearTimeout(updaterTimer);
		clearTimeout(updaterTimeLeft);
		isOn = 0;
		document.getElementById("threadUpdaterButton").innerHTML = "Auto update";
	}
}

function updaterCounter(){
	if (timeLeft == 0){
		timeLeft = 15;
	}
	timeLeft--;
	document.getElementById("threadUpdaterButton").innerHTML = "-"+timeLeft;
	updaterTimeLeft = setTimeout("updaterCounter()",1000);
}

function makeReply(post){
	var board = document.getElementById('forJs').innerHTML;
	var doubledash = document.createElement('div');
	doubledash.setAttribute("class","doubledash");
	doubledash.innerHTML = "&gt;&gt;";
	
	var replyContainer = document.createElement('div');
	replyContainer.setAttribute("id","replyContainer"+post.no);
	replyContainer.setAttribute("class","replyContainer");
	
	var reply = document.createElement('div');
	reply.setAttribute("id","reply"+post.no);
	reply.setAttribute("class","reply newPost");
	
	var a = document.createElement('a');
	a.setAttribute("id",post.no);
	
	var replyPostInfo = document.createElement('div');
	replyPostInfo.setAttribute("class","replyPostInfo");
	
	var delCheckbox = document.createElement('input');
	delCheckbox.setAttribute('type','checkbox');
	delCheckbox.setAttribute('name','delete');
	delCheckbox.setAttribute('value',post.no);
	$(replyPostInfo).append(delCheckbox);
	
	var replytitle = document.createElement('span');
	replytitle.setAttribute('class','replytitle');
	replytitle.innerHTML=post.sub;
	$(replyPostInfo).append(replytitle);
	
	var postername = document.createElement('span');
	postername.setAttribute('class','postername');
	postername.innerHTML=post.name;
	$(replyPostInfo).append(postername);
	
	var postertrip = document.createElement('span');
	postertrip.setAttribute('class','postertrip');
	postertrip.innerHTML=post.trip;
	$(replyPostInfo).append(postertrip);
	
	var datespan = document.createElement('span');
	datespan.setAttribute('class','date');
	datespan.innerHTML=post.now;
	$(replyPostInfo).append(datespan);
	
	var idspan = document.createElement('span');
	idspan.setAttribute('class','id');
	idspan.innerHTML=post.id;
	$(replyPostInfo).append(idspan);
	
	var refLink = document.createElement('span');
	refLink.setAttribute('class','reflink');
	
	var refLinkInner = document.createElement('a');
	refLinkInner.setAttribute('class','refLinkInner');
	refLinkInner.setAttribute('href','javascript:insert(\'&gt;&gt;'+post.no+"\')");
	refLinkInner.innerHTML = "No."+post.no;
	$(refLink).append(refLinkInner);
	$(replyPostInfo).append(refLink);
	
	var postMenuButton = document.createElement('a');
	postMenuButton.setAttribute("id","postMenuButton"+post.no);
	postMenuButton.setAttribute("class","postMenuButton");
	postMenuButton.setAttribute("href","javascript:void(0)");
	postMenuButton.setAttribute("onclick","togglePostMenu('postMenu"+post.no+"','postMenuButton"+post.no+"',0);");
	postMenuButton.innerHTML = "[<span></span>]";
	
	var postMenu = document.createElement('div');
	postMenu.setAttribute("id","postMenu"+post.no);
	postMenu.setAttribute("class","postMenu");
	postMenu.setAttribute("style","display:none");
	
	var menuReport = document.createElement('a');
	menuReport.setAttribute('onmouseover','closeSub(this);');
	menuReport.setAttribute('href','javascript:void(0)');
	menuReport.setAttribute('onclick','reportPostPopup('+post.no+',\''+board+'\')');
	menuReport.setAttribute('class','postMenuItem');
	menuReport.innerHTML = "Report this post";
	$(postMenu).append(menuReport);
	
	var deleteMenu = document.createElement('div');
	deleteMenu.setAttribute('onmouseover','showSub(this);');
	deleteMenu.setAttribute('class','hasSubMenu');
	// laziness reins supreme
	deleteMenu.innerHTML="<span class='postMenuItem'>Delete</span><div onmouseover$(this).addClass('focused') class='postMenu subMenu' style='display:none';><a class='postMenuItem' href='javascript:void(0);' onclick='deletePost("+post.no+");'>Post</a><a class='postMenuItem' href='javascript:void(0);' onclick='deleteImage("+post.no+");'>Image</a></div>";
	$(postMenu).append(deleteMenu);
	
	var filterMenu = document.createElement('div');
	filterMenu.setAttribute('onmouseover','showSub(this);');
	filterMenu.setAttribute('class','hasSubMenu');
	filterMenu.innerHTML="<span class='postMenuItem'>Filter</span><div class='postMenu subMenu' style='display:none'><a class='postMenuItem' href='javascript:void(0)'>Not yet implemented</a></div>";
	$(postMenu).append(filterMenu);
	
	var facebookButton = document.createElement('div');
	facebookButton.setAttribute('onmouseover','closeSub(this)');
	facebookButton.setAttribute('href','javascript:void(0)');
	facebookButton.setAttribute('onclick','facebookPost(window.location.hostname,'+post.no+','+post.parent+')');
	facebookButton.setAttribute('class','postMenuItem');
	facebookButton.innerHTML="Post to Facebook";
	$(postMenu).append(facebookButton);
	
	var twitterButton =  document.createElement('div');
	twitterButton.setAttribute('onmouseover','closeSub(this)');
	twitterButton.setAttribute('href','javascript:void(0)');
	twitterButton.setAttribute('onclick','twitterPost(window.location.hostname,'+post.no+','+post.parent+')');
	twitterButton.setAttribute('class','postMenuItem');
	twitterButton.innerHTML="Post to Twitter";
	$(postMenu).append(twitterButton);
	
	var permaLink = document.createElement('a');
	permaLink.setAttribute('href',boardPath + '/res/'+post.parent+'#'+post.no);
	permaLink.setAttribute('class','postMenuItem');
	permaLink.setAttribute('target','_blank');
	permaLink.innerHTML="Permalink";
	$(postMenu).append(permaLink);
	
	var blockquote = document.createElement('blockquote');
	blockquote.innerHTML = post.com;
	
	if(post.filename){
		var fileSize = document.createElement('span');
		fileSize.setAttribute('class','filesize');
		var filename=post.filename.substring(0,post.filename.lastIndexOf("."));
		filename=filename.replace("src/","");
		if(filename.length>25){
			filename=filename.substring(0,25)+'(...)'+post.filename.substring(post.filename.lastIndexOf("."));
		}
		else{
			filename=post.filename;
		}
		fileSize.innerHTML="File: <a target='_blank' href='"+ boardPath + post.image+"'>"+filename+"</a> -("+Math.round(post.fsize/1000)+" KB, "+post.w+"x"+post.h+")";
		
		var thumbLink = document.createElement('a');
		thumbLink.setAttribute('class','thumbLink');
		thumbLink.setAttribute('target','_blank');
		thumbLink.setAttribute('href',boardPath + post.image);
		var thumbnail = document.createElement('img');
		thumbnail.setAttribute('class','thumb replyThumb');
		filename=post.image.substring(0,post.image.lastIndexOf("."))+"s.jpg";
		filename=filename.replace("src/","thumb/");
		thumbnail.setAttribute('src',boardPath + filename);
		thumbnail.setAttribute('alt',post.fsize);
		thumbnail.setAttribute('data-md5',post.md5);
		thumbnail.setAttribute('style',"width:"+post.tn_w*.504+"px;height:"+post.tn_h*.504+"px;");
		$(thumbLink).append(thumbnail);
	}
	
	$(replyContainer).append(doubledash);
	$(reply).append(a);
	$(replyPostInfo).append(postMenuButton);
	$(reply).append(replyPostInfo);
	$(reply).append(postMenu);
	if(post.filename){
		$(reply).append("<br />");
		$(reply).append(fileSize);
		$(reply).append("<br />");
		$(reply).append(thumbLink);
	}
	$(reply).append(blockquote);
	$(replyContainer).append(reply);
	//$(".thread").append(replyContainer);
	return replyContainer;
}

function hidePost(replyDivId){
	var dengus = document.createElement("div");
	dengus.innerHTML = "Post Hidden";
	dengus.setAttribute("id","postStub"+replyDivId.substring(5));
	
	if((document.getElementById(replyDivId).style.display=="table")||(document.getElementById(replyDivId).style.display=="")){
		document.getElementById(replyDivId).style.display="none";
		document.getElementById("replyContainer"+replyDivId.substring(5)).appendChild(dengus);
		document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a>";
		localStorage.setItem(replyDivId+"Hidden", "true");
	}
	else{
		document.getElementById(replyDivId).style.display="table";
		document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>";
		document.getElementById("replyContainer"+replyDivId.substring(5)).removeChild(document.getElementById("postStub"+replyDivId.substring(5)));
		localStorage.removeItem(replyDivId+"Hidden");
	}
}

function hideThread(thread,parentPost,filesize){
	var dengus = document.createElement("div");
	dengus.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a> Thread Hidden";
	dengus.setAttribute("id","postStub" + parentPost.id.substring(6));
	dengus.onclick = function(){ hideThread(thread,parentPost,filesize); };
	
	if((thread.style.display=="block")||(thread.style.display=="")){
		//thread.insertBefore(dengus);
		$(thread).after(dengus);
		thread.style.display="none";
		//document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a>";
		localStorage.setItem("thread"+parentPost.id.substring(6)+"Hidden", "true");
	}
	else{
		thread.style.display="block";
		//document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>";
		//document.getElementById("replyContainer"+replyDivId.substring(5)).removeChild(document.getElementById("postStub"+replyDivId.substring(5)));
		//document.removeChild(document.getElementById("postStub"+parentPost.id.substring(6)));
		//document.removeChild(thread.nextElementSibling);
		//$("postStub"+parentPost.id.substring(6)).remove();
		document.getElementById("postStub"+parentPost.id.substring(6)).outerHTML = "";
		//console.log("postStub"+parentPost.id.substring(6))
		localStorage.removeItem("thread"+parentPost.id.substring(6)+"Hidden");
	}
}

function birthday(birthday, play){
	
	if(birthday==0){
		for (var i = 0; i < document.getElementsByClassName('hat').length; i++ ){
			document.getElementsByClassName('hat')[i].innerHTML = "<img src='"+domain+"img/partyhat.gif' style='position:absolute; margin-top:-100px;'/>"
		}
		
		document.getElementById("announcement").childNodes[1].innerHTML += "<br /><br /><a href='javascript:void(0)' onclick='birthday(1,1)'>Enable Party Hard mode</a>";
		//console.log(document.getElementById('announcement').firstChild.innerHTML);
	}
	
	if (birthday == 1){
		if (play == 1){
			play = 0;
			document.body.innerHTML+="<audio controls='controls' autoplay='autoplay' loop='loop'><source src='http://onlinebargainshrimptoyourdoor.com/asdf.ogg' type='audio/ogg'></audio>";
		}

		window.setTimeout("birthday(1,0)", 30); // 5000 milliseconds delay
		var index = Math.round(Math.random() * 5);
		var ColorValue = "FFFFFF"; // default color - white (index = 0)
		var ColorValue2 = "000000";
		if (index == 1) {
			ColorValue = "RED"; //peach
			ColorValue2 = "BLUE";
		}
		if (index == 2) {
			ColorValue = "PURPLE"; //violet
			ColorValue2 = "GREEN";
		}
		if (index == 3) {
			ColorValue = "BLUE"; //lt blue
			ColorValue2 = "RED";
		}
		if (index == 4) {
			ColorValue = "GREEN"; //cyan
			ColorValue2 = "PURPLE";
		}
		if (index == 5) {
			ColorValue = "BLACK"; //tan
			ColorValue2 = "WHITE";
		}

		document.body.style.background=ColorValue2;
		
		for (var i=0; i < document.getElementsByClassName('reply').length; i++ ){
			document.getElementsByClassName('reply')[i].style.background=ColorValue;
		}
	}
}

function partyHard(){
	birthday = 1;
}

function twitterPost(domain,post,parent){
	if(parent==0){
		parent = post;
	}
	var board = document.getElementById('forJs').innerHTML;
	window.open("https://twitter.com/share?url=http://"+encodeURI(domain+"/"+board+"/res/"+parent)+"%23"+post);
}

function facebookPost(domain,post,parent){
	if(parent==0){
		parent = post;
	}
	var board = document.getElementById('forJs').innerHTML;
	window.open("http://www.facebook.com/sharer.php?u=http://"+domain+"/"+board+"/res/"+parent+"%23"+post);
}