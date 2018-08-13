<?php
class Calendar{
	static $JS_ENABLE;
	const INFO = [
		"NAME"=>"カレンダープラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"カレンダー情報の管理",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["holiday_date",0,1]]
	];

	public static function initModule(){
		MG::DB()->exec("create table IF NOT EXISTS holiday(holiday_date date primary key,holiday_name text)");
	}
	public static function JS_importHoliday(){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"休日インポート　権限エラー"];
		if(Self::importHoliday())
			return ["result"=>1,"message"=>"休日インポート完了"];
		return ["result"=>0,"message"=>"休日インポートデータ取得失敗"];
	}
	public static function JS_getHoliday($start,$end){
		return Self::getHoliday($start,$end);
	}
	public static function JS_setHoliday($date,$name){
		if(!MG::isAdmin())
			return false;
		return Self::setHoliday([$date,$name]);
	}
	static function getHoliday($start,$end){
		return MG::DB()->queryData2("select * from holiday where holiday_date>=? and holiday_date<=?",
				$start,$end);
	}

	public static function importHoliday(){
		$url = "http://www8.cao.go.jp/chosei/shukujitsu/syukujitsu_kyujitsu.csv";
		$values = [];
		// fopenでファイルを開く（'r'は読み込みモードで開く）
		$fp = fopen($url, 'r');
		if($fp == null)
			return null;
		// whileで行末までループ処理
		if(!feof($fp))
			fgets($fp);
		while (!feof($fp)){
			$txt = fgets($fp);
			$txt = mb_convert_encoding($txt, "UTF8", "SJIS");
			$value = explode(",",$txt);
			if(count($value) > 0)
			{
				$value[0] = date($value[0]);
				$value[1] = rtrim($value[1]);
				$values[] = $value;
			}
		}
		fclose($fp);

		Self::setHoliday($values);
		return true;
	}
	public static function setHoliday($values){
		//MG::getDB()->exec("begin");
		for($i=0;$i<count($values);$i++){
			$value = $values[$i];
			if(strlen($value[1])==0){
				MG::DB()->exec("delete from holiday where date(holiday_date)=date(?)",[$value[0]]);
			}
			else
				MG::DB()->replace("holiday",["holiday_date"],["holiday_date"=>$value[0],"holiday_name"=>$value[1]]);
		}
		//MG::getDB()->exec("commit");
		return true;
	}
}