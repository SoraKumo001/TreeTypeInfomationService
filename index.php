<?php
require_once("PHP/Manager.php");

function isBot(){
	//return true;
	$agent = $_SERVER['HTTP_USER_AGENT'];
	//if (stripos($agent, "bot") !== false)
	//	return true;
	//if (stripos($agent, "search") !== false)
	//	return true;
	if (stripos($agent, "facebookexternalhit") !== false)
		return true;
	return false;
}

function outputScript($path,&$links,$type){
	//JavaScriptを自動的に出力
	$files = scandir(dirname(__FILE__) . "/" . $path);
	$scripts = "";
	foreach ($files as $file) {
		$name = explode(".", $file, 2);
		if (count($name) === 2 && $name[1] === $type) {
			$date = date ("YmdHis", filemtime("$path/$file"));
			if($type === 'js'){
			//	$scripts .= "\t<link rel='preload' as='script' href='$path/$file?ver=$date'>\n";
				$scripts .= "\t<script type='text/javascript' src='$path/$file?ver=$date'></script>\n";
			}else{
			//	$scripts .= "\t<link rel='preload' as='style' href='$path/$file?ver=$date'>\n";
				$scripts .= "\t<link rel='stylesheet' href='$path/$file?ver=$date'>\n";
			}
			$links[] = "$path/$file?ver=$date";
		}
	}
	return $scripts;
}


function outputFile($fileName){
	$links = [];
	$scripts = outputScript("css", $links, "css");
	$scripts .= outputScript("JavaScript/include", $links,'js');
	$scripts .= outputScript("JavaScript", $links,'js');

	foreach ($links as $link) {
		header("link: <$link>;rel=preload;as=script;", false);
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
	//パンくずリスト
	$scripts .= "\t".Contents::getBreadcrumb()."\n";
	//正規URL
	$scripts .= "\t" . Contents::getCanonical()."\n";
	$title = Contents::getTitle();
	//圧縮
	//ob_start("ob_gzhandler");
	// Last-modified と ETag 生成
	$last_modified = gmdate( "D, d M Y H:i:s T", filemtime($fileName) );
	$etag = md5( $last_modified.$fileName);
	// ヘッダ送信
	header( "Last-Modified: {$last_modified}" );
	header( "Etag: {$etag}" );
	$contents = file_get_contents($fileName);
	$contents = str_replace("[[SCRIPTS]]",$scripts,$contents);
	echo str_replace("[[TITLE]]",$title,$contents);
}

$result = MG::init();
if(isBot()){
	//ob_start("ob_gzhandler");
	Contents::outputPage();
}else if($result === null){
	outputFile(".index.html");
}
else{
	//Log::output(MG::getSessionHash(),$result["message"]);
	//ob_start("ob_gzhandler");
	header("Content-type: application/json");
	header("Access-Control-Allow-Origin: *");
	echo json_encode($result, JSON_UNESCAPED_UNICODE);
}
