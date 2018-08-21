//エディタカスタマイズ用
function createCustomEditor(id) {
	function save(){
		mValue["date"] = (new Date(mTextDate.value + " " + mTextTime.value)).toISOString();
		mValue["title"] = mTitle.value;
		mValue["stat"] = mCheckStat.checked ? 1 : 0;
		mValue["value"] = editor.getHtml();
		ADP.exec("Contents.updateContents",
			mValue["id"], mValue["stat"], mValue["date"],mValue["type"],
			mValue["title_type"], mValue["title"], mValue["value"]).on = function(flag){
				if(flag){
					Contents.updateContents(mValue);
				}
			}
	}
	function onDropFile(e) {
		e.preventDefault();
		upload(e.dataTransfer.files);
	}

	function onPaste(e) {
		upload(e.clipboardData.files);
	}
	function upload(files) {
		if (files.length > 0) {
			var id = mValue["id"];
			var dir = AFL.sprintf("/Contents/%04d/%02d", Math.floor(id / 100) * 100, id % 100);

			//ファイル名の修正
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				s = file.name.split(/(?=\.[^.]+$)/);
				var name = s[0] + (new Date).getTime();
				if (s[1] != null)
					name += s[1];
				file.name2 = name;
			}
			ADP.exec("Files.createDir",1,dir).on = function (r) {
				if (r != null && r.value) {
					GUI.uploadFiles(r.value, files, onComplete);
				}
			}
		}
	}
	function openFileView() {
		var id = mValue["id"];
		var dir = AFL.sprintf("/Contents/%04d/%02d", Math.floor(id / 100) * 100, id % 100);
		var values = {
			"command": "createDir", "sessionHash": sessionStorage.getItem("sessionHash"),
			"parent": 1, "name": dir
		};

		AFL.sendJson(SCRIPT_URL, values, function (r) {
			if (r != null && r.value) {
				var file = createFileWindow(r.value);
				file.addEvent("itemClick", onFile);
			}
		});
	}
	function onComplete(files) {
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var id = file.id;
			var s;
			if (file.type.indexOf("image") != -1){
				var node = editor.createElement("img");
				node.style.maxWidth = "640px";
				node.src = '?command=Files.download&id=' + id;
				editor.insertNode(node);
			}else{
				s = AFL.sprintf("<a href='?command=Files.download&id=%d'>%s</a>", file.id, file.name);
				editor.sendCommand('insertHTML', false, s);
			}
		}
	}

	function openFileView() {
		var id = mValue["id"];
		var dir = AFL.sprintf("/Contents/%04d/%02d", Math.floor(id / 100) * 100, id % 100);
		ADP.exec("Files.createDir",1,dir).on = function (r) {
			if (r.value) {
				var file = createFileWindow(r.value);
				file.addEvent("itemClick", onFile);
			}
		}
	}
	function onFile(e) {
		//FileViewのオープン動作を抑制
		e.open = false;
		var id = e.value["id"];
		var name = e.value["name"];

		var ext = name.split('.');
		var type = "";
		if (ext.length > 1) {
			type = ext[ext.length - 1].toLowerCase();
		}
		var g = ["jpg", "jpeg", "png", "svg"];
		var flag = false;
		for (var index in g) {
			if (type == g[index]) {
				flag = true;
				break;
			}
		}
		var s;
		if (flag){
			var node = editor.createElement("img");
			node.style.maxWidth = "640px";
			node.src = '?command=Files.download&id='+id;
			editor.insertNode(node);
		}else{
			s = AFL.sprintf("<a href='?command=Files.download&id=%d'>%s</a>", id, name);
			editor.sendCommand('insertHTML', false, s);
		}
	}

	function preview(){
		mValue["date"] = (new Date(mTextDate.value + " " + mTextTime.value)).toISOString();
		mValue["title"] = mTitle.value;
		mValue["stat"] = mCheckStat.checked?1:0;
		mValue["value"] = editor.getHtml();
		Contents.updateContents(mValue);
	}
	function del(){
		var id = mValue["id"];
		Contents.deleteContents(id);
	}
	function onContentsDelete(e){
		if (e.id == mValue["id"])
			editor.close();
	}

	var TITLE_TYPE = ["表示無", "表示大", "表示中", "表示小"];
	var STAT_TYPE = ["仮状態","非表示","表示"];
	var PAGE_TYPE = ["PAGE","TEXT","UPDATE"];
	var mValue;
	var editor = createTextEditor();	//テキストエディタの作成
	editor.setSize(1000, 600);			//サイズの指定
	editor.setPos();					//位置を中央に設定
	editor.addEvent("close",function(){
		Contents.delEditor(editor);
	});
	Contents.addEditor(editor);
	editor.getId = function(){
		return mValue["id"];
	}

	//editor.setHtml(node.innerHTML);		//nodeの内容をエディタに設定

	//コントロールパネル作成(エディタのカスタマイズ)
	var panel = editor.getStdPanel();
	panel.addButton("FILE",function(){
		openFileView();
	});

	var panel = editor.addPanel();
	panel.getClient().innerHTML =
		"<button>保存</button><button>プレビュー</button><span>表示<input type='checkbox'/></span>" +
		"<span>日付<input/></span><span>時間<input/></span> <button>削除</button>";
	panel.setSortZ(1);					//パネルを一番上に
	var button = panel.getClient().querySelectorAll("button");
	//保存処理
	button[0].addEventListener("click",save);
	button[1].addEventListener("click", preview);
	button[2].addEventListener("click", del);
	//入力用インスタンスの取得
	var input = panel.getClient().querySelectorAll("input");
	mCheckStat = input[0];
	mTextDate = input[1];
	mTextTime = input[2];
	mTextDate.addEventListener("click", function () {
		var cal = createCalendar();
		cal.setPos();
		cal.addEvent("clickDay", function (e) {
			mTextDate.value = e.date.toLocaleDateString();
			cal.close();
		});
	});

	var panel = editor.addPanel();
	panel.getClient().innerHTML =
		"<button>タイプ</button><button>タイプ</button><input class='title'>";
	panel.setSortZ(1);					//パネルを一番上に
	input = panel.getClient().querySelectorAll("input");
	mTitle = input[0];

	button = panel.getClient().querySelectorAll("button");
	//ページタイプ
	mType = button[0];
	mType.addEventListener("click", function () {
		var select = GUI.createSelectView();
		for (var i = 0; i < PAGE_TYPE.length; i++)
			select.addText(PAGE_TYPE[i]);
		select.show(this);
		select.addEvent("select", function (e) {
			mType.textContent = e.value;
			mValue["type"] = e.value;
		});
	});

	//タイトルタイプ
	mTitleType = button[1];
	mTitleType.addEventListener("click", function () {
		var select = GUI.createSelectView();
		for(var i=0;i<TITLE_TYPE.length;i++)
			select.addText(TITLE_TYPE[i], i);
		select.show(this);
		select.addEvent("select",function(e){
			mTitleType.textContent = TITLE_TYPE[e.value];
			mValue["title_type"] = e.value;
		});
	});

	var panelStat = editor.addPanel();
	panelStat.setChildStyle("bottom");

	editor.getHtmlBox().addEventListener("drop", onDropFile);
	editor.getHtmlBox().addEventListener("paste", onPaste);

	if(id!=null){
		ADP.exec("Contents.getContents",id).on = function(value){
			if (value == null)
				return;
			mValue = value;
			mCheckStat.checked = value['stat']!==0;
			mType.innerHTML = value['type'];
			var date = new Date(value["date"]);
			mTextDate.value = date.toLocaleDateString();
			mTextTime.value = date.toLocaleTimeString();
			mTitle.value = value["title"];
			mTitleType.textContent=TITLE_TYPE[value["title_type"]];
			editor.setHtml(value["value"]);

			var date = new Date(value["update"]);
			panelStat.getClient().textContent = AFL.sprintf("ID:%s PID:%d STAT:%s UPDATE:%s",
				value["id"], value["pid"], STAT_TYPE[value["stat"] + 1], date.toLocaleString());
		}
	}
}