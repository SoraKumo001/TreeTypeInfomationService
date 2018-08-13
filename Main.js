function createEvent(node){
	node.GUI={events:{}};
	node.callEvent = function (e) {
		var eventList = node.GUI.events[e.etype];
		if (eventList) {
			for (var i = 0; i < eventList.length; i++)
				eventList[i].call(this, e);
		}
	}
	node.addEvent = function (name, func) {
		var eventList = node.GUI.events[name];
		if (!eventList) {
			eventList = [];
			node.GUI.events[name] = eventList;
		}
		eventList.push(func);
	}
}

function createMenu(items) {
	function onClick() {
		menu.close();
		menu.callEvent({etype:"select",value:this._value});
	}

	var menu = document.createElement("div");
	menu.className = "GUIMenu";
	document.body.appendChild(menu);
	menu.addEventListener("mouseleave", function () {this.close(); })
	createEvent(menu);
	for (var i in items) {
		var item = items[i];
		var div = document.createElement("div");
		div.textContent = item;
		div._value = i;
		menu.appendChild(div);
		div.addEventListener("click", onClick);
	}

	menu.close = function(){
		this.addEventListener("animationend", function (e) {
			this.parentNode.removeChild(this);
		});
		this.style.animation = "close 0.2s ease 0s 1 forwards";
	}
	return menu;
}
(function(){
//PHP通信用アダプタの作成(グローバル)
ADP = AFL.createAdapter("./",sessionStorage.getItem("sessionHash"));
document.addEventListener("DOMContentLoaded",onLoad);

//プログラム開始動作
function onLoad(){
	//認証処理後、onStartを呼び出す
	SESSION.requestSession(onStart,false);
}
System = {};
System.reload = function(){
	onStart();
}
function onStart(){
	GUI.rootWindow.removeChildAll();

	//画面上部を作成
	var top = GUI.createWindow();
	top.setSize(0, 60);
	top.setChildStyle("top");
	top.setClientClass("LayoutTop");

	var title = document.createElement("div");
	top.getClient().appendChild(title);
	title.textContent = "Tree Type Infomation Service";


	if (SESSION.isAuthority("SYSTEM_ADMIN")){
		var setting = document.createElement("div");
		System.setting = setting;
		setting.className = "menuItem";
		setting.textContent = "設定";
		top.getClient().appendChild(setting);
		setting.addEventListener("click", function () {
			createSettingView(mainView);
		});
	}


	var login = document.createElement("div");
	System.login = login;
	login.className = "menuItem";
	top.getClient().appendChild(login);
	login.addEventListener("click", function () {
		SESSION.createLoginWindow(onStart);
	});
	System.login.textContent = SESSION.getUserName();

	var mainView = GUI.createWindow();
	mainView.setChildStyle("client");

	createContensView(mainView);
	//createCustomEditor();
	//createFileWindow();
	//createMenu(["上に作成","下に作成","子として作成"]);
}




})();