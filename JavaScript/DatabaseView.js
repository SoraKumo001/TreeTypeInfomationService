function createDatabaseView(){
	var win = GUI.createWindow();

	if(!SESSION.isAuthority('SYSTEM_ADMIN')){
		GUI.createMessageBox("エラー","権限がありません",["OK"]);
		return win;
	}

	win.setPos();
	win.setTitle("データベースの設定");
	var client = win.getClient();

	clientArea = document.createElement("div");
	client.appendChild(clientArea);
	clientArea.className = "ParamsEditView";

	var viewArea = document.createElement("div");
	clientArea.appendChild(viewArea);

	var inputArea = document.createElement("div");
	viewArea.appendChild(inputArea);
	var buttonArea = document.createElement("div");
	viewArea.appendChild(buttonArea);
	function addInput(name,type){
		var div = document.createElement("div");
		var label = document.createElement("div");
		var input = document.createElement("input");
		if (type)
			input.type = type;
		label.textContent = name;
		div.appendChild(label);
		div.appendChild(input);
		inputArea.appendChild(div);
		return div;
	}
	function addButton(name) {
		var div = document.createElement("div");
		var input = document.createElement("button");
		input.className = 'blueButton';
		div.appendChild(input);
		input.textContent = name;
		buttonArea.appendChild(div);
		return div;
	}
	addInput("データベースアドレス");
	addInput("データベースユーザ");
	addInput("データベースパスワード","password");
	addInput("データベース名");
	addButton("設定");

	var inputs = client.querySelectorAll("input");
	var buttons = client.querySelectorAll("button");
	buttons[0].addEventListener("click",function(){
		ADP.exec("MG.setDatabase", inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value).on = function(flag){
			GUI.createMessageBox("データベース設定",flag?"設定完了":"設定エラー",["OK"]);
		}
	});
	ADP.exec("MG.getDatabase").on = function(values){
		if (values === null)
			return;
		inputs[0].value = values["POSTGRES_ADR"];
		inputs[1].value = values["POSTGRES_USER"];
		inputs[2].value = values["POSTGRES_PASS"];
		inputs[3].value = values["POSTGRES_DB"];
	}
	return win;

}