<?php
class Contents{
	static $JS_ENABLE;
	const INFO = [
		"NAME"=>"コンテンツプラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"メインコンテンツの管理",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["t_log",0,1]]
	];
	public static function initModule(){
		//MG::DB()->exec("drop table contents");
		if(MG::DB()->isConnect() && !MG::DB()->isTable("contents")){

			MG::DB()->exec(
				"create table contents(
					contents_id SERIAL primary key,
					contents_parent INTEGER references contents(contents_id),
					contents_priority INTEGER,
					contents_stat INTEGER,contents_type TEXT,
					contents_date timestamp with time zone,contents_update timestamp with time zone,
					contents_title_type integer,contents_title TEXT,contents_value TEXT)");
			MG::DB()->exec("insert into contents values(default,null,1000,1,'PAGE',current_timestamp,current_timestamp,0,'Top','')");
			Files::createDir(1,"Contents");

		}
	}
	public static function JS_export($id=1){
		if(!MG::isAdmin())
			return false;
		$id = MG::getParam("id");
		if($id == null)
			$id = 1;
		$values = MG::DB()->queryData(
			"select contents_id as id,contents_parent as pid,contents_stat as stat,contents_priority as priority,contents_type as type,contents_date as date,contents_update as update,contents_title_type as title_type,contents_title as title,contents_value as value from contents order by contents_type='PAGE',contents_priority"
		);
		if ($values === null)
			return null;
		foreach ($values as &$value) {
			$id2 = $value["id"];
			//ファイルデータの読み出し
			$path = sprintf("/Contents/%04d/%02d", ((int)($id2 / 100)) * 100, $id2 % 100);
			$fileId = Files::getDirId(1, $path);
			if ($fileId != null) {
				$fileList = Files::getChildList($fileId);
				if(count($fileList)){
					$f = [];
					foreach($fileList as $fileId){
						$f = Files::getFile($fileId[0]);
					}
					$value["files"][]=&$f;
				}
			}
			//ID参照用データの作成
			$items[$id2] = &$value;
		}

		//親子関係の作成
		foreach ($items as &$item) {
			if ($item["pid"] !== null) {
				$parent = &$items[$item["pid"]];
				$parent["childs"][] = &$item;
			}
		}
		ob_start("ob_gzhandler");
		//header('content-type: application/force-download');
		header('content-type: text/json');
		header('Content-disposition: attachment; filename="export.json"');
		header("Access-Control-Allow-Origin: *");
		echo json_encode($items[$id], JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	public static function JS_import($id,$mode,$value){
		if($id == null)
			return false;
		$value = json_decode($value, true);
		MG::DB()->exec("begin");
		if($mode == 0){
			if($id == 1){
				//全データを削除
				MG::DB()->exec("TRUNCATE table contents;select setval ('contents_contents_id_seq', 1, false);");
				//関連ファイルの削除
				$fileId = Files::getDirId(1, "/Contents");
				Files::deleteFile($fileId);
				Files::createDir(1, "Contents");
				//インポート処理
				Self::import(null, $value);
			}else{
				//上書き元のデータを取得
				$contents = MG::DB()->gets("select contents_parent as parent,contents_priority as priority from contents where contents_id=?",$id);
				$ids = [];
				//上書き元のデータを削除
				Self::deleteContents($id, $ids);
				$value["priority"] = $contents["priority"];
				Self::import($contents["parent"],$value);
			}
		}else{
			Self::import($id ,$value);
		}
		MG::DB()->exec("commit");

	}
	public static function import($pid,$value){
		//データの挿入
		$cid = MG::DB()->get(
			"insert into contents values(default,?,?,?,?,?,?,?,?,?) RETURNING contents_id",
			$pid,
			$value["priority"],
			$value["stat"],
			$value["type"],
			$value["date"],
			$value["update"],
			$value["title_type"],
			$value["title"],
			$value["value"]
		);
		if($cid === null)
			return false;
		//ファイルの復元処理
		if(isset($value["files"])){
			$ids = [];
			$dirId = Files::createDir(1, Self::getDirPath($cid));
			foreach($value["files"] as $file){
				$ids[$file["id"]] = Files::setFile($dirId, $file["name"],$file["date"],$file["value"]);
			}
			foreach($ids as $srcId => $destId){
				$convertSrc[] = sprintf('/src="\?command=Files\.download&amp;id=%d"/',$srcId);
				$convertDest[] = sprintf('/src="?command=Files.download&amp;id=%d"/', $destId);
			}
			$value["value"] = preg_replace($convertSrc, $convertDest, $value["value"]);
			MG::DB()->exec(
				"update contents set contents_value=? where contents_id=?",
				$value["value"],
				$cid);
		}
		//子データの挿入
		if(isset($value["childs"])){
			foreach($value["childs"] as $child){
				Self::import($cid,$child);
			}
		}
		return true;
	}
	public static function JS_getTree($id=1){
		//権限によって取得データに条件をつける
		$visible = MG::isAdmin()?"":"where contents_stat=1";
		//ツリー構造に必要なデータを抽出
		$values = MG::DB()->queryData(
			"select contents_id as id,contents_parent as pid,contents_stat as stat,
			contents_type as type,contents_title as title from contents $visible order by contents_type='PAGE',contents_priority");
		if($values === null)
			return null;
		//ID参照用データの作成
		foreach($values as &$value){
			$items[$value["id"]] = &$value;
		}
		//親子関係の作成
		foreach($items as &$item){
			if($item["pid"] !== null && isset($items[$item["pid"]])){
				$parent = &$items[$item["pid"]];
				$parent["childs"][] = &$item;
			}
		}
		//最上位のデータを返す
		return $items[$id];
	}
	public static function JS_getContentsPage($id){
		$pid = Self::getParentPage($id);
		if($pid == 0)
			return null;
		$contents = Self::JS_getContents($pid);
		if($contents === null)
			return null;
		$contents["childs"] = Self::getContentsPageFromParent($pid);
		return $contents;
	}
	public static function JS_getContents($id){
		$visible = MG::isAdmin() ? "" : "and contents_stat=1";
		$values = MG::DB()->queryData("select contents_id as id,contents_parent as pid,contents_stat as stat,contents_type as type,contents_date as date,contents_update as update,contents_title_type as title_type,contents_title as title,contents_value as value from contents where contents_id=? $visible",$id);
		return $values[0];
	}
	public static function JS_updateContents($id,$stat,$date,$contentsType,$titleType,$title,$value){
		if (!MG::isAdmin())
			return null;
		return MG::DB()->exec(
			"update contents SET contents_stat=?,contents_date=?,contents_type=?,contents_update=current_timestamp,
			contents_title_type=?,contents_title=?,contents_value=? where contents_id=?",
			$stat,$date,$contentsType,$titleType,$title,$value,$id)==1;
	}
	public static function JS_deleteContents($id){
		if (!MG::isAdmin())
			return null;
		$ids = [];
		MG::DB()->exec("begin");
		$flag = Self::deleteContents($id,$ids);
		MG::DB()->exec("commit");
		return $ids;
	}

	public static function JS_createContents($id,$vector,$type){
		if (!MG::isAdmin())
			return null;
		$cid = 0;
		switch($vector){
			case 0:
			case 1:
				$pid = Self::getContentsParent($id);
				$priority = Self::getContentsPriority($id)+ ($vector == 0 ? -5 : 5);
				break;
			case 2:
			case 3:
				$pid = $id;
				$priority = $vector == 2 ? 0 : 100000;
				break;
			default:
				return null;

		}
		$titleType = 1;
		if ($type != 'PAGE') {
			$count = Self::getDeeps($pid);
			if ($count == 0)
				$titleType = 2;
			else
				$titleType = 3;
		}
		$cid = MG::DB()->get(
			"insert into contents values(default,?,?,-1,?,
				current_timestamp,current_timestamp,?,'New','') RETURNING contents_id",
			$pid,
			$priority,
			$type,
			$titleType);
		Self::updatePriority($pid);
		return ["pid"=>$pid,"id"=>$cid];
	}
	public static function JS_moveVector($id,$vector)
	{
		if (!MG::isAdmin())
			return null;
		$priority = Self::getContentsPriority($id);
		if(!$priority)
			return false;
		$count = MG::DB()->exec(
			"update contents set contents_priority = ? where contents_id=?",
			$priority +($vector<0?-15:15),$id);
		Self::updatePriorityFromChild($id);
		$priority2 = Self::getContentsPriority($id);
		return $priority !== $priority2;
	}

	public static function JS_getRss()
	{
		date_default_timezone_set("UTC");
		$values = MG::DB()->queryData("select contents_id as id,contents_date as date,contents_title as title,contents_value as value from contents where contents_stat=1 and contents_type='PAGE' order by contents_date desc");

		$url = Params::getParam("Global_base_url", "");
		$title = Params::getParam("Global_base_title", "タイトル");
		$info = Params::getParam("Global_base_info", "");

		header('Content-Type: text/xml; charset=utf-8', true);
		$rss = new SimpleXMLElement('<rss/>');
		$rss->addAttribute('version', '2.0');
		$channel = $rss->addChild('channel');

		$title = $channel->addChild('title', $title);
		$description = $channel->addChild('description', $info);
		$link = $channel->addChild('link', $url);
		$language = $channel->addChild('language', 'ja-jp');

		foreach ($values as $value) {
			$msg = strip_tags($value["value"]);
			$msg = str_replace("&nbsp;", "&#160;", $msg);
			$msg = str_replace("&amp;", "&#38;", $msg);
			$item = $channel->addChild("item");
			$item->addChild("title", $value["title"]);
			$item->addChild('description', $msg);
			$item->addChild(
				"link",
				sprintf("%s?p=%d", $url, $value["id"])
			);
			$item->addChild("pubDate", date("r", strtotime($value["date"])));
		}
		ob_start("ob_gzhandler");
		echo $rss->asXML();
		exit(0);
	}
	public static function getContentsParent($id)
	{
		return MG::DB()->get("select contents_parent from contents where contents_id=?", $id);
	}
	public static function getContentsPriority($id)
	{
		return MG::DB()->get("select contents_priority from contents where contents_id=?", $id);
	}
	public static function updatePriority($id){
		$values = MG::DB()->queryData2("select contents_id from contents where contents_parent=? order by contents_type='PAGE',contents_priority",$id);
		$sql = "";
		foreach($values as $key => $value){
			$sql .= sprintf("update contents SET contents_priority=%d where contents_id=%d;\n",($key+1)*1000,$value[0]);
		}
		if($sql !== "")
			MG::DB()->exec($sql);
	}
	public static function updatePriorityFromChild($id)
	{
		$values = MG::DB()->queryData2("select contents_id from contents where contents_parent=(select contents_parent from contents where contents_id=?) order by contents_type='PAGE',contents_priority", $id);
		$sql = "";
		foreach ($values as $key => $value) {
			$sql .= sprintf("update contents SET contents_priority=%d where contents_id=%d;\n", ($key + 1) * 10, $value[0]);
		}
		if ($sql !== "")
			MG::DB()->exec($sql);
	}
	public static function deleteContents($id,&$idList){
		$ids = MG::DB()->queryData2("select contents_id from contents where contents_parent=?",$id);
		foreach($ids as $cid)
			Self::deleteContents($cid[0], $idList);
		if($id === 1)
			return true;
		$idList[] = $id;
		//関連ファイルの削除
		$path = Self::getDirPath($id);
		$fileId = Files::getDirId(1, $path);
		Files::deleteFile($fileId);
		//コンテンツの削除
		return MG::DB()->exec("delete from contents where contents_id=?",$id)===1;
	}
	public static function &getContentsPageFromParent($pid)
	{
		$visible = MG::isAdmin() ? "" : "and contents_stat=1";
		//親Idを元にコンテンツを抽出
		$values = MG::DB()->queryData("select contents_id as id,contents_parent as pid,contents_stat as stat,contents_type as type,contents_date as date,contents_update as update,contents_title_type as title_type,contents_title as title,contents_value as value from contents where contents_parent=? and contents_type != 'PAGE' $visible order by contents_priority", $pid);
		//子コンテンツを抽出
		foreach($values as &$value){
			$value["childs"] = &Self::getContentsPageFromParent($value["id"]);
		}
		return $values;
	}
	public static function getDirPath($id){
		return sprintf("/Contents/%04d/%02d", ((int)($id / 100)) * 100, $id % 100);
	}

	public static function getParentPage($id){
		//PAGEタイプを持つ親を探す
		while(true){
			$value = MG::DB()->gets("select contents_parent as pid,contents_type as type from contents where contents_id=?",$id);
			if($value === null)
				return 0;
			if($value['type'] === 'PAGE')
				break;
			$id = $value['pid'];
		}
		return $id;
	}
	public static function getParent($id){
		MG::DB()->get("select contents_parent from contents where contents_id = ?",$id);
	}
	public static function isParent($id,$checkId){
		if($id === $checkId)
			return true;
		while($id = Self::getParent($id)){
			if ($id === $checkId)
				return true;
		}
		return false;
	}
	public static function JS_moveContents($fromId,$toId){
		//移動先が子だったら処理を行わない
		if(Self::isParent($toId,$fromId))
			return false;
		//親の組み替え
		$flag = MG::DB()->exec("update contents set contents_parent=?,contents_priority=100000 where contents_id=?", $toId, $fromId) === 1;
		Self::updatePriority($toId);
		return $flag;
	}
	public static function getDeeps($id)
	{
		//PAGEタイプまでの深さを探索
		$count = 0;
		while (true) {
			$id = MG::DB()->get("select contents_parent as type from contents where contents_id=? and contents_type!='PAGE'", $id);
			if ($id === null)
				break;
			$count++;
		}
		return $count;
	}
	public static function outputPage(){
		$id = MG::getParam("p");
		if($id == null)
			$id = 1;

		$contents = Self::JS_getContentsPage($id);
		if($contents === null)
			return;
		$title = Params::getParam("Global_base_title", "");
		printf(
			"<!DOCTYPE html>\n<html>\n\t<head>\n\t<meta charset=\"UTF-8\"/>\n" .
				"\t<link rel=\"alternate\" type=\"application/rss+xml\" href=\"?command=Contents.getRss\" title=\"RSS2.0\" />\n" .
				"<title>%s</title>" .
				"</head>\n<body>\n",
			htmlspecialchars($contents["title"]." ～ ".$title)
		);

		Self::outputContents($contents);
		echo "</body>\n</html>\n";
	}
	public static function outputContents($contens){
		//タイトルの出力
		switch($contens["title_type"]){
			case 1:
				printf("<h1>%s</h1>\n", $contens["title"]);
				break;
			case 2:
				printf("<h2>%s</h2>\n", $contens["title"]);
				break;
			case 3:
				printf("<h3>%s</h3>\n", $contens["title"]);
				break;
		}
		printf("<div>%s</div>\n", date("Y-m-d H:i:s", strtotime($contens["date"])));
		printf("<p>%s</p>\n", $contens["value"]);

		foreach($contens["childs"] as $child){
			Self::outputContents($child);
		}
	}

}