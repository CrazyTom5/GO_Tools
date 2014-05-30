// ==UserScript==
// @name       Player_Activity
// @namespace  ogame.gameforge.com
// @match      http://*.ogame.gameforge.com/game/admin2/kontrolle.php?session=*&uid=*
// @match      http://*.ogame.gameforge.com/game/admin2/login_log.php?session=*&uid=*
// @match      http://*.ogame.gameforge.com/game/admin2/flottenlog.php?session=*&uid=*&list=0&from=1&touser=*
// @match      http://*.ogame.gameforge.com/game/admin2/flottenlog.php?session=*&uid=*&list=0&touser=*
// @version    0.6
// @grant      none
// ==/UserScript==

//Created by Crazy_Tom on Dec 18 2013 v0.1 Created to combine fleet activity and login data in one chart.
//Edited by Crazy_Tom on Dec 18 2013 v0.2 Fully incorporated fleetlog_Activity_Checker.user.js into script
//Edited by Crazy_Tom on Dec 19 2013 v0.3 Mostly Working version can not recreate table on player overview page
//Edited by Crazy_Tom on Dec 26 2013 v0.4 Updated list of mission table. Fixed bug on recreating table on player overview page
//Edited by Crazy_Tom on Jan 1 2014 v0.5 Minor changes including changing mission colors
//Edited by Crazy_Tom on Jan 5 2014 v0.6 Added a button to set correct amount of days for login page

//****Config
var missionColor=["Green","Lime","Cyan","Blue","Orange","Yellow","OrangeRed","White","Black","Red","Orchid","Indigo"];//Can be Changed based on color preference
//var missionColor=["#8F3D3D","#8F3D5A","#3E3C8F","#623C8F","#8F553C","#8F813D","#418F3C","#3C8F6B","#AF1B94","#8F6C3D","#999","black"];//Kelder fleetlog colors
switch(document.getElementsByName("langselect")[0].selectedIndex){
	case 1:
		var missionNames=["Angreifen (1)","Verbandsangriff (2)","Transport (3)","Stationieren (4)","Halten (5)","Spionage (6)","Kolonisieren (7)","Abbau (8)","Zerstören (9)","Raketenangriff (10)","Expedition (15)"];
		var listHeader=["Mission\nNumber","Mission Type","Launch Time","Gap in seconds","Home","Target","Ships"];
		var shortListHeader=["Number","Mission Type","Time","Gap"];
		var description="Der Tag wird in 5min-Einheiten heruntergebrochen und dann wird die Farbe entsprechend der abgeschickten Flotten angezeigt. Die erste Mission innerhalb des Blocks wird angezeigt.";
		break;
	case 3:
		var missionNames=["Attaquer (1)","Attaque groupée (2)","Transporter (3)","Stationner (4)","Stationner chez un allié (5)","Espionnage (6)","Coloniser (7)","Exploiter (8)","Détruire (9)","Attaque par missile (10)","Expédition (15)"];
		var listHeader=["Mission\nNumber","Mission Type","Launch Time","Gap in seconds","Home","Target","Ships"];
		var shortListHeader=["Number","Mission Type","Time","Gap"];
		var description="Description not in French yet";
		break;
	case 4:
		var missionNames=["Atacar (1)","Ataque de confederación (2)","Transportar (3)","Desplegar (4)","Mantener en posición","Espionaje (6)","Colonizar (7)","Recolección (8)","Destruir (9)","Ataque de misiles (10)","Expedición (15)"];
		var listHeader=["Mission\nNumber","Mission Type","Launch Time","Gap in seconds","Home","Target","Ships"];
		var shortListHeader=["Number","Mission Type","Time","Gap"];
		var description="Description not in Spanish yet";
		break;
	case 5:
		var missionNames=["Attacco (1)","Attacco federale (2)","Trasporto (3)","Schieramento (4)","Stazionamento (5)","Spionaggio (6)","Colonizzazione (7)","Raccolta (8)","Distruzione Luna (9)","Attacchi missilistici (10)","Spedizioni (15)"];
		var listHeader=["Mission\nNumber","Mission Type","Launch Time","Gap in seconds","Home","Target","Ships"];
		var shortListHeader=["Number","Mission Type","Time","Gap"];
		var description="Description not in Italian yet";
		break;
	default:	
		var missionNames=["Attack (1)","ACS Attack (2)","Transport (3)","Deployment (4)","ACS Defend (5)","Espionage (6)","Colonization (7)","Harvest (8)","Moon Destruction (9)","Missile attack (10)","Expedition (15)","Login"];
		var listHeader=["Mission\nNumber","Mission Type","Launch Time","Gap in seconds","Home","Target","Ships"];
		var shortListHeader=["Time","Player Name","Mission Type","Gap"];
		var description="Breaks up the day into 5 minute sections and then changes color based on fleets sent or logins during that time.<br>Only the last activity in the time block is shown.<br>For list of missions a black box means gap in activity greater than 8 hours and a red box greater than 4 hours.";}
		
var incudedMissions=[true,true,true,true,true,true,true,true,true,true,true,true];//Can be changed if you wish to hide a mission by default
var prefix='Crazy_Tom_Activity_';
var session=/session=([a-z0-9]{40})/.exec(document.location.href)[1]; //stores session id from browser url
var uid=/uid=(\d{6})/.exec(document.location.href)[1]; //stores user id from browser url
var textbox=document.getElementsByClassName('textbox')[0];
//****End Config

addNewStyle('#GM_activity td { background-color:#303050; background-image:none; padding:1px; }');
addNewStyle('#GM_activity td:nth-child(12n+1) { border-right:1px solid #999; }');
addNewStyle('#GM_activity th { border-right:1px solid #aaa; }');
addNewStyle('#GM_actLegend td:nth-child(2n) { background-image:none; }');
addNewStyle('#list td { background-color:#303050; background-image:none; }');
addNewScript('function show(){	var ele = document.getElementById(\'list\');	var text = document.getElementById(\'missionList\');	if(ele.style.display==\'block\'){    ele.style.display=\'none\';		text.innerHTML=\'Show List of Missions\';  	}	else {		ele.style.display=\'block\';		text.innerHTML=\'Hide List of Missions\';	}}');//Simple function to show/hide table "list"

switch (document.location.pathname) {
	case '/game/admin2/kontrolle.php':
		var data=[];
		var myDiv=document.createElement('div');
		myDiv.setAttribute('id', 'Activity');
		var login=sessionStorage.getItem(prefix+'login_data_'+uid);
		var fleet=sessionStorage.getItem(prefix+'fleet_data_'+uid);
		//myDiv.innerHTML+=login+"<br><br>"+fleet+"<br><br>";
		if(login>""){
			var loginList=login.split(";");
			for(a=0;a<loginList.length-1;a++){//Last item is blank
				var loginSubList=loginList[a].split(",");
				//myDiv.innerHTML+=loginSubList[0]+","+loginSubList[1]+","+a+";<br>";
				data.push([loginSubList[0],loginSubList[1]]);}}
		else{
			myDiv.innerHTML+="Please open full login page in this tab script will read results.<br>";}
		if(fleet>""){
			var fleetList=fleet.split(";");
			for(a=0;a<fleetList.length-1;a++){//Last item is blank
				var fleetSubList=fleetList[a].split(",");
				//myDiv.innerHTML+=fleetSubList[0]+","+fleetSubList[1]+","+a+";<br>";
				data.push([fleetSubList[0],fleetSubList[1]]);}}
		else{
			myDiv.innerHTML+="Please open fleetlogs page in this tab script will read results.<br>";}
		var name=document.getElementsByTagName('th')[0].textContent;
		name=name.substring(0,name.indexOf('*'));
		if(login>""&&fleet>""){
			data=data.sort(function(a,b){return a[0]>b[0];});
			var button=document.createElement("button");
			var innerButton=document.createTextNode("Activity!");
			button.setAttribute("id","fleetActivity");
			button.appendChild(innerButton);
			button.addEventListener("click",function(){doActivity(true,data,name);},false);
			myDiv.appendChild(button);
		}
		// for(a=0;a<data.length;a++){
			// myDiv.innerHTML+=data[a][0]+","+data[a][1]+"<br>";
		// }
		textbox.parentNode.insertBefore(myDiv,textbox);//inserts myDiv into page
		break;
	case '/game/admin2/login_log.php':
		var loginData="";
		var year=new Date();
		fullYear=year.getUTCFullYear();
		var loginButton=document.createElement("button");
		var innerLoginButton=document.createTextNode("Activity!");
		loginButton.setAttribute("id","loginActivity");
		loginButton.appendChild(innerLoginButton);
		loginButton.addEventListener("click",function(){fetchLogin();},false);
		textbox.parentNode.insertBefore(loginButton,textbox);
		var table=textbox.getElementsByTagName('table')[1];
		var cells=table.getElementsByTagName('td');
		for(a=0;a<cells.length;a++){
			var cell=cells[a].textContent;
			//textbox.innerHTML+=a+",<br>"+cell+"<br>";
			//textbox.innerHTML+=a+",<br>";
			if(cell.trim()){//Tests if each cell has any content				
				var loginList=cell.trim().split("\n");//trims then splits on new lines
				for(b=0;b<loginList.length;b++){
					var results=loginList[b].match(/(\d+)/g);//finds all group of numbers in each login
					//textbox.innerHTML+=loginList[b]+"<br>"+results+"<br>";					
					var loginTime=new Date(fullYear,results[0]-1,results[1],results[2],results[3],results[4]);
					// if(loginTime>year){//Because login logs do not have year we have to assume it is the year of the current date but if this is greater than the end time it is a year in the future
						// loginTime.setUTCFullYear(loginTime.getUTCFullYear()-1);}
					var ip=results[5]+"."+results[6]+"."+results[7]+"."+results[8];
					loginTime=loginTime.getTime();
					loginData+=loginTime+","+ip+";";
					//textbox.innerHTML+=loginTime+","+ip+";<br>";
				}
			}
		}
		try {
			sessionStorage.setItem(prefix+'login_data_'+uid,loginData);}
		catch(e) {
			alert("Couldn't store data.\n\n" + e);}
		break;
	case '/game/admin2/flottenlog.php':
		var fleetData="";
		var button=document.createElement("button");
		var innerButton=document.createTextNode("Need to click to activate for activity");
		button.setAttribute("id","fleetActivity");
		button.appendChild(innerButton);
		button.addEventListener("click",function(){doActivity(false,"","");},false);
		var buttonSpot=document.getElementsByTagName("h3")[0];
		buttonSpot.appendChild(button);
		break;
}
function fetchLogin(){
	var begin = new Date();
	begin.setUTCDate(begin.getUTCDate() - 8);
	var end = new Date ();
	end.setUTCDate(end.getUTCDate() +  1);
	var elName=['user','login_start_year','login_start_month','login_start_day','login_end_year','login_end_month','login_end_day'];
	var form=[uid,begin.getUTCFullYear(),begin.getUTCMonth() + 1,begin.getUTCDate(),end.getUTCFullYear(),end.getUTCMonth() + 1,end.getUTCDate()];
	for(i=0;i<7;i++){
		document.getElementsByName(elName[i])[0].value=form[i];}
}
function changeColor(mission){//returns different colors for different mission types
	switch(mission){
		case missionNames[0]:
			return missionColor[0];
		case missionNames[1]:
			return missionColor[1];
		case missionNames[2]:
			return missionColor[2];
		case missionNames[3]:
			return missionColor[3];
		case missionNames[4]:
			return missionColor[4];
		case missionNames[5]:
			return missionColor[5];
		case missionNames[6]:
			return missionColor[6];
		case missionNames[7]:
			return missionColor[7];
		case missionNames[8]:
			return missionColor[8];
		case missionNames[9]:
			return missionColor[9];
		case missionNames[10]:
			return missionColor[10];
		case missionNames[11]:
			return missionColor[11];
		default: //should never reach here
			return "BlueViolet";}
}
function missionSelector(table,days,ID,time,missions){
	var selector=ID.match(/\d+/g);
	if(ID.match(/\d+/)==1&&missions[0]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==2&&missions[1]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==3&&missions[2]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==4&&missions[3]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==5&&missions[4]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==6&&missions[5]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==7&&missions[6]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==8&&missions[7]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==9&&missions[8]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==10&&missions[9]){
		fillTable(table,days,ID,time);}
	else if(ID.match(/\d+/)==15&&missions[10]){
		fillTable(table,days,ID,time);}
	else if(selector.length>1&&missions[11]){
		fillTable(table,days,ID,time);}
}
function fillTable(table,days,ID,timeFull){//Created separate function anticipating a new call from hiding mission activity
	var time=timeFull.match(/\d+/g);//Gets time missions was sent
	var location=Math.floor((+time[3]*60+ +time[4])/5+1);//Finds correct cell. The extra + are to make sure
	//textbox.innerHTML+=location+","+time[0]+"-"+time[1]+"-"+time[2]+";<br>";
	switch(time[0]+"-"+time[1]+"-"+time[2]){//Compares mission launch time to past 8 days
		case days[0]:
			table.childNodes[1].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[1]:
			table.childNodes[2].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[2]:
			table.childNodes[3].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[3]:
			table.childNodes[4].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[4]:
			table.childNodes[5].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[5]:
			table.childNodes[6].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[6]:
			table.childNodes[7].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[7]:
			table.childNodes[8].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		case days[8]:
			table.childNodes[9].childNodes[location].style.backgroundColor=changeColor(ID);
			break;
		// default:
			// table.childNodes[1].childNodes[location].style.backgroundColor=changeColor(ID);
	}
}
function reCreate(table,days,data,incudedMissions){
	for(var a=1;a<10;a++){
		for(var b=1;b<289;b++){		
			table.childNodes[a].childNodes[b].style.backgroundColor="#303050";}}
	for(var c=0;c<data.length;c++){
		if(data[c].length==2){
			var reCreateLocalTime=new Date(+data[c][0]);//Javascript sets date locally
			var reCreateTime=new Date(reCreateLocalTime.setTime(reCreateLocalTime.getTime()-reCreateLocalTime.getTimezoneOffset()*60*1000));//Converts to UTC
			//textbox.innerHTML+=reCreateLocalTime+","+reCreateTime+"#";
			reCreateTime=dateToString(reCreateTime);//Needed to convert timestamp into full date format.
			missionSelector(table,days,data[c][1],reCreateTime,incudedMissions);}
		else{
			missionSelector(table,days,data[c][0],data[c][10],incudedMissions);}}
}
function doActivity(pageTest,storedData,playerName){
	var fleetData="";
	var myP=document.createElement('p');//Creates <p> to contain all new output
	myP.setAttribute("id","fleetActivityContent");
	var tableColors=document.createElement('table');//Creates <table> for mission color legend
	tableColors.id='GM_actLegend';
	var header=document.createElement('tr');
	var label=document.createElement('th');
	label.setAttribute("colspan","6");
	//label.appendChild(document.createTextNode("Click mission to remove that type"));
	label.appendChild(document.createTextNode("Visual Display of Fleet Activity"));
	header.appendChild(label);
	tableColors.appendChild(header);
	var testResult;
	pageTest?testResult=missionNames.length:testResult=missionNames.length-1;//Test to see if logins should be inculded in table
	for (e=0;e<testResult;){//fills in table for mission color legend Last mission is saved for logins
		var trC=document.createElement('tr');
		for (f=0;f<3;f++) {//Creates a 3 wide table rather than 1
			if (e<testResult) {
				var td1=document.createElement('td');
				var name=document.createElement('a');
				name.appendChild(document.createTextNode(missionNames[e]));
				td1.appendChild(name);
				var td2=document.createElement('td');
				var checkBox=document.createElement('input');//creates checkbox to be added to cell with color
				checkBox.setAttribute("type","checkbox");
				checkBox.setAttribute("name","checkbox");
				checkBox.setAttribute("value",missionNames[e]);
				checkBox.checked=incudedMissions[e];
				td2.appendChild(checkBox);
				td2.className="out";
				td2.style.backgroundColor=missionColor[e];
				td2.style.width="50px";
				trC.appendChild(td1);
				trC.appendChild(td2);
				e++;}}
		tableColors.appendChild(trC);}
	table=document.createElement('table');//Creates main output table
	table.setAttribute('id', 'GM_activity');
	var tr=document.createElement('tr');//Creates header for output table
	tr.appendChild(document.createElement('th'));
	for(var x=0;x<=23;x++){//list hour of day across top of table
		var th=document.createElement('th');
		th.innerHTML=x;
		th.colSpan=12;
		tr.appendChild(th);}
	table.appendChild(tr)	
	var days=[];//Creates variable for each row in table
	for(var a=0;a<9;a++){//Creates table that can show 8 days of logs
	    var utc=new Date();//Gets UTC time
	    tr=document.createElement('tr');
	    var date=document.createElement('td');
	    var oldDays=new Date(utc.setUTCDate(utc.getUTCDate()-8+a));//Gets each of the past 8 days
		//tr.appendChild(document.createTextNode(oldDays.toISOString()));
		var tempDays=oldDays.toISOString().match(/\d+/g);
		var readDays=tempDays[0]+"-"+tempDays[1]+"-"+tempDays[2];
	    date.appendChild(document.createTextNode(readDays));
	    days.push(readDays);
	    tr.appendChild(date);
	    for(var b=0;b<288;b++){//creates 288 blocks that represent 5 minute periods in the day
	        var td=document.createElement('td');
	        tr.appendChild(td);}
	    table.appendChild(tr);}		
	/* Start of filling tables*/
	if(pageTest){
		var actTime=[];
		for(a=0;a<storedData.length;a++){
			var localTime=new Date(+storedData[a][0]);//Javascript sets date localy
			localTime.setTime(localTime.getTime()-localTime.getTimezoneOffset()*60*1000);//Converts to UTC
			var readTime=dateToString(localTime);
			actTime.push(readTime);
			// var month=localTime.getUTCMonth()+1;
			// var tempTime=localTime.getUTCFullYear()+"-"+month+"-"+localTime.getUTCDate()+" "+localTime.getUTCHours()+":"+localTime.getUTCMinutes()+":"+localTime.getUTCSeconds();
			// actTime.push(tempTime);
			missionSelector(table,days,storedData[a][1],actTime[a],incudedMissions);
		}		
		var listTable=document.createElement('table');//creates a table that lists all missions
		listTable.setAttribute("id","list");
		listTable.style.display="none";//hides the table by default
		var thList=document.createElement('tr');
		for(c=0;c<4;c++){
			var th=document.createElement('th');
			th.appendChild(document.createTextNode(shortListHeader[c]));
			thList.appendChild(th);}
		listTable.appendChild(thList);
		var firstList=document.createElement('tr');
		//var first=[0,storedData[0][1],actTime[0],0];//Old version
		var first=[actTime[0],playerName,storedData[0][1],0];
		for(d=0;d<4;d++){
			var td=document.createElement('td');
			td.appendChild(document.createTextNode(first[d]));
			firstList.appendChild(td);}
		listTable.appendChild(firstList);
		var hourgap8=0,hourgap4=0,hourgap2=0;
		for(b=1;b<storedData.length;b++){
			var trList=document.createElement('tr');
			var gap=(storedData[b][0]-storedData[b-1][0])/1000;
			//var readTime=dateToString(actTime[b]);
			//myP.innerHTML+=actTime[b]+","+readTime;
			//listTemp=[b,storedData[b][1],actTime[b],gap];//Old version
			listTemp=[actTime[b],playerName,storedData[b][1],gap];//New version
			for(e=0;e<4;e++){
				var tdList=document.createElement('td');
				if(e==3&&gap>28800){//8 hours
					tdList.style.backgroundColor="black";
					hourgap8++;}
				else if(e==3&&gap>14400){//4 hours
					tdList.style.backgroundColor="red";
					hourgap4++;}
				else if(e==3&&gap>7200){//2 hours
					hourgap2++;}
				tdList.appendChild(document.createTextNode(listTemp[e]));
				trList.appendChild(tdList);}
			listTable.appendChild(trList);}
	}
	else{
		var data=fetchData(textbox);
		for(var a=0;a<data.length;a++){
			missionSelector(table,days,data[a][0],data[a][10],incudedMissions);
			//textbox.innerHTML+=data[a][10]+","+data[a][0]+"<br>";
		}
		var listTable=document.createElement('table');//creates a table that lists all missions
		listTable.setAttribute("id","list");
		listTable.style.display="none";//hides the table by default
		var thList=document.createElement('tr');
		for(x=0;x<7;x++){//Creates header for mission list table
			var thTemp=document.createElement('th');
			thTemp.appendChild(document.createTextNode(listHeader[x]));
			thList.appendChild(thTemp);}
		listTable.appendChild(thList);
		var hourgap8=0,hourgap4=0,hourgap2=0;
		for (var d=data.length-1;d>1;d--){//Creates main content if mission list table minus last row
			trList=document.createElement('tr');
			var missionTime=data[d-1][10].match(/\d+/g);//Gets date from data converts to javascript readable in next line
			missionTime=new Date(missionTime[0],(missionTime[1]-1),missionTime[2],missionTime[3],missionTime[4],missionTime[5]);
			var oldMissionTime=data[d][10].match(/\d+/g);//Gets date from previous data converts to javascript readable in next line
			oldMissionTime=new Date(oldMissionTime[0],(oldMissionTime[1]-1),oldMissionTime[2],oldMissionTime[3],oldMissionTime[4],oldMissionTime[5]);
			var gap=(missionTime.getTime()-oldMissionTime.getTime())/1000;//.getTime is in milliseconds
			var listTemp=[d,data[d][0],data[d][10],gap,data[d][5],data[d][6],data[d][8]];
			for(var y=0;y<7;y++){
				var tdTemp=document.createElement('td');
				if(y==3&&gap>28800){//8 hours
					tdTemp.style.backgroundColor="black";
					hourgap8++;}
				else if(y==3&&gap>14400){//4 hours
					tdTemp.style.backgroundColor="red";
					hourgap4++;}
				else if(y==3&&gap>7200){//2 hours
					hourgap2++;}
				tdTemp.appendChild(document.createTextNode(listTemp[y]));
				trList.appendChild(tdTemp);}
			listTable.appendChild(trList);}
		var firstMission=document.createElement('tr');//Create last row outside of for loop to help comparisons
		var first=["1",data[0][0],data[0][10]," ",data[0][5],data[0][6],data[0][8]];
		for(var z=0;z<7;z++){//Creates last row of mission list table from the first mission
			var firstTemp=document.createElement('td');
			firstTemp.appendChild(document.createTextNode(first[z]));
			firstMission.appendChild(firstTemp);}
		listTable.appendChild(firstMission);
	}
	var legendButtonTD=document.createElement('td');
	var legendButton=document.createElement("button");//Creates button to run script with different missions selected
	var legendButtonInner=document.createTextNode("Click to re-run");
	legendButton.setAttribute("id","legendButton");
	legendButton.appendChild(legendButtonInner);
	legendButton.addEventListener("click",function(){
		var inputList=document.getElementsByName("checkbox");
		for(var i=0;i<inputList.length;i++){
			inputList[i].checked?incudedMissions[i]=true:incudedMissions[i]=false;
		}
		pageTest?reCreate(table,days,storedData,incudedMissions):reCreate(table,days,data,incudedMissions);
	},false);
	legendButtonTD.appendChild(legendButton);
	legendButtonTD.colSpan=2;
	if(pageTest){
		tableColors.appendChild(trC);
		trC=document.createElement('tr');
		trC.appendChild(legendButtonTD);
		legendButtonTD.colSpan=6;}	
	trC.appendChild(legendButtonTD);
	tableColors.appendChild(trC);
	var button=document.createElement("button");//Creates button to show/hide list table
	var innerButton=document.createTextNode("Show List of Missions");
	button.setAttribute("id","missionList");
	button.appendChild(innerButton);
	button.setAttribute("onclick","show()");
	myP.innerHTML+=description;//starts to add output to display <p>
	myP.innerHTML+="<hr>Number of 8+ hour gaps:  "+hourgap8+"<br>Number of 4-8 hour gaps: "+hourgap4+"<br>Number of 2-4 hour gaps: "+hourgap2+"<br>";
	myP.appendChild(tableColors);
	myP.appendChild(table);
	myP.appendChild(button);
	myP.appendChild(listTable);
	textbox.parentNode.insertBefore(myP, textbox);//inserts myP into page
	document.getElementById("fleetActivity").parentNode.removeChild(document.getElementById("fleetActivity"));
}
function addNewStyle(newStyle){//adds a new style tag in header that takes precedence over external CSS file
	var styleElement = document.getElementById('styles_js');
	if (!styleElement) {
		styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.id = 'styles_js';
		document.getElementsByTagName('head')[0].appendChild(styleElement);}
	styleElement.appendChild(document.createTextNode(newStyle));
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
function dateToString(d){
	var s=
	(d.getUTCFullYear())+'-'+
	((d.getUTCMonth()+1)<10?'0':'')+(d.getUTCMonth()+1)+'-'+
	(d.getUTCDate()<10?'0':'')+d.getUTCDate()+' '+
	(d.getUTCHours()<10?'0':'')+d.getUTCHours()+':'+
	(d.getUTCMinutes()< 10?'0':'')+d.getUTCMinutes()+':'+
	(d.getUTCSeconds()<10?'0':'')+d.getUTCSeconds();
	return s;
}
function fetchData(textbox){
	var data=[];//creates array that will be filled in loops
	var list=textbox.getElementsByTagName("table");//creates a list of all missions
	for (x=0; x<list.length-1; x++){//last table on fleet logs page is empty
		var cells=list[x].getElementsByTagName("td");//creates a list of all cells
		var temp=[];//creates new temp array to fill the array data
		var sender=/uid=(\d+)/.exec(cells[1].getElementsByTagName("a")[0].getAttribute("href"))[1];//gets uid from link in fleet table
		if (sender==uid){//Only need to add to data if the sender is same as player
			for (y=0;y<cells.length;y++){
				if (document.all){// IE Stuff
					var string=cells[y].innerTEXT;}
				else {// Mozilla does not work with innerText
					var string=cells[y].textContent;}
				string.trim;//trims whitespace
				temp.push(string);}//adds text to temp array from inner text
			data.push(temp);}}//adds temp to full data array
	var i=1;//count starts at one to compare to previous entry
	while(i<data.length){
		if(data[i][10]==data[i-1][10]){//compares current and previous launch times to see if same mission
			data.splice(i,1);}//removes return missions
		i++;}
	for(var j=0;j<data.length;j++){//cleans up date into more output ready format
		var match1=data[j][5].match(/\(M\)|\[\d+:\d+:\d+\]/g);//Home planet
		match1?match1.length>1?data[j][5]=match1[1]+match1[0]:data[j][5]=match1[0]:"";
		var match2=data[j][6].match(/\(M\)|\[\d+:\d+:\d+\]/g);//Target planet
		match2?match2.length>1?data[j][6]=match2[1]+match2[0]:data[j][6]=match2[0]:"";
		data[j][8]=data[j][8].replace(/[\.\d+]+/g,"$& ");
		var fTR=data[j][10].match(/(\d+)/g);//finds all group of numbers in each login
		var fleetTime=new Date(fTR[0],fTR[1]-1,fTR[2],fTR[3],fTR[4],fTR[5]);
		fleetData+=fleetTime.getTime()+","+data[j][0]+";";}
	try {
		sessionStorage.setItem(prefix+'fleet_data_'+uid,fleetData);}
	catch(e) {
		alert("Couldn't store data.\n\n" + e);}
	return data;
}