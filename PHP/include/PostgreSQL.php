<?php
require_once(dirname(__FILE__)."/Database.php");

class PostgreSQL extends Database{
	public function connect($server,$user,$pass,$dbname){
		return parent::_connect("pgsql",$server,$user,$pass,$dbname);
	}
	function isTable($name){
		$sql = sprintf("select * from pg_tables where tablename=%s",$this->quote($name));
		$stmt = $this->query($sql);
		return $stmt->fetch(PDO::FETCH_NUM)!=null;
	}
}


?>
