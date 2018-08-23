<?php
require_once("PHP/Manager.php");

function isBot(){
	//return true;
	$agent = $_SERVER['HTTP_USER_AGENT'];
	if (stripos($agent, "bot") !== false)
		return true;
	if (stripos($agent, "search") !== false)
		return true;
	return false;
}

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
	$analytics = Params::getParam("Global_base_analytics", "");
	if($analytics!=""){
		$scripts .= sprintf(
			"\t<script async src=\" https://www.googletagmanager.com/gtag/js?id=%s\"></script>\n".
			"\t<script>\n".
			"\t\tAnalyticsUA = '%s';\n".
			"\t\twindow.dataLayer = window.dataLayer || [];\n".
			"\t\tfunction gtag() { dataLayer.push(arguments); }\n".
			"\t\tgtag('js', new Date());\n".
			"\t\tgtag('config', AnalyticsUA);\n".
			"\t</script>\n",
			$analytics, $analytics);
	}
	$adsense = Params::getParam("Global_base_adsense", "");
	if($adsense!=""){
		$scripts .= sprintf(
			"\t<script async src=\"//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\"></script>\n".
			"\t<script>\n".
			"\t\t(adsbygoogle = window.adsbygoogle || []).push({\n".
			"\t\tgoogle_ad_client: \"%s\",\n".
			"\t\tenable_page_level_ads: true\n".
			"\t\t});\n".
			"\t</script>\n",
			$adsense);
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
if(isBot()){
	ob_start("ob_gzhandler");
	Contents::outputPage();
}else if($result === null){
	outputFile(".index.html");
}
else{
	//Log::output(MG::getSessionHash(),$result["message"]);
	ob_start("ob_gzhandler");
	header("Access-Control-Allow-Origin: *");
	echo json_encode($result, JSON_UNESCAPED_UNICODE);
}
