<?php
class Params{
	const INFO = [
		"NAME"=>"パラメータプラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"パラメータの保存",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["params",0,1]]
	];
	public static function initModule(){
		MG::LDB()->exec("create table IF NOT EXISTS params(params_name TEXT primary key,params_value TEXT);");
	}

	public static function getParam($name,$default=null){
		$ret =  MG::LDB()->get("select params_value from params where params_name=?",$name);
		return $ret!==null?$ret:$default;
	}
	public static function setParam($name,$value){
		if(MG::LDB()->exec("update params set params_value=? where params_name=?",$value,$name)==0){
			return MG::LDB()->exec("insert into params values(?,?)",$name,$value) == 1;
		}
		return true;
	}
	public static function getParams(...$names){
		$s = MG::LDB()->createValueParam($names);
		$sql = sprintf("select params_name,params_value from params where params_name in (%s)",$s);
		$values = MG::LDB()->queryData2($sql);
		$params = [];
		foreach($values as $value){
			$params[$value[0]] = $value[1];
		}
		foreach($names as $name){
			if(!isset($params[$name]))
				$params[$name] = null;
		}
		return $params;
	}

}