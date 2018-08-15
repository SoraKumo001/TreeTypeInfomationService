<?php
class GParams{
	static $JS_ENABLE;
	const INFO = [
		"NAME"=>"パラメータプラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"グローバルパラメータの保存",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["params",0,1]]
	];
	public static function initModule(){
		if (MG::DB()->isConnect())
			MG::DB()->exec("create table IF NOT EXISTS params(params_name TEXT primary key,params_value TEXT);");
	}
	public static function JS_setParam($name,$value)
	{
		if (!MG::DB()->isConnect())
			return null;
		return Self::setParam("Global_" . $name,$value);
	}
	public static function JS_getParam($name)
	{
		if (!MG::DB()->isConnect())
			return null;
		return Self::getParam("Global_" . $name);
	}
	public static function JS_getParams($names)
	{
		if (!MG::DB()->isConnect())
			return null;
		$names2 = [];
		foreach ($names as $name) {
			$names2[] = "Global_" . $name;
		}
		$params = Self::getParams(...$names2);
		$params2 = [];
		foreach ($params as $key => $value) {
			$params2[substr($key,7)] = $value;
		}
		return $params2;
	}
	public static function getParam($name,$default=null){
		$ret =  MG::DB()->get("select params_value from params where params_name=?",$name);
		return $ret!==null?$ret:$default;
	}
	public static function setParam($name,$value){
		if (!MG::isAdmin())
			return false;
		if(MG::DB()->exec("update params set params_value=? where params_name=?",$value,$name)==0){
			return MG::DB()->exec("insert into params values(?,?)",$name,$value) == 1;
		}
		return true;
	}
	public static function &getParams(...$names){
		$s = MG::DB()->createValueParam($names);
		$sql = sprintf("select params_name,params_value from params where params_name in (%s)",$s);
		$values = MG::DB()->queryData2($sql);
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