<?php
require_once(dirname(__FILE__)."/include/SQLite.php");
class LocalDB extends SQLite{
	public function  __construct(){
		$this->connect(LOCAL_DB);
	}
}
?>