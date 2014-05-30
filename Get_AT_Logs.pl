#!/usr/bin/perl -w

# Get_AT_Logs.pl
# Greg Bechtol March 3 2014
# Created by Crazy_Tom for use by Ogame.org game staff to record all GO records on March 3 2014.
# For use by Ogame.org staff only. Please delete script if not a staff member.
# Please obtain permission from CrazyTom@ogame.org before redistrabuting.

# import modules
use warnings;
use strict;
use CGI;
use WWW::Mechanize;
use HTML::TreeBuilder 5 -weak; # Ensure weak references in use

my $cgi = new CGI;
my $mech = WWW::Mechanize->new();
my $tree = HTML::TreeBuilder->new;

my $name='Username';
my $pass='Password';
#my @uniList=('Andromeda','Electra','Jupiter','Nekkar','Orion','Pegasus','Quantum','Rigel','Sirius','Taurus','Ursa','Vega','Wasat','Xalynth','1. Universe','20. Universe','30. Universe','35. Universe','44. Universe');
my @uniList=('680. Universe');
my (%data,%list,%details,%finalList,%listGO,%finalListGO,$uni,$universe,$GOName,$listNub,$a,$b,$c,$d,$e);

#Calls three subroutines for each universe in uniList array and stores the result in an hash for each subroutine
foreach $uni (@uniList){
	$data{$uni}={&Get_Uni_Logs($uni,$name,$pass)};
	$list{$uni}={&Get_Uni_List($uni,$name,$pass)};
	$details{$uni}={&Get_Uni_Details($uni,$name,$pass)};
}

#Combines statistics across all the universes into one hash.
foreach $universe(keys %data){
	for $GOName ( keys %{ $data{$universe} } ) {
		if(exists $finalList{$GOName}){
			for $a (0..4){
				$finalList{$GOName}[$a]+=$data{$universe}{$GOName}[$a];
			}
		}
		else{
			for $a (0..4){
				$finalList{$GOName}[$a]=$data{$universe}{$GOName}[$a];
			}
		}
	}
}
#Runs through list of activity creating or adding to each GOs data in each universe for fleetlog, login and overview checks
foreach $universe(keys %list){
	for $listNub (0..$#{$list{$universe}}){
		if($list{$universe}[$listNub]=~/ \(\d{6}\): checks the fleet log/s){
			#(exists $listGO{$`}[0])?$listGO{$`}[0]+=1:$listGO{$`}[0]=1;
			if(exists $listGO{$`}[0]){
				$listGO{$`}[0]+=1;
			}
			else{
				$listGO{$`}[0]=1;
			}
		}
		elsif($list{$universe}[$listNub]=~/ checked the Login logs of /s){
			if(exists $listGO{$`}[1]){
				$listGO{$`}[1]+=1;
			}
			else{
				$listGO{$`}[1]=1;
			}
		}
		elsif(my @temp=$list{$universe}[$listNub]=~/: checked \|(.+) \(\d{6}\)/s){
			if(exists $listGO{$temp[0]}[2]){
				$listGO{$temp[0]}[2]+=1;
			}
			else{
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
	$finalListGO{$universe}={%listGO};
}
#Prints start of HTML document with the head and start of the body including the fist table for statistics of all GOs across all the universes
print $cgi->header();
print <<ENDHTML;
<html>
	<head>
		<title>Crazy Tom - GO  Statistics</title>
	</head>
	<body>
		<h1>Stats for Ogame.org Game Operators</h1>
		<table>
			<tr>
				<th colspan=6>Combined statistics of all GOs across all universes</th>
			</tr>
			<tr>
				<td>GO Name</td>
				<td>3 Days</td>
				<td>7 Days</td>
				<td>14 Days</td>
				<td>28 Days</td>
				<td>All</td>
			</tr>
ENDHTML
#Prints GO name as first column in table to web page
foreach $b (keys %finalList){
	print <<ENDHTML;
			<tr>
				<td>$b</td>
ENDHTML
#Prints data from finalList hash to the table in the web page
	for $c (0..4){
		print <<ENDHTML;
				<td>$finalList{$b}[$c]</td>
ENDHTML
	}
#Ends each row in table
	print <<ENDHTML;
			</tr>
ENDHTML
}
#Ends table on combined statistics for all GOs across all the universes
print <<ENDHTML;
		</table>
		<h2>Statistics for each individual universes</h2>
ENDHTML
#Prints each universe name followed by the first of two tables, the first one combines the four weekly tables on the details page
foreach $universe(keys %details){
	print <<ENDHTML;
		</br>
		<font color="Blue">
			<h3>$universe</h3>
		</font>
		<table>
			<tr>
				<th colspan=11>Data Combinded from Details Page</th>
			</tr>
			<tr>
				<td>GO Name</td>
				<td>Bans</td>
				<td>Unbans</td>
				<td>Renames</td>
				<td>Account transfers</td>
				<td>Email changes</td>
				<td>Alliance name changes</td>
				<td>Alliance deletions</td>
				<td>Alliance founder</td>
				<td>Accesses</td>
				<td>Password recoveries</td>
			</tr>
ENDHTML
	for $GOName(keys %{$details{$universe}}){
#Prints GO name as first column in table to web page
		print <<ENDHTML;
			<tr>
				<td>$GOName</td>
ENDHTML
		for $d(0..9){
#Prints data from details hash to the table in the web page		
			print <<ENDHTML;
				<td>$details{$universe}{$GOName}[$d]</td>
ENDHTML
		}
#Ends each row in table
		print <<ENDHTML;
			</tr>
ENDHTML
	}
#Ends table on combined tables from details page and starts new table summarizing list of activities done by GO listing Fleetlog, Login and Overview Checks
	print <<ENDHTML;
		</table>
		<table>
			<tr>
				<th colspan=4>Fleetlog, Login and Overview Checks</th>
			</tr>
			<tr>
				<td>GO Name</td>
				<td>FleetLog</td>
				<td>Login</td>
				<td>Overview Checks</td>
			</tr>
ENDHTML
	for $GOName(keys %{$finalListGO{$universe}}){
#Prints GO name as first column in table to web page
		print <<ENDHTML;
			<tr>
				<td>$GOName</td>
ENDHTML
		for $e(0..2){
#Prints data from finalListGO hash to the table in the web page.  Some values might not have been generated so if not the script outputs 0	
			if(exists $finalListGO{$universe}{$GOName}[$e]){
				print <<ENDHTML;
				<td>$finalListGO{$universe}{$GOName}[$e]</td>
ENDHTML
			}
			else{
				print <<ENDHTML;
				<td>0</td>
ENDHTML
			}
		}
#Ends each row in table
		print <<ENDHTML;
			</tr>
ENDHTML
	}
#Ends table on combined statistics for all GOs across all the universes
	print <<ENDHTML;
		</table>
ENDHTML
	
}
#Closes the web page
print <<ENDHTML;
	</body>
</html>
ENDHTML

sub Get_Uni_Logs{
	my (@table,@row,%GO,$f);#Declares variables used in subroutine
	#$mech->get("http://en.ogame.gameforge.com/");#Opens the main login page for ogame.org
	$mech->get("http://pioneers.en.ogame.gameforge.com/");
	$mech->credentials('0r1g1n4t3','B3w4r30f3ngl15h');
	$mech->submit_form(with_fields=>{'uni'=>$_[0],'login'=>$_[1],'pass'=>$_[2]});#Fills in the login information and submits the form.
	$mech->follow_link(url_regex=>qr/admin2/i);#Finds and clicks the link for the Admin Tool
	$mech->follow_link(url_regex=>qr/home/i);#Clicks on home because of iFrames
	$mech->follow_link(url_regex=>qr/logs/i);#Finds and clicks on the GO logs link
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
		#$listResults{$listCell[0]->as_text}=$listCell[1]->as_text;
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
					$details{$cells[0]}[$j-1]+=$cells[$j];#Creates a hash with the key as the GO's name and an array of statistics as value.
				}
			}
			else{#Otherwise it creates the key value pair in hash
				for $j(1..$#cells){
					$details{$cells[0]}[$j-1]=$cells[$j];#Creates a hash with the key as the GO's name and an array of statistics as value.
				}
			}
		}
	}
	return %details;#Returns hash
}