function createUserView(){
	var win = GUI.createWindow();

	if(!SESSION.isAuthority('SYSTEM_ADMIN')){
		GUI.createMessageBox("エラー","権限がありません",["OK"]);
		return win;
	}

	var separate = GUI.createSeparate(400,"ns");
	win.addChild(separate,"client");


	var panel = GUI.createPanel();
	separate.getChild(0).addChild(panel,"top");
	panel.getClient().innerHTML = "ユーザ設定 <BUTTON>追加</BUTTON><BUTTON>削除</BUTTON>";

	var buttons = panel.getClient().querySelectorAll("button");
	for(var i=0;i<buttons.length;i++){
		buttons[i].addEventListener("click",onButtonClick);
	}
	function onButtonClick(e){
		switch(e.srcElement.textContent){
			case "追加":
				ADP.exec("Users.addUser").on = function(r){
					if(r)
						win.loadUser();
				}
				break;
			case "削除":
				var index = listView.getSelectIndex();
				var id = listView.getItemText(index,0);
				ADP.exec("Users.delUser",id).on = function(r){
					if(r)
						win.loadUser();
				}
				break;
		}
	}

	var listView = GUI.createListView();
	listView.addHeader("ID",80);
	listView.addHeader("ENABLE",100);
	listView.addHeader("NAME",200);
	listView.addHeader("MAIL",200);
	listView.addHeader("PASS",120);
	listView.addHeader("INFO",200);
	separate.getChild(0).addChild(listView,"client");

	win.loadUser = function(){
		listView.clearItem();
		listGroup.clearItem();
		ADP.exec("Users.getUsers").on = function(values){
			if(values!==null){
				for(var i=0;i<values.length;i++){
					var value = values[i];
					var index = listView.addItem(value['users_id']);
					listView.setItem(index,1,value['users_enable']);
					listView.setItem(index,2,value['users_name']);
					listView.setItem(index,3,value['users_mail']);
					listView.setItem(index,4,'********');
					listView.setItem(index,5,value['users_info']);
				}
			}
		}
	}

	listView.addEvent("itemClick",function(e){
		var index = e.itemIndex;
		var subIndex = e.itemSubIndex;
		win.loadGroup();
		if(subIndex <= 0)
			return;

		var id = listView.getItemText(index,0);
		var area = this.getItemArea(index,subIndex);
		var enable = ['true','false'];
		switch(subIndex){
			case 1:
				var select = GUI.createSelectView();
				for(var i in enable)
					select.addText(enable[i]);
				select.setSize(area.width,200);
				select.setPos(area.x,area.y);
				select.addEvent("select",function(e){
					ADP.exec("Users.setUser",id,e.value).on = function(r){
						if(r != null && r.result){
							listView.setItem(index,subIndex,e.value);
						}
					}
				});
				break;
			case 2:
			case 3:
			case 4:
			case 5:
				var edit = listView.editText(index,subIndex);
				edit.addEvent("enter",function(e){
					var p = [];
					p[subIndex - 2] = subIndex == 4 ? CryptoJS.MD5(e.value).toString():e.value;
					ADP.exec("Users.setUser",id,null,p[0],p[1],p[2],p[3]).on=function(r){
						if(r != null && r.result){
							if(subIndex!=4)
								listView.setItem(index,subIndex,e.value);
						}
					}
				});
				break;
		}
	});

	var panel = GUI.createPanel();
	separate.getChild(1).addChild(panel, "top");
	panel.getClient().innerHTML = "グループ設定 <BUTTON>追加</BUTTON><BUTTON>削除</BUTTON>";

	var listGroup = GUI.createListView();
	listGroup.addHeader("ID",80);
	listGroup.addHeader("NAME",300);
	separate.getChild(1).addChild(listGroup, "client");

	var buttons = panel.getClient().querySelectorAll("button");
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener("click", onButtonGroup);
	}
	function onButtonGroup(e){
		switch (e.srcElement.textContent) {
			case "追加":
				var w = createGroupSelect(function(value){
					if (listView.getSelectIndex() < 0)
						return;
					var id = listView.getItemText(listView.getSelectIndex(), 0);
					ADP.exec("Users.addGroupUser", value,id).on = function (r) {
						if (r){
							w.close();
							win.loadGroup();
						}
					}
				});
				break;
			case "削除":
				if (listView.getSelectIndex() < 0 || listGroup.getSelectIndex() < 0)
					return;
				var userId = listView.getItemText(listView.getSelectIndex(), 0);
				var groupId = listGroup.getItemText(listGroup.getSelectIndex(), 0);
				ADP.exec("Users.delGroupUser", groupId, userId).on = function (r) {
					if (r)
						win.loadGroup();
				}
				break;
		}
	}
	win.loadGroup = function () {
		listGroup.clearItem();
		if (listView.getSelectIndex() < 0)
			return;
		var id = listView.getItemText(listView.getSelectIndex(), 0);
		ADP.exec("Users.getUserGroups",id).on = function (values) {
			if (values) {
				for (var i = 0; i < values.length; i++) {
					var value = values[i];
					var index = listGroup.addItem(value['user_group_id']);
					listGroup.setItem(index, 1, value['user_group_name']);
				}
			}
		}
	}

	win.loadUser();
	return win;
}
function createGroupSelect(func){
	var win = GUI.createFrameWindow();
	win.setTitle("グループ選択");
	var listView = GUI.createListView();
	listView.addHeader("ID",80);
	listView.addHeader("ENABLE", 100);
	listView.addHeader("NAME",200);
	listView.addHeader("INFO",200);
	win.addChild(listView,"client");
	win.setPos();

	listView.addEvent("itemDblClick",function(e){
		func(this.getItemText(e.itemIndex,0));
	});

	win.load = function(){
		listView.clearItem();
		ADP.exec("Users.getGroups").on = function (values) {
			if (values === null)
				return;
			for (var i = 0; i < values.length; i++) {
				var value = values[i];
				var index = listView.addItem(value['user_group_id']);
				listView.setItem(index, 1, value['user_group_enable']);
				listView.setItem(index, 2, value['user_group_name']);
				listView.setItem(index, 3, value['user_group_info']);
			}
		}
	}

	win.load();
	return win;
}

function createGroupView() {
	var win = GUI.createWindow();

	if (!SESSION.isAuthority('SYSTEM_ADMIN')) {
		GUI.createMessageBox("エラー", "権限がありません", ["OK"]);
		return win;
	}


	var panel = GUI.createPanel();
	win.addChild(panel, "bottom");
	panel.getClient().innerHTML = "<BUTTON>追加</BUTTON><BUTTON>削除</BUTTON>";
	var buttons = panel.getClient().querySelectorAll("button");
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener("click", onButtonClick);
	}
	function onButtonClick(e) {
		switch (e.srcElement.textContent) {
			case "追加":
				ADP.exec("Users.addGroup").on = function (r) {
					if (r)
						win.load();
				};
				break;
			case "削除":
				var index = listView.getSelectIndex();
				var id = listView.getItemText(index, 0);
				ADP.exec("Users.delGroup", id).on = function (r) {
					if (r)
						win.load();
				};
				break;
		}
	}

	var listView = GUI.createListView();
	listView.addHeader("ID", 80);
	listView.addHeader("ENABLE", 100);
	listView.addHeader("NAME", 150);
	listView.addHeader("INFO", 200);
	listView.addHeader("COUNT", 100);
	win.addChild(listView, "client");

	win.load = function () {
		listView.clearItem();
		ADP.exec("Users.getGroups").on = function (values) {
			if (values === null)
				return;
			for (var i = 0; i < values.length; i++) {
				var value = values[i];
				var index = listView.addItem(value['user_group_id']);
				listView.setItem(index, 1, value['user_group_enable']);
				listView.setItem(index, 2, value['user_group_name']);
				listView.setItem(index, 3, value['user_group_info']);
				listView.setItem(index, 4, 0);
			}
		}
	}

	listView.addEvent("itemClick", function (e) {
		var index = e.itemIndex;
		var subIndex = e.itemSubIndex;
		if (subIndex <= 0)
			return;
		var code = ["user_group_name", "user_group_info"];
		var area = this.getItemArea(index, subIndex);
		var enable = ['true', 'false'];
		switch (subIndex) {
			case 1:
				var select = GUI.createSelectView();
				for (var i in enable)
					select.addText(enable[i]);
				select.setSize(area.width, 200);
				select.setPos(area.x, area.y);
				select.addEvent("select", function (e) {
					var id = listView.getItemText(index, 0);
					ADP.exec("Users.setGroup", id, e.value, null, null).on = function (r) {
						if (r) {
							listView.setItem(index, subIndex, e.value);
						}
					}
				});
				break;
			case 2:
			case 3:
				var edit = GUI.createEditView();
				edit.addEvent("enter", function (e) {
					var v = [];
					v[subIndex - 2] = e.value;
					var id = listView.getItemText(index, 0);
					ADP.exec("Users.setGroup", id, null, v[0], v[1]).on = function (r) {
						if (r) {
							listView.setItem(index, subIndex, e.value);
						}
					}
				});
				edit.setText(this.getItemText(index, subIndex));
				edit.setSize(area.width, area.height);
				edit.setPos(area.x, area.y);
				edit.setOrderSystem(true);
				edit.setFocus();
				break;
		}


	});

	win.load();
	return win;
}