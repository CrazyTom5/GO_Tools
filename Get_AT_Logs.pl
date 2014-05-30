#!/usr/bin/perl -w

# Get_AT_Logs.pl
# Version 0.4
# Created by Crazy_Tom for use by Ogame.org game staff to record all GO records on March 3 2014.
# For use by Ogame.org staff only. Please delete script if not a staff member.
# Please obtain permission from CrazyTom@ogame.org before redistributing.
# Version 0.2 Changed Get_Uni_List subroutine to return an array rather than hash (did not need it to be timestamped)
# Version 0.3 Changed to one ENDHTML print
# Version 0.4 Changed Salt to something a little more random

# import modules
use warnings;
use strict;
use CGI;
use WWW::Mechanize;
use HTML::TreeBuilder;
use POSIX qw(strftime);

my $cgi = new CGI;
my $mech = WWW::Mechanize->new();
my $tree = HTML::TreeBuilder->new();

my $name='ATName';#Your AT name
my $pass='ATPass';#Your AT password
my $comm='EN';#Your Community used for file name
my $time=strftime "%F",gmtime;#Gets current date to store for file name 
my @set=('0'..'9','A'..'Z','a'..'z');
my $salt=join''=>map $set[rand @set],1..8;#Used to add randomness to file name so old team members can not access files
my $file="$comm-$time-$salt.html";#Creates file name format 'EN-2014-03-21-ABCabc12.html'
my $runtime=strftime "%c",gmtime;#Gets current time and date to store in output file
unless(open OUTPUT, '>'.$file) {#opens new file for writing and dies if fails.
	die "Unable to create '$file'";
}
print "\n$file\n";#Prints file name to give to rest of SGOs/GAs
#my @uniList=('Andromeda','Electra','Jupiter','Nekkar','Orion','Pegasus','Quantum','Rigel','Sirius','Taurus','Ursa','Vega','Wasat','Xalynth','1. Universe','20. Universe','30. Universe','35. Universe','44. Universe');
my @uniList=('680. Universe');
my (%data,%list,%details,%finalList,%listGO,%finalListGO,$uni,$universe,$GOName,$listNub,$html,$a,$b,$c,$d,$e);#Declares variables used in main progam
foreach $uni (@uniList){#Calls three subroutines for each universe in uniList array and stores the result in an hash for each subroutine
	$data{$uni}={&Get_Uni_Logs($uni,$name,$pass)};
	$list{$uni}=[&Get_Uni_List($uni,$name,$pass)];
	$details{$uni}={&Get_Uni_Details($uni,$name,$pass)};
}
foreach $universe(keys %data){#Combines statistics across all the universes into one hash.
	for $GOName(keys %{$data{$universe}}){#Checks all GOs in each universe
		if(exists $finalList{$GOName}){#Checks if GO name is already in finalList hash if so it adds to statistics
			for $a (0..4){
				$finalList{$GOName}[$a]+=$data{$universe}{$GOName}[$a];#Creates a hash with the key as the GO's name and an array of statistics as value
			}
		}
		else{#Otherwise it creates the key value pair in hash
			for $a (0..4){
				$finalList{$GOName}[$a]=$data{$universe}{$GOName}[$a];#Creates a hash with the key as the GO's name and an array of statistics as value
			}
		}
	}
}
foreach $universe(keys %list){#Runs through list of activity creating or adding to each GOs data in each universe for fleetlog, login and overview checks
	for $listNub (0..$#{$list{$universe}}){#Checks all activity in each universe
		if($list{$universe}[$listNub]=~/ \(\d{6}\): checks the fleet log/s){#Fleet Log regex GO name at start of string
			#(exists $listGO{$`}[0])?$listGO{$`}[0]+=1:$listGO{$`}[0]=1;
			if(exists $listGO{$`}[0]){#Checks if GO name is already in listGO hash if so it adds to statistics
				$listGO{$`}[0]+=1;
			}
			else{#Otherwise it creates the value
				$listGO{$`}[0]=1;
			}
		}
		elsif($list{$universe}[$listNub]=~/ checked the Login logs of /s){#Login log regex GO name at start of string
			if(exists $listGO{$`}[1]){#Checks if GO name is already in listGO hash if so it adds to statistics
				$listGO{$`}[1]+=1;
			}
			else{#Otherwise it creates the value
				$listGO{$`}[1]=1;
			}
		}
		elsif(my @temp=$list{$universe}[$listNub]=~/: checked \|(.+) \(\d{6}\)/s){#Overview check regex GO name and uid at end of string
			if(exists $listGO{$temp[0]}[2]){#Checks if GO name is already in listGO hash if so it adds to statistics
				$listGO{$temp[0]}[2]+=1;
			}
			else{#Otherwise it creates the value
				$listGO{$temp[0]}[2]=1;
			}
		}
#Was going to use as other but due to the different formats of checks in list would pick up non GOs
#Most of information is also stored on the details page that gets reported in a separate table.
#		else{
#			if(exists $listGO{$`}[3]){
#				$listGO{$`}[3]+=1;
#			}
#			else{
#				$listGO{$`}[3]=1;
#			}
#		}
	}
	$finalListGO{$universe}={%listGO};#Adds each unverese's GOs to total list
}
$html="<html>\n\t<head>\n\t\t<style>\ntable,th,td{\n\tborder:1px solid black;\n\tborder-collapse:collapse;\n}\nh1,h2{\n\ttext-align:center;\n}\nh3{\n\ttext-align:center;\n\tcolor:blue;\n}\ndiv{\n\ttext-align:center;\n}\n\t\t</style>\n\t\t<title>Crazy Tom - GO  Statistics</title>\n\t</head>\n\t<body>\n\t\t<h1>Stats for Ogame.org Game Operators</h1>\n\t\t<div>\n\t\t\t<p>Combined statistics of all GOs across all universes</p>\n\t\t\t<table>\n\t\t\t\t<tr>\n\t\t\t\t\t<th>GO Name</th>\n\t\t\t\t\t<th>3 Days</th>\n\t\t\t\t\t<th>7 Days</th>\n\t\t\t\t\t<th>14 Days</th>\n\t\t\t\t\t<th>28 Days</th>\n\t\t\t\t\t<th>All</th>\n\t\t\t\t</tr>";#Prints start of HTML document with the head and start of the body including the fist table for statistics of all GOs across all the universes
foreach $b (keys %finalList){
	$html.="\n\t\t\t\t<tr>\n\t\t\t\t\t<td>$b</td>";#Prints GO name as first column in table to web page
	for $c (0..4){
		$html.="\n\t\t\t\t\t<td>$finalList{$b}[$c]</td>";#Prints data from finalList hash to the table in the web page
	}
	$html.="\n\t\t\t\t</tr>";#Ends each row in table
}
$html.="\n\t\t\t</table>\n\t\t</div>\n\t\t<h2>Statistics for each individual universes</h2>";#Ends table on combined statistics for all GOs across all the universes and creates headings for next section
foreach $universe(keys %details){
	$html.="\n\t\t<h3>$universe</h3>\n\t\t<div>\n\t\t\t<p>Data Combinded from Details Page</p>\n\t\t\t<table>\n\t\t\t\t<tr>\n\t\t\t\t\t<th>GO Name</th>\n\t\t\t\t\t<th>Bans</th>\n\t\t\t\t\t<th>Unbans</th>\n\t\t\t\t\t<th>Renames</th>\n\t\t\t\t\t<th>Account transfers</th>\n\t\t\t\t\t<th>Email changes</th>\n\t\t\t\t\t<th>Alliance name changes</th>\n\t\t\t\t\t<th>Alliance deletions</th>\n\t\t\t\t\t<th>Alliance founder</th>\n\t\t\t\t\t<th>Accesses</th>\n\t\t\t\t\t<th>Password recoveries</th>\n\t\t\t\t\t</tr>";#Prints each universe name followed by the first of two tables, the first one combines the four weekly tables on the details page
	for $GOName(keys %{$details{$universe}}){
		$html.="\n\t\t\t\t<tr>\n\t\t\t\t\t<td>$GOName</td>";#Prints GO name as first column in table to web page
		for $d(0..9){		
			$html.="\n\t\t\t\t\t<td>$details{$universe}{$GOName}[$d]</td>";#Prints data from details hash to the table in the web page
		}
		$html.="\n\t\t\t\t</tr>";#Ends each row in table
	}
	$html.="\n\t\t\t</table>\n\t\t</div>\n\t\t<div>\n\t\t\t<p>Summary of List of Activities</p>\n\t\t\t<table>\n\t\t\t\t<tr>\n\t\t\t\t\t<th>GO Name</th>\n\t\t\t\t\t<th>FleetLog</th>\n\t\t\t\t\t<th>Login</th>\n\t\t\t\t\t<th>Overview Checks</th>\n\t\t\t\t\t</tr>";#Ends table on combined tables from details page and starts new table summarizing list of activities done by GO listing Fleetlog, Login and Overview Checks
	for $GOName(keys %{$finalListGO{$universe}}){
		$html.="\n\t\t\t\t<tr>\n\t\t\t\t\t<td>$GOName</td>";#Prints GO name as first column in table to web page
		for $e(0..2){
			if(exists $finalListGO{$universe}{$GOName}[$e]){#Prints data from finalListGO hash to the table in the web page.  Some values might not have been generated so if not the script outputs 0	
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
print OUTPUT $html;#Adds all html text to file
close OUTPUT;#Closes file

#print $cgi->header();
#print <<ENDHTML;
#$html
#ENDHTML
sub Get_Uni_Logs{
	my (@table,@row,%GO,$f);#Declares variables used in subroutine
	#$mech->get("http://en.ogame.gameforge.com/");#Opens the main login page for ogame.org
	$mech->get("http://pioneers.en.ogame.gameforge.com/");
	$mech->credentials('0r1g1n4t3','B3w4r30f3ngl15h');
	$mech->submit_form(with_fields=>{'uni'=>$_[0],'login'=>$_[1],'pass'=>$_[2]});#Fills in the login information and submits the form.
	print "\n".$mech->text()."\n";
	$mech->follow_link(url_regex=>qr/admin2/i);#Finds and clicks the link for the Admin Tool
	print "\n".$mech->text()."\n";
	$mech->follow_link(url_regex=>qr/home/i);#Clicks on home because of iFrames
	print "\n".$mech->text()."\n";
	$mech->follow_link(url_regex=>qr/logs/i);#Finds and clicks on the GO logs link
	print "\n".$mech->text()."\n";
	$tree->parse($mech->content());#Converts page into an HTML table
	$tree->eof();
	@table=$tree->find_by_tag_name('tag','table');#Finds all tables on page
	@row=$table[0]->find_by_tag_name('tag','tr');#Finds all tr tags in first table on page 
	for($f=1;$f<$#row;$f+=2){#Finds every odd tr skipping the table header row.
		my @cell=$row[$f]->find_by_tag_name('tag','td');#Finds all td in supplied tr
		$GO{$cell[0]->as_text}=[$cell[1]->as_text,$cell[2]->as_text,$cell[3]->as_text,$cell[4]->as_text,$cell[5]->as_text];#Creates a hash with the key as the GO's name and an array of statistics as value.
	}
	return %GO;#Returns hash
}
sub Get_Uni_List{
	my(@listResults,@table,@listRow,@listCell,$g);#Declares variables used in subroutine
	@table=$tree->find_by_tag_name('tag','table');#Finds all tables on page
	@listRow=$table[1]->find_by_tag_name('tag','tr');#Finds all tr tags in second table on page
	for $g(0..$#listRow){#Runs though each row with max table size of 1000 so if GOs have more than 1000 combined clicks in a month they will not all show
		@listCell=$listRow[$g]->find_by_tag_name('tag','td');#Finds each td in the provided row
		push(@listResults,$listCell[1]->as_text);#Adds to listResults array with each cell a string stating GO activity
	}
	return @listResults;#Returns array
}
sub Get_Uni_Details{
	my(%details,@tables,@rows,@cells,$h,$i,$j);#Declares variables used in subroutine
	$mech->follow_link(url_regex=>qr/stats=1/i);#Mech variable still on logs page from previous subroutine finds page with the detailed information
	$tree->parse($mech->content());#Converts page into an HTML table
	$tree->eof();
	@tables=split /<br \/><br \/>/,$tree->as_HTML;#Ungraceful split of web page needed to find the tables
	for $h(17..20){#Need to find better method to find the 4 relevant tables
		$tables[$h]=~ s/<\/?center>//g;#Removes all center tags
		@rows=split /<\/td><\/tr><tr><td width="200">/,$tables[$h];#Splits table on each new row cutting out the leading and trailing td tag
		$rows[$#rows]=~ s/<\/td><\/tr><\/table>//g;#Removes trailing tags on last tr
		for $i(1..$#rows){#Skips Legor and first 2 rows in table
			@cells=split /<\/td><td>/,$rows[$i];#Splits each cell
			if(exists $details{$cells[0]}){#Checks if the GO in the table is already in hash if so adds to count
				for $j(1..$#cells){
					$details{$cells[0]}[$j-1]+=$cells[$j];#Creates a hash with the key as the GO's name and an array of statistics as value
				}
			}
			else{#Otherwise it creates the key value pair in hash
				for $j(1..$#cells){
					$details{$cells[0]}[$j-1]=$cells[$j];#Creates a hash with the key as the GO's name and an array of statistics as value
				}
			}
		}
	}
	return %details;#Returns hash
}
