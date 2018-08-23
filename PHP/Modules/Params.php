<?php
class Params{
	static $JS_ENABLE;
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
	public static function JS_setParam($name,$value)
	{
		return Params::setParam("Global_" . $name,$value);
	}
	public static function JS_getParam($name)
	{
		return Params::getParam("Global_" . $name);
	}
	public static function JS_getParams($names)
	{
		$names2 = [];
		foreach ($names as $name) {
			$names2[] = "Global_" . $name;
		}
		$params = Params::getParams(...$names2);
		$params2 = [];
		foreach ($params as $key => $value) {
			$params2[substr($key,7)] = $value;
		}
		return $params2;
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
	public static function &getParams(...$names){
		$s = MG::LDB()->createValueParam($names);
		$sql = sprintf("select params_name,params_value from params where params_name in (%s)",$s);
		$values = MG::LDB()->queryData2($sql);
		$params = [];
		foreach($values as &$value){
			$params[$value[0]] = $value[1];
		}
		foreach($names as $name){
			if(!isset($params[$name]))
				$params[$name] = null;
		}
		return $params;
	}

}