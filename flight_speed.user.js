// ==UserScript==
// @name	Flight_Speed
// @namespace	ogame.org
// @description	Shows speed percent that fleet was sent at
// @match	http://*.ogame.gameforge.com/game/admin2/kontrolle.php?session=*&ressourcen=*&uid=*
// @match	http://*.ogame.gameforge.com/game/admin2/flottenlog.php?session=*&uid=*&list=*&from=1&touser=*
// @match	http://*.ogame.gameforge.com/game/admin2/flottenlog.php?session=*&uid=*&list=*&touser=*
// @version	0.3
// @grant	none
// ==/UserScript==

//Created by Crazy_Tom on Feb 1 2014 to add ship speed into each out going fleet from player.
//Edited by Crazy_Tom on Feb 4 2014 to v0.2 Fist working version
//Edited by Crazy_Tom on Feb 5 2014 to v0.3 Some code clean up



//****Config
addNewScript('src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"');
var prefix='Crazy_Tom_Fleet_Speed_';
var session=/session=([a-z0-9]{40})/.exec(document.documentURI)[1]; //stores session id from browser url
var uid=/uid=(\d{6})/.exec(document.documentURI)[1]; //stores user id from browser url
var textbox=document.getElementsByClassName('textbox')[0];
var shipNames=["Small Cargo","Large Cargo","Light Fighter","Heavy Fighter","Cruiser","Battleship","Colony Ship","Recycler","Espionage Probe","Bomber","Destroyer","Deathstar","Battlecruiser"];//Will add languge support later
var shipSpeed=[5000,7500,12500,10000,15000,10000,2500,2000,100000000,4000,5000,100,10000];
//****End Config

switch (document.location.pathname) {
	case '/game/admin2/kontrolle.php'://Due to @match only runs when viewing a planet
		$(function() {
			$.get("/api/serverData.xml", function(responseXml){
				var xml = $(responseXml);
				//alert(xml);
				var fleetSpeed = $("speedFleet", xml).text();
				//alert(fleetSpeed);
				if(document.getElementsByName("tid[115]")[0]){//Tests to see if planet is homeworld with research information
					combustion=document.getElementsByName("tid[115]")[0].value;
					impulse=document.getElementsByName("tid[117]")[0].value;
					hyperspace=document.getElementsByName("tid[118]")[0].value;
					engineData=fleetSpeed+","+combustion+","+impulse+","+hyperspace;}
				else{
					engineData="";}
				//alert(engineData);
				try {
					sessionStorage.setItem(prefix+uid,engineData);}
				catch(e) {
					alert("Couldn't store data.\n\n" + e);}
			});
		});
	break;
	case '/game/admin2/flottenlog.php':
		var engine=sessionStorage.getItem(prefix+uid);
		if(engine>""){
			var engineList=engine.split(",");
			doSpeed(shipSpeed,engineList,shipNames);}
		else{
			//textbox.innerHTML+="Please open Homeplanet info page into this tab.<br>";//this breaks Player_Activity
		}
	break;
}
function doSpeed(shipSpeed,engineList,shipNames){
	var list=textbox.getElementsByTagName("table");//creates a list of all missions
	var finalShipSpeed=finalSpeed(shipSpeed,engineList);//Uses drive technology to calculate speed for each ship.
	for(var x=0;x<list.length;x++){
		var cells=list[x].getElementsByTagName("td");//creates a list of all cells
		var sender=/uid=(\d+)/.exec(cells[1].getElementsByTagName("a")[0].getAttribute("href"))[1];//gets uid from link in fleet table
		if (sender==uid){//Only need to add to data if the sender is same as player
			var distance=getDistance(cells[5].innerHTML,cells[6].innerHTML);//Calls the getDistance function to calculate and return the distance between home and target location.
			var speed=getSpeed(cells[8].innerHTML,finalShipSpeed,shipNames);//Calls the getSpeed function to determine and return the slowest ship sent
			var time=getTime(cells[10].innerHTML,cells[11].innerHTML);//Calls the getTime function to calculate and return the time between launch and arrival
			//alert(time+","+engineList[0]+","+distance+","+speed);
			var percent=Math.round((35000/(time*engineList[0]-10))*Math.sqrt((distance*1000)/speed));//Calculates the percent the fleet was sent at rounds to the nearest 1% so can show 99% or 101%
			//alert(percent+","+time+","+engineList[0]+","+distance+","+speed);
			cells[4].innerHTML=percent+"%";}}//Adds the percent into the fleetlog table
}
function getDistance(home,target){
	if(home=="unknown"||target=="unknown"){//If home or target is not stored in the AT it sets the distance to the next slot.
		var distance=1005;}
	else{
		var home=/\[([\d:]+)\]/.exec(home)[1];
		var target=/\[([\d:]+)\]/.exec(target)[1];	
		var homeParts=home.split(":");
		var targetParts=target.split(":");
		if(homeParts[0]!=targetParts[0]){//Treats it as it only calculates crossing Galaxy or systems or planets or going to moon but with different order of magnitude probably ends in rounding error. 
			var distance=20000*Math.abs(homeParts[0]-targetParts[0]);}
		else if(homeParts[1]!=targetParts[1]){
			var distance=2700+95*Math.abs(homeParts[1]-targetParts[1]);}
		else if(homeParts[2]!=targetParts[2]){
			var distance=1000+5*Math.abs(homeParts[2]-targetParts[2]);}
		else{
			var distance=5;}}
	//alert(distance);
	return distance;	
}
function getSpeed(ships,finalShipSpeed,shipNames){
	var shipParts=ships.split("<br>");//Every row ends in a "<br>"	
	var speed=10000000000;//Much higher maximum speed to test against
	for(var a=0;a<shipParts.length-1;a++){//Last one is empty
		var shipPart=shipParts[a].split(":");//separates ship name from number of ships sent
		for(var b=a;b<shipNames.length;b++){//ships are in order so do not need to recheck them
			if(shipPart[0].trim()==shipNames[b].trim()&&finalShipSpeed[b]<speed){//Only updates speed if the ship name sent matches one of the stored names and if the ship is slower than current speed
				speed=finalShipSpeed[b];}}}
	//alert(speed);
	return speed;
}
function getTime(start,end){
	var startList=start.match(/(\d+)/g);
	var startTime=new Date(startList[0],startList[1]-1,startList[2],startList[3],startList[4],startList[5]);//Sets JavaScript date for launch
	var endList=end.match(/(\d+)/g);
	var endTime=new Date(endList[0],endList[1]-1,endList[2],endList[3],endList[4],endList[5]);//Sets JavaScript date for arrival
	var time=(endTime.getTime()-startTime.getTime())/1000;//calculates the time travelled in seconds
	//alert(time);
	return time;
}
function finalSpeed(shipSpeed,engineList){
	var finalShipSpeed=shipSpeed;
	engineList[2]>4?finalShipSpeed[0]=10000*(1+engineList[2]*.2):finalShipSpeed[0]=shipSpeed[0]*(1+engineList[1]*.1);//Small Cargos switch to impulse drive when impulse drive is 5 or above
	finalShipSpeed[1]=shipSpeed[1]*(1+engineList[1]*.1);
	finalShipSpeed[2]=shipSpeed[2]*(1+engineList[1]*.1);
	finalShipSpeed[3]=shipSpeed[3]*(1+engineList[2]*.2);
	finalShipSpeed[4]=shipSpeed[4]*(1+engineList[2]*.2);
	finalShipSpeed[5]=shipSpeed[5]*(1+engineList[3]*.3);
	finalShipSpeed[6]=shipSpeed[6]*(1+engineList[2]*.2);
	finalShipSpeed[7]=shipSpeed[7]*(1+engineList[1]*.1);
	finalShipSpeed[8]=shipSpeed[8]*(1+engineList[1]*.1);
	engineList[3]>7?finalShipSpeed[9]=5000*(1+engineList[3]*.3):finalShipSpeed[9]=shipSpeed[9]*(1+engineList[2]*.2);//Bombers switch to hyperspace drive when hyperspace drive is 8 or above
	finalShipSpeed[10]=shipSpeed[10]*(1+engineList[3]*.3);
	finalShipSpeed[11]=shipSpeed[11]*(1+engineList[3]*.3);
	finalShipSpeed[12]=shipSpeed[12]*(1+engineList[3]*.3);
	return finalShipSpeed;
}
function addNewScript(newScript){//adds a new script tag in header that is used for showing and hiding fleet list table
	var scriptElement = document.getElementById('script_js');
	if (!scriptElement) {
		scriptElement = document.createElement('script');
		scriptElement.type = 'text/javascript';
		scriptElement.id = 'script_js';
		document.getElementsByTagName('head')[0].appendChild(scriptElement);}
	scriptElement.appendChild(document.createTextNode(newScript));
}




//textbox.innerHTML+=session+","+uid+","+uni;

// $.get("/api/xsd/serverData.xsd", function(responseXml) {
// var xml = $(responseXml);
// var fleetSpeed = $("speedFleet", xml).text();
// alert(speedFleet);
// });

// function getSpeed(){
// xmlhttp=new XMLHttpRequest();
// xmlhttp.onreadystatechange=function(){
// if (xmlhttp.readyState==4 && xmlhttp.status==200){
// alert(xmlhttp.responseText;);
// document.getElementById("txtHint").innerHTML=xmlhttp.responseText;
// }
// }
// xmlhttp.open("GET","/api/xsd/serverData.xsd",true);
// xmlhttp.send();
// }









