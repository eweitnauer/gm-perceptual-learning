<?php
include('db_connect.php'); // defines variable $exp_id

function mysql_insert($table, $inserts) {
    $values = array_map('mysql_real_escape_string', array_values($inserts));
    $keys = array_map('mysql_real_escape_string', array_keys($inserts));

    return mysql_query('INSERT INTO `'.$table.'` (`'.implode('`,`', $keys).'`) VALUES (\''.implode('\',\'', $values).'\')');
}

function get_table_name($exp_id) {
  $res = mysql_query('SELECT trials_table FROM experiments WHERE id='.$exp_id);
  $row = mysql_fetch_array($res);
  return $row["trials_table"];
}

print 'experiment id: '.$exp_id;
$tab = get_table_name($exp_id);
print 'table name: '.$tab;

$trials = json_decode($_POST['json']);

for($i=0;$i<count($trials);$i++)
{
	$to_insert = (array)($trials[$i]);
	$to_insert["subject_id"] = $_POST['subject_id'];
	$to_insert["exp_id"] = $exp_id;
	$result = mysql_insert($tab, $to_insert);
}

// confirm the results
if (!$result) {
	die('Invalid query: ' . mysql_error());
} else {
	print "successful insert!";
}

?>
