// ==UserScript==
// @name		Login_Tools
// @namespace	ogame.gameforge.com
// @match		http://*.ogame.gameforge.com/game/admin2/login_log.php?session=*&uid=*
// @version		0.9
// @grant		none
// ==/UserScript==

//Created by Crazy_Tom on Jan 5 2014 to add functionality of http://kelder.dnsalias.net:58520/cgi-bin/login_tools.php to inside the AT via javascript
//Edited by Crazy_Tom on Jan 21 2014 to add in jquery functions
//Edited by Crazy_Tom on May 8 2014 to version 0.4 included some looking for multi functionality
//Edited by Crazy_Tom on May 13 2014 to version 0.5 added a list of players and number of times each logged onto an IP
//Edited by Crazy_Tom on May 26 2014 to version 0.9 Final beta version

addNewStyle('#GM_activity td { background-color:#303050; background-image:none; padding:1px; }');
addNewStyle('#GM_activity tr { border-bottom:10px solid #aaa; }');
addNewScript('src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"');


//****Config
var prefix='Crazy_Tom_Login_Tools_';
var session=/session=([a-z0-9]{40})/.exec(document.location.href)[1]; //stores session id from browser url
var uid=/uid=(\d{6})/.exec(document.location.href)[1]; //stores user id from browser url
var textbox=document.getElementsByClassName('textbox')[0];
var optionNames=["Multi","List of IPs"];
var incudedOptions=[false,false];
var IPHeaders=['IP','Names and Times Used','Country','Region','City','ISP'];
var output=document.createElement('div');
output.id='GM_activity';
var logsChecker=textbox.getElementsByTagName('table');//Used to see if the page is displaying login logs
var uidP=document.createElement('p');
uidP.setAttribute("id","uidP");
//****End Config

var input=document.createElement('div');//need to make pretty
input.setAttribute("name","GM_input");

if(logsChecker.length>2){//Checks if page is displaying login logs if so it displays a button to store login logs
	var storeLogsButton=document.createElement("button");
	var innerStoreLogsButton=document.createTextNode("Store Login Logs");
	storeLogsButton.setAttribute("id","storeLogsButton");
	storeLogsButton.appendChild(innerStoreLogsButton);
	storeLogsButton.addEventListener("click",function(){fetchLogs(textbox);},false);
	textbox.parentNode.insertBefore(storeLogsButton,textbox);
}
if(sessionStorage.getItem(prefix)){//Checks if any login logs are stored if so displays list of uid's of stored logs
	var uidList=sessionStorage.getItem(prefix);
	var userList=uidList.split(",");//Splits the stored values
	uidP.innerHTML="List of stored login logs:<br>"
	for(var b=0;b<userList.length-1;b++){//Last value is blank
		uidP.innerHTML+=userList[b]+":<input type=\"checkbox\" name=\"uidCheckbox\" value="+userList[b]+" checked></input><br>";//Creates checkbox
	}
	input.appendChild(uidP);
}
	
var inputP=document.createElement('p');
inputP.innerHTML="Options:<br>";
for(var a=0;a<optionNames.length;a++){
	incudedOptions[a]?inputP.innerHTML+=optionNames[a]+":<input type=\"checkbox\" name=\"checkbox\" value="+optionNames[a]+" checked></input><br>":inputP.innerHTML+=optionNames[a]+":<input type=\"checkbox\" name=\"checkbox\" value="+optionNames[a]+"></input><br>";
}
input.appendChild(inputP);
var inputButton=document.createElement("button");//Creates button to run script with different login tool options selected
var inputButtonInner=document.createTextNode("Click to run");
inputButton.setAttribute("id","inputButton");
inputButton.appendChild(inputButtonInner);
inputButton.addEventListener("click",function(){
	var inputList=document.getElementsByName("checkbox");
	for(var i=0;i<inputList.length;i++){
		inputList[i].checked?incudedOptions[i]=true:incudedOptions[i]=false;
	}
	doActivity();
},false);
input.appendChild(inputButton);//Adds button to page
var inputSpot=textbox.getElementsByTagName('br')[2];
//if(logsChecker.length>2){
	inputSpot.parentNode.insertBefore(input,inputSpot);//Adds the input div to page
//}
function doActivity(){
	var uids=[];
	var listUid=document.getElementsByName("uidCheckbox");//Gets list of stored uids
	for(var a=0;a<listUid.length;a++){//Checks if uids are checked if so then adds to list to send to subfunctions
		if(listUid[a].checked){
			uids.push(listUid[a].value);}
	}
	if(incudedOptions[0]){//Checks to run Multi subfunction
		var multiOutput=multi(uids);//Returns a table
		input.appendChild(multiOutput);//Adds table below the input div
	}
	if(incudedOptions[1]){//Checks to run List of IPs subfunction
		var IPOutput=listOfIP(uids);//Returns a table
		input.appendChild(IPOutput);//Adds table below the input div
	}
}
function provideLogs(uid){//Gets stored login logs from uid
	var data=[];
	var login=sessionStorage.getItem(prefix+uid);
	var loginList=login.split(";");//Splits login logs into rows of 3 elements
	for(a=0;a<loginList.length-1;a++){//Last item is blank
		var loginSubList=loginList[a].split(",");//Splits the three elements
		data.push([loginSubList[0],loginSubList[1],loginSubList[2]]);}//Adds to array
	return data;
}
function multi(uids){
	var outputTable=document.createElement('table');
	var data=[];
	for(var a=0;a<uids.length;a++){//Combines all the stored login information into one array
		data=data.concat(provideLogs(uids[a]));
	}
	data.sort(function(a,b){return new Date(a[0]) > new Date(b[0]);});//Sorts by date
	var date=new Date(data[0][0]);//Stores date as js date for converting to a readable date
	var oldDate=date;//Stores old date for comparison
	outputTable.innerHTML="<tr><th>Time</th><th>IP</th><th>Name</th><th>Difference</th></tr><tr><td>"+dateToString(date)+"</td><td>"+data[a][1]+"</td><td>"+data[a][2]+"</td><td></td></tr>";
	for(var a=1;a<data.length;a++){
		date=new Date(data[a][0]);
		difference=(date-oldDate)/1000;//Dates are in milliseconds
		if(data[a][2]!=data[a-1][2]&&data[a][1]==data[a-1][1]){//checks if the names are different and the IP is the same
			if(difference<60){//Shows up red if under 60 seconds apart
				outputTable.innerHTML+="<tr><td>"+dateToString(date)+"</td><td>"+data[a][1]+"</td><td>"+data[a][2]+"</td><td><span style=\"color:red\">"+difference+"</span></td></tr>";}
			else if(difference<300){//Shows up blue if under 300 seconds apart
				outputTable.innerHTML+="<tr><td>"+dateToString(date)+"</td><td>"+data[a][1]+"</td><td>"+data[a][2]+"</td><td><span style=\"color:blue\">"+difference+"</span></td></tr>";}
			else if(difference<1800){//Shows up green if under 1800 seconds apart
				outputTable.innerHTML+="<tr><td>"+dateToString(date)+"</td><td>"+data[a][1]+"</td><td>"+data[a][2]+"</td><td><span style=\"color:green\">"+difference+"</span></td></tr>";}
			else{
				outputTable.innerHTML+="<tr><td>"+dateToString(date)+"</td><td>"+data[a][1]+"</td><td>"+data[a][2]+"</td><td>"+difference+"</td></tr>";}
			}
		else{
			outputTable.innerHTML+="<tr><td>"+dateToString(date)+"</td><td>"+data[a][1]+"</td><td>"+data[a][2]+"</td><td>"+difference+"</td></tr>";}
		oldDate=date;
	}
	return outputTable
}
function listOfIP(uids){
	var outputTable=document.createElement('table');
	var outputHeaderRow=document.createElement('tr');
	var IPList=[];
	var countList=[];
	for(var a=0;a<6;a++){
		var outputHeaderTD=document.createElement('th');
		outputHeaderTD.innerHTML=IPHeaders[a];
		outputHeaderRow.appendChild(outputHeaderTD);
	}
	outputTable.appendChild(outputHeaderRow);
	var data=[];
	for(var a=0;a<uids.length;a++){//Combines all the stored login information into one array
		data=data.concat(provideLogs(uids[a]));
	}
	data.sort(function(a,b){return a[1] > b[1];});//Sorts by IP
	var IPList=[data[0][1]],nameList=[data[0][2]],countList=[];//Creates the first entry in unique IPs with the name that logged in on that IP
	for(var a=1;a<data.length;a++){		
		if(data[a-1][1]!=data[a][1]){//Tests if different IP if so adds a new cell to list of IPs and the name on that login
			IPList.push(data[a][1]);
			nameList.push(data[a][2]);
		}
	}
	for(var a=0;a<IPList.length;a++){
		countList[a]="";
		var names=[nameList[a]],count=[0];
		for(var b=0;b<data.length;b++){
			if(IPList[a]==data[b][1]){
				for(var c=0;c<names.length;c++){
					var namecheck=false;					
					if(names[c]==data[b][2]){
						namecheck=true;
						count[c]++;}
				}
				if(!namecheck){
					names.push(data[b][2]);
					count.push(1);
				}
			}
		}
		for(var d=0;d<names.length;d++){
			countList[a]+=names[d]+" ("+count[d]+") ";
		}
		var outputRow=document.createElement('tr');
		outputRow.innerHTML="<td>"+IPList[a]+"</td><td>"+countList[a]+"</td><td></td><td></td><td></td><td></td>";
		outputTable.appendChild(outputRow);
	}
	if(IPList.length>50){
		alert("Sorry to many requests\nTry with fewer logins");}
	else{
		for(var c=0;c<IPList.length;c++){
			var tempIP=IPList[c];
			//alert(tempIP);
			$.getJSON('http://ip-api.com/json/'+tempIP+'?callback=?',function(result){
				if(result.status=="success"){
					//alert(data.query+","+data.country+","+data.regionName+","+data.city+","+data.isp);
					//textbox.innerHTML+=data.query+","+data.country+","+data.regionName+","+data.city+","+data.isp+"<br>";
					handleMyJSON_IP(result,outputTable);
				}
			});	
		}
	}
	return outputTable;
}
function handleMyJSON_IP(result,table){
	for(a=1;a<table.childNodes.length;a++){
		//alert(table.childNodes[a].childNodes[0].innerHTML+"<br>"+result.query);
		if(table.childNodes[a].childNodes[0].innerHTML==result.query){
			table.childNodes[a].childNodes[2].innerHTML=result.country;
			table.childNodes[a].childNodes[3].innerHTML=result.regionName;
			table.childNodes[a].childNodes[4].innerHTML=result.city;
			table.childNodes[a].childNodes[5].innerHTML=result.isp;
		}
	}
}
function fetchLogs(textbox){
	var loginData="";
	var year=new Date();
	var fullYear=year.getUTCFullYear();
	var table=textbox.getElementsByTagName('table')[1];
	var cells=table.getElementsByTagName('td');
	//textbox.innerHTML+=cells+"<br>";
	for(var a=0;a<cells.length;a++){
		var cell=cells[a].textContent;
		//textbox.innerHTML+=a+",<br>"+cell+"<br>";
		//textbox.innerHTML+=a+",<br>";
		if(cell.trim()){//Tests if each cell has any content
			var loginList=cell.trim().split("\n");//trims then splits on new lines
			for(var b=0;b<loginList.length;b++){
				var results=/(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}): (\d+)\.(\d+)\.(\d+)\.(\d+) (.+)/g.exec(loginList[b].trim());
				//textbox.innerHTML+=results+"<br>";
				// var results=loginList[b].match(/(\d+)/g);//finds all group of numbers in each login
				var loginTime=new Date(fullYear,results[1]-1,results[2],results[3],results[4],results[5]);
				loginTime.setTime(loginTime.getTime()-loginTime.getTimezoneOffset()*60*1000);//Converts to UTC
				if(loginTime>year){//Because login logs do not have year we have to assume it is the year of the current date but if this is greater than the end time it is a year in the future
					loginTime.setUTCFullYear(loginTime.getUTCFullYear()-1);}
				// var temp=[];
				// temp.push(loginTime,results[6]+"."+results[7]+"."+results[8]+"."+results[9],results[10]);
				// list.push(temp);
				loginData+=loginTime+","+results[6]+"."+results[7]+"."+results[8]+"."+results[9]+","+results[10]+";";
				//textbox.innerHTML+=loginData+",<br>";
			}
		}
	}
	if(!sessionStorage.getItem(prefix+uid)){
		var uidList="";
		if(sessionStorage.getItem(prefix)){
			uidList=sessionStorage.getItem(prefix);}
		uidList+=uid+",";
		try {
			sessionStorage.setItem(prefix,uidList);}
		catch(e) {
			alert("Couldn't store data.\n\n" + e);}	
		try {
			sessionStorage.setItem(prefix+uid,loginData);}
		catch(e) {
			alert("Couldn't store data.\n\n" + e);}
		if(document.getElementById("uidP")){
			var uidP=document.getElementById("uidP");
			uidP.innerHTML+=uid+":<input type=\"checkbox\" name=\"uidCheckbox\" value="+uid+" checked></input><br>";
		}
		else{
			uidP=document.createElement('p');
			uidP.innerHTML+="List of stored login logs:<br>"+uid+":<input type=\"checkbox\" name=\"uidCheckbox\" value="+uid+" checked></input><br>";
			input.parentNode.insertBefore(uidP,input);
		}
	}
	else{
		//alert("Logs already stored for "+uid);
	}
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
var scriptElement = document.createElement('script');
scriptElement.src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(scriptElement);