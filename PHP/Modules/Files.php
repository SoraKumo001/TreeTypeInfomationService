<?php
class Files{
	static $JS_ENABLE;
	const INFO = [
		"NAME"=>"ファイルプラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"ファイルデータの管理",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["t_log",0,1]]
	];
	public static function initModule(){
		if(MG::DB()->isConnect() && !MG::DB()->isTable("files")){
			MG::DB()->exec("create table files(files_id SERIAL PRIMARY KEY,files_parent INTEGER references files(files_id),files_kind INTEGER,users_id INTEGER references users(users_id),files_name TEXT,files_date TIMESTAMP with time zone,files_byte BYTEA);");
				MG::DB()->exec("insert into files values(default,null,0,null,'[ROOT]',now(),null)");
		}

	}
	public static function JS_createDir($parent,$name){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ディレクトリ作成 権限エラー"];
		return Self::createDir($parent,$name);
	}
	public static function JS_setFileName($id,$name){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ファイル名変更 権限エラー"];
		return Self::setFileName($id,$name);
	}
	public static function JS_deleteFiles($ids){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ファイル削除 権限エラー"];
		return Self::deleteFiles($ids);
	}
	public static function JS_deleteFile($id){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ファイル削除 権限エラー"];
		return Self::deleteFile($id);
	}
	public static function JS_getFileList($pid){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ファイルリスト取得 権限エラー"];
		return Self::getFileList($pid);
	}
	public static function JS_getDirList(){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ディレクトリリスト取得 権限エラー"];
		return Self::getDirList();
	}
	public static function JS_getDirId($parent,$name){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ディレクトリリスト取得 権限エラー"];
						$id = Self::getDirId(MG::getParam("parent"),MG::getParam("name"));
		if($id === null)
			return ["result"=>0,"message"=>"フォルダID取得 エラー"];
		else
			return ["result"=>1,"message"=>"フォルダID取得","id"=>$id];
	}
	public static function JS_uploadFile($parent,$name){
		if(!MG::isAdmin())
			return ["result"=>0,"message"=>"ファイルアップロード 権限エラー"];
		if(MG::getUserCode() === null)
			$result = ["result"=>0,"message"=>"ファイルアップロード 権限エラー"];
		else if(!isset($_SERVER['CONTENT_LENGTH']))
			$result = ["result"=>0,"message"=>"ファイルアップロード パラメータエラー"];
		else{
			$file = fopen("php://input", "r");
			$result = Self::saveFile($parent,$name,$file,$_SERVER['CONTENT_LENGTH']);
			fclose($file);
		}
		return $result;
	}
	public function JS_download(){
		if(MG::isParams(["id"]))
			Self::getFileStream(MG::getParam("id"));
		return null;
	}
	public static function getFileInfo($fileId){
		return MG::DB()->gets("select files_name,files_kind,octet_length(files_byte),files_date from files where files_id=?",$fileId);
	}
	public static function getFileStream($fileId){
		$stmt = MG::DB()->query("select files_name,octet_length(files_byte),files_date,files_byte from files where files_id=? and files_kind=1",$fileId);
		$stmt->bindColumn(1, $name, PDO::PARAM_STR);
		$stmt->bindColumn(2, $size, PDO::PARAM_INT);
		$stmt->bindColumn(3, $date, PDO::PARAM_STR);
		$stmt->bindColumn(4, $fp, PDO::PARAM_LOB);

		if($stmt->fetch() === false)
			return;
		$httpDisposition= "inline;";
		$contentType = "application/octet-stream";
		$ext = substr($name, strrpos($name, '.') + 1);
		switch(strtolower($ext)){
		case "png":
			$contentType = "image/png";
			break;
		case "svg":
			$contentType = "image/svg+xml";
			break;
		case "jpeg":
		case "jpg":
			$contentType = "image/jpeg";
			break;
		case "gif":
			$contentType = "image/gif";
			break;
		default:
		   	$httpDisposition= "attachment;";
		   	break;
		}
		header("Content-type: $contentType");
		header("Content-Disposition: $httpDisposition filename*=utf-8'jp'".urlencode($name));
		fpassthru($fp);
		exit(0);

	}
	public static function getDirList(){
		$values = MG::DB()->queryData("select files_id,files_parent,files_kind,files_name,files_date,octet_length(files_byte) as size
			from files where files_kind=0 order by files_name");
		$hash = [];
		if($values!==null){
			foreach($values as &$value){
				$id = $value["files_id"];
				$hash[$id] = [
					"id"=>$value["files_id"],
					"parent"=>$value["files_parent"],
					"kind"=>$value["files_kind"],
					"name"=>$value["files_name"],
					"size"=>$value["size"],
					"files_date"=>null,
					"childs"=>[]];
			}
			foreach($hash as $id=>&$file){
				$parent = $file["parent"];
				if($parent > 0)
					$hash[$parent]["childs"][] = &$file;
			}
			$result = ["result"=>1,"message"=>"フォルダリストの取得","value"=>$hash[1]];
		}
		else
			$result = ["result"=>0,"message"=>"フォルダリストの取得 エラー"];
		return $result;
	}
	public static function getFileList($parentId){
		date_default_timezone_set("UTC");
		$values = MG::DB()->queryData(
			"select files_id,files_parent,files_kind,files_name,files_date,octet_length(files_byte) as size
			from files where files_parent=? order by files_kind,files_name",$parentId);
		$files = [];
		if($values!==null){
			foreach($values as &$value){
				$files[] = [
					"id"=>$value["files_id"],
					"parent"=>$value["files_parent"],
					"kind"=>$value["files_kind"],
					"name"=>$value["files_name"],
					"date"=>date("Y-m-d\TH:i:s\Z", strtotime($value["files_date"])),
					"size"=>$value["size"],
					"files_date"=>null,
					"childs"=>[]];
			}
			$result = ["result"=>1,"message"=>"ファイルリストの取得","values"=>$files];
		}
		else
			$result = ["result"=>0,"message"=>"ファイルリストの取得 エラー"];
		return $result;
	}
	public static function getChildList($fileId){
		$sql = sprintf("select files_id from files where files_parent=%d",$fileId);
		$values = MG::DB()->queryData2($sql);
		return $values;
	}
	public static function getFileId($parentId,$name){
		//フォルダを分解
		$values = explode("/",$name);
		$p = $parentId;
		$count = count($values);
		for($i=0;$i<$count;$i++){
			$name2 = $values[$i];
			$id = MG::DB()->get("select files_id from files where files_parent=? and files_name=?",
				$p,$name2);
			if($id === null)
				return null;
			$p = $id;
		}
		return $id;
	}
	public static function setFileName($fileId,$name){
		if(MG::DB()->exec("update files set files_name=? where files_id=?",$name,$fileId)>0){
			return ["result"=>1,"message"=>"ファイル名の変更"];
		}
		return ["result"=>0,"message"=>"ファイル名の変更 失敗"];
	}

	public static function saveFile($parentId,$name,$file,$size){
		$id = Self::getFileId(MG::getParam("parent"),MG::getParam("name"));
		if($id === null){
			$row = MG::DB()->gets2("insert into files values(default,?,1,?,?,now(),?) returning files_id,octet_length(files_byte)",
				$parentId,MG::getUserCode(),$name,$file);
		}else{
			$row = MG::DB()->gets2("update files set files_byte=?,user_data_id=?,files_date=now() where files_id=? returning files_id,octet_length(files_byte)",
				$file,MG::getUserCode(),$id);
		}

		if($row[0] < 1 || $row[1] != $size){
			Self::deleteFile($row[0]);
			return ["result"=>0,"message"=>"ファイルアップロード エラー"];
		}
		return ["result"=>1,"message"=>"ファイルアップロード","value"=>$row[0]];
	}
	public static function deleteFiles($files){
		foreach($files as $fileId){
			$result = Self::deleteFile($fileId);
			if($result["result"] == 0)
				break;
		}
		return $result;
	}
	public static function deleteFile($fileId){
		$fileId = (int)$fileId;
		if($fileId > 1){
			//配下のオブジェクトを削除
			$childs = Self::getChildList($fileId);
			foreach($childs as $child){
				Self::deleteFile($child[0]);
			}
			//ファイル削除
			$sql = sprintf("delete from files where files_id=%d",
				$fileId);
			if(MG::DB()->exec($sql) > 0){
				return ["result"=>1,"message"=>"ファイル削除"];
			}
		}
		return ["result"=>0,"message"=>"ファイル削除 失敗"];
	}
	public static function createDir($parentId,$name){
		//フォルダを分解
		$values = explode("/",ltrim($name, '/'));

		$p = $parentId;
		for($i=0;$i<count($values);$i++){
			$name2 = $values[$i];
			$id = Self::getFileId($p,$name2);
			if($id == null)
				break;
			$file = Self::getFileInfo($id);
			if($file == null)
				break;
			if($file["files_kind"] != 0)
				return ["result"=>0,"message"=>"フォルダの作成 失敗"];
			$p = $id;
		}
		if($i == count($values))
			return ["result"=>0,"message"=>"フォルダの作成 既に作成済み","value"=>$id];
		for(;$i<count($values);$i++){
			$name2 = $values[$i];
			$id = MG::DB()->get(
				"insert into files values(default,?,0,?,?,now(),null) returning files_id",
				$p,MG::getUserCode(),$name2);
			if($id === null)
				$result = ["result"=>0,"message"=>"フォルダの作成 失敗"];
			$p = $id;
		}
		return ["result"=>1,"message"=>"フォルダの作成","value"=>$id];
	}
	public static function getDirId($parent,$name){
		$values = explode("/",ltrim($name, '/'));
		$id = 1;
		foreach($values as $value){
			$id = MG::DB()->get("select files_id from files where files_parent=? and files_name=?",
				$id,$value);
			if($id === null)
				return null;
		}
		return $id;
	}

}