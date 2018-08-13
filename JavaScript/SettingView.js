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
	item.addItem("ログ").setItemValue(createLog);
	item.addItem("祝日設定").setItemValue(importHoliday);
	item.addItem("設定を閉じる").setItemValue(System.reload);
}