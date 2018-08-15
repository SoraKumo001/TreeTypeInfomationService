function createSettingView(mainView) {
	mainView.removeChildAll();
	//画面分割(横)
	var separate = GUI.createSeparate(200, "we");
	mainView.addChild(separate, "client");

	//ツリーメニューの作成
	var treeMenu = GUI.createTreeView();
	separate.addSeparateChild(0, treeMenu, "client");
	treeMenu.addEvent("select", function () {
		var parent = separate.getChild(1);
		parent.removeChildAll();
		var proc = treeMenu.getSelectValue();
		if (proc) {
			var w = proc();
			if(w)
				separate.addSeparateChild(1, w, "client");
		}

	});

	var rootItem = treeMenu.getRootItem();
	rootItem.setItemText("Menu一覧");

	var item, subItem;
	item = rootItem.addItem("システム");
	item.addItem("モジュール確認").setItemValue(createPluginView);
	item.addItem("データベース設定").setItemValue(createDatabaseView);
	item.addItem("ユーザ設定").setItemValue(createUserView);
	item.addItem("グループ設定").setItemValue(createGroupView);
	item.addItem("基本設定").setItemValue(createBaseSetView);
	item.addItem("ログ").setItemValue(createLog);
	item.addItem("祝日設定").setItemValue(importHoliday);
	item.addItem("設定を閉じる").setItemValue(System.reload);
}


function createBaseSetView(parent) {
	var list = GUI.createListView();
	list.addHeader("項目", 200);
	list.addHeader("データ", 300);

	list.addItem("URL");
	list.addItem("タイトル");
	list.addItem("説明");

	var label = ["base_url", "base_title", "base_info"];

	list.addEvent("itemClick", function (e) {
		var index = e.itemIndex;
		var subIndex = e.itemSubIndex;
		if (subIndex != 1)
			return;
		var area = this.getItemArea(index, subIndex);
		switch (index) {
			case 0:
			case 1:
			case 2:
				var edit = list.editText(index, subIndex);
				edit.addEvent("enter", function (e) {
					ADP.exec("GParams.setParam", label[index], e.value).on =
						function (flag) {
							if (flag) {
								Contents.loadTitle();
								list.setItem(index, subIndex, e.value);
							}
						}
				});
		}
	});

	list.load = function () {
		ADP.exec("GParams.getParams", label).on = function (values) {
			if (values){
				list.setItem(0, 1, values[label[0]]);
				list.setItem(1, 1, values[label[1]]);
				list.setItem(2, 1, values[label[2]]);
			}
		}
	}
	list.load();
	return list;
}