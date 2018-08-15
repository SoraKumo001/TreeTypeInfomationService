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

	public static function JS_getTree($id=1){
		$visible = MG::isAdmin()?"":"where contents_stat=1";
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
			if($item["pid"] !== null){
				$parent = &$items[$item["pid"]];
				$parent["childs"][] = &$item;
			}
		}
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
	public static function JS_moveContents($id,$vector)
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

}