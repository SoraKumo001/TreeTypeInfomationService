<?php
class Log{
	static $JS_ENABLE;
	const INFO = [
		"NAME"=>"ログプラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"ログデータの管理",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["t_log",0,1]]
	];

	public static function initModule(){
		if(MG::LDB()->isConnect())
			MG::LDB()->exec("create table IF NOT EXISTS t_log(id integer primary key,log_time timestamp,
				ip text,user_id text,user_name text,command text,message text)");
	}

	public static function output($command,$message){
		if(!MG::LDB()->isConnect())
			return;
		$user = MG::getSession();
		if($user !== null){
			MG::LDB()->exec("insert into t_log values(null,current_timestamp,?,?,?,?,?)",
				$_SERVER["REMOTE_ADDR"],$user['users_id']!==null?$user['users_id']:'',
				$user['users_name']!==null?$user['users_name']:'',
				$command,$message);

		}
	}
	public static function JS_getLog($count){
		if(MG::isAdmin())
			return MG::LDB()->queryData2("select * from t_log order by id desc limit ?",$count);
		else{
			$user = MG::getSession();
			if($user===null || $user['users_id']===null)
				return [];
			return MG::LDB()->queryData2("select * from t_log where user_id=? order by id desc limit ?",$user['user_id'],$count);
		}
	}
}