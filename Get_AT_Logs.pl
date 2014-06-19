#!/usr/bin/perl -w

# Get_AT_Logs.pl
# Version 0.7
# Created by Crazy_Tom for use by Ogame.org game staff to record all GO records on March 3 2014.
# For use by Ogame.org staff only. Please delete script if not a staff member.
# Please obtain permission from CrazyTom@ogame.org before redistributing.
# Version 0.2 Changed Get_Uni_List subroutine to return an array rather than hash (did not need it to be timestamped)
# Version 0.3 Changed to one ENDHTML print
# Version 0.4 Changed Salt to something a little more random
# Version 0.5 Combined the three gather functions into one function
# Version 0.6 Added a while loop to read full list of GOs activity's
# Version 0.7 Started work to create seperate config file to store settings.

# import modules
#package AT_Logs;
use warnings;
use strict;
##use lib '/var/www/ogame/cgi-bin/Get_AT_Logs_Config.pm';
#use lib '/var/www/ogame/cgi-bin/AT_Logs/';
##package AT_Logs;
#use Get_AT_Logs_Config;
##our %settings = ();
##print AT_Logs::config;
use WWW::Mechanize;
use HTML::TreeBuilder;
use POSIX qw(strftime);
use Time::Local;


#my $package = 'Get_AT_Logs_Config';
#my @names = $package->get_name;


#my $name=AT_Logs::Get_AT_Logs_Config->get_name;
my $name='Fake_Name';#Your AT name
my $pass='Fake_Pass';#Your AT password
my $comm='EN';#Your Community used for file name
my $time=strftime "%F",localtime;#Gets current date to store for file name
my @set=('0'..'9','A'..'Z','a'..'z');
my $salt=join''=>map $set[rand @set],1..8;#Used to add randomness to file name so old team members can not access files
my $file="$comm-$time-$salt.html";#Creates file name format 'EN-2014-03-21-ABCabc12.html'
my $runtime=strftime "%c",localtime;#Gets current time and date to store in output file
unless(open OUTPUT, '>'.$file) {#opens new file for writing and dies if fails.
	die "Unable to create '$file'";
}
#my @uniList=('Andromeda','Electra','Jupiter','Nekkar','Orion','Pegasus','Quantum','Rigel','Sirius','Taurus','Ursa','Vega','Wasat','Xalynth','1. Universe','20. Universe','30. Universe','35. Universe','44. Universe');
my @uniList=('44. Universe','Andromeda','Electra','Jupiter');
my (%returned,%finalList,%listGO,%finalListGO,$uni,$html);
foreach $uni(@uniList){#Calls three subroutines for each universe in uniList array and stores the result in an hash for each subroutine
	print "Starting ".$uni."\n";
	$returned{$uni}=[&gather($uni,$name,$pass)];
}
print "Starting Output\n";
%finalList=&combine(\%returned);
foreach my $universe(keys %returned){
	#print $returned{$universe}[1]."\n";
	for my $listNub(0..$#{$returned{$universe}[1]}){
		#print $returned{$universe}[1][$listNub]."\n";
		if($returned{$universe}[1][$listNub]=~/ \(\d{6}\): checks the fleet log/s){#Fleet Log regex GO name at start of string
			#(exists $listGO{$`}[0])?$listGO{$`}[0]+=1:$listGO{$`}[0]=1;
			if(exists $listGO{$`}[0]){#Checks if GO name is already in listGO hash if so it adds to statistics
				$listGO{$`}[0]+=1;
			}
			else{#Otherwise it creates the value
				$listGO{$`}[0]=1;
			}
			#exists $listGO{$`}[0]?$listGO{$`}[0]++:$listGO{$`}[0]=1;
		}
		elsif($returned{$universe}[1][$listNub]=~/ checked the Login logs of /s){#Login log regex GO name at start of string
			if(exists $listGO{$`}[1]){#Checks if GO name is already in listGO hash if so it adds to statistics
				$listGO{$`}[1]+=1;
			}
			else{#Otherwise it creates the value
				$listGO{$`}[1]=1;
			}
		}
		elsif(my @temp=$returned{$universe}[1][$listNub]=~/: checked \|(.+) \(\d{6}\)/s){#Overview check regex GO name and uid at end of string
			if(exists $listGO{$temp[0]}[2]){#Checks if GO name is already in listGO hash if so it adds to statistics
				$listGO{$temp[0]}[2]+=1;
			}
			else{#Otherwise it creates the value
				$listGO{$temp[0]}[2]=1;
			}
		}
		#Was going to use as other but due to the different formats of checks in list would pick up non GOs
		#Most of information is also stored on the details page that gets reported in a separate table.
		#else{
			#if(exists $listGO{$`}[3]){
				#$listGO{$`}[3]+=1;
			#}
			#else{
				#$listGO{$`}[3]=1;
			#}
		#}
	}
	$finalListGO{$universe}={%listGO};#Adds each unverese's GOs to total list
}		
$html="<html>\n\t<head>\n\t\t<style>\ntable,th,td{\n\tborder:1px solid black;\n\tborder-collapse:collapse;\n}\nh1,h2{\n\ttext-align:center;\n}\nh3{\n\ttext-align:center;\n\tcolor:blue;\n}\ndiv{\n\ttext-align:center;\n}\n\t\t</style>\n\t\t<title>Crazy Tom - GO Statistics</title>\n\t</head>\n\t<body>\n\t\t<h1>Stats for Ogame.org Game Operators</h1>\n\t\t<div>\n\t\t\t<p>Combined statistics of all GOs across all universes</p>\n\t\t\t<table>\n\t\t\t\t<tr>\n\t\t\t\t\t<th>GO Name</th>\n\t\t\t\t\t<th>3 Days</th>\n\t\t\t\t\t<th>7 Days</th>\n\t\t\t\t\t<th>14 Days</th>\n\t\t\t\t\t<th>28 Days</th>\n\t\t\t\t\t<th>All</th>\n\t\t\t\t</tr>";#Prints start of HTML document with the head and start of the body including the fist table for statistics of all GOs across all the universes
foreach my $h(keys %finalList){
	$html.="\n\t\t\t\t<tr>\n\t\t\t\t\t<td>$h</td>";#Prints GO name as first column in table to web page
	for my $i(0..4){
		$html.="\n\t\t\t\t\t<td>$finalList{$h}[$i]</td>";#Prints data from finalList hash to the table in the web page
	}
	$html.="\n\t\t\t\t</tr>";#Ends each row in table
}
$html.="\n\t\t\t</table>\n\t\t</div>\n\t\t<h2>Statistics for each individual universes</h2>";#Ends table on combined statistics for all GOs across all the universes and creates headings for next section
#for my $universe(0..$#uniList){
foreach my $universe(keys %returned){
	$html.="\n\t\t<h3>$universe</h3>\n\t\t<div>\n\t\t\t<p>Data Combinded from Details Page</p>\n\t\t\t<table>\n\t\t\t\t<tr>\n\t\t\t\t\t<th>GO Name</th>\n\t\t\t\t\t<th>Bans</th>\n\t\t\t\t\t<th>Unbans</th>\n\t\t\t\t\t<th>Renames</th>\n\t\t\t\t\t<th>Account transfers</th>\n\t\t\t\t\t<th>Email changes</th>\n\t\t\t\t\t<th>Alliance name changes</th>\n\t\t\t\t\t<th>Alliance deletions</th>\n\t\t\t\t\t<th>Alliance founder</th>\n\t\t\t\t\t<th>Accesses</th>\n\t\t\t\t\t<th>Password recoveries</th>\n\t\t\t\t\t</tr>";#Prints each universe name followed by the first of two tables, the first one combines the four weekly tables on the details page
	for my $GOName(keys $returned{$universe}[2]){
		$html.="\n\t\t\t\t<tr>\n\t\t\t\t\t<td>$GOName</td>";#Prints GO name as first column in table to web page
		for my $d(0..9){
			$html.="\n\t\t\t\t\t<td>$returned{$universe}[2]{$GOName}[$d]</td>";#Prints data from details hash to the table in the web page
		}
		$html.="\n\t\t\t\t</tr>";#Ends each row in table
	}
	$html.="\n\t\t\t</table>\n\t\t</div>\n\t\t<div>\n\t\t\t<p>Summary of List of Activities</p>\n\t\t\t<table>\n\t\t\t\t<tr>\n\t\t\t\t\t<th>GO Name</th>\n\t\t\t\t\t<th>FleetLog</th>\n\t\t\t\t\t<th>Login</th>\n\t\t\t\t\t<th>Overview Checks</th>\n\t\t\t\t\t</tr>";#Ends table on combined tables from details page and starts new table summarizing list of activities done by GO listing Fleetlog, Login and Overview Checks
	for my $GOName(keys $returned{$universe}[2]){
		$html.="\n\t\t\t\t<tr>\n\t\t\t\t\t<td>$GOName</td>";#Prints GO name as first column in table to web page
		for my $e(0..2){
			if(exists $finalListGO{$universe}{$GOName}[$e]){#Prints data from finalListGO hash to the table in the web page. Some values might not have been generated so if not the script outputs 0
				$html.="\n\t\t\t\t\t<td>$finalListGO{$universe}{$GOName}[$e]</td>";
			}
			else{
				$html.="\n\t\t\t\t\t<td>0</td>";
			}
		}
		$html.="\n\t\t\t\t</tr>";#Ends each row in table
	}
	$html.="\n\t\t\t</table>\n\t\t</div>";#Ends table on combined statistics for all GOs across all the universes
}
$html.="\n\t\t<p>Output generated at $runtime</p>\n\t</body>\n</html>";#Finishes html on web page
print "Output Finished\n".$file."\n";#Prints file name to give to rest of SGOs/GAs
print OUTPUT $html;#Adds all html text to file
close OUTPUT;#Closes file
sub gather{
	my $mech = WWW::Mechanize->new();
	my $tree = HTML::TreeBuilder->new();
	$mech->get("http://en.ogame.gameforge.com/");#Opens the main login page for ogame.org
	$mech->submit_form(with_fields=>{'uni'=>$_[0],'login'=>$_[1],'pass'=>$_[2]});#Fills in the login information and submits the form.
	$mech->follow_link(url_regex=>qr/admin2/i);#Finds and clicks the link for the Admin Tool
	#print $mech->text()."\n";
	$mech->follow_link(url_regex=>qr/home/i);#Clicks on home because of iFrames
	#print $mech->text()."\n\nmech\n\n";
	$mech->follow_link(url_regex=>qr/logs/i);#Finds and clicks on the GO logs link
	#print $mech->text()."\n";
	$tree->parse_content($mech->content());#Converts page into an HTML table
	#$tree->eof();
	#print $tree->as_text()."\n\ntree\n\n";
	my (@table,@row,%GOList)=[];
	@table=$tree->find_by_tag_name('tag','table');#Finds all tables on page
	@row=$table[0]->find_by_tag_name('tag','tr');#Finds all tr tags in first table on page
	#print $table[0]->as_text."\n";
	for(my $a=1;$a<$#row;$a+=2){#Finds every odd tr skipping the table header row because extra row in table.
		my @cell=$row[$a]->find_by_tag_name('tag','td');#Finds all td in supplied tr
		#print $cell[0]->as_text."\n";
		$GOList{$cell[0]->as_text}=[$cell[1]->as_text,$cell[2]->as_text,$cell[3]->as_text,$cell[4]->as_text,$cell[5]->as_text];#Creates a hash with the key as the GO's name and an array of statistics as value.
	}
	my (@listRow,@listCell,@listResults);
	@listRow=$table[1]->find_by_tag_name('tag','tr');#Finds all tr tags in second table on page
	my @startTimeArray=split /[\- :]/,$listRow[0]->find_by_tag_name('tag','td')->as_text;
	my $startTime=timegm($startTimeArray[5],$startTimeArray[4],$startTimeArray[3],$startTimeArray[2],$startTimeArray[1]-1,$startTimeArray[0]);
	my $delta=60*60*24*30;
	for my $b(0..$#listRow){#Runs though each row with max table size of 1000 so if GOs have more than 1000 combined clicks in a month they will not all show
		@listCell=$listRow[$b]->find_by_tag_name('tag','td');#Finds each td in the provided row
		push(@listResults,$listCell[1]->as_text);#Adds to listResults array with each cell a string stating GO activity
	}
	my @endTimeArray=split /[\- :]/,$listRow[$#listRow]->find_by_tag_name('tag','td')->as_text;
	my $endTime=timegm($endTimeArray[5],$endTimeArray[4],$endTimeArray[3],$endTimeArray[2],$endTimeArray[1]-1,$endTimeArray[0]);
	my $page=1;
	#print $startTime." ".$endTime."\n";
	while($startTime-$endTime<$delta){
		$page++;
		print "On page ".$page."\n";
		$mech->follow_link(url_regex=>qr/page=$page/i);
		my $pageTree = HTML::TreeBuilder->new();
		$pageTree->parse_content($mech->content());#Converts page into an HTML table
		@table=$pageTree->find_by_tag_name('tag','table');#Finds all tables on page
		@listRow=$table[1]->find_by_tag_name('tag','tr');#Finds all tr tags in second table on page
		for my $b(0..$#listRow){#Runs though each row with max table size of 1000 so if GOs have more than 1000 combined clicks in a month they will not all show
			@listCell=$listRow[$b]->find_by_tag_name('tag','td');#Finds each td in the provided row
			push(@listResults,$listCell[1]->as_text);#Adds to listResults array with each cell a string stating GO activity
		}
		@endTimeArray=split /[\- :]/,$listRow[$#listRow]->find_by_tag_name('tag','td')->as_text;
		$endTime=timegm($endTimeArray[5],$endTimeArray[4],$endTimeArray[3],$endTimeArray[2],$endTimeArray[1]-1,$endTimeArray[0]);
		#print $endTime."\n";
		#print $startTime-$endTime."\n"
	}
	$mech->follow_link(url_regex=>qr/logs/i);#Finds and clicks on the GO logs link
	$mech->follow_link(url_regex=>qr/stats=1/i);#Mech variable still on logs page from previous subroutine finds page with the detailed information
	$tree->parse($mech->content());#Converts page into an HTML table
	$tree->eof();
	my (@tables,@rows,@cells,%details);
	@tables=split /<br \/><br \/>/,$tree->as_HTML;#Ungraceful split of web page needed to find the tables
	for my $c(17..20){#Need to find better method to find the 4 relevant tables
		$tables[$c]=~ s/<\/?center>//g;#Removes all center tags
		@rows=split /<\/td><\/tr><tr><td width="200">/,$tables[$c];#Splits table on each new row cutting out the leading and trailing td tag
		$rows[$#rows]=~ s/<\/td><\/tr><\/table>//g;#Removes trailing tags on last tr
		for my $d(1..$#rows){#Skips Legor and first 2 rows in table
			@cells=split /<\/td><td>/,$rows[$d];#Splits each cell
			if(exists $details{$cells[0]}){#Checks if the GO in the table is already in hash if so adds to count
				for my $e(1..$#cells){
					$details{$cells[0]}[$e-1]+=$cells[$e];#Creates a hash with the key as the GO's name and an array of statistics as value
				}
			}
			else{#Otherwise it creates the key value pair in hash
				for my $e(1..$#cells){
					$details{$cells[0]}[$e-1]=$cells[$e];#Creates a hash with the key as the GO's name and an array of statistics as value
				}
			}
		}
	}
	return (\%GOList,\@listResults,\%details);
}
sub combine{
	my $params = shift;
	my %paramhash = %$params;
	my %finalGOList;
	#print $#_."\n";
	foreach my $f(keys %paramhash){
		#print "loop".$paramhash{$f}."\n";
		foreach my $tempGO(keys $paramhash{$f}[0]){
			#print $tempGO."\n";
			if(exists $finalGOList{$tempGO}){
				for my $g(0..4){
					#print "exists".$paramhash{$f}[0]{$tempGO}[$g]."\n";
					$finalGOList{$tempGO}[$g]+=$paramhash{$f}[0]{$tempGO}[$g];
				}
			}
			else{
				for my $g(0..4){
					#print "not exists".$paramhash{$f}[0]{$tempGO}[$g]."\n";
					$finalGOList{$tempGO}[$g]=$paramhash{$f}[0]{$tempGO}[$g];
				}
			}
		}		
	}
	return %finalGOList;
}
