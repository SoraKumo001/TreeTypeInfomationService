<?php
require_once(dirname(__FILE__)."/Database.php");
class SQLite extends Database{
	function connect($filePath){
		return parent::_connect2("sqlite:".$filePath);
	}
	function isTable($name){
		$sql = sprintf("select * from sqlite_master where type='table' and name=%s",
			$this->quote($name));
		$stmt = $this->query($sql);
		return $stmt->fetch(PDO::FETCH_NUM)!=null;
	}
}

?>