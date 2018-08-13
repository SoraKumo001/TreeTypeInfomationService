//--------------------------------------------
//URLのパラメータ部分から、表示ページを切り替え
function goLocation() {
	//パラメータの読み出し
	var p = {};
	location.search.substring(1).split('&').forEach(function (v) { s = v.split('='); p[s[0]] = s[1]; });
	//指定ページに飛ぶ
	Contents.selectContents(p['p'] >= 1 ? p['p'] : 1, false);
}

//ブラウザの「戻る」「進む」ボタンが押された場合のイベント処理
addEventListener('popstate', function () { goLocation(); }, false);

Contents = {events:{},editors:[],nodes:[]};

Contents.callEvent = function (e) {
	var eventList = Contents.events[e.etype];
	if (eventList) {
		for (var i = 0; i < eventList.length; i++)
			eventList[i].call(this, e);
	}
}
Contents.addEvent = function (name, func) {
	var eventList = Contents.events[name];
	if (!eventList) {
		eventList = [];
		Contents.events[name] = eventList;
	}
	eventList.push(func);
}
Contents.delEvent = function (name, func) {
	var eventList = Contents.events[name];
	if (!eventList)
		return;
	var index = eventList.indexOf(func);
	if (index  >= 0)
		eventList.splice(index, 1);
}
Contents.addEditor = function(editor){
	this.editors.push(editor);
}
Contents.delEditor = function(editor){
	var index = this.editors.indexOf(editor);
	if (index >= 0)
		this.editors.splice(index, 1);
}
Contents.createContents = function(pid,vector,type){
	ADP.exec("Contents.createContents",pid,vector,type).on = function(id){
		if(id){
			Contents.reloadTree(pid,id);
			Contents.selectContents(id);
		}
	}
}

Contents.updateContents = function(value){
	var id = value["id"];
	var contents = Contents.nodes[id];
	if(contents){
		contents.updateContents(value);
	}
	Contents.updateTitle(value["id"],value["title"]);
}
function createContensView(mainView){
	Contents.updateTitle = function(id,title){
		var item = treeView.findItem(id);
		if(item){
			item.setItemText(title);
			//item.select();
		}
	}
	Contents.moveContents = function (id, vector) {
		ADP.exec("Contents.moveContents", id, vector).on = function (flag) {
			if (flag) {
				var item = treeView.findItem(id);
				item.moveItem(vector);
				Contents.selectContents(id);
			}
		}
	}
	Contents.reloadTree = function(id,sid){
		ADP.exec("Contents.getTree",id).on = function (value) {
			var item = treeView.findItem(id);
			item.clearItem();
			setTreeItem(item, value);
			if(sid !== null){
				Contents.selectContents(sid);
			}
		}
	}
	Contents.selectContents = function(id){
		var item = treeView.findItem(id);
		if(item){
			item.select();
			item.openItem(true);
		}
	}
	Contents.deleteContents = function(id){
		ADP.exec("Contents.deleteContents", id).on = function (ids) {
			if (ids && ids.length > 0) {
				//ツリー削除処理
				var item = treeView.findItem(id);
				var parent = item.getParentItem();
				if (parent){
					parent.select();
					item.delItem();
				}else{
					item.clearItem();
					item.select();
				}
				//Editorクローズ処理
				for (var i = Contents.editors.length-1;i>=0;i--){
					var editor = Contents.editors[i];
					if(ids.indexOf(editor.getId()) >= 0)
						editor.close();
				}

				//Contents.callEvent({etype:"deleteContents",id:id});
			}
		}


	}
	function setTreeItem(item, value) {
		item.setItemText(value["title"]);
		item.setItemValue(value["id"]);
		item.dataset.type = value["type"] === "PAGE"?"PAGE":"TEXT";
		if (value.childs) {
			var flag = item == treeView.getRootItem();
			for (var i = 0; value.childs[i]; i++) {
				setTreeItem(item.addItem("",flag), value.childs[i]);
			}
		}
	}


	mainView.removeChildAll();
	//画面分割(横)
	var separate = GUI.createSeparate(300, "we");
	mainView.addChild(separate, "client");

	var contentsMain = createContentsView();
	separate.addSeparateChild(1, contentsMain, "client");

	var treeView = GUI.createTreeView();
	separate.addSeparateChild(0,treeView,"client");
	treeView.addEvent("select", function (r) {
		var id = treeView.getSelectValue();

		var p = {};
		location.search.substring(1).split('&').forEach(function (v) { s = v.split('='); p[s[0]] = s[1]; });
		var p = p["p"] ? p["p"]:1;
		if(p != id){
			//URLの書き換え
			history.pushState(null, null, "?p=" + id);
		}

		//親アイテムも含めて展開
		var item = treeView.getSelectItem();
		do{
			item.openItem(true);
		}while(item = item.getParentItem());
		//コンテンツの読み出し
		contentsMain.loadContents(id);
	});
	var mOptionNode = document.createElement("div");
	mOptionNode.innerHTML = "<span>🔺</span><span>🔻</span><span>🖹</span>";
	mOptionNode.className = "TreeOption";
	var options = mOptionNode.querySelectorAll("span");
	options.forEach(o => {
		o.addEventListener("click",function(e){
			var id = this.parentNode.item.getItemValue();
			var vector = 2;
			if (this.textContent == '🔺')
				Contents.moveContents(id, -1);
			else if (this.textContent == '🔻')
				Contents.moveContents(id, 1);
			else{
				var rect = this.getBoundingClientRect();
				var menu = createMenu(["兄弟(↑)","兄弟(↓)","子(↑)","子(↓)"]);
				menu.style.left = rect.x + (rect.width - menu.offsetWidth)/2+"px";
				menu.style.top = rect.y + (rect.height - menu.offsetHeight) / 2 + "px";
				menu.addEvent("select",function(e){
					Contents.createContents(id, e.value, 'PAGE');
				});
			}
			e.preventDefault();
			//
		});
	});


	treeView.addEvent("itemOver",function(e){
		var item = e.item;
		if (mOptionNode.parentNode != item.treeRow && mOptionNode.parentNode){
			mOptionNode.parentNode.removeChild(mOptionNode);
		}
		item.treeRow.appendChild(mOptionNode);
		mOptionNode.item = item;
	});
	treeView.addEvent("itemLeave", function (e) {
		if (mOptionNode.parentNode) {
			mOptionNode.parentNode.removeChild(mOptionNode);
		}
	 });

	function loadTree(){
		ADP.exec("Contents.getTree").on = function(value){
			if (value){
				treeView.clearItem();
				setTreeItem(treeView.getRootItem(), value);
			}
			goLocation();
		}
	}
	loadTree();
	return separate;
}