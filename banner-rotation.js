/* Sample banner rotation script. */

var d = new Date();
if(d.getMonth() != 11) {
	var banners = [
		sitevars.domain + "/img/banners/1318775387701.gif", 
		sitevars.domain + "/img/banners/1318777025077.gif",
		sitevars.domain + "/img/banners/1318761274858.jpg",
		sitevars.domain + "/img/banners/1318770259873.jpg",
		sitevars.domain + "/img/banners/1318770358799.jpg",
		sitevars.domain + "/img/banners/1318770404369.jpg",
		sitevars.domain + "/img/banners/1318774662616.jpg",
		sitevars.domain + "/img/banners/1318783007058.jpg",
		sitevars.domain + "/img/banners/1318940631499.jpg",
		sitevars.domain + "/img/banners/1318940692121.jpg",
		sitevars.domain + "/img/banners/1351599355103.jpg",
		sitevars.domain + "/img/banners/1351599405807.jpg",
		sitevars.domain + "/img/banners/1350453803730.png"
	];
	var rand = Math.floor(Math.random()*13);
	$('img.banner').attr('src',banners[rand]);
}
else {
	var banners = [
		sitevars.domain + "/img/banners/christmas1.jpg",
		sitevars.domain + "/img/banners/christmas2.jpg"
	];
	var rand = Math.floor(Math.random()*2);
	$('img.banner').attr('src',banners[rand]);
}
