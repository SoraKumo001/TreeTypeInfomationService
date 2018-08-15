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

Contents = {events:{},editors:[],nodes:[],visible:true};
GUI.createEvent(Contents);

Contents.addEditor = function(editor){
	this.editors.push(editor);
}
Contents.delEditor = function(editor){
	var index = this.editors.indexOf(editor);
	if (index >= 0)
		this.editors.splice(index, 1);
}
Contents.createContents = function(pid,vector,type){
	ADP.exec("Contents.createContents",pid,vector,type).on = function(value){
		if (value){
			Contents.callEvent({etype:"create",value:value});
		}
	}
}
Contents.loadTitle = function(){
	ADP.exec("GParams.getParam", "base_title").on = function (value) {
		System.title = value;
		Contents.callEvent({etype:"title",title:value});
	}
}
Contents.createContentsMenu = function(id,type,node){
	var rect = node.getBoundingClientRect();
	var menu = createMenu(["兄弟(↑)", "兄弟(↓)", "子(↑)", "子(↓)"]);
	var x = rect.x + (rect.width - menu.offsetWidth) / 2;
	var y = rect.y + (rect.height - menu.offsetHeight) / 2;
	if(x < 0) x = 0;
	if(y < 0) y = 0;
	var width = GUI.getClientWidth();
	var height = GUI.getClientHeight();
	if (x + menu.offsetWidth > width)
		x = width - menu.offsetWidth;
	if (y + menu.offsetHeight > height)
		y = height - menu.offsetHeight;
	menu.style.left = x + "px";
	menu.style.top = y + "px";
	menu.addEvent("select", function (e) {
		Contents.createContents(id, e.value, type);
	});
}
Contents.updateContents = function(value){
	Contents.callEvent({ etype: "update", value:value});
}
Contents.isVisible = function () {
	return Contents.visible;
}
Contents.setVisible = function (flag) {
	Contents.visible = flag;
	Contents.nodes = [];
	Contents.loadTree();
	document.body.dataset.visible = flag;
}
Contents.moveContents = function (id, vector) {
	ADP.exec("Contents.moveContents", id, vector).on = function (flag) {
		if (flag) {
			var item = treeView.findItem(id);
			item.moveItem(vector);
			contentsMain.moveContents(id, vector);
			Contents.selectContents(id);
		}
	}
}

Contents.selectContents = function (id) {
	Contents.callEvent({etype:"select",id:id});
}
Contents.deleteContents = function (id) {
	ADP.exec("Contents.deleteContents", id).on = function (ids) {
		Contents.callEvent({etype:"delete",ids:ids});
	}
}


function createContensView(mainView){

	function setTreeItem(item, value) {
		item.setItemText(value["title"]);
		item.setItemValue(value["id"]);
		item.dataset.stat = value["stat"];
		item.dataset.type = value["type"] === "PAGE" ? "PAGE" : "TEXT";
		if (value.childs) {
			var flag = (item == treeView.getRootItem()) || item.dataset.type!=='PAGE';
			for (var i = 0; value.childs[i]; i++) {
				var child = value.childs[i];
				if (Contents.visible || child["stat"] == 1)
					setTreeItem(item.addItem("", flag), child);
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

	//管理者用編集メニュー
	if (SESSION.isAuthority("SYSTEM_ADMIN")){
		var mOptionNode = document.createElement("div");
		mOptionNode.innerHTML = "<span>🖹</span><span>🔺</span><span>🔻</span>";
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
					Contents.createContentsMenu(id,"PAGE",this);
				}
				e.preventDefault();
				//
			});
		});
		treeView.addEvent("itemOver", function (e) {
			var item = e.item;
			if (mOptionNode.parentNode != item.treeRow && mOptionNode.parentNode) {
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
	}

	Contents.addEvent("delete",function(r){
		var ids = r.ids;
		if (ids && ids.length > 0) {
			for(var i in ids){
				var id = ids[i];
				//ツリー削除処理
				var item = treeView.findItem(id);
				if(item)
					item.delItem();
			}

			//Editorクローズ処理
			for (var i = Contents.editors.length - 1; i >= 0; i--) {
				var editor = Contents.editors[i];
				if (ids.indexOf(editor.getId()) >= 0)
					editor.close();
			}
			var contents = Contents.nodes[id];
			if (contents) {
				contents.deleteContents();
			}
		}
	});
	Contents.addEvent("create", function (r) {
		var value = r.value;
		treeView.reloadTree(value.pid, value.id);
	});

	Contents.addEvent("select",function(r){
		var item = treeView.findItem(r.id);
		if (item) {
			item.select();
			item.openItem(true);
		}
	});
	Contents.addEvent("update", function (r) {
		var value = r.value;
		var item = treeView.findItem(value["id"]);
		if (item) {
			if (item.dataset.type != value["type"]) {
				treeView.reloadTree(item.getParentItem().getItemValue(), value["id"]);
			}else{
				item.setItemText(value["title"]);
				item.dataset.stat = value["stat"];
				item.dataset.visible = "true";
			}
		}
	});

	treeView.loadTree = function(){
		Contents.nodes = [];
		ADP.exec("Contents.getTree").on = function(value){
			if (value){
				treeView.clearItem();
				setTreeItem(treeView.getRootItem(), value);
			}
			goLocation();
		}
	}
	treeView.reloadTree = function (id, sid) {
		Contents.nodes = [];
		ADP.exec("Contents.getTree", id).on = function (value) {
			var item = treeView.findItem(id);
			item.clearItem();
			setTreeItem(item, value);
			if (sid !== null) {
				Contents.selectContents(sid);
			}
		}
	}
	treeView.loadTree();
	return separate;
}