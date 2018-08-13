<?php
require_once(dirname(__FILE__)."/include/PostgreSQL.php");
class MainDB extends PostgreSQL{
	public function  __construct(){
		$params = Params::getParams("POSTGRES_ADR","POSTGRES_USER","POSTGRES_PASS","POSTGRES_DB");
		if(isset($params["POSTGRES_ADR"]) &&
			isset($params["POSTGRES_USER"]) &&
			isset($params["POSTGRES_PASS"]) &&
			isset($params["POSTGRES_DB"]))
			$this->connect($params["POSTGRES_ADR"],$params["POSTGRES_USER"],$params["POSTGRES_PASS"],$params["POSTGRES_DB"]);
	}
}
?>