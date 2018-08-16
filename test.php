<?php
header("content-type: text/plain");
$str = '"このサイトは、技術系のネタを取り扱っていきます。\n<div><br>\n</div>\n<div><img src="?command=Files.download&amp;id=13" style="max-width: 640px;"><br>\n</div>"';
$convertSrc[] = sprintf('/src="\?command=Files\.download&amp;id=%d"/', 13);
$convertDest[] = sprintf('/src="\?command=Files\.download&amp;id=%d"/', 100);
echo preg_replace($convertSrc, $convertDest, $str);
