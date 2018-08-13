//=========================================================
//JavaScript基本ファイル
//作成 Akihiko Oikawa
//========================================================
(function () {
	//名前空間の定義
	AFL = {}
	//ファイルのインポート
	AFL.importJS = function (url) {
		if (typeof (importJS.IMPORTS) == 'undefined')
			importJS.IMPORTS = new Array();
		if (importJS.IMPORTS[url] == null) {
			var scCode = getHttpText(url);
			if (scCode) {
				var sc = document.createElement('SCRIPT');
				sc.text = scCode;
				document.body.appendChild(sc);
			}
			importJS.IMPORTS[url] = true;
		}
	}
	//HTMLデータをテキストに変換
	AFL.htmlToText = function (s) {
		var dumy = document.createElement("span");
		dumy.innerHTML = s;
		return dumy.firstChild.nodeValue;
	}
	//---------------------------------------
	//書式付文字列生成
	//	引数	format,・・・
	//	戻り値	生成文字列
	AFL.sprintf = function () {
		var args = AFL.sprintf.arguments;
		return AFL.vsprintf(args);
	}
	//---------------------------------------
	//書式付文字列生成
	//	引数	args	配列[書式,引数1,,引数2・・・]
	AFL.vsprintf = function (args) {
		if (args[0] == null)
			return '';
		var format = args[0];
		var paramIndex = 1;
		var dest = "";
		for (var i = 0; format.charAt(i) ; i++) {
			if (format.charAt(i) == '%') {
				var flagZero = false;
				var num = 0;
				i++;
				if (format.charAt(i) == '0') {
					flagZero = true;
					i++
				}
				for (; format.charAt(i) >= '0' && format.charAt(i) <= '9'; i++) {
					num *= 10;
					num += parseInt(format.charAt(i));
				}
				switch (format.charAt(i)) {
					case 's':
						var work = String(args[paramIndex++]);
						var len = num - work.length;
						dest += work;
						var len = num - work.length;
						if (len > 0) {
							for (j = 0; j < len; j++)
								dest += ' ';
						}
						break;
					case 'd':
						var work = String(args[paramIndex++]);
						var len = num - work.length;
						if (len > 0) {
							var j;
							var c;
							if (flagZero)
								c = '0';
							else
								c = ' ';
							for (j = 0; j < len; j++)
								dest += c;
						}
						dest += work;
				}
			}
			else
				dest += format.charAt(i);
		}
		return dest;
	}

	//---------------------------------------
	//文字列の置換
	//	引数	src		元文字列
	//			datas	data[置換元] = 置換後
	//	戻り値	生成文字列
	function replaceText(src, datas) {
		var dest = new String();
		var i;
		var length = src.length;
		var flag;
		for (i = 0; i < length; i++) {
			flag = true;
			for (index in datas) {
				var data = datas[index];
				if (src.substr(i, index.length).indexOf(index) == 0) {
					dest += data;
					flag = false;
					i += index.length - 1;
					break;
				}
			}
			if (flag)
				dest += src.charAt(i);
		}
		return dest;
	}

	//---------------------------------------
	//アドレスの取得、パラメータの削除
	//	引数	無し
	//	戻り値	生成文字列
	function getURL() {
		var i;
		var url = '';
		var src = document.location.href;
		for (i = 0; src.charAt(i) && src.charAt(i) != '?' && src.charAt(i) != '#'; i++)
			url += src.charAt(i);
		return url;
	}

	//---------------------------------------
	//アドレスの取得、ファイル名の削除
	//	引数	無し
	//	戻り値	生成文字列
	function getPATH() {
		var i;
		var path = document.location.href;
		var index = path.lastIndexOf("/");
		if (index >= 0)
			path = path.substring(0, index + 1);
		return path;
	}
	//---------------------------------------------------------
	//Cookie設定
	//	引数	name	名前
	//			value	値
	//	戻り値	無し
	AFL.setCookie = function (name, value) {
		if (value != null) {
			var date = new Date();
			date.setDate(date.getDate() + 30);

			document.cookie =
				encodeURI(name) + "=" + encodeURI(value) + "; expires=" + date.toGMTString() + ";path=/;";
		}
		else {
			var date = new Date();
			date.setDate(date.getDate() - 1);
			document.cookie = encodeURI(name) + "= ; expires=" + date.toGMTString() + ";";
		}
	}

	AFL.getParams = function(){
		var params = {};
		var pair=location.search.substring(1).split('&');
		for(var index in pair) {
			var value = pair[index];
			var data = value.split('=');
			params[data[0]] = data[1];
		}
		return params;
	}
	//---------------------------------------------------------
	//Cookie取得
	//	引数	name	名前
	//	戻り値	値
	AFL.getCookie = function (name) {
		//クッキー分解用
		function getCookies() {
			var dest = Array();
			var cookieData = document.cookie + ";"
			var index1 = 0;
			var index2;
			while ((index2 = cookieData.indexOf("=", index1)) >= 0) {
				var name = cookieData.substring(index1, index2);
				var value = '';
				index1 = index2 + 1;
				index2 = cookieData.indexOf(";", index1);
				if (index2 == -1)
					break;
				value = cookieData.substring(index1, index2);
				if (dest[decodeURI(name)] == undefined)
					dest[decodeURI(name)] = decodeURI(value);
				index1 = index2 + 1;
				for (; cookieData.charAt(index1) == ' '; index1++);
			}
			return dest;
		}
		var cookies = getCookies();
		return cookies[name];
	}

	//---------------------------------------------------------
	//Ajax用インスタンスの作成
	//	引数	無し
	//	戻り値	Ajax用インスタンス
	AFL.getRequest = function () {
		var xmlHttp = null;
		if (window.XMLHttpRequest) {
			xmlHttp = new XMLHttpRequest();
		}
		else if (window.ActiveXObject) {
			xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
			if (!xmlHttp)
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return xmlHttp;
	}
	//---------------------------------------------------------
	//Ajaxによるデータ送信
	//	引数	url			接続先アドレス
	//			getData		送信用GETパラメータ
	//			postData	送信用POSTパラメータ
	//			proc		送信完了後のコールバックファンクション(null可)
	//	戻り値	procがnullの場合は、同期通信後データを返す
	AFL.send = function (url, getData, postData, proc) {
		var xmlHttp = AFL.getRequest();
		var methodGET = "";
		if (getData) {
			var urlGET = url.indexOf('?');
			for (name in getData) {
				if (methodGET.length == 0 && urlGET == -1)
					methodGET += '?';
				else
					methodGET += '&';
				methodGET += encodeURIComponent(name) + '=' + encodeURIComponent(getData[name]);
			}
		}

		try {
			url += methodGET;
			if (proc == null)
				xmlHttp.open('POST', url, false);
			else {
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == 4) {
						proc(xmlHttp.responseText);
					}
				}
				xmlHttp.open('POST', url, true);
			}
			var data = new Uint8Array(postData);
			xmlHttp.send(data);
		}
		catch (e) {
			alert(e);
			alert("読み込みエラー");
			if (proc != null)
				proc(null);
			return null;
		}
		return xmlHttp.responseText;

	}
	//---------------------------------------------------------
	//Ajaxによるファイル送信
	//	引数	url			接続先アドレス
	//			getData		送信用GETパラメータ
	//			postData	送信ファイルデータ
	//			proc		送信完了後のコールバックファンクション(null可)
	//	戻り値	procがnullの場合は、同期通信後データを返す
	AFL.sendFile = function (url, getData, postData, proc,progress) {
		var xmlHttp = AFL.getRequest();
		var flag = false;
		try{
			xmlHttp.responseType = type==null?"json":type;
		}catch(e){flag=true;}

		var methodGET = "";
		if (getData) {
			var urlGET = url.indexOf('?');
			for (name in getData) {
				if (methodGET.length == 0 && urlGET == -1)
					methodGET += '?';
				else
					methodGET += '&';
				methodGET += encodeURIComponent(name) + '=' + encodeURIComponent(getData[name]);
			}
		}

		try {

			url += methodGET;

			xmlHttp.onreadystatechange = function () {
				if (xmlHttp.readyState == 4) {
					var obj = null;
					try
					{
						if(flag)
							obj = JSON.parse(xmlHttp.response);
						else
							obj = xmlHttp.response;

					} catch (e)
					{
						proc(null);
						return;
					}
					if(AFL.sendProc != null)
						AFL.sendProc(obj);
					proc(obj);
				}
			}
			if(progress != null){
				xmlHttp.upload.onprogress = function(e){
					progress(e);
				}
			}
			xmlHttp.open('POST', url, true);

			var data = new Uint8Array(postData);
			var pt = 0;
			if (sessionStorage.getItem("Session"))
			    xmlHttp.setRequestHeader("X-Session", sessionStorage.getItem("Session"));
			xmlHttp.send(data);
		}
		catch (e) {
			alert(e);
			alert("読み込みエラー");
			if (proc != null)
				proc(xmlHttp, data);
			return null;
		}
		return xmlHttp;

	}
	//---------------------------------------------------------
	//AjaxにJSONデータの送信
	//	引数	url			接続先アドレス
	//			data		送信用オブジェクト
	//			proc		送信完了後のコールバックファンクション(null可)
	//	戻り値	procがnullの場合は、同期通信後データを返す
	AFL.sendJson = function (url, data, proc,type) {
		var xmlHttp = AFL.getRequest();
		var flag = false;
		try{
			xmlHttp.responseType = type==null?"json":type;
		}catch(e){flag=true;}
		try {
			if (proc == null) {
				xmlHttp.open('POST', url, false);
				return JSON.parse(xmlHttp.responseText);
			}
			else {
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == 4) {
						var obj = null;
						try
						{
							if(flag)
								obj = JSON.parse(xmlHttp.response);
							else
								obj = xmlHttp.response;

						} catch (e)
						{
							proc(null);
							return;
						}
						if(AFL.sendProc != null)
							AFL.sendProc(obj);
						proc(obj);
					}
				}
			}
			if (data == null) {
				xmlHttp.open('GET', url, true);
				xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xmlHttp.send(null);
			}
			else {
				xmlHttp.open('POST', url, true);
				xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				if (sessionStorage.getItem("Session"))
					xmlHttp.setRequestHeader("X-Session", sessionStorage.getItem("Session"));
				xmlHttp.send(JSON.stringify(data));
			}
		}
		catch (e) {
			alert("読み込みエラー");
			proc(null);
			return null;
		}
		return null;
	}

	AFL.createAdapter = function(scriptUrl,sessionHash){
		var adapter = {"url":scriptUrl,"sessionHash":sessionHash};
		adapter.exec = function(){
			if(arguments.length == 0)
				return;
			var proc = {on:null};
			var functions = [];
			if(arguments[0] instanceof Array)
				for(var i=0;i<arguments.length;i++)
					functions.push({"function":arguments[i][0],"params":Array.prototype.slice.call(arguments[i], 1)});
			else
				functions.push({"function":arguments[0],"params":Array.prototype.slice.call(arguments, 1)});


			var values = {"command":"exec","sessionHash":adapter.sessionHash,"functions":functions};
			AFL.sendJson(this.url,values,function(r){
				if (proc.on){
					if(r === null || r.result==0)
						proc.on(null);
					else
						proc.on(functions.length==1?r.values[0]:r.values);
				}
			});
			return proc;
		}
		adapter.upload = function(){
			if (arguments.length == 0)
				return;
			var _this = this;
			var functions = [];
			functions.push({ "function": arguments[0], "params": Array.prototype.slice.call(arguments, 2) });
			var values = { "command": "exec", "sessionHash": adapter.sessionHash, "functions": JSON.stringify(functions) };
			AFL.sendFile(this.url, values, arguments[1], function (r) {
				if (_this.on) {
					if (r === null || r.result == 0)
						_this.on(null);
					else
						_this.on(functions.length == 1 ? r.values[0] : r.values);
				}
			},function(r){
				if(_this.progress)
					_this.progress(r);
			});
			this.on = null;
			this.progress = null;
			return this;
		}
		adapter.setSession = function(sessionHash){this.sessionHash=sessionHash;}
		adapter.getSession = function(){return this.sessionHash};
		return adapter;
	}
})();
