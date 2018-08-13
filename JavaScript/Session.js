(function(){
	SESSION = {};
	//ローカル管理ユーザ作成
	SESSION.createLocalAdmin = function(func){
		var win = GUI.createFrameWindow();
		win.setTitle("ユーザ作成");
		win.setSize(300, 200);
		win.setPos();

		var client = win.getClient();
		client.classList.add("ParamsEditView");
		client.innerHTML =
			"<DIV><DIV><DIV><DIV>ユーザ名</DIV><input type='text'></DIV>"+
			"<DIV><DIV>パスワード</DIV><input type='password'></DIV></DIV>"+
			"<DIV><BUTTON>作成</BUTTON></DIV></DIV>";

		client.querySelector("button").addEventListener("click",function(){
			var inputs = client.querySelectorAll("input");
			ADP.exec("Session.createAdmin",inputs[0].value,inputs[1].value).on = function(value){
				if(value){
					win.close();
					SESSION.requestSession(func);
				}else{
					GUI.createMessageBox("エラー","管理者の作成に失敗");
				}
			}
		});
		return win;
	}
	//ログインウインドウの作成
	SESSION.createLoginWindow = function(func){
		var win = GUI.createFrameWindow();
		win.setTitle("ログイン");
		win.setSize(300,200);
		win.setPos();
		var client = win.getClient();
		client.classList.add("ParamsEditView");
		client.innerHTML =
			"<DIV><DIV>" +
			"<DIV><DIV>ユーザ名</DIV><input type='text'></DIV>" +
			"<DIV><DIV>パスワード</DIV><input type='password'></DIV>" +
			"</DIV>" +
			"<DIV><button class='blueButton'>ログイン</button><button class='blueButton'>ログアウト</button></DIV></DIV>";
		var input = client.querySelectorAll("input");
		input[0].focus();
		for(var i=0;i<2;i++)
			input[i].addEventListener("keydown",keydown);
		var button = client.querySelectorAll("button");
		button[0].addEventListener("click",login);
		button[1].addEventListener("click",logout);
		function keydown(e){
			if(e.keyCode == 13)
				login();
		}
		function login(e){
			var pass = CryptoJS.MD5(ADP.getSession() + CryptoJS.MD5(input[1].value).toString()).toString();
			ADP.exec("Session.requestLogin", input[0].value, pass).on =
				function(r){
					if(r == null)
						return;
					if(r.result == 0)
						return;
					sessionStorage.setItem("sessionHash",ADP.getSession());
					win.close();
					SESSION.sessionData = r;
					func(r);
				}

			if(e != null)
				e.preventDefault();
			return false;
		}
		function logout(){
			sessionStorage.removeItem("sessionHash");
			ADP.setSession(null);
			win.close();
			SESSION.requestSession(func);
			return false;
		}
	}
	//セッション情報照合と復元
	SESSION.requestSession = function (func, flag) {
		var win = GUI.createFrameWindow();
		win.setTitle("認証情報");
		win.setSize(300, 200);
		win.setPos();

		var client = win.getClient();
		client.classList.add("ParamsEditView");
		client.innerHTML = "認証確認中";

		ADP.exec("Session.requestSession").on = function (r) {
			if (r === null || r.result === 0) {
				sessionStorage.removeItem("sessionHash");
				ADP.setSession(null);
				if (flag)
					requestLogin();	//セッションに照合失敗したのでリトライ
				else
					func(null);
			} else {
				sessionStorage.setItem("sessionHash", r.sessionHash);
				ADP.setSession(r.sessionHash);
				win.close();
				if (r === null) {
					GUI.createMessageBox("エラー", "サーバ接続エラー");
					return;
				}
				if (r.result === -1) {
					GUI.createMessageBox("エラー", "SQLiteのアクセス権を確認してください");
					return;
				}
				if (r.result === -2) {
					SESSION.createLocalAdmin(func);
					return;
				}
				SESSION.sessionData = r;
				func(r);
			}
			win.close();
		};
	}
	SESSION.isAuthority = function(authority){
		if (SESSION.sessionData && SESSION.sessionData.user && SESSION.sessionData.user.groups)
			return SESSION.sessionData.user.groups.indexOf(authority) >= 0;
		return false;
	}
	SESSION.getUserName = function(){
		return SESSION.sessionData.user.name;
	}

})();
