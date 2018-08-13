<?php
class Database{
	private $mDB;
	private $mErrorProc;
	public function _connect($driver,$server,$user,$pass,$dbname){
		try{
		if($server == null || $server=="")
			$this->mDB = new PDO("$driver:dbname=$dbname", $user, $pass);
		else
			$this->mDB = new PDO("$driver:host=$server;dbname=$dbname", $user, $pass);
		if(!$this->mDB)
			return false;
		$this->mDB->setAttribute(PDO::ERRMODE_WARNING, PDO::ERRMODE_EXCEPTION);
		$this->mDB->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		return true;
		}catch(Exception $e){
			return false;
		}
	}
	public function _connect2($str){
		try{
			$this->mDB = new PDO($str);
			if(!$this->mDB)
				return false;
			$this->mDB->setAttribute(PDO::ERRMODE_WARNING, PDO::ERRMODE_EXCEPTION);
			$this->mDB->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			return true;
		}catch(Exception $e){
			return false;
		}
	}
	public function isConnect(){
		return $this->mDB !== null;
	}
	public function setOnError($proc){
		$this->mErrorProc = $proc;
	}
	public function getHandle(){
		return $this->mDB;
	}
	public function close(){
		$mDB = null;
	}
	public function createUpdateParam($array,$keys){
		$param = "";
		foreach($array as $key => $value){
			//プライマリキーを除外
			if(isset($keys[$key]))
				continue;
			if(strlen($param)>0)
				$param .=",";
			$param .= sprintf("%s=%s",$key,$value!=null?$this->quote($value):'null');
		}
		return $param;
	}
	public function createNameParam($array){
		$param = "";
		foreach($array as $key => $value){
			if(strlen($param)>0)
				$param .=",";
			$param .= $key;
		}
		return $param;
	}
	public function createValueParam($array){
		$param = "";
		foreach($array as $key => $value){
			if(strlen($param)>0)
				$param .=",";
			$param .= $value!=null?$this->quote($value):'null';
		}
		return $param;
	}
	public function createKeyParam($values,$keys){
		$param = "";
		foreach($keys as $key){
			if(strlen($param)>0)
				$param .=" and ";
			$param .= sprintf("%s=%s",$key,$values[$key]!=null?$this->quote($values[$key]):'null');
		}
		return $param;
	}
	public function quote($value){
		return $this->mDB->quote($value);
	}
	public function gets($sql,...$params){
		$stmt =	$this->query($sql,...$params);
		if($row=$stmt->fetch(PDO::FETCH_ASSOC))
			return $row;
		return null;
	}
	public function gets2($sql,...$params){
		$stmt =	$this->query($sql,...$params);
		if($row=$stmt->fetch(PDO::FETCH_NUM))
			return $row;
		return null;
	}
	public function get($sql,...$params){
		$stmt =	$this->query($sql,...$params);
		if($stmt !== null &&$row=$stmt->fetch(PDO::FETCH_NUM))
			return $row[0];
		return null;
	}
	public function query($sql,...$params){
		try{
			if($this->mDB === null)
				return false;
			$stmt = $this->mDB->prepare($sql);
			if($params !== null){
				foreach($params as $index => $param){
					$type = gettype($param) ;
					if($type == "resource")
						$stmt->bindValue($index+1,$param,PDO::PARAM_LOB);
					else if($type == "date")
						$stmt->bindValue($index+1,$param,PDO::PARAM_STR);
					else
						$stmt->bindValue($index+1,$param);
				}
			}
			$stmt->execute();
			if($this->mDB->errorInfo()[0] != 0){
				if($mErrorProc !== null)
					call_user_func($mErrorProc, $this->mDB->errorInfo()[0],$sql);
			}
			return $stmt;
		}catch(PDOException $exception){
			//if($this->mErrorProc !== null)
				//call_user_func($this->mErrorProc,  $exception->getMessage(),$sql);
		}
		return null;
	}
	public function execute($sql){
		try{
			$stmt = $this->mDB->exec($sql);
			if($params !== null){
				foreach($params as $index => $param){
				if(gettype($param) == "resource")
					$stmt->bindValue($index+1,$param,PDO::PARAM_LOB);
				else
					$stmt->bindValue($index+1,$param);
				}
			}
			$stmt->execute();
			return $stmt->rowCount();
		}catch(PDOException $exception){
			if($this->mErrorProc !== null)
				call_user_func($this->mErrorProc,  $exception->getMessage(),$sql);
		}
		return null;
	}
	public function exec($sql,...$params){
		try{
			if($this->mDB === null)
				return false;
			if($params !== null && count($params)){
				$stmt = $this->mDB->prepare($sql);
				foreach($params as $index => $param){
				if(gettype($param) == "resource")
					$stmt->bindValue($index+1,$param,PDO::PARAM_LOB);
				else
					$stmt->bindValue($index+1,$param);
				}
				$stmt->execute();
				return $stmt->rowCount();
			}else
				return $this->mDB->exec($sql);

		}catch(PDOException $exception){
			if($this->mErrorProc !== null){
				//call_user_func($this->mErrorProc,  $exception->getMessage(),$sql);
			}
		}
		return null;
	}
	public function replace($table,$keys,$values){
		$strKey = $this->createKeyParam($values,$keys);
		$names = $this->createNameParam($values);
		$updates = $this->createUpdateParam($values,$keys);
		$values = $this->createValueParam($values);

		$sql = sprintf("update %s set %s where %s;",$table,$updates,$strKey);
		$count = $this->exec($sql);
		if($count > 0)
			return $count;
		$sql = sprintf("insert into %s(%s) select %s where not exists (select 1 from %s where %s);",
			$table,$names,$values,$table,$strKey);
		return $this->exec($sql);
	}


	public function isSequence($name){
		$sql = sprintf("SELECT c.relname FROM pg_class c LEFT join pg_user u ON c.relowner = u.usesysid WHERE c.relkind = 'S' and c.relname=%s",
			$this->mDB->quote($name));
		$stmt = $this->query($sql);
		return $stmt->fetch(PDO::FETCH_NUM)!=null;
	}
	public function queryFormatData(){
		$args = func_get_args();
		$vargs = array_slice($args,1);
		$sql = vsprintf($args[0],$vargs);
		return $this->queryData($sql);
	}
	public function queryData($sql,...$params){
		$stmt = $this->query($sql,...$params);
		if($stmt == null)
			return null;
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}
	public function queryData2($sql,...$params){
		$stmt = $this->query($sql,...$params);
		if($stmt == null)
			return null;
		//データの取得
		$datas = Array();
		while($row=$stmt->fetch(PDO::FETCH_NUM))
		{
			$datas[] = $row;
		}
		return $datas;
	}
}