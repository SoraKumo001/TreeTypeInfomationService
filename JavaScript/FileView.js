
GUI.uploadFiles = function(id,files,proc){
	var winMsg = GUI.createFrameWindow();
	winMsg.setOrderTop(true);
	winMsg.setSize(400, 200);
	winMsg.setPos();
	winMsg.setTitle("転送状況");
	winMsg.addEvent("close",function(){
		for (var i = 0; i < files.length; i++){
			var file = files[i];
			if(file.req != null)
				file.req.abort()
		}
	});

	var list = [];
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		var reader = new FileReader();
		reader.file = file;
		reader.pid = id;

		var msg = document.createElement("div");
		msg.textContent = file.name + " 転送開始";
		winMsg.getClient().appendChild(msg);
		file.msg = msg;

		winMsg.addEvent("close",function(){
			if(proc != null)
				proc(list);
		});

		reader.onload = function (evt) {
			var file = this.file;
			var req = ADP.upload("Files.uploadFile", evt.target.result, this.pid, file.name2 != null ? file.name2 : file.name);
			req.on = function(r){
				if (r == null || r.result != 1) {
					file.msg.textContent = file.name + " 転送エラー";
				}
				else  {
					file.id = r.value;
					list.push(file);
					file.msg.textContent = file.name + " 転送完了";
					if(list.length == list.length){
						winMsg.close();
					}
				}
			}
			req.progress = function(e){
				file.msg.textContent = file.name + " " + e.loaded  + "/" + e.total ;
			};
		}
		reader.readAsArrayBuffer(reader.file);
	}
}

function createFileWindow(openId){
	function createDir(){
		var item = tree.getSelectItem();
		if(item === null)
			return;

		//フォルダ名作成処理
		var count = item.getChildCount();
		var name = "新規フォルダ";
		var name2 = name;
		for(var j=0;j<100;j++){
			var flag = true;
			for(var i=0;i<count && flag;i++)
				if(name2 == item.getChild(i).getItemText())
					flag = false;
			if(flag)
				break;
			name2 = AFL.sprintf("%s(%d)", name, j);
		}
		//フォルダの作成
		ADP.exec("Files.createDir", item.getItemValue(),name2).on=function(r){
			if(r != null && r.result == 1){
				win.loadTree();
			}
		}
	}
	function deleteDir(){
		var id = tree.getSelectValue();
		if(id === null)
			return;

		ADP.exec("Files.deleteFile",id).on=function(r){
			if(r != null && r.result == 1){
				win.loadTree();
			}
		}
	}
	function editDir(){
		var item = tree.getSelectItem();
		if(item < 0)
			return;
		var area = item.getItemArea();
		var edit = GUI.createEditView();
		edit.addEvent("enter",function(e){
			ADP.exec("Files.setFileName", item.getItemValue(), e.value).on=function(r){
				if(r != null && r.result){
					item.setItemText(e.value);
				}
			}
		});
		edit.setText(item.getItemText());
		edit.setSize(Math.max(area.width,100),area.height);
		edit.setPos(area.x,area.y);
		edit.setOrderSystem(true);
		edit.setFocus();
	}
	function editFile(){
		var index = list.getSelectIndex();
		if(index < 0)
			return;
		var area = list.getItemArea(index,1);
		var edit = GUI.createEditView();
		edit.addEvent("enter",function(e){
			ADP.exec("Files.setFileName", list.getItemValue(index)["id"], e.value).on=function(r){
				if(r != null && r.result){
					list.setItem(index,1,e.value);
				}
			};
		});
		edit.setText(list.getItemText(index,1));
		edit.setSize(Math.max(area.width,100),area.height);
		edit.setPos(area.x,area.y);
		edit.setOrderSystem(true);
		edit.setFocus();
	}
	function deleteFile(){
		var values = list.getSelectValues();
		if(values.length == 0)
			return;

		var ids = [];
		for(var index in values){
			var value = values[index];
			ids.push(value["id"]);
		}
		ADP.exec("Files.deleteFiles", ids).on=function(r){
			if(r != null && r.result == 1){
				win.loadTree();
				//win.loadFile();
			}
		};
	}
	function uploadFile(){
		var input = document.createElement("input");
		input.type = "file";
		input.multiple="multiple"
		input.addEventListener("change",function(e){
			uploadFiles(this.files);
		});
		input.click();

	}

	var win= GUI.createFrameWindow();
	win.setTitle("ファイル");
	win.setSize(800,600);
	win.setPos();

	var separate = GUI.createSeparate();
	win.addChild(separate,"client");
	separate.setSeparatePos(200);

	var tree = GUI.createTreeView();
	separate.addSeparateChild(0,tree,"client");

	tree.addEvent("select",function(){
		win.loadFile();
	});

	var dirPanel = GUI.createPanel();
	separate.addSeparateChild(0,dirPanel,"bottom");
	var buttonNew = document.createElement("button");
	buttonNew.textContent = "新規";
	buttonNew.addEventListener("click",createDir);
	dirPanel.getClient().appendChild(buttonNew);
	var buttonDel = document.createElement("button");
	buttonDel.textContent = "削除";
	buttonDel.addEventListener("click",deleteDir);
	dirPanel.getClient().appendChild(buttonDel);
	var buttonEdit = document.createElement("button");
	buttonEdit.textContent = "編集";
	buttonEdit.addEventListener("click",editDir);
	dirPanel.getClient().appendChild(buttonEdit);

	var filePanel = GUI.createPanel();
	separate.addSeparateChild(1,filePanel,"bottom");
	var buttonNew = document.createElement("button");
	buttonNew.textContent = "アップ";
	buttonNew.addEventListener("click",uploadFile);
	filePanel.getClient().appendChild(buttonNew);
	var buttonDel = document.createElement("button");
	buttonDel.textContent = "削除";
	buttonDel.addEventListener("click",deleteFile);
	filePanel.getClient().appendChild(buttonDel);
	var buttonEdit = document.createElement("button");
	buttonEdit.textContent = "編集";
	buttonEdit.addEventListener("click",editFile);
	filePanel.getClient().appendChild(buttonEdit);

	var list = GUI.createListView();
	separate.addSeparateChild(1,list,"client");

	list.addHeader("*",40);
	list.addHeader("名前",200);
	list.addHeader("サイズ",100);
	list.addHeader("日時",180);

	list.addEventListener("drop",onDropFile);
	list.ondragover = function (e) {
		e.preventDefault();
	}
	function uploadFiles(files){
		var id = tree.getSelectValue();
		if(id === null)
			return;
		GUI.uploadFiles(id,files,onComplete);

		function onComplete(){
			win.loadFile();
		}
	}

	function setTreeData(item,value){
		item.setItemText(value.name);
		item.setItemValue(value.id);
		for(var i=0;i<value.childs.length;i++){
			var child = value.childs[i];
			setTreeData(item.addItem("123"),child);
		}
	}
	function onDropFile(e){
		e.preventDefault();
		uploadFiles(e.dataTransfer.files);
	}
	function onPaste(e){
		e.preventDefault();
		uploadFiles(e.clipboardData.files);
	}
	function onFileClick(e){
		var index = e.itemIndex;
		var value = list.getItemValue(index);
		if(value["kind"] == 0)
			tree.setSelectValue(value["id"]);
		else{
			var e = {"etype":"itemClick","value":value,"open":true};
			win.callEvent(e);
			if(e.open)
				window.open("?command=Files.download&id="+value["id"]);
		}
	}
	list.addEvent("itemDblClick",onFileClick);
	win.loadTree = function(id){
		tree.clearItem();
		var select = id===null?tree.getSelectValue():id;
		var items = tree.getOpenValues();
		ADP.exec("Files.getDirList").on = function(r){
			if(r != null && r.result == 1){
				var value = r.value;
				var item = tree.getRootItem();
				setTreeData(item,value);
				tree.getOpenValues(items);
				tree.setSelectValue(select==null?1:select);
			}
		}
	}
	win.loadFile = function(){
		list.clearItem();
		var select = tree.getSelectValue();
		if(select == null)
			return;
		ADP.exec("Files.getFileList", select).on = function(r){
			list.clearItem();
			if(r != null && r.result == 1){
				for(var i=0;i<r.values.length;i++){
					var value = r.values[i];
					var item = document.createElement("div");
					if(value["kind"] == 0)
						item.className = "Folder";
					else
						item.className = "File";
					var index = list.addItem(item);
					list.setItemValue(index,value);
					list.setItem(index,1,value["name"]);
					list.setItem(index,2,value["size"]);
					var d = (new Date(value["date"])).toLocaleString();
					list.setItem(index,3,d);
				}
			}
		}
	}
	win.addEventListener("paste",onPaste);
	win.loadTree(openId);
	return win;
}