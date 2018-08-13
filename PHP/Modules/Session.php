<?php
class Session{
	const INFO = [
		"NAME"=>"セッションプラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"セッションを管理する",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["session",0,1],["users",0,1]]
	];

	static $JS_ENABLE;
	static $mSessionValues;
	public static function initModule(){
		MG::LDB()->exec(
			"create table IF NOT EXISTS session(session_hash text primary key,users_id text,users_name text,users_info text,login_time timestamp);
			create table IF NOT EXISTS users(users_id integer primary key,users_name text unique,users_password text)");
	}
	public static function JS_requestLogin($id,$pass){
		if(!Self::login($id,$pass))
			return ["result"=>0,"message"=>"ログイン 失敗"];
		return Self::JS_requestSession();
	}
	public static function isLocalAdmin($id=null,$pass=null){
		if($id == null)
			return MG::LDB()->get("select 1 from users limit 1") == 1;
		$p =  MG::LDB()->get("select users_password from users where users_name=?",$id);
		if($p === null)
			return false;
		return MD5(MG::getSessionHash().$p) === $pass;
	}
	public static function JS_createAdmin($id,$pass){
		if(!Self::isLocalAdmin()){
			$pass = md5($pass);
			if(MG::LDB()->exec("insert into users values(null,?,?)",$id,$pass) == 1){
				Self::login($id,md5(MG::getSessionHash().$pass));
				return true;
			}
		}
		return false;
	}
	public static function isDBParams(){
		$params = Self::getParams("DATABASE_URL","DATABASE_ID","DATABASE_PASS","DATABASE_NAME");
		$count = 0;
		foreach($params as $p){
			if($p !== null)
				$count++;
		}
		return $count===4;
	}
	public static function JS_requestSession(){
		//ローカルDBチェック
		if(!MG::LDB()->isConnect())
			return ["result"=>-1,"sessionHash"=>MG::getSessionHash(),"message"=>"ローカルデータベースに接続できない"];

		//セッション情報の読み取り
		$values = Self::getSessionValues();
		//セッションハッシュが無ければ作成
		if($values === null){
			MG::setSessionHash(Self::createHash());
			$values = Self::getSessionValues();
		}

		//ローカル管理者
		if(!Self::isLocalAdmin()){
			return ["result"=>-2,"sessionHash"=>MG::getSessionHash(),"message"=>"ローカル管理者が設定されていない"];
		}

		if($values !== null && $values["users_id"]!==null){
			//ローカル管理者だった場合の処理
			if($values["users_id"] == -1){
				return ["result"=>1,"message"=>"セッション取得",
					"sessionHash"=>MG::getSessionHash(),
					"user"=>[
						"id"=>$values['users_id'],
						"name"=>$values['users_name'],
						"info"=>$values['users_info'],
						"groups"=>["SYSTEM_ADMIN"]]];
			}
			//通常ユーザ
			return ["result"=>1,"message"=>"セッション取得",
				"sessionHash"=>MG::getSessionHash(),
				"user"=>[
					"id"=>$values['users_id'],
					"name"=>$values['users_name'],
					"info"=>$values['users_info'],
					"groups"=>$values['groups']]];
		}

		//セッションユーザが空の場合の処理はGUEST情報を返す
		if($values === null || $values['users_id'] === null){
			return ["result"=>1,"message"=>"セッション取得",
				"sessionHash"=>MG::getSessionHash(),
				"user"=>[
					"id"=>'0',
					"name"=>'GUEST',
					"info"=>'',
				"groups"=>[]]];
		}

		if(Self::DB()->isConnect()){
		}


		//セッション情報の取得
		$session = Self::getValues();
		if($session === null){
			//セッションが無かったら作成する
			MG::setSessionHash(Self::createHash());
			$session = ['users_id'=>0,'users_name'=>'GUEST','users_info'=>''];
		}
		//セッション情報の生成
		$result = ["result"=>1,"message"=>"セッション取得",
			"sessionHash"=>MG::getSessionHash(),
			"user"=>[
				"id"=>$session['users_id'],
				"name"=>$session['users_name'],
				"info"=>$session['users_info']],
			"groups"=>[UserGroup::getUserGroupNames($session['users_id'])]
		];
		return $result;
	}

	public static function createHash(){
		while(true){
			$sessionHash = md5(time());
			if(!Self::isSession($sessionHash))
				break;
			sleep(0);
		}
		MG::LDB()->exec("delete from session where login_time < current_timestamp + '-1 hour'");
		MG::LDB()->exec("insert into session values(?,null,null,null,current_timestamp)",$sessionHash);
		return $sessionHash;
	}
	public static function isSession(){
		$stmt = MG::LDB()->query("select users_id from session where session_hash=? limit 1",MG::getSessionHash());
		if($stmt === false){
			return false;
		}
		if($row = $stmt->fetch(PDO::FETCH_NUM)){
			return true;
		}
		return false;
	}
	public static function login($id,$pass){
		//ローカル管理者かチェック
		if(Self::isLocalAdmin($id,$pass)){
			$count = MG::LDB()->exec("update session set users_id=?,users_name=?,users_info=? where session_hash=?",
				-1,$id,'',MG::getSessionHash());
			return $count>0;
		}
		//メインDBに接続できなければ終了
		if(!MG::DB()->isConnect())
			return false;

		$row = MG::DB()->gets("select * from users where users_mail=? and md5(?||users_password)=?",
			$id,MG::getSessionHash(),$pass);
		if($row === null)
			return false;

		$count = MG::LDB()->exec("update session set users_id=?,users_name=?,users_info=? where session_hash=?",
			$id,$row['users_name'],'',MG::getSessionHash());
		return $count > 0;
	}
	//セッションハッシュから情報を返す
	public static function getSession($sessionHash){
		return MG::LDB()->gets("select users_id,users_name,users_info from session where session_hash=? limit 1",
				$sessionHash);
	}

	public static function getSessionValues(){
		if(Self::$mSessionValues == null){
			$session = Self::getSession(MG::getSessionHash());;
			if($session !== null){
				if($session["users_id"] == -1)
					$session['groups'] = ['SYSTEM_ADMIN'];
				else
					$session['groups'] = MG::getUserGroups($session["users_id"]);
				Self::$mSessionValues = $session;
			}
		}
		return Self::$mSessionValues;
	}
	public static function getSessionValue($index){
		return Self::getValues()[$index];
	}

}
