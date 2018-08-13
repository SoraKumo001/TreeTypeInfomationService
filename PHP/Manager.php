<?php
define("MODULE_PATH","/Modules/");	//クラスの置き場所
define("DECORATION","JS_");			//呼び出しファンクションに付ける修飾文字列
define("LOCAL_DB",dirname(__FILE__)."/../save/.local.db");

spl_autoload_register(function ($className) {
	include_once(dirname(__FILE__)."/Modules/".$className.".php");
	if(method_exists($className,"initModule")){
		$className::initModule();
	}
});

require_once(dirname(__FILE__)."/MainDB.php");
require_once(dirname(__FILE__)."/LocalDB.php");
class MG{
	static $JS_ENABLE;


	static $mSessionHash;
	static $mCommand;
	static $mParams;
	static $mDB;
	static $mLocalDB;
	static $mSession;
	static $mUserCode;
	static $mUserJob;

	public static function init(){
		if(MG::getCommand() === null)
			return null;
		if(MG::getCommand() == "exec"){
			$values = [];	//戻り値格納用
			$funcs = MG::getParam("functions");
			if(gettype($funcs) == "string")
				$funcs = json_decode($funcs,true);
			$errInfo = "";
			foreach($funcs as $func_info){
				if(!isset($func_info["function"]))
					break;
				//クラス名とファンクションを分ける
				$name = explode(".",$func_info["function"],2);
				if(count($name) != 2){
					$errInfo = $func_info["function"].":クラスが指定されていない";
					Log::output($func_info["function"],$errInfo);
					break;
				}
				$class = $name[0];
				$func = DECORATION.$name[1];
				//実行可能か判断
				if(!property_exists($class,"JS_ENABLE") || !method_exists($class,$func)){
					$errInfo = $func_info["function"].":実行可能な命令が存在しない";
					Log::output($func_info["function"],$errInfo);
					break;
				}
				$count = (new ReflectionClass($class))->getMethod($func)->getNumberOfRequiredParameters();
				if(count($func_info["params"]) < $count){
					$errInfo = $func_info["function"].":パラメータが足りない";
					Log::output($func_info["function"],$errInfo);
					break;
				}

				//命令の実行
				try{
					$values[] = $class::$func(...$func_info["params"]);
					Log::output($func_info["function"],'実行');
				}catch(Exception $e){
					Log::output($func_info["function"],'異常終了');
				}
			}
			//全ての命令が実行できたか？
			if(count($values) != count($funcs))
				return ["result"=>0,"message"=>"execの実行失敗","info"=>$errInfo];
			//データを返す
			return ["result"=>1,"message"=>"execの実行","values"=>$values];
		}else{
			//クラス名とファンクションを分ける
			$funcName = MG::getCommand();
			$name = explode(".",$funcName,2);
			if(count($name) != 2){
				$errInfo = $funcName.":クラスが指定されていない";
				Log::output($funcName,$errInfo);
				return ["result"=>0,"message"=>"実行失敗","info"=>$errInfo];
			}
			$class = $name[0];
			$func = DECORATION.$name[1];
			//実行可能か判断
			if(!property_exists($class,"JS_ENABLE") || !method_exists($class,$func)){
				$errInfo = $funcName.":実行可能な命令が存在しない";
				Log::output($funcName,$errInfo);
				return ["result"=>0,"message"=>"実行失敗","info"=>$errInfo];
			}
			//命令の実行
			try{
				$values[] = $class::$func();
				Log::output($funcName,'実行');
			}catch(Exception $e){
				Log::output($funcName,'異常終了');
			}
			//データを返す
			return ["result"=>1,"message"=>"実行","values"=>$values];
		}

		return null;
	}

	public static function getParam($name){
		if(Self::$mParams === null){
			if(isset($_GET["command"])){
				Self::$mCommand = $_GET["command"];
				Self::$mParams = array();
			}else{
				$json_string = file_get_contents('php://input');
				Self::$mParams = json_decode($json_string,true);
				Self::$mCommand = isset(Self::$mParams["command"])?Self::$mParams["command"]:"";
			}
		}
		if(isset(Self::$mParams[$name])){
			return Self::$mParams[$name];
		}
		if(isset($_GET[$name]))
			return $_GET[$name];
		return null;
	}
	public static function isParams($values){
		foreach($values as $value){
			if(Self::getParam($value) === null)
				return false;
		}
		return true;
	}
	public static function isParamsOr($values){
		foreach($values as $value){
			if(Self::getParam($value) !== null)
				return true;
		}
		return false;
	}
	public static function setSessionHash($hash){
		Self::$mSessionHash = $hash;
	}
	public static function getSessionHash(){
		if(Self::$mSessionHash == null){
			Self::$mSessionHash = Self::getParam("sessionHash");
		}
		return Self::$mSessionHash;
	}
	public static function getCommand(){
		if(Self::$mCommand !== null)
			return Self::$mCommand;
		return Self::getParam("command");
	}
	public static function DB(){
		if(Self::$mDB === null){
			Self::$mDB = new MainDB();
			Self::$mDB->setOnError("MG::errorDB");
		}
		return Self::$mDB;
	}
	public static function LDB(){
		if(Self::$mLocalDB === null){
			Self::$mLocalDB = new LocalDB(LOCAL_DB);
		}
		return Self::$mLocalDB;
	}
	public static function getSession(){
		if(Self::$mSession == null){
			Self::$mSession = Session::getSessionValues();
		}
		return Self::$mSession;
	}
	public static function initDB(){
		$plugins = Self::getPlugins();
		foreach($plugins as $plugin){

		}
	}
	public static function getPlugins(){
		$files = scandir(dirname(__FILE__).MODULE_PATH);
		$plugins = [];
		foreach($files as $file){
			$name = explode(".",$file,2);
			if(count($name) === 2 && $name[1] === "php"){
				if(defined($name[0]."::INFO")){
					$info = $name[0]::INFO;
					$info['CLASS'] = $name[0];
					$plugins[] = $info;
				}
			}
		}
		return $plugins;
	}
	public static function getUserId(){
		$session = Self::getSession();
		if($session == null)
			return 0;
		return $session["users_id"];
	}
	public static function getUserCode(){
		$session = Self::getSession();
		if($session == null)
			return 0;
		return Users::getUserIdFromMail($session["users_id"]);
	}
	public static function isAdmin(){
		return Self::isAuthority("SYSTEM_ADMIN");
	}
	public static function isAuthority($authority){
		$session = Self::getSession();
		if($session == null)
			return false;
		if($session["users_id"] == -1)
			return true;
		return array_search($authority,$session["groups"]) !== false;
	}
	public static function getUserGroups($userId){
		if(!method_exists("Users","getGroupNames"))
			return [];
		return Users::getGroupNames($userId);
	}
	public static function JS_getPlugins(){
		return Self::getPlugins();
	}

	public static function JS_setDatabase($adr,$user,$pass,$name){
		if(!Self::isAuthority("SYSTEM_ADMIN"))
			return false;
		Params::setParam("POSTGRES_ADR",$adr);
		Params::setParam("POSTGRES_USER",$user);
		Params::setParam("POSTGRES_PASS",$pass);
		Params::setParam("POSTGRES_DB",$name);

		$db = new PostgreSQL();
		if($db->connect($adr,$user,$pass,$name))
			return true;

		if($db->connect($adr,$user,$pass,"postgres")){
			return $db->exec("create database $name") === 0;
		}
		return false;
	}
	public static function JS_getDatabase(){
		if(!Self::isAuthority("SYSTEM_ADMIN"))
			return null;
		return Params::getParams("POSTGRES_ADR","POSTGRES_USER","POSTGRES_PASS","POSTGRES_DB");
	}


}
