<?php
require_once("PHP/Manager.php");


function outputFile($fileName){
	//JavaScriptを自動的に出力
	$files = scandir(dirname(__FILE__)."/JavaScript");
	$scripts = "";
	foreach($files as $file){
		$name = explode(".",$file,2);
		if(count($name) === 2 && $name[1] === "js"){
			$scripts .= "\t<script type='text/javascript' src='JavaScript/$file'></script>\n";
		}
	}
	//圧縮
	ob_start("ob_gzhandler");
	// Last-modified と ETag 生成
	$last_modified = gmdate( "D, d M Y H:i:s T", filemtime($fileName) );
	$etag = md5( $last_modified.$fileName);
	// ヘッダ送信
	header( "Last-Modified: {$last_modified}" );
	header( "Etag: {$etag}" );
	$contents = file_get_contents($fileName);
	echo str_replace("[[SCRIPTS]]",$scripts,$contents);
}

$result = MG::init();
if($result === null){
	outputFile(".index.html");
}
else{
	//Log::output(MG::getSessionHash(),$result["message"]);
	ob_start("ob_gzhandler");
	header("Access-Control-Allow-Origin: *");
	echo json_encode($result, JSON_UNESCAPED_UNICODE);
}
