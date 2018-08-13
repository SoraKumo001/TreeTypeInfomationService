function createPluginView(){
	var win = GUI.createWindow();
	ADP.exec("MG.getPlugins").on = function(values){
		if (values === null)
			return;
		var client = win.getClient();
		client.classList.add("BoxView");

		for(var i=0;i<values.length;i++){
			var value = values[i];
			var div = document.createElement('div');
			client.appendChild(div);
			var p = [
				[ "クラス名",value.CLASS ],
				[ "名称",value.NAME ],
				[ "バージョン",value.VERSION ],
				[ "制作者",value.AUTHOR ],
				[ "概要",value.DESCRIPTION ]
			];
			var names = document.createElement('div');
			div.appendChild(names);
			var val = document.createElement('div');
			div.appendChild(val);
			for(var j=0;j<p.length;j++){
				var n = document.createElement('div');
				names.appendChild(n);
				n.textContent = p[j][0];
				var n = document.createElement('div');
				val.appendChild(n);
				n.textContent = p[j][1];
			}
		}

	}
	return win;
}