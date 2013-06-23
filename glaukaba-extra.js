var isOn = 0;
var updaterTimer;
var updaterTimeLeft;
var timeLeft = 15;
//var req = new XMLHttpRequest();
var modified;
var newPosts;
var postsAdded = 0;
var numberOfPosts = 0;
var settings = ['qRep','inlineExpansion','threadUpdater','quotePreview','replyHiding','threadHiding','anonymize','inlineQuote','expandPosts','expandThreads','replyBacklinking','expandFilename','fixedNav','markPosts','reverseImgSearch','reverseImgSearchLinks'];
var hasCaptcha = 0;
var postsInTitle=0;
var finalDivScrollPos;
var ext = ".html";
var yourPosts = new Array();
var replytemplatever = 1;
//yourPosts = typeof sessionStorage['yourPosts'] != 'undefined' ? JSON.parse(sessionStorage['yourPosts']) : {"posts":[]};
if(typeof sessionStorage['yourPosts'] != 'undefined'){ yourPosts = JSON.parse(sessionStorage['yourPosts']); }

function isMobile(){
	return ($('#postFormToggle').css('display')=='none'?false:true);
}

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
		if($('#'+settings[i]).is('input')){
			if((localStorage.getItem(settings[i])=='false')||(localStorage.getItem(settings[i])==null)){
				document.getElementById(settings[i]).checked = "";
			}
			else{
				document.getElementById(settings[i]).checked = "checked";
			}
		}
		else{
			document.getElementById(settings[i]).value = localStorage.getItem(settings[i]);
		}
		//console.log(settings[i]+": "+localStorage.getItem(settings[i]));
		//console.log(i);
	}
	
	if((localStorage.getItem('reverseImgSearchLinks') == null)||(localStorage.getItem('reverseImgSearchLinks') == ''))
		$('#reverseImgSearchLinks').val("# Remove the hash sign from the services you'd like to use.\n\n# reverse image search\n#//www.google.com/searchbyimage?image_url=%tn\n#//tineye.com/search?url=%tn\n#//3d.iqdb.org/?url=%tn\n#//regex.info/exif.cgi?imgurl=%img\n\n# uploaders:\n#//imgur.com/upload?url=%img\n#//ompldr.org/upload?url1=%img");
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
	var board = boardDir;
	/*for (var i = 0; i < refLinks.length; i++ ){
		if (i == 0){i = numberOfPosts;}
		if (refLinks[i].className.indexOf("processed") == -1){
			$(refLinks[i]).on('click',function(e){quickReply(this,board);e.preventDefault();});
		}
		refLinks[i].className += " processed";
	}*/
	
	$("body").on("click","a.refLinkInner",function(e){quickReply(this,board);e.preventDefault();});
}

var previewinprogress;

function quotePreview(){
	$('.thread').on('mouseover','a.postlink, a.backlink',function(){
		previewinprogress = $.Deferred();
		$('div[id^=qp_]').remove();
		postlink = this;
		
		if($(postlink).attr('class') != 'backlink'){
			href = $(postlink).attr('href');
			parentnum = href.substr(href.lastIndexOf('/')+1,href.indexOf('#')-(href.lastIndexOf('/')+1)).replace('.html','');
			quoted = href.substr(href.indexOf('#')+1);
			jsonlink = noExt == 1 ? href.substr(0,href.indexOf('#')+1) + '.json' : href.substr(0,href.indexOf('#')+1).replace('.html','.json');
		}
		else{
			quoted = $(postlink).attr('id').replace('backlink','');
			//post = $('#reply' + quoted).clone();
		}
		
		if($('#reply' + quoted).length == 0){
			cachedposts = getCache(parentnum);
			
			if(cachedposts){
				$(cachedposts.posts).each(function(i,item){
					if(item.no == quoted){
						makeReply(item,function(post){
							appendPreview(post,quoted);
							previewinprogress.resolve();
						});
					}
				});
			}
			else{
				$.getJSON(jsonlink,function(data){
					setCache(parentnum, data);
					$(data.posts).each(function(i,item){
						if(item.no == quoted){
							makeReply(item,function(post){
								appendPreview(post,quoted);
								previewinprogress.resolve();
							});
						}
					});
				});
			}
		}
		else{
			post = $('#reply' + quoted).clone();
			$(post).attr('id','qp_' + $(post).attr('id'));
			$(post).css('position','absolute');
			$(post).css('border',"1px solid #9E9E9E");
			$(post).find('div[id^=iq]').remove();
			//$(post).find('div[id^=bliq]').remove();
			if($(post).find('a.thumbLink').children('img.expandedThumb').length)
				$(post).find('a.thumbLink').each(function(e){expandImage(this)}); //magic
			
			
			$(document).mousemove(function(e){
				previewOffsetY = $(post).height();
				$(post).css('top',(e.pageY-(previewOffsetY+10))+"px");
				$(post).css('left',(e.pageX+50)+"px");
			});
			
			if($('#qp_reply' + quoted).length == 0)
				$('body').append(post);
				
			previewinprogress.resolve();
		}
	});
	
	$('.thread').on('mouseout','a.postlink, a.backlink',function(){
		href = $(this).attr('href');
		quoted = href.substr(href.indexOf('#')+1);
		
		if($(previewinprogress).length <= 0)
			return;
		
		$.when(previewinprogress).then(function(){
			$('div[id^=qp_]').remove();
		});
	});
}

function appendPreview(post,quoted){
	post = $(post).children('.reply');
	$(post).attr('id','qp_' + $(post).attr('id'));
	$(post).css('position','absolute');
	$(post).css('border',"1px solid #9E9E9E");
	
	$(document).mousemove(function(e){
		previewOffsetY = $(post).height();
		$(post).css('top',(e.pageY-(previewOffsetY+10))+"px");
		$(post).css('left',(e.pageX+50)+"px");
	});
	
	if($('#qp_reply' + quoted).length == 0)
		$('body').append(post);
}

function inlineQuote(){
	//$(varReferences[i]).on('click',function(e){inlineQuote(this,this.href,0); e.preventDefault();});
	//var varReferences = document.getElementsByClassName("postlink");
	/*$(".thread").on("click","a.postlink",function(e){
		inlineQuote(this,this.href,0);
		e.preventDefault();
	});*/
	$(".thread").on("click","a.postlink, a.backlink",function(e){
		$('div[id^=qp_]').remove();
		postlink = this;
		e.preventDefault();
		inlineinprogress = $.Deferred();
		
		if($(postlink).attr('class') != 'backlink'){
			href = $(postlink).attr('href');
			parentnum = href.substr(href.lastIndexOf('/')+1,href.indexOf('#')-(href.lastIndexOf('/')+1)).replace('.html','');
			quoted = href.substr(href.indexOf('#')+1);
			jsonlink = noExt == 1 ? href.substr(0,href.indexOf('#')+1) + '.json' : href.substr(0,href.indexOf('#')+1).replace('.html','.json');
		}
		else{
			quoted = $(postlink).attr('id').replace('backlink','');
			//post = $('#reply' + quoted).clone();
		}
		
		if(($(postlink).next('#iq_reply' + quoted).length == 0)&&($(postlink).parent().parent().parent('.parentPost, .reply').children('#iq_reply' + quoted).length == 0)){
			//console.log($(postlink).parent().parent().parent('.parentPost, .reply').children('#iq_reply' + quoted));
			if($('#reply' + quoted).length == 0){
				cachedposts = getCache(parentnum);
			
				if(cachedposts){
					$(cachedposts.posts).each(function(i,item){
						if(item.no == quoted){
							makeReply(item,function(post){
								appendInlineQuote(quoted,post,postlink);
								inlineinprogress.resolve();
							});
						}
					});
				}
				else{
					$.getJSON(jsonlink,function(data){
						setCache(parentnum, data);
						$(data.posts).each(function(i,item){
							if(item.no == quoted){
								makeReply(item,function(post){
									appendInlineQuote(quoted,post,postlink);
									inlineinprogress.resolve();
								});
							}
						});
					});
				}
			}
			else{
				post = $('#reply' + quoted).clone();
				$(post).attr('id','iq_' + $(post).attr('id'));
				$(post).css('border',"1px solid #9E9E9E");
				$(post).find('div[id^=iq]').remove();
				//$(post).find('div[id^=bliq]').remove();
				if($(post).find('a.thumbLink').children('img.expandedThumb').length){
					$(post).find('a.thumbLink').each(function(e){expandImage(this)}); //magic
				}
				
				if($(postlink).next('#iq_reply' + quoted).length == 0)
					if($(postlink).attr('class') != 'backlink')
						$(postlink).after(post);
					else{
						if(isMobile()){ $(post).css('box-sizing','border-box'); }	
						$(postlink).parent().parent().parent().children('blockquote').before(post);
					}
					
				inlineinprogress.resolve();
			}
		}
		else{
			if($(postlink).attr('class') != 'backlink')
				$(postlink).next('#iq_reply' + quoted).remove();
			else
				$(postlink).parent().parent().parent().children('#iq_reply' + quoted).remove();
		}
	});
}

function appendInlineQuote(quoted,post,postlink){
	post = $(post).children('.reply');
	$(post).attr('id','iq_' + $(post).attr('id'));
	$(post).css('border',"1px solid #9E9E9E");
	
	if($(postlink).next('#iq_reply' + quoted).length == 0)
		$(postlink).after(post);
}

function updaterPrep(){
	if (postsAdded < 1){
		if(document.body.className=="replypage"){
			/*req = new XMLHttpRequest();
			req.open('HEAD', document.location, false);
			req.send(null);
			modified = req.getResponseHeader("Last-Modified");*/
			
			//currentPosts = document.getElementsByClassName("replyContainer");
			
			var updateLink = document.createElement('a');
			updateLink.innerHTML = "<a style='position: fixed; padding: 5px; right: 0; bottom:0;' id='threadUpdaterButton' href='javascript:void(0)' onclick='threadUpdater()'>Auto update</a>";
			
			/*var modifiedDiv = document.createElement('div');
			modifiedDiv.setAttribute("id","lastModified");
			modifiedDiv.style.display = "none";
			modifiedDiv.innerHTML = modified;
			
			document.body.appendChild(modifiedDiv);*/
			document.body.appendChild(updateLink);
		}
	}
}

// so legacy, so powa, yeah!
function hideThreadPrep(){
	if (document.body.className != "indexpage")
        return;
	//var threads = $('.thread');
	//console.log(threads);
	if($('#postFormToggle').css('display')=='none'){
		/*for (var i=0; i < threads.length; i++){
			var parentPost = $(threads[i]).children('.parentContainer').children('.parentPost').last();
			var filesize = $(parentPost).children('.fileinfo').children('.filesize').last();
			//if(!filesize){
				//var filesize = $(parentPost).children('.parentPostInfo')[0];
			//}
			//console.log(parentPost);
			var hideButton = document.createElement("a");
			hideButton.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a> ";
			hideButton.addEventListener("click",function(){hideThread(threads[i],parentPost,hideButton)});
			
			$(parentPost).children('.fileinfo').children('span.filesize').before(hideButton);
			//console.log(filesize);
			if($(filesize).length==0){
				$(parentPost).children('.parentPostInfo').children('input').first().before(hideButton);
				filesize = $(parentPost).children('.parentPostInfo').children('input');
				//console.log(filesize);
			}
			
			if(localStorage.getItem("thread"+$(parentPost).attr('id').substring(6)+"Hidden")=='true'){
				hideThread(threads[i],parentPost,filesize);
			}
			console.log(threads[i]);
		}*/
		
		$('.parentPost').each(function(){
			var parentpost = this;
			if($(parentpost).children('.fileinfo').length!=0){
				$(parentpost).children('.fileinfo').children('span.filesize').before(
					"<a class=\"hidePostButton hideThreadButton\" href=\"javascript:void(0)\">[ - ]</a> "
				);
			}
			else{
				$(parentpost).children('.parentPostInfo').children('input[name="delete"]').before(
					"<a class=\"hidePostButton hideThreadButton noFileInfo\" href=\"javascript:void(0)\">[ - ]</a> "
				);
			}
			//console.log("threadHidden"+$(parentpost).attr('id'));
			if(localStorage["threadHidden"+$(parentpost).attr('id')]=='true'){
				toggleThread($(parentpost).find('.hideThreadButton').last());
				//console.log($(parentpost).find('.hideThreadButton').last());
			}
		});
		
		$('.hideThreadButton').on('click',function(){
			toggleThread(this);
		});
	}
	else{	
		$('.mobilePostReplyLink').children('a.button').after('<a class="button hidePostButton" href="javascript:void(0)">Hide</a>');
		$('.hidePostButton.button').on('click',function(){
			var parentPost = $(this).parentsUntil('.thread').last().children().first().attr('id').replace('parent','');
			hideThreadMobile(this,parentPost);
		});

		/*if(localStorage.getItem("thread"+parentPost+"Hidden")=='true'){
			hideThreadMobile(button,parentPost);
		}*/
		
		// hide posts already hidden
		$('.hidePostButton.button').each(function(){
			var parentPost = $(this).parentsUntil('.thread').last().children().first().attr('id').replace('parent','');
			if(localStorage.getItem("thread"+parentPost+"Hidden")=='true'){
				hideThreadMobile(this,parentPost);
			}
		});
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
    if (document.body.className=="threadpage")
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
    if (document.body.className=="threadpage")
        return;
    var links = $('.omittedposts.desktop');
	if($('#postFormToggle').css('display')=='none'){
		for (var i = 0; i < links.length; i++ ){
			//links[i].innerHTML = links[i].innerHTML.replace("Reply","<a href='javascript:void(0)'>here</a>");
			var opid = $(links[i]).prev('.parentContainer').children('.parentPost').attr('id');
			//console.log(opid);
			links[i].outerHTML = "<span class='omittedposts processed'><a style='text-decoration: none;' href='javascript:void(0)' onclick=expandThread('"+opid+"',0)>+ " + links[i].innerHTML.replace("Reply","here") + "</a></span>"
		}
	}
	else{
		// disable for mobile
		return;
	}
}

function backlinkPrep(){
	var postlinks = $('.postlink');
	var bls = $('.backlink').length;
	
	$(postlinks).each(function(taargus){
		if(($(this).parent('.capcodeReplies').length==0)&&($(this).attr('href').indexOf("#")!=-1)){
			//console.log($(this).attr('href').indexOf(".."));
			var postNum = $(this).text().replace(">>","");
			postNum = postNum.replace(" (OP)","");
			postNum = postNum.replace(" (You)","");
			postNum = postNum.replace(" (Cross-Thread)","");
			var posts = $('#reply'+postNum+", #parent"+postNum);
			var postLinkContainerNum = $(this).parents(".reply, .parent").last().attr('id').replace("reply","");
			postLinkContainerNum.replace("parent",""); // probably useless
			
			var backlink = document.createElement("a");
			backlink.innerHTML = "&gt;&gt;" + postLinkContainerNum;
			backlink.href = "javascript:void(0);"
			backlink.id = "backlink" + postLinkContainerNum;
			backlink.className = "backlink";
			backlink.style.paddingRight = "3px";
					
			if($(posts).find("#backlink"+postLinkContainerNum).length==0)
				$(posts).find('.rightblock').append(backlink);
		}
	});
}

// this is a "hybrid" function in that it handles both the prep and the actual function
function highlightPosts(identifier){
	if(identifier!=undefined){
		$(".reply.highlight").attr("class","reply");
		
		if(identifier.className=="postername"){
			if(identifier.firstElementChild!=null){
				if(identifier.firstElementChild.className=="adminName"){
					//console.log($(identifier).text());
					var thread=$(identifier).parentsUntil("div.thread").parent()[0];
					$(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class','reply highlight');
				}
			}
			else if(identifier.nextElementSibling.className=="postertrip"){
				identifier = identifier.nextElementSibling;
				//console.log($(identifier).text());
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
					//console.log($(identifier).text());
					var thread=$(identifier).parentsUntil("div.thread").parent()[0];
					$(thread).children("div.replyContainer").children('div.reply:contains("## Admin")').attr('class','reply highlight');
				}
			}
			else{
				//console.log($(identifier).text());
				var thread=$(identifier).parentsUntil("div.thread").parent()[0];
				//console.log(identifier);
				$(thread).children("div.replyContainer").children('div.reply:contains("'+$(identifier).text()+'")').attr('class','reply highlight');
			}
		}
		else if(identifier.className=="posteridnum"){
			//console.log($(identifier).text());
			var thread=$(identifier).parentsUntil("div.thread").parent()[0];
			$(thread).children("div.replyContainer").children('div.reply:contains('+$(identifier).text()+')').attr('class','reply highlight');
		}
	}
	else{
		$("body").on("click","span.postername",function(){highlightPosts(this)});
		$("body").on("click","span.postertrip",function(){highlightPosts(this)});
		$("body").on("click","span.posteridnum",function(){highlightPosts(this)});
		//console.log(identifier);
	}
}

// tri-brid?
function expandFilename(filename,mode){
	if(filename!=undefined){
		var oldName = $(filename).text();
		if(mode==0){
			$(filename).text($(filename).attr("title"));
			$(filename).attr("title",oldName);
		}
		else{
			$(filename).text($(filename).attr("title"));
			$(filename).attr("title",oldName);
		}
	}
	else{
		$(".filesize").on("mouseover","a",function(){expandFilename(this,0)});
		$(".filesize").on("mouseout","a",function(){expandFilename(this,1)});
	}
}

function toggleThread(button){
	var thread = $(button).parentsUntil('.thread').last().parent();
	var op = $(thread).children('.parentContainer').children('.parentPost');
	var opid = $(op).attr('id');
	
	if($(button).attr('class').indexOf('revealThreadButton')==-1){
		var poststub = "<a class='hidePostButton revealThreadButton' id='threadHidden"+opid+"' href='javascript:void(0)'>[ + ] Thread Hidden</a>";
		$(thread).children('.replyContainer, .parentContainer, .omittedposts').css('display','none');
		$(thread).append(poststub);
		localStorage["threadHidden"+opid] = true;
		
		$('.revealThreadButton').on('click',function(){
			thread = $(this).parent();
			op = $(thread).children('.parentContainer').children('.parentPost');
			opid = $(op).attr('id');
			$('#threadHidden'+opid).remove();
			$(thread).children('.replyContainer, .parentContainer, .omittedposts').css('display','block');
			localStorage.removeItem("threadHidden"+opid);
		});
	}
}

function markPosts(){
	var postlinks = $('.postlink');
	//console.log(yourPosts);
	for(var i=0;i<postlinks.length;i++){
		var jsonObject = {"parent": $('#post_form').children('input[name="parent"]').attr('value'), "num": $(postlinks[i]).text().replace(">>","") }
		/*if($.inArray(jsonObject,yourPosts)!=-1){
			$(postlinks[i]).text($(postlinks[i]).text()+" (You)");
		}*/
		for(var a=0;a<yourPosts.length;a++){
			//yourPosts[a] = JSON.parse(yourPosts[a]);
			//console.log(yourPosts[a].num);
			if(jsonObject.num==yourPosts[a].num){
				$(postlinks[i]).text($(postlinks[i]).text()+" (You)");
			}
		}
	}
}

function fixedNav(){
	if(window.location.href.indexOf("admin")==-1){
		$('.topNavContainer').css('display','block');
		$('.logo').css('margin-top','25px');
	}
}

// ENTERPRISE
function titleFactory(mode){
	if(mode==1){
		finalDivScrollPos=$('.reply.newPost').last().scrollTop();
		//console.log(finalDivScrollPos);
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
	if (noExt==1){
		ext= "";
	}
	
	if($('body').attr('class')){
		if (!again){
			if(localStorage.getItem('qRep')=='true'){ qrPrep(); }
			if(localStorage.getItem('quotePreview')=='true'){ quotePreview(); }
			if(localStorage.getItem('inlineExpansion')=='true'){ imgExpPrep(); }
			if(localStorage.getItem('expandFilename')=='true'){ expandFilename(); }
			if(localStorage.getItem('fixedNav')=='true'){ fixedNav(); }
			if(localStorage.getItem('inlineQuote')=='true'){ inlineQuote(); }
			if(localStorage.getItem('threadUpdater')=='true'){ updaterPrep(); }
			highlightPosts();
		}
		if(localStorage.getItem('markPosts')=='true'){ markPosts(); }
		if(localStorage.getItem('replyHiding')=='true'){ hideReplyPrep(); }
		if(localStorage.getItem('threadHiding')=='true'){ hideThreadPrep(); }
		if(localStorage.getItem('anonymize')=='true'){ anonymize(); }
		if(localStorage.getItem('expandPosts')=='true'){ postExpansionPrep(); }
		if(localStorage.getItem('expandThreads')=='true'){ threadExpansionPrep(); }
		if(localStorage.getItem('inlineQuote')=='true'){ $('a.postlink').removeAttr("onclick"); }
		if(localStorage.getItem('replyBacklinking')=='true'){ backlinkPrep(); }
		if(localStorage.getItem('reverseImgSearch')=='true'){ makeReverseSearchLinks(); }
		prettyPrint();
	}
}

var postsfetched = [];

function getCache(parentnum){
	if($(postsfetched[parentnum]).length == 0){
		return null;
	}
	else{
		return postsfetched[parentnum];
	}
}

function setCache(parentnum,posts){
	postsfetched[parentnum] = posts;
}

function makeReverseSearchLinks(){
	if(localStorage['reverseImgSearchLinks'] == null)
		return;
		
	links = localStorage['reverseImgSearchLinks'].split('\n');
	
	$('.thumbLink').each(function(i,img){
		$(links).each(function(a,link){
			if((link.indexOf('#') != 0)&&(link.length > 1)){
				link = link.replace('%tn',encodeURIComponent(domain.substr(0,domain.length-1).replace('//','http://') + $(img).children('img').attr('src')));
				link = link.replace('%img',encodeURIComponent(domain.substr(0,domain.length-1).replace('//','http://') + $(img).attr('href')));
				link = link.replace('%md5',encodeURIComponent($(img).children('img').attr('data-md5')));
				
				reallink = document.createElement('a');
				reallink.href = link;
				
				linktext = reallink.host.substr(0,reallink.host.lastIndexOf('.')).replace('www.','');
				reallink = ' <a target="_blank" class="reverseimglink" href="'+reallink+'">'+linktext+'</a>';
				if($(img).parent('.reply, .parentPost').length != 0)
					$(img).parent().children('.fileinfo').children('.filesize').append(reallink);
				else
					$(img).parentsUntil('.reply, .parentPost').last().parent().children('.fileinfo').children('.filesize').append(reallink);
			}
		});
	});
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
			var loadedPost = $(data).find("#parent" + link.pathname.substring(link.pathname.lastIndexOf("/")+1).replace('.html',''));
			//console.log(link.pathname.substring(link.pathname.lastIndexOf("/")+1));
			document.getElementById("parent" + link.pathname.substring(link.pathname.lastIndexOf("/")+1).replace('.html','')).lastElementChild.innerHTML = $(loadedPost).find("blockquote").last().html();
			//doIt();
		});
	}
}

function expandThread(parentDivId,mode){
	var board = boardDir;
	var threadLink = boardPath + "res/" + parentDivId.replace("parent","") + ext;
	
	//console.log(board);
	//console.log(window.location.hostname);
	
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
		if(hasPass==0){
			document.getElementById("recaptcha_reload_btn").href = "javascript:recaptchaRefresh();";
			var recaptchaInsert = document.createElement('div');
			recaptchaInsert.id = "recaptchaInsert";
			recaptchaInsert.innerHTML = document.getElementById("recaptchaContainer").innerHTML;
			hasCaptcha=1;
		}
		else{
			var recaptchaInsert = document.createElement('div');
			recaptchaInsert.id = "recaptchaInsert";
		}
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
	
	parent = $(refLink).parentsUntil("div.thread").parent()[0].firstElementChild.firstElementChild.id.replace("parent","");
	//parent = $('.thread')[0].children('.parentContainer').children('.parentPost').attr('id').replace("parent","");
	//console.log(parent);

	// needs to get admin and no captcha keys
	// this whole thing probably needs to be rewritten.
	if(document.getElementById("quickReply") == null){			
		var margintop = $(".topNavContainer").css('display') == 'none' ? '0px' : "30px";
		$(_div).css('margin-top',margintop);
		document.body.appendChild(_div);
		_div.innerHTML += '<span>Quick Reply</span><a href="javascript:void(0)" style="float: right" onclick="closeQuickReply();">[ x ]</a><form id="qrActualForm" action="/' + board + '/wakaba.pl" method="post" enctype="multipart/form-data"> <input type="hidden" name="task" value="post"> <input type="hidden" name="parent" value=' + parent + '> <input type="hidden" name="ajax" value=1> <div class="trap">Leave these fields empty (spam trap): <input type="text" name="name" autocomplete="off"><input type="text" name="link" autocomplete="off"></div> <div id="qrPostForm"> <div class="postTableContainer"> <div class="postBlock">Name</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field1" id="qrField1"></div> </div> <div class="postTableContainer"> <div class="postBlock">Link</div> <div class="postSpacer"></div> <div class="postField"><input type="text" class="postInput" name="field2" id="qrField2"></div> </div> <div class="postTableContainer"> <div class="postBlock">Subject</div> <div class="postSpacer"></div> <div class="postField"> <input type="text" name="field3" class="postInput" id="qrField3"> <input type="submit" id="qrField3s" value="Submit" onclick=""> </div> </div> <div class="postTableContainer"> <div class="postBlock">Comment</div> <div class="postSpacer"></div> <div class="postField"><textarea name="field4" class="postInput" id="qrField4"></textarea></div> </div> <div class="postTableContainer" id="qrCaptcha">' + recaptchaInsert.innerHTML + '</div> <div class="postTableContainer">'+ uploadField.html() +'</div> <div class="postTableContainer"> <div class="postBlock">Password</div> <div class="postSpacer"></div> <div class="postField"><input type="password" class="postInput" id="qrPassword" name="password"> (for post and file deletion)</div> </div> ' + addons + ' <div class="postTableContainer"> </div> <div id="qrErrorStatus" style="color:red"></div> </div> </form>';
		//document.getElementById("quickReply").childNodes[2].childNodes[7].childNodes[7].childNodes[5].childNodes[0].value += ref+"\n";
		//$('#qrActualForm').children('#qrField4').attr('value','ref\n');
		document.getElementById("qrField4").value += ref+"\n";
		setQrInputs("qrPostForm");
		formStuff();
	}
	else{
		//document.getElementById("quickReply").childNodes[2].childNodes[7].childNodes[7].childNodes[5].childNodes[0].value += ref+"\n";
		document.getElementById("qrField4").value += ref+"\n";
	}
	
	if(isMobile()){
		$("#quickReply").css('position','absolute');
		$("#quickReply").css('top',window.pageYOffset);
	}
}

function setSubmitText(){
	document.getElementById("qrField3s").value = "Submitting...";
}

function formStuff(){
	$('#qrActualForm').submit(function(e){
		var form = this;
		var action = $(this).attr('action');
		var formData = new FormData(this)
		e.preventDefault();
		document.getElementById("qrField3s").value = "Submitting...";
		
		/*var postObject = $.post(action,formData,function(data){
			var yourPost = postObject.getResponseHeader("Your-Post");
			
			if(data.indexOf("errorMessage") == -1){
				document.getElementById("qrErrorStatus").innerHTML="";
				closeQuickReply();
				
				if (hasCaptcha==1){
					Recaptcha.reload("t");
					
				}
			}
			else{
				$responseObj = $(data);
				document.getElementById("qrErrorStatus").innerHTML = $responseObj.filter('#errorMessage').html();
				document.getElementById("qrField3s").value = "Try again";
				recaptchaRefresh();
			}
		});*/
		
		// fuck it i'll just steal an example from mdn
		var oReq = new XMLHttpRequest();
		oReq.onload = ajaxSuccess;
		oReq.open("post", form.action, true);
		oReq.send(new FormData(form));
	});
}

function ajaxSuccess(){
	var yourPost = this.getResponseHeader('Your-Post');
	var data = this.responseText;
	//console.log(yourPost);
	
	if(data.indexOf("errorMessage") == -1){
		yourPost = JSON.parse(yourPost);
		yourPosts.push(yourPost);
		//ls_yourPosts = sessionStorage["yourPosts"];
		//sessionStorage["yourPosts"] = typeof ls_yourPosts != 'undefined' ? ls_yourPosts.concat(yourPosts) : yourPosts;
		sessionStorage["yourPosts"] = JSON.stringify(yourPosts);
		
		document.getElementById("qrErrorStatus").innerHTML="";
		closeQuickReply();
		
		if (hasCaptcha==1){
			Recaptcha.reload("t");
		}
	}
	else{
		$responseObj = $(data);
		document.getElementById("qrErrorStatus").innerHTML = $responseObj.filter('#errorMessage').html();
		document.getElementById("qrField3s").value = "Try again";
		recaptchaRefresh();
	}
}

function qrAjaxSubmit(){
	//bind 'qrActualForm' and provide a simple callback function
	$(document).ready(function() { 
		var options= {
			error: showResponse,
			success: showResponse
		};
		
		//$('#qrActualForm').ajaxForm(options);
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
	//console.log(thumbLink);
	
	if (image.className.indexOf("expandedThumb") == -1){
		var pageWidth = window.innerWidth;
		var offset = findPos(image);
		image.src = thumbLink.href;
		image.removeAttribute("style");
		image.className += " expandedThumb";
		
		image.onload = function(){
			if (image.naturalWidth > pageWidth-offset){
				var difference = image.naturalWidth - (pageWidth-offset);
				
				if(isMobile()){
					$(image).css('cssText', "width:"+ ($(image).parentsUntil('.thread').parent().width()-(offset+10)) + "px !important");
				}
				else{
					image.style.width = (image.naturalWidth - difference) - 100 + "px";
				}
			}
		}
	}
	else{
		var thumbFname = thumbLink.href.substring(thumbLink.href.lastIndexOf("src/") + 4,thumbLink.href.lastIndexOf("src/") + 17);
		// this isn't needed in my version of glaukaba
		//var thumbExt = thumbLink.href.substring(thumbLink.href.lastIndexOf("."));
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



//var requestscount = 0;

/*function threadUpdater(){
	req = new XMLHttpRequest();
	var json = boardPath + "res/" + $(".parentPost").attr("id").replace("parent","") + ".json";
	//json = json.replace(/.html/i,".json");
	req.open('HEAD', json, false);
	req.send(null);
	modified = req.getResponseHeader("Last-Modified");

	if (document.getElementById("lastModified").innerHTML == modified){
		console.log("No new posts");
	}
	else{
		document.getElementById("lastModified").innerHTML = modified;
		console.log("New post!");
		postsAdded++;
		
		$.getJSON(json, function(data){
			var lastPost = $('.thread').last().children().last('.reply').attr('id').replace("replyContainer","");
			lastPost=lastPost.replace("parent","")
			var newPosts = [];
			
			$.each(data.posts,function(index,post){
				if(post.no > lastPost){
					requestscount++;
				}
			});
			
			$.each(data.posts,function(index,post){
				if(post.no > lastPost){
					makeReply(post,function(newPost){
						newPosts.push(newPost);
						requestscount--;
						if(requestscount==0){
							if(index == (data.posts.length-1)){
								if(postsInTitle==0){
									$('.thread').last().children().last().children('.reply').attr('class','reply unreadMarker');
									$('.thread').last().children().last().children('.reply').css('box-shadow','0 3px red');
								}
								
								//$(newPosts).find('.replyPostInfo').children('span').after("&nbsp;");
								console.log(newPosts);
								$('.thread').append(newPosts);
								postsInTitle = $('.reply.newPost').length;
								titleFactory(1);
								doIt(1);
								updaterTimer = setTimeout("threadUpdater()",15000);
							}
						}
					});
				}
			});
		});
	}
}*/

function threadUpdater(){
	if(isOn == 0){
		console.log("Thread updater started.");
		updateThread();
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

function updateThread(){
	$.ajax({
		type: 'HEAD',
		dataType: 'json',
		url: boardPath + 'res/' + $('.parentPost').attr('id').replace('parent','') + '.json',
		success: function(data,status,xhrobj){
			if(modified != xhrobj.getResponseHeader('Last-Modified')){
				modified = xhrobj.getResponseHeader('Last-Modified');
				
				// get new posts
				$.ajax({
					type: 'GET',
					dataType: 'json',
					url: boardPath + 'res/' + $('.parentPost').attr('id').replace('parent','') + '.json',
					success: function(data,status,xhrobj){
						var newPosts = [];
						var lastPost = $('.reply, .parentPost').last().attr('id').replace("reply","");
						lastPost = lastPost.replace("parent","")
						
						// build replies from data
						var deferreds = $(data.posts).map(function(i,post){
							if(post.no > lastPost){
								var deferred = $.Deferred();
								
								makeReply(post,function(reply){
									newPosts.push(reply);
									deferred.resolve();
								});
								
								return deferred;
							}
						});
						
						// append the replies
						$.when.apply(null,deferreds).then(function(){
							if(newPosts.length>0){
								if(postsInTitle==0){
									$('.reply').last().attr('class','reply unreadMarker');
									$('.reply').last().css('box-shadow','0 3px red');
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
			
			// keep the counter accurate
			clearTimeout(updaterTimer);
			clearTimeout(updaterTimeLeft);
			timeLeft = 0;
			updaterTimer = setTimeout("updateThread()",15000);
			updaterCounter();
		}
	});
}

// now with maneagable code!
function makeReply(data,callback){
	var reply = document.createElement('div');
	if(data.image){
		var tnfname = data.image.substring(0,data.image.lastIndexOf(".")) + "s.jpg";
		tnfname = tnfname.replace("src/","thumb/");
		data.tnfname = tnfname;
		
		if(data.filename.length>25){
			data.filename=data.filename.substring(0,25)+'(...)'+data.filename.substring(data.filename.lastIndexOf("."));
		}
	}
	//console.log(data);
	
	/*$.get(domain+'/js/reply-template',function(tpl){
		$(reply).jqoteapp(tpl,data);
		console.log(reply.firstElementChild);
		return reply.firstElementChild;
	});*/
	
	// gotta do it this way so you can turn off async
	if((localStorage['replytemplate'] != null)&&(localStorage['replytemplate_ver'] == replytemplatever)){
		$(reply).jqoteapp(localStorage['replytemplate'],data);
		$(reply).find('.reply').attr('class','reply newPost');
		callback(reply.firstElementChild);
	}
	else{
		$.ajax({
			type: 'GET',
			url: domain+'js/reply-template',
			success: function(tpl){
				localStorage['replytemplate'] = tpl;
				localStorage['replytemplate_ver'] = replytemplatever;
				$(reply).jqoteapp(tpl,data);
				$(reply).find('.reply').attr('class','reply newPost');
				callback(reply.firstElementChild);
			}
		});
	}
}

/*function makeReply(post){
	var board = boardDir;
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
	
	//console.log(post.sub);
	if(post.sub!=''){
		var replytitle = document.createElement('span');
		replytitle.setAttribute('class','replytitle');
		replytitle.innerHTML=post.sub;
		$(replyPostInfo).append(replytitle);
	}
	
	var postername = document.createElement('span');
	postername.setAttribute('class','postername');
	postername.innerHTML=post.name;
	$(replyPostInfo).append(postername);
	
	var postertrip = document.createElement('span');
	postertrip.setAttribute('class','postertrip');
	postertrip.innerHTML=post.trip;

	if(post.trip!=""){
		$(replyPostInfo).append(postertrip);
	}
	
	var idspan = document.createElement('span');
	idspan.setAttribute('class','posterid');
	idspan.innerHTML="(ID: <span class=\"posteridnum\">"+post.id+"</span>)";
	
	//console.log(post.id);
	
	if(post.id!=null){
		$(replyPostInfo).append(idspan);
	}
	
	var datespan = document.createElement('span');
	datespan.setAttribute('class','date');
	datespan.innerHTML=post.now;
	$(replyPostInfo).append(datespan);

	
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
	postMenuButton.innerHTML = "[<span></span>] ";
	
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
	
	if(social){
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
	}
	
	var permaLink = document.createElement('a');
	permaLink.setAttribute('href',boardPath + '/res/'+post.parent + ext + '#'+post.no);
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
		tnfname=post.image.substring(0,post.image.lastIndexOf("."))+"s.jpg";
		tnfname=tnfname.replace("src/","thumb/");
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
		//$(reply).append("<br />");
		$(reply).append("<div class=\"fileinfo\">"+fileSize.outerHTML+"</div>");
		//$(reply).append("<br />");
		$(reply).append(thumbLink);
	}
	$(reply).append(blockquote);
	$(replyContainer).append(reply);
	//$(".thread").append(replyContainer);
	return replyContainer;
}
*/

function hidePost(replyDivId){
	var dengus = document.createElement("div");
	dengus.innerHTML = "Post Hidden";
	dengus.setAttribute("id","postStub"+replyDivId.substring(5));
	$(dengus).css('display','inline');
	
	if((document.getElementById(replyDivId).style.display=="inline-block")||(document.getElementById(replyDivId).style.display=="")){
		document.getElementById(replyDivId).style.display="none";
		document.getElementById("replyContainer"+replyDivId.substring(5)).appendChild(dengus);
		document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a>";
		localStorage.setItem(replyDivId+"Hidden", "true");
	}
	else{
		document.getElementById(replyDivId).style.display="inline-block";
		document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>";
		document.getElementById("replyContainer"+replyDivId.substring(5)).removeChild(document.getElementById("postStub"+replyDivId.substring(5)));
		localStorage.removeItem(replyDivId+"Hidden");
	}
}

function hideThread(thread,parentPost,filesize){
	console.log(thread);
	var dengus = document.createElement("div");
	dengus.innerHTML = "<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a> Thread Hidden";
	dengus.setAttribute("id","postStub" + $(parentPost).attr('id').substring(6));
	dengus.onclick = function(){ hideThread(thread,parentPost,filesize); }
	
	if($(thread).css('display')!='none'){
		//thread.insertBefore(dengus);
		$(thread).after(dengus);
		$(thread).css('display','none')
		//document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ + ]</a>";
		localStorage.setItem("thread"+$(parentPost).attr('id').substring(6)+"Hidden", "true");
	}
	else{
		$(thread).css('display','block')
		//document.getElementById(replyDivId).previousElementSibling.innerHTML="<a class='hidePostButton' href='javascript:void(0)'>[ - ]</a>";
		//document.getElementById("replyContainer"+replyDivId.substring(5)).removeChild(document.getElementById("postStub"+replyDivId.substring(5)));
		//document.removeChild(document.getElementById("postStub"+parentPost.id.substring(6)));
		//document.removeChild(thread.nextElementSibling);
		//$("postStub"+parentPost.id.substring(6)).remove();
		document.getElementById("postStub"+$(parentPost).attr('id').substring(6)).outerHTML = "";
		//console.log("postStub"+parentPost.id.substring(6))
		localStorage.removeItem("thread"+$(parentPost).attr('id').substring(6)+"Hidden");
	}
}

function hideThreadMobile(button,threadnum){
	var thread = $(button).parentsUntil('.thread').last().parent();
	//var threadnum = $(button).parentsUntil('.thread').last().children().first().attr('id').replace('parent','');
	
	if($(thread).css('display')!='none'){
		$(thread).css('display','none');
		var dengus = document.createElement("div");
		dengus.innerHTML = '<a href="javascript:void(0)" class="hidePostButton hiddenPostButton button">Thread Hidden</a>';
		dengus.setAttribute("id","postStub" + threadnum);
		dengus.onclick = function(){ hideThreadMobile(button,threadnum); };
		$(dengus).css('text-align','center');
		$(thread).before(dengus);
		localStorage.setItem("thread"+threadnum+"Hidden", "true");
	}
	else{
		localStorage.removeItem("thread"+threadnum+"Hidden");
		$('#postStub'+threadnum).remove();
		console.log('#postStub'+threadnum);
		$(thread).css('display','block');
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
	var board = boardDir;
	window.open("https://twitter.com/share?url=http://"+encodeURI(domain+"/"+board+"/res/"+parent+ext)+"%23"+post);
}

function facebookPost(domain,post,parent){
	if(parent==0){
		parent = post;
	}
	var board = boardDir;
	window.open("http://www.facebook.com/sharer.php?u=http://"+domain+"/"+board+"/res/"+parent+ext+"%23"+post);
}