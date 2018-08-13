<?php
class Users{
	static $JS_ENABLE;
	const INFO = [
		"NAME"=>"ユーザ管理プラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"ユーザ情報の管理を行う",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["users",1,1]]
	];
	public static function initModule(){
		if(MG::DB()->isConnect() && !MG::DB()->isTable("users")){
			MG::DB()->exec(
				"create table IF NOT EXISTS users(users_id SERIAL PRIMARY KEY,users_enable BOOLEAN,
					users_mail TEXT,users_password TEXT,users_name TEXT,users_info TEXT,UNIQUE(users_mail));
				create table user_group(user_group_id SERIAL PRIMARY KEY,user_group_enable boolean,user_group_name TEXT,user_group_info TEXT);
				insert into user_group values(default,true,'SYSTEM_ADMIN','管理者グループ');
				insert into user_group values(default,true,'GUEST','ゲストグループ');
				create table user_group_bind(users_id INTEGER references users(users_id),
					user_group_id INTEGER references user_group(user_group_id),
					user_group_bind_value INTEGER,PRIMARY KEY(users_id,user_group_id));");
		}
	}
	public static function getUserCount(){
		return MG::DB()->get("select count(*) from users");
	}
	public static function getUsers(){
		return MG::DB()->queryData("select * from users order by users_id");
	}
	public static function getUserIdFromMail($mail){
		return MG::DB()->get("select users_id from users where users_mail=?",$mail);
	}
	public static function addUser(){
		return MG::DB()->get("insert into users values(default,true,null,null,'新規ユーザ','') returning users_id");
	}
	public static function delUser($id){
		return MG::DB()->exec("delete from users where users_id=?",$id);
	}
	public static function setUser($id,$enable,$name,$mail,$pass,$info){
		$keys = ["users_id"];
		$values = ["users_id"=>$id];
		if($enable !== null)	$values["users_enable"] = $enable;
		if($name !== null)		$values["users_name"] = $name;
		if($mail !== null)		$values["users_mail"] = $mail;
		if($pass !== null)		$values["users_password"] = $pass;
		if($info !== null)		$values["users_info"] = $info;
		return MG::DB()->replace("users",$keys,$values);
	}
	public static function getGroupNames($userId){
		if(!MG::DB()->isConnect())
			return null;
		$values = MG::DB()->queryData2("select user_group_name from user_group where user_group_id in ".
			"(select user_group_id from user_group_bind where users_id = (select users_id from users where users_mail=?))",
			$userId);
		$result = [];
		foreach($values as $value)
			$result[] = $value[0];
		return $result;
	}
	public static function getGroups($userId){
		return MG::DB()->queryData("select * from user_group where user_group_id in ".
			"(select user_group_id from user_group_bind where users_id=?)",
			$userId);
	}
	public static function getGroupUserCount($groupName){
		if($groupName === null)
			return MG::DB()->get("select count(*) from user_group_bind");
		else
			return MG::DB()->get(
				"select count(*) from user_group_bind where user_group_id in ".
				"(select user_group_id from user_group where user_group_name=?)",
				$groupName);
	}
	public static function JS_getUsers(){
		if(!MG::isAdmin())
			return false;
		return Self::getUsers();
	}
	public static function JS_addUser(){
		if(!MG::isAdmin())
			return false;
		return Self::addUser();
	}
	public static function JS_delUser($userId){
		if(!MG::isAdmin())
			return false;
		return Self::delUser($userId);
	}
	public static function JS_setUser($id,$enable=null,$name=null,$mail=null,$pass=null,$info=null){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ユーザーデータの設定 権限エラー"];
		Self::setUser($id,$enable,$name,$mail,$pass,$info);
		$result = ["result"=>1,"message"=>"ユーザーデータの設定"];
		return $result;
	}
	public static function JS_getGroups(){
		if(!MG::isAdmin())
			return false;
		return MG::DB()->queryData("select *,0 from user_group order by user_group_id");
	}
	public static function JS_setGroup($id,$enable,$name,$info){
		if(!MG::isAdmin())
			return false;

		$keys = ["user_group_id"];
		$values = ["user_group_id"=>$id];
		if($enable !== null)
			$values["user_group_enable"] = $enable;
		if($name !== null)
			$values["user_group_name"] = $name;
		if($info !== null)
			$values["user_group_info"] = $info;
		return MG::DB()->replace("user_group",$keys,$values);
	}
	public static function JS_delGroup($id){
		if(!MG::isAdmin())
			return false;
		return MG::DB()->exec("delete from user_group where user_group_id=?",$id);
	}
	public static function JS_addGroup(){
		if(!MG::isAdmin())
			return false;
		return MG::DB()->get("insert into user_group values(default,true,'新規グループ','') returning user_group_id");
	}
	public static function JS_addGroupUser($groupId,$userId){
		if(!MG::isAdmin())
			return false;
		return MG::DB()->exec("insert into user_group_bind values(?,?)",$userId,$groupId) === 1;
	}
	public static function JS_delGroupUser($groupId,$userId){
		if(!MG::isAdmin())
			return false;
		return MG::DB()->exec("delete from user_group_bind where users_id=? and user_group_id=?",$userId,$groupId) === 1;
	}
	public static function JS_getUserGroups($userId){
		if(!MG::isAdmin())
			return false;
		return Self::getGroups($userId);
	}
}