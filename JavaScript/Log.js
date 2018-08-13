function createLog() {
	var window = GUI.createWindow();


	var listView = GUI.createListView();
	window.addChild(listView, "client");
	listView.addHeader("時間", 230);
	listView.addHeader("IP", 150);
	listView.addHeader("ID", 50);
	listView.addHeader("名前", 150);
	listView.addHeader("コマンド", 200);
	listView.addHeader("結果", 500);

	window.load = function () {
		ADP.exec("Log.getLog", 500).on = function (values) {
			if (values) {
				for (var i = 0; i < values.length; i++) {
					var value = values[i];
					var index = listView.addItem(value[1]);
					for (var j = 1; j < 6; j++)
						listView.setItem(index, j, value[j + 1]);
				}
			}
		}
	}
	window.load();
	return window;
}