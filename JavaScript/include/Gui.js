(function(){

	//ページ読み出し後の初期化処理
	document.addEventListener("DOMContentLoaded",onLoad);
	function onLoad(){

		//GUI描画エリアの作成
		GUI.root = document.createElement("div");
		GUI.root.className = "GUIArea";
		document.body.appendChild(GUI.root);

		GUI.rootWindow = GUI.createWindow();
		GUI.rootWindow.id = "root";
		GUI.rootWindow.style.width = 0;
		GUI.rootWindow.style.height = 0;
		GUI.rootWindow.setSize(getClientWidth(), getClientHeight());
		GUI.layout(true);
	}

	//RGB変換
	function getARGB(color) {
		var a = (color >>> 24) / 255;
		var r = (color >> 16) & 0xff;
		var g = (color >> 8) & 0xff;
		var b = color & 0xff;
		return "rgba(" + r + "," + g + "," + b + "," + a + ")";
	}



	//GUIがらみの初期設定
	GUI = {};
	GUI.getARGB = getARGB;
	GUI.getRGB = function(color){
		var a = (color >>> 24) / 255;
		var r = (color >> 16) & 0xff;
		var g = (color >> 8) & 0xff;
		var b = color & 0xff;
		return "rgb(" + r + "," + g + "," + b+")";
	}
	GUI.foreground = [];
	GUI.focus = null;
	GUI.setFocus = function(node){
		GUI.focus = node;
	}
	GUI.createEvent = function(node) {
		node.GUI = { events: {} };
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
		node.delEvent = function (name, func) {
			var eventList = node.GUI.events[name];
			if (!eventList)
				return;
			var index = eventList.indexOf(func);
			if (index >= 0)
				eventList.splice(index, 1);
		}
	}

	//イベント処理全般
	function onTouchEnd(e){
		onMouseUp(e);	//タッチイベントをイベントを転送
	}
	function onMouseUp(e){
		e.etype = "mouseup";
		GUI.selectWindow = null;
		if(GUI.overParts == "GUIClient")
			GUI.overWindow.callEvent(e);
	}
	function onTouchStart(e){
		if(e.targetTouches.length > 0){
			var touch = e.targetTouches[0];
			e.clientX = touch.pageX;
			e.clientY = touch.pageY;
			e.etype = "mousedown";
			onMouseDown(e);
		}
	}

	function onMouseDown(e){
		e.etype = "mousedown";
		GUI.mouseDownX = parseInt(e.clientX);
		GUI.mouseDownY = parseInt(e.clientY);

		var win = GUI.getWindow(GUI.mouseDownX,GUI.mouseDownY);
		if(win){
			win.setForeground();
			var x = win.GUI.x;
			var y = win.GUI.y;
			var widht = win.GUI.widht;
			var height = win.GUI.height;

			var partsName = win.getHit(GUI.mouseDownX,GUI.mouseDownY);
			if(partsName){

				GUI.selectWindow = win;
				GUI.selectStartX = win.GUI.x;
				GUI.selectStartY = win.GUI.y;
				GUI.selectStartWidth = win.GUI.width;
				GUI.selectStartHeight = win.GUI.height;
				GUI.selectParts = partsName;
			}
			switch(partsName){
				case "GUITitleMin":
					win.setMinimize(!win.GUI.minimize);
					break;
				case "GUITitleMax":
					win.setMaximize(!win.GUI.maximize);
					break;
				case "GUITitleClose":
					win.close();
					break;
				case "GUIClient":
					var p = win.screenToClient(GUI.mouseX, GUI.mouseY);
					e.cx = p.x;
					e.cy = p.y;
					win.callEvent(e);
					break;
			}
		}
	}
	function onMouseClick(e){
		e.etype = "mouseclick";
		GUI.mouseDownX = parseInt(e.clientX);
		GUI.mouseDownY = parseInt(e.clientY);
		var win = GUI.getWindow(GUI.mouseDownX,GUI.mouseDownY);
		var p = win.screenToClient(GUI.mouseX, GUI.mouseY);
		e.cx = p.x;
		e.cy = p.y;
		win.callEvent(e);
	}
	function onMouseDblClick(e){
		e.etype = "mousedblclick";
		if(GUI.overParts == "GUIClient"){
			GUI.mouseDownX = parseInt(e.clientX);
			GUI.mouseDownY = parseInt(e.clientY);
			var win = GUI.getWindow(GUI.mouseDownX,GUI.mouseDownY);
			var p = win.screenToClient(GUI.mouseX, GUI.mouseY);
			e.cx = p.x;
			e.cy = p.y;
			GUI.overWindow.callEvent(e);
		}
	}
	function onMouseLeave(e){
		e.etype = "mouseleave";
		 GUI.selectWindow = null;
		 if(GUI.overWindow != null)
			 GUI.overWindow.callEvent(e);
	}
	function onTouchMove(e){
		if(e.targetTouches.length > 0){
			var touch = e.targetTouches[0];
			e.clientX = touch.pageX;
			e.clientY = touch.pageY;
			e.etype = "mousemove";
			onMouseMove(e);
		}
	}
	function onMouseMove(e){
		e.etype = "mousemove";
		//マウスの位置情報設定
		GUI.mouseX = parseInt(e.clientX);
		GUI.mouseY = parseInt(e.clientY);
		GUI.overWindow = GUI.getWindow(GUI.mouseX,GUI.mouseY);
		if(GUI.overWindow)
			GUI.overParts = GUI.overWindow.getHit(GUI.mouseX,GUI.mouseY);
		else
			GUI.overParts = null;
		if(GUI.selectWindow){
			var moveX = GUI.mouseX - GUI.mouseDownX;
			var moveY = GUI.mouseY - GUI.mouseDownY;
			var x = moveX + GUI.selectStartX;
			var y = moveY + GUI.selectStartY;
			var win = GUI.selectWindow;
			GUI.moveX2 = x;
			GUI.moveY2 = y;
			switch(GUI.selectParts){
				case "GUITitle":
				case "GUITitleText":
					win.setPos(x,y);
					break;
				case "GUIBorderLeft":
					win.setPos(x, GUI.selectStartY);
					win.setSize(GUI.selectStartWidth - moveX,GUI.selectStartHeight);
					break;
				case "GUIBorderRight":
					win.setSize(GUI.selectStartWidth + moveX,GUI.selectStartHeight);
					break;
				case "GUIBorderTop":
					win.setPos(GUI.selectStartX,y);
					win.setSize(GUI.selectStartWidth,GUI.selectStartHeight-moveY);
					break;
				case "GUIBorderBottom":
					win.setSize(GUI.selectStartWidth,GUI.selectStartHeight+moveY);
					break;
				case "GUIBorderTopLeft":
					win.setPos(x,y);
					win.setSize(GUI.selectStartWidth - moveX,GUI.selectStartHeight-moveY);
					break;
				case "GUIBorderTopRight":
					win.setPos(GUI.selectStartX,y);
					win.setSize(GUI.selectStartWidth + moveX,GUI.selectStartHeight-moveY);
					break;
				case "GUIBorderBottomLeft":
					win.setPos(x,GUI.selectStartY);
					win.setSize(GUI.selectStartWidth - moveX,GUI.selectStartHeight+moveY);
					break;
				case "GUIBorderBottomRight":
					win.setSize(GUI.selectStartWidth+moveX,GUI.selectStartHeight+moveY);
					break;
				case "GUIClient":
					if(win.GUI.move)
						win.setPos(x,y);
					else{
						var p = win.screenToClient(GUI.mouseX, GUI.mouseY);
						e.cx = p.x;
						e.cy = p.y;
						win.callEvent(e);
					}
					break;
			}
			if(GUI.selectParts != "GUIClient")
				e.preventDefault();
		}
		if(GUI.overWindow){
			var p = GUI.overWindow.screenToClient(GUI.mouseX, GUI.mouseY);
			e.cx = p.x;
			e.cy = p.y;
			GUI.overWindow.callEvent(e);
		}


	}

	//キーボード処理全般
	var mKeymap = new Array();
	var mShiftKey = false;
	var mCtrlKey = false;
	GUI.isKeymap = function (code) {
		return mKeymap[code];
	}
	GUI.isShift = function () {
		return mShiftKey;
	}
	GUI.isCtrl = function () {
		return mCtrlKey;
	}
	//キーボード操作の記憶
	function onKeyup(e) {
		var code;
		if (e) {
			code = e.keyCode;
			mCtrlKey = typeof (e.modifiers) == 'undefined' ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK;
			mShiftKey = typeof (e.modifiers) == 'undefined' ? e.shiftKey : e.modifiers & Event.SHIFT_MASK;
		}
		else {
			code = event.keyCode;
			mCtrlKey = event.ctrlKey;
			mShiftKey = event.shiftKey;
		}
		mKeymap[code] = false;
	}
	function onKeydown(e) {
		var code;
		if (e) {
			code = e.keyCode;
			mCtrlKey = typeof (e.modifiers) == 'undefined' ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK;
			mShiftKey = typeof (e.modifiers) == 'undefined' ? e.shiftKey : e.modifiers & Event.SHIFT_MASK;
		}
		else {
			code = event.keyCode;
			mCtrlKey = event.ctrlKey;
			mShiftKey = event.shiftKey;
		}
		mKeymap[code] = true;
	}

	//ウインドウサイズ変更処理
	function getClientHeight(){
		if(innerHeight)
			return innerHeight;
		return document.body.clientHeight;
	}
	function getClientWidth(){
		if (innerWidth)
			return innerWidth;
		return document.body.clientWidth;
	}
	GUI.getClientHeight = getClientHeight;
	GUI.getClientWidth = getClientWidth;
	function onResize(e){
		if (GUI.rootWindow) {
			GUI.rootWindow.setSize(getClientWidth(), getClientHeight());
			GUI.layout(true);
		}
	}

	//イベント処理
	document.addEventListener('click', onMouseClick, false);
	document.addEventListener('mousedown', onMouseDown, false);
	document.addEventListener('mouseup', onMouseUp, false);
	document.addEventListener('mouseleave', onMouseLeave, false);
	document.addEventListener('dblclick', onMouseDblClick, false);
	document.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('touchstart', onTouchStart,  {passive: false});
	document.addEventListener('touchmove', onTouchMove,  {passive: false});
	document.addEventListener('touchend', onTouchEnd,  {passive: false});
	document.addEventListener('keyup', onKeyup, false);
	document.addEventListener('keydown', onKeydown, false);
	window.addEventListener('resize', onResize, false);

	GUI.layoutFlag = false;
	GUI.layout = function(flag){
		if(!GUI.layoutFlag){
			GUI.layoutFlag=true;
			setTimeout(function(){
				GUI.layoutFlag=false;
				GUI.rootWindow.onLayout(flag);
				if(GUI.focus){
					GUI.focus.focus();
					GUI.focus = null;
				}
				GUI.layout(false);
			},1);
		}
	}
	GUI.getWindow = function(x,y){
		return GUI.rootWindow.getWindow(x,y);
	}
	GUI.getMouseX = function(){
		return GUI.mouseX;
	}
	GUI.getMouseY = function(){
		return GUI.mouseY;
	}
	GUI.createFrameWindow = function(){
		var win = GUI.createWindow();
		win.changeFrameWindow();
		return win;
	}

	//ウインドウのクラス構造定義
	var GUIPartsClass = [
		["GUIFrame",
			["GUIBorderLeft",
			"GUIBorderRight",
			"GUIBorderTop",
			"GUIBorderBottom",
			"GUIBorderTopLeft",
			"GUIBorderTopRight",
			"GUIBorderBottomLeft",
			"GUIBorderBottomRight",
			["GUITitle",
				["GUITitleText",
				["GUITitleIcons",
					["GUITitleMin","GUITitleMax","GUITitleClose"]]
				]
			]]
			],
			"GUIClient"
		];
	//Window用プロトタイプの作成
	GUI.createWindow = function(){
		var win = document.createElement("div");
		win.className = "GUIWindow";
		win.GUI = {
			x:0,y:0,width:640,height:480,parent:null,minimize:false,maximize:false,move:false,
			padding:{x1:0,y1:0,x2:0,y2:0},
			visible:true,events:{},layout:true,child:[],orderTop:false,sortZ:500,parts:{}};


		function createElementByClassName(parent,nameArray){
			for(var i in nameArray){
				var c = nameArray[i];

				var className = c instanceof  Array?c[0]:c;
				var element = document.createElement("div");
				element.className = className;
				parent.appendChild(element);
				win.GUI.parts[className] = element;

				if(c instanceof  Array)
					createElementByClassName(element,c[1]);
			}
		}
		createElementByClassName(win,GUIPartsClass);
		var partsName = Object.keys(win.GUI.parts)
		partsName.reverse();
		win.addEventListener("animationend",function(){
			this.requestLayout();
		});
		win.sortChild = function(){
			//Z値にソート
			var childList = win.GUI.child;
			childList.sort(function(a,b){
				var valueA = (a.GUI.sortZ+(a.GUI.orderSystem?100000:0) + (a.id=="frame"||a.id=="overlap"?10000:0) + (a.GUI.orderTop?1000:0));
				var valueB = (b.GUI.sortZ+(b.GUI.orderSystem?100000:0) + (b.id=="frame"||b.id=="overlap"?10000:0) + (b.GUI.orderTop?1000:0));

				return valueB - valueA;
			});
			//Z値再付番
			for(var i=0;i<childList.length;i++){
				childList[i].GUI.sortZ = childList.length - i;
			}
		}
		win.screenToClient = function (x, y) {
			var p = {};
			p.x = parseInt(x) - this.getAbsX() - this.getClientX();
			p.y = parseInt(y) - this.getAbsY() - this.getClientY();
			return p;
		}
		win.changeFrameWindow = function () {
			this.getBorderSize = function () {
				return 2;
			}
			this.id = "frame";
			return this;
		}
		win.setMove = function(flag){
			this.GUI.move = flag;
		}
		win.getParent = function(){
			return this.GUI.parent;
		}
		win.setClientClass = function(name){
			this.getClient().className = name;
		}
		win.addClientClass = function(name){
			this.getClient().classList.add(name);
		}
		win.close = function(){
			win.addEventListener("animationend", function(e) {
				for(var i=0;i<win.GUI.child;i++){
					win.GUI.child[i].close();
				}
				if(win.GUI.parent)
					win.GUI.parent.removeChild(this);
				//win.remove();
			});
			win.style.animation="close 0.2s ease 0s 1 forwards";
			e = {etype:"close"};
			this.callEvent(e);
		}
		win.isVisible = function () {
			if (!this.GUI.visible)
				return false;
			if (this.getParent())
				return this.getParent().isVisible();
			return true;
		}
		win.setVisible = function (flag) {
			this.GUI.visible = flag;
			this.style.display = flag ? 'block' : 'none';
			this.requestLayout();
		}
		win.setMinimize = function(flag){
			if(win.GUI.minimize != flag){
				if(flag){
					var client = win.GUI.parts["GUIClient"];
					client.style.animation="minimize 0.2s ease 0s 1 forwards";
				}else{
					var client = win.GUI.parts["GUIClient"];
					client.style.animation="restore 0.2s ease 0s 1 backwards";
				}
				win.GUI.minimize = flag;
				win.requestLayout();
			}
		}
		win.setMaximize = function(flag){
			if(this.GUI.maximize != flag){
				if(flag){
					this.GUI.normalX = win.GUI.x;
					this.GUI.normalY = win.GUI.y;
					this.GUI.normalWidth = win.GUI.width;
					this.GUI.normalHeight = win.GUI.height;
					this.GUI.parts["GUITitleMax"].className = "GUITitleNormal";
					this.style.animation="maximize 0.2s ease 0s 1 forwards";
				}else{
					this.GUI.x = win.GUI.normalX;
					this.GUI.y = win.GUI.normalY;
					this.GUI.width = win.GUI.normalWidth;
					this.GUI.height = win.GUI.normalHeight;
					this.GUI.parts["GUITitleMax"].className = "GUITitleMax";
					this.style.animation="maxrestore 0.2s ease 0s 1 forwards";
				}
				this.GUI.maximize = flag;
				this.requestLayout();
			}

		}
		win.onLayout = function(flag){
			var flag2 = false;
			if(flag || win.GUI.layout){
				flag2 = win.GUI.layout;
				win.GUI.layout = false;
				win.callEvent({etype:"layout"});
				win.layout();
			}
			//Zソート
			win.sortChild();
			var childList = win.GUI.child;
			for(var i=0;i<childList.length;i++){
				var child = childList[i];
				child.style.zIndex = childList.length-i;
				child.onLayout(flag||flag2);
			}

		}
		win.layout = function()
		{
			if(win.GUI.maximize){
				var parent = win.GUI.parent;
				win.setPos(0,0);
				win.setSize(parent.getClientWidth(),parent.getClientHeight());
			}

			var width = win.GUI.width;
			var height = win.GUI.height;
			var client = win.GUI.parts["GUIClient"];
			win.style.left = win.GUI.x + "px";
			win.style.top = win.GUI.y + "px";
			if(GUI.rootWindow != this){
				client.style.width = width+"px";
				client.style.height = height+"px";
			}


			//配置順序リスト
			var childList = [].concat(win.GUI.child);
			childList.sort(function(a,b){
				var priority = {top:10,bottom:10,left:8,right:8,client:5};
				return priority[b.GUI.arrangement] - priority[a.GUI.arrangement];
			});

			var x1 = this.getClientX();
			var y1 = this.getClientY();
			var x2 = x1+this.getClientWidth();
			var y2 = y1+this.getClientHeight();
			for(var i=0;i<childList.length;i++){
				var child = childList[i];
				if(!child.GUI.visible)
					continue;
				switch(child.GUI.arrangement){
					case "top":
						child.setPos(x1, y1);
						child.setWidth(x2 - x1);
						y1 += child.getHeight();
						break;
					case "bottom":
						child.setPos(x1, y2 - child.getHeight());
						child.setWidth(x2 - x1);
						y2 -= child.getHeight();
						break;
					case "left":
						child.setPos(x1, y1);
						child.setHeight(y2 - y1);
						x1 += child.getWidth();
						break;
					case "right":
						child.setPos(x2 - child.getWidth(), y1);
						child.setHeight(y2 - y1);
						x2 -= child.getWidth();
						break;
					case "client":
						child.setPos(x1, y1);
						child.setSize(x2 - x1, y2 - y1);
						break;
				}
			}
			return true;
		}
		win.addChild = function(child,arrangement){
			if(child.GUI.parent)
				child.GUI.parent.removeChild(child);
			var client = win.GUI.parts['GUIClient'];
			client.appendChild(child);

			child.GUI.arrangement = arrangement;
			child.GUI.parent = this;
			win.GUI.child.push(child);
			win.requestLayout();
		}
		win.removeChildAll = function(){
			var client = win.GUI.parts['GUIClient'];
			var childList = win.GUI.child;
			for(var i=0;i<childList.length;i++){
				var child = childList[i];
				client.removeChild(child);
				child.GUI.parent = null;
			}
			win.GUI.child = [];
			win.requestLayout();
		}
		win.removeChild = function(child){
			if(child.GUI.parent != this)
				return;
			child.GUI.parent = null;
			var childList = win.GUI.child;
			for(var i=0;i<childList.length;i++){
				if(childList[i] == child){
					childList.splice(i,1);
					break;
				}
			}
			win.requestLayout();
		}
		win.getPosX = function(){
			return win.GUI.x;
		}
		win.getPosY = function(){
			return win.GUI.y;
		}
		win.setSortZ = function(v){
			win.GUI.sortZ = v+500;
		}
		win.setPos = function(x,y){
			if(x==null || y==null){
				x = (this.GUI.parent.getWidth() - this.getWidth())/2;
				y = (this.GUI.parent.getHeight() - this.getHeight())/2;
			}
			// if(x+this.getWidth() > this.GUI.parent.getClientWidth())
			// 	x = this.GUI.parent.getClientWidth() - this.getWidth();
			// if(y+this.getHeight() > this.GUI.parent.getClientHeight())
			// 	y = this.GUI.parent.getClientHeight() - this.getHeight();
			if(x < 0)
				x = 0;
			if(y < 0)
				y = 0;

			var e = {type:"move",x:x,y:y};
			win.GUI.x = e.x;
			win.GUI.y = e.y;
			win.callEvent({type:"move"});
			win.requestLayout();
		}
		win.setSize = function(width,height){
			var e = {type:"size",width:width,height:height};
	/*		if(this.GUI.parent){
				var pwidth = this.GUI.parent.getClientWidth();
				var pheight = this.GUI.parent.getClientHeight();
				if(e.width > pwidth)
					e.width = pwidth;
				if(e.height > pheight)
					e.height = pheight;
			}*/
			if(win.GUI.width != e.width || win.GUI.height != e.height){
				win.callEvent(e);
				win.GUI.width = e.width;
				win.GUI.height = e.height;
				e.etype="sized";
				win.callEvent(e);
				win.requestLayout();
			}


		}
		win.requestLayout = function(){
			win.GUI.layout = true;
			GUI.layout(false);
		}
		win.isOrderTop = function () {
			return this.GUI.orderTop;
		}
		win.setOrderTop = function(flag){
			this.GUI.orderTop = flag;
		}
		win.setOrderSystem = function(flag){
			this.GUI.orderSystem = flag;
		}
		win.getOtherZ = function(){
			var parent = this.GUI.parent;
			if(parent == null)
				return 0;
			var child = parent.GUI.child;
			var count = child.length;
			var z = 0;
			for(var i=0;i<count;i++){
				z = Math.max(z,child[i].GUI.sortZ);
			}
			return z;
		}
		win.setForeground = function(){
			var foreground = [];

			var p = this;
			while(p){
				foreground.push(p);
				if(p.GUI.arrangement == null || p.GUI.arrangement == "")
					p.GUI.sortZ = p.getOtherZ()+1000;
				p.requestLayout();
				p = p.GUI.parent;
			}
			//非アクティブ通知
			for (var index in GUI.foreground) {
				var w = GUI.foreground[index];
				if (foreground.indexOf(w) == -1) {
					w.callEvent({etype:"foreground",foreground:false});
				}
			}
			//アクティブ通知
			for (var index in foreground) {
				var w = foreground[index];
				if (GUI.foreground.indexOf(w) == -1) {
					w.callEvent({etype:"foreground",foreground:true});
				}
			}
			GUI.foreground = foreground;


		}
		win.getAbsX = function(){
			var px = win.GUI.x;
			var parent = this;
			while(parent = parent.GUI.parent){
				px += parent.GUI.parts["GUIClient"].offsetLeft+parent.getClientX()+parent.GUI.x;
			}
			return px;
		}
		win.getAbsY = function(){
			var py = win.GUI.y;
			var parent = this;
			while(parent = parent.GUI.parent){
				py += parent.GUI.parts["GUIClient"].offsetTop+parent.getClientY()+parent.GUI.y;
			}
			return py;
		}
		win.getHit = function(x,y){
			if(win.id == "frame"){
				for(var index in partsName){
					var p = win.GUI.parts[partsName[index]];
					var rect = p.getBoundingClientRect();
					if(x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom)
						return partsName[index];
				}
			}else{
				return "GUIClient";
			}
			return null;
		}
		win.isHit = function(x,y){
			if(GUI.rootWindow == this)
				return true;
			var rect={};
			if(win.id == "frame"){
				var rect1 = win.GUI.parts["GUIBorderTopLeft"].getBoundingClientRect();
				var rect2 = win.GUI.parts["GUIBorderBottomRight"].getBoundingClientRect();
				rect.left = rect1.left;
				rect.top = rect1.top;
				rect.right = rect2.right;
				rect.bottom = rect2.bottom;
			}
			else
				rect = win.getBoundingClientRect();
			return (x >= rect.left && y >= rect.top && x < rect.right && y < rect.bottom);
		}
		win.getWindow = function(x,y){
			win.sortChild();
			if(win.isHit(x,y)){
				var childList = win.GUI.child;
				for(var i=0;i<childList.length;i++){
					var child = childList[i].getWindow(x,y);
					if(child)
						return child;
				}
				return this;
			}
			return null;
		}

		win.setBackgroundColor=function(color){
			var client = win.GUI.parts["GUIClient"];
			if(color == 0)
				client.style.backgroundColor = "transparent";
			else
				client.style.backgroundColor = getARGB(color);
		}
		win.getWidth = function(){
			return win.GUI.width;
		}
		win.getHeight = function(){
			return win.GUI.height;
		}
		win.setWidth = function(width){
			this.setSize(width,win.GUI.height);
		}
		win.setHeight = function(height){
			this.setSize(win.GUI.width,height);
		}
		win.getBorderSize = function(){
			return 0;
		}
		win.setPadding = function(x1,y1,x2,y2){
			this.GUI.padding.x1 = x1;
			this.GUI.padding.y1 = y1;
			this.GUI.padding.x2 = x2;
			this.GUI.padding.y2 = y2;
		}
		win.getClientX = function(){
			return this.GUI.padding.x1;
			//return this.getBorderSize()+this.GUI.padding.x1;
		}

		win.getClientY = function(){
			//if(GUI.rootWindow == this)
				return this.GUI.padding.y1;
		/*	if(win.id == "frame"){
				titleSize = win.GUI.parts["GUITitle"].offsetHeight;
				return titleSize+this.GUI.padding.y1 + this.getBorderSize();
			}
			return 0;*/
		}
		win.getClientWidth = function(){
			if(GUI.rootWindow == this)
				return getClientWidth();
			return win.GUI.width - this.getClientX()-this.GUI.padding.x2;
		}
		win.getClientHeight = function(){
			if(GUI.rootWindow == this)
				return getClientHeight();
			return win.GUI.height - this.getClientY()-this.GUI.padding.y2;
		}
		win.setTitle = function(name){
			win.GUI.title = name;
			win.GUI.parts["GUITitleText"].textContent = name;;
		}
		win.callEvent = function(e){
			var eventList = win.GUI.events[e.etype];
			if(eventList){
				for(var i=0;i<eventList.length;i++)
					eventList[i].call(this,e);
			}
		}
		win.addEvent = function(name,func){
			var eventList = win.GUI.events[name];
			if(!eventList){
				eventList = [];
				win.GUI.events[name] = eventList;
			}
			eventList.push(func);
		}
		win.getClient = function(){
			return win.GUI.parts["GUIClient"];
		}
		win.setChildStyle = function(arrangement){
			win.GUI.arrangement = arrangement;
		}


		GUI.root.appendChild(win);
		if(GUI.rootWindow)
			GUI.rootWindow.addChild(win);
		win.requestLayout();
		return win;
	};

	GUI.createSeparate = function(pos,type){
		var win = GUI.createWindow();
		win.setSize(640,480);
		win.addSeparateChild = function(index,child,arrangement){
			win.GUI.separateChildList[index].addChild(child,arrangement);
		}
		win.setSeparatePos = function(pos,type){
			win.GUI.separatePos = pos;
			if(type != null){
				win.GUI.separateType = type;
				separate.GUI.parts["GUIClient"].id = type;
			}
			win.requestLayout();
		}
		win.GUI.separateThick = 10;
		win.GUI.separatePos = (pos==null?100:pos);
		win.GUI.separateType = (type==null?"we":type);
		win.GUI.separateChildList = [GUI.createWindow(),GUI.createWindow()];
		var separate = GUI.createWindow();
		win.addChild(separate);
		win.addChild(win.GUI.separateChildList[0]);
		win.addChild(win.GUI.separateChildList[1]);

		separate.id = "GUISeparate";
		separate.GUI.parts["GUIClient"].id=win.GUI.separateType;

		win.getChild = function(index){
			return win.GUI.separateChildList[index];
		}
		separate.addEvent("mousemove",function(e){
			if(GUI.selectWindow == separate){
				var width = win.getClientWidth();
				var height = win.getClientHeight();
				var separateThick = win.GUI.separateThick;
				switch(win.GUI.separateType){
					case "ns":
						win.GUI.separatePos = GUI.moveY2;
						break;
					case "sn":
						win.GUI.separatePos = height-(GUI.moveY2+separateThick);
						break;
					case "we":
						win.GUI.separatePos = GUI.moveX2;
						break;
					case "ew":
						win.GUI.separatePos = width - (GUI.moveX2+separateThick);
						break;

				}
				win.requestLayout();
				e.preventDefault();
			}
		});
		separate.addEvent("layout",function(){
			var width = win.getClientWidth();
			var height = win.getClientHeight();
			var separateThick = win.GUI.separateThick;

			if(win.GUI.separatePos < 0)
				win.GUI.separatePos = 0;
			switch(win.GUI.separateType){
				case "we":
					if(win.GUI.separatePos >= width-separateThick)
						win.GUI.separatePos = width-separateThick-1;
					separate.setSize(separateThick,height);
					separate.GUI.x = win.GUI.separatePos;
					separate.GUI.y = 0;
					win.GUI.separateChildList[0].setSize(separate.GUI.x,height);
					win.GUI.separateChildList[1].GUI.x = separate.GUI.x+separateThick;
					win.GUI.separateChildList[1].setSize(width-(separate.GUI.x+separateThick),height);
					break;
				case "ew":
					if(win.GUI.separatePos >= width-separateThick)
						win.GUI.separatePos = width-separateThick-1;
					separate.setSize(separateThick,height);
					separate.GUI.x = width-(win.GUI.separatePos+separateThick);
					separate.GUI.y = 0;
					win.GUI.separateChildList[1].setSize(separate.GUI.x,height);
					win.GUI.separateChildList[0].GUI.x = separate.GUI.x+separateThick;
					win.GUI.separateChildList[0].setSize(width-(separate.GUI.x+separateThick),height);
					break;
				case "ns":
					if(win.GUI.separatePos >= height-separateThick)
						win.GUI.separatePos = height-separateThick-1;
					separate.setSize(width,separateThick);
					separate.GUI.x = 0;
					separate.GUI.y = win.GUI.separatePos;
					win.GUI.separateChildList[0].setSize(width,win.GUI.separatePos);
					win.GUI.separateChildList[1].GUI.y = win.GUI.separatePos+separateThick;
					win.GUI.separateChildList[1].setSize(width,height-(win.GUI.separatePos+separateThick));
					break;
				case "sn":
					if(win.GUI.separatePos >= height-separateThick)
						win.GUI.separatePos = height-separateThick-1;
					separate.setSize(width,separateThick);
					separate.GUI.x = 0;
					separate.GUI.y = height-(win.GUI.separatePos+separateThick);
					win.GUI.separateChildList[1].setSize(width,separate.GUI.y);
					win.GUI.separateChildList[0].GUI.y = separate.GUI.y+separateThick;
					win.GUI.separateChildList[0].setSize(width,height-(separate.GUI.y+separateThick));
					break;
			}
		});
		return win;
	};
	GUI.createAdapterList = function(){
		var win = GUI.createWindow();
		var client = win.getClient();
		var mAdapter;
		win.setAdapter = function(adapter){
			mAdapter = adapter;
		}
		win.update = function(){

		}
		return win;
	}
	GUI.createTreeView = function(){
		var win = GUI.createWindow();
		win.getClient().classList.add("GUITreeView");
		win.treeSelect = null;
		win.treeDrag = null;
		win.treeDragX;
		win.treeDragY;

		//ドラッグ関係イベント処理
		document.addEventListener('mouseup', function () {
			win.treeDrag = null;
		});
		document.addEventListener('mousemove', function () {
			if (win.treeDrag) {
				var x = win.treeDragX - GUI.getMouseX();
				var y = win.treeDragY - GUI.getMouseY();
				var l = x * x + y * y;
				if (l >= 8 * 8) {
					var node = GUI.createMoveNode(GUI.mouseX, GUI.mouseY);
					var drag = win.treeDrag;
					win.treeDrag = null;
					node.addEvent("drag", function (e) {
						e.etype = "itemDrag";
						win.callEvent({ etype: "itemDrag", item: drag });
					});
				}
			}
		});

		function createItem(value){
			var html =
				"<div class='GUITreeRow'>"+
					"<div class='GUITreeIcon'></div>"+
					"<div class='GUITreeBody'></div>"+
				"</div>"+
				"<div class='GUITreeRow'>"+
					"<div class='GUITreeChild'></div>"+
				"</div>";

			var item = document.createElement("div");
			item.GUI = {opend:true};
			item.id = "alone";
			item.className = "GUITreeItem";
			item.innerHTML = html;
			item.treeIcon = item.querySelector(".GUITreeIcon");
			item.treeChild = item.querySelector(".GUITreeChild");
			item.treeBody = item.querySelector(".GUITreeBody");
			item.treeRow = item.querySelector(".GUITreeRow");
			item.dataset.select = false;
			item.treeRow.addEventListener("click",function(e){
				item.select();
				//e.preventDefault();
			});
			item.treeRow.addEventListener("dblclick", function (e) {
				win.callEvent({ etype: "itemDblclick",item:item });
				//e.preventDefault();
			});
			item.openItem = function(flag){
				this.GUI.opend = flag;
				if(item.getChildCount() == 0)
					item.id = "alone";
				else{
					item.id=item.GUI.opend?"open":"close";
					if (item.GUI.opend){
						item.querySelectorAll(".GUITreeItem#open > .GUITreeRow:nth-child(2) > .GUITreeChild > .GUITreeItem").forEach(function (n) {
							n.style.animation = "treeOpen 0.3s ease 0s 1 normal";
							n.style.display = 'block';
						});
					}else{
						item.treeChild.querySelectorAll(".GUITreeItem").forEach(function (n) {
							n.style.animation = "treeClose 0.8s ease 0s 1 forwards";
						});
					}

				}
			}
			item.treeIcon.addEventListener("click",function(e){
				item.openItem(!item.GUI.opend);
				e.preventDefault();
				e.stopPropagation()
			});
			item.treeRow.addEventListener("mouseover",function(e){
				win.GUI.hoverItem = item;
				e.etype = "itemOver";
				e.item = item;
				win.callEvent(e);
			});
			item.treeRow.addEventListener("mouseleave",function(e){
				e.etype = "itemLeave";
				e.item = win.GUI.hoverItem;
				win.callEvent(e);
				win.GUI.hoverItem = null;
			});

			//ドラッグ処理準備
			item.addEventListener("mousedown", function(){
				if (win.getSelectItem() == this){
					win.treeDrag = this;
					win.treeDragX = GUI.getMouseX();
					win.treeDragY = GUI.getMouseY();
				}
			});

			item.setItemValue = function(value){
				this.value = value;
			}
			item.getItemValue = function(){
				return this.value;
			}
			item.setItemText = function(value){
				this.treeBody.textContent = value;
			}
			item.getItemText = function(){
				return this.treeBody.textContent;
			}
			item.getChildCount = function(){
				return this.treeChild.childNodes.length;
			}
			item.getChild = function(index){
				return this.treeChild.childNodes[index];
			}
			item.getParentItem = function(){
				if(this === rootItem)
					return null;
				return this.parentNode.parentNode.parentNode;
			}
			item.addItem = function(value,flag){
				var subItem = createItem(value);
				this.treeChild.appendChild(subItem);
				if(flag != null)
					this.GUI.opend = flag;
				this.id=this.GUI.opend?"open":"close";
				if (!this.GUI.opend)
					subItem.style.display = 'none';
				return subItem;
			}
			item.clearItem = function(){
				var childs = this.treeChild.childNodes;
				while (childs.length){
					this.treeChild.removeChild(childs[0]);
				}
			}
			item.delItem = function(){
				if(this != rootItem)
					this.parentNode.removeChild(this);

				if(this.getChildCount() == 0)
					this.id = "alone";
			}
			item.findItem = function(value){
				if(this.getItemValue() == value)
					return this;
				var nodes = this.treeChild.childNodes;
				var count = nodes.length;
				for(var i=0;i<count;i++){
					var child = nodes[i];
					var f = child.findItem(value);
					if(f != null)
						return f;
				}
				return null
			}
			item.getItemArea = function(){
				var rect = this.treeBody.getBoundingClientRect();
				var x = rect.left;
				var y = rect.top;
				return {x:x,y:y,width:rect.width,height:rect.height};
			}

			item.select = function(){
				if(win.treeSelect != this){
					this.dataset.select = true;
					if(win.treeSelect)
						win.treeSelect.dataset.select = false;
					win.treeSelect = item;
				}
				win.callEvent({etype:"select"});
			}
			item.getOpenValues = function(values){
				if(this.GUI.opend)
					values.push(this.getItemValue());
				var childs = this.treeChild.childNodes;
				for(var i=0;i<childs.length;i++){
					var child = childs[i];
					child.getOpenValues(values);
				}
			}
			item.setOpenValues = function(values){
				this.openItem(values.indexOf(this.getItemValue()) >= 0);

				var childs = this.treeChild.childNodes;
				for(var i=0;i<childs.length;i++){
					var child = childs[i];
					child.setOpenValues(values);
				}
			}
			item.setItemText(value);
			item.moveItem = function(vector){
				var parent = this.getParentItem();
				if(parent === null)
					return false;
				var childs = parent.treeChild.childNodes;
				for (var i = 0; i < childs.length; i++) {
					if (childs[i] === this){
						if(vector < 0){
							if(i === 0)
								return false;
							parent.treeChild.insertBefore(this, childs[i - 1]);
						}else{
							if (i === childs.length-1)
								return false;
							parent.treeChild.insertBefore(childs[i + 1],this);
						}
						break;
					}
				}
			}

			return item;
		}
		var client = win.GUI.parts.GUIClient;
		var rootItem = createItem("root");
		client.appendChild(rootItem);
		win.clearItem = function(){
			client.removeChild(rootItem);
			rootItem = createItem("root");
			client.appendChild(rootItem);
		}
		win.findItem = function(value){
			return rootItem.findItem(value);
		}
		win.addItem = function(value,flag){
			return rootItem.addItem(value,flag==null?true:flag);
		}
		win.getRootItem = function(){
			return rootItem;
		}
		win.getSelectItem = function(){
			return this.treeSelect;
		}
		win.getSelectValue = function(){
			if(this.treeSelect == null)
				return null;
			return this.treeSelect.getItemValue();
		}
		win.setSelectValue = function(value){
			var item = this.findItem(value);
			if(item != null)
				item.select();

		}
		win.getHoverItem = function(){
			return this.GUI.hoverItem;
		}
		win.getOpenValues = function(){
			var values = [];
			rootItem.getOpenValues(values);
		}
		win.setOpenValues = function(values){
			rootItem.setOpenValues(values);
		}
		return win;
	};

	GUI.createScrollView = function () {
		var win = GUI.createWindow();
		var clinet = win.getClient();
		var mClient = document.createElement("div");
		mClient.style.position = "absolute";
		mClient.style.overflow = "hidden";
		mClient.style.left = "0px";
		mClient.style.top = "0px";
		mClient.style.width = "0px";
		mClient.style.height = "0px";
		clinet.appendChild(mClient);

		var mArea = document.createElement("div");
		clinet.appendChild(mArea);
		mArea.style.overflow = "auto";
		mArea.style.position = "absolute";

		var mScroll = document.createElement("div");
		mArea.appendChild(mScroll);
		mScroll.style.position = "absolute";

		var view_setSize = win.setSize;
		//---------------------------------------
		//ウインドウサイズの設定
		//[引数]
		//width  幅
		//height 高さ
		//[戻り値]無し
		win.setSize = function (width, height) {
			view_setSize.call(this,width, height);
			mArea.style.width = this.getWidth() + "px";
			mArea.style.height = this.getHeight() + "px";
			mClient.style.width = mArea.clientWidth + "px";
			mClient.style.height = mArea.clientHeight + "px";
		}
		win.setScrollSize = function (width, height) {
			mScroll.style.width = width + "px";
			mScroll.style.height = height + "px";
		}
		win.getClientWidth = function () {
			return mArea.clientWidth;
		}
		win.getClientHeight = function () {
			return mArea.clientHeight;
		}
		var view_addChild = win.addChild;
		win.addChild = function (w) {
			view_addChild.call(this,w);
			mClient.appendChild(w);
		}
		mArea.onscroll = function (e) {
			if (win.onScroll)
				win.onScroll(mArea.scrollLeft, mArea.scrollTop);
		}
		win.getClientNode = function () {
			return mClient;
		}
		win.getScrollX = function () {
			return mArea.scrollLeft;
		}
		win.getScrollY = function () {
			return mArea.scrollTop;
		}
		return win;
	};
	GUI.createListView = function(){
		var mRedrawing = false;
		var mRedraw = false;
		var mWidths = [];
		var mColumnType = [];

		var view = GUI.createScrollView();
		view.className = view.className+" GUIListView";
		var mClient = document.createElement("div");
		view.getClientNode().appendChild(mClient);

		//サイズ計算用隠し領域
		var mHView = document.createElement("div");
		mHView.className = "ListWork";
		document.querySelector(".GUIArea").appendChild(mHView);

		var mHeaderNode = document.createElement("div");
		mHeaderNode.className = "HeaderWork";
		mHView.appendChild(mHeaderNode);

		var mHeader = mHeaderNode.childNodes;

		var mItemNode = document.createElement("div");
		mHView.appendChild(mItemNode);
		view.addEventListener("mouseleave",function (e) {
			mDownFlag = false;
		});

		view.addEventListener("mouseup",function (e) {
			mDownFlag = false;
		});

		var mOverHeaderIndex = -1;
		var mOverItemIndex = -1;
		var mOverSubItemIndex = -1;
		function onMouseMove(e) {
			var p = this.screenToClient(GUI.mouseX,GUI.mouseY);
			if(p.x >= this.getClientWidth() || p.y >= this.getClientHeight()){
				mOverItemIndex = -1;
				mOverHeaderIndex = -1;
			}else{
				var index = this.getItemIndex(p.y);
				mOverSubItemIndex = this.getSubItemIndex(p.x);
				if (index == -2) {
					mOverItemIndex = -1;
					mOverHeaderIndex = mOverSubItemIndex;
				}
				else {
					mOverHeaderIndex = -1;
					if (mOverItemIndex != index) {
						mOverItemIndex = index;
					}
				}
			}
			this.redraw();
		}
		view.addEventListener("mousemove", onMouseMove);
		view.addEventListener("mouseout",onMouseOut);
		view.addEvent("target", onTarget);
		function onMouseOut(){
			mOverItemIndex = -1;
			mOverHeaderIndex = -1;
			this.redraw();
		}


		function onTarget(flag) {
			this.redraw();
		}


		view.getHoverIndex = function () {
			return mOverItemIndex;
		}
		view.setColumnType = function(index,type){
			mColumnType[index] = type;
		}
		var mSelectIndex = [];
		var mLastIndex = 0;
		var mSortFlag = [];
		view.setSelectIndexes = function(items){
			mSelectIndex = items;
			this.redraw();
		}
		view.getSelectIndex = function () {
			if (mSelectIndex.length == 0)
				return -1;
			else
				return mSelectIndex[0];
		}
		view.getSelectIndexes = function () {
			return mSelectIndex;
		}
		view.getSelectValues = function () {
			var values = [];
			var count = mSelectIndex.length;
			for(var i=0;i<count;i++)
				values.push(this.getItemValue(mSelectIndex[i]));
			return values;
		}
		view.editText = function(index,subIndex){
			var area = this.getItemArea(index,subIndex);
			var edit = GUI.createEditView();
			edit.setText(this.getItemText(index,subIndex));
			edit.setSize(area.width,area.height);
			edit.setPos(area.x,area.y);
			edit.setOrderSystem(true);
			edit.setFocus();
			return edit;
		}
		view.editSelect = function(index,subIndex,items){
			var area = this.getItemArea(index,subIndex);
			var select = GUI.createSelectView();
			for(var i in items)
				select.addText(items[i]);
			select.setSize(area.width,200);
			select.setPos(area.x,area.y);
			select.setOrderSystem(true);
			return select;
		}
		var select = false;
		var px;
		var py;
		view.addEvent("mousedown",onMouseDown);
		function onMouseDown(e){
			select = true;
			px = GUI.getMouseX();
			py = GUI.getMouseY();
		}
		document.addEventListener('mouseup', function(){select=false;});
		document.addEventListener('mousemove', function(){
			if(mSelectIndex.length == 0)
				return;
			var x = px - GUI.getMouseX();
			var y = py - GUI.getMouseY();
			var l = x*x+y*y;
			if(select == true && l >= 8*8){
				var node = GUI.createMoveNode(GUI.mouseX,GUI.mouseY);
				node.addEvent("drag",function(e){
					e.etype = "itemDrag";
					view.callEvent(e);
				});
				select=false;
			}

		});

		view.addEvent("mouseclick", onMouseClick);
		function onMouseClick(e) {
			var p = this.screenToClient(GUI.mouseX,GUI.mouseY);
			if(p.x >= this.getClientWidth() || p.y >= this.getClientHeight()){
				return;
			}
			if (e.cx < this.getClientWidth() && e.cy >= this.getHeaderHeight() && e.cy < this.getClientHeight())
			{
				mDownFlag = true;
			}

			var index = this.getItemIndex(e.cy);
			var subIndex = this.getSubItemIndex(e.cx);
			if (index == -2) {
				this._sort(subIndex);
				return;
			}
			if (index < 0)
				return;

			if (GUI.isCtrl()) {
				var point = mSelectIndex.indexOf(index);
				if (point == -1) {
					mLastIndex = index;
					mSelectIndex.push(index);
				}
				else {
					index = -1;
					mSelectIndex.splice(point, 1);
				}
			}
			else if (GUI.isShift()) {
				var start;
				var end;
				if (index > mLastIndex) {
					start = mLastIndex;
					end = index;
				}
				else {
					start = index;
					end = mLastIndex;
				}

				for (var i = start; i <= end; i++) {
					var point = mSelectIndex.indexOf(i);
					if (point == -1) {
						mSelectIndex.push(i);
					}
				}
			}
			else {
				mSelectIndex = [index];
				mLastIndex = index;
			}
			this.redraw();

			var e = {};
			e.type = "itemClick";
			e.etype = "itemClick";
			e.itemIndex = index;
			e.itemSubIndex = subIndex;
			e.next = true;

			if(index == mBeforeIndex && subIndex == mBeforeSubIndex){
				e.before = true;
			}else{
				e.before = false;
				mBeforeIndex = index;
				mBeforeSubIndex = subIndex;
			}

			view.callEvent(e);

		}
		var mBeforeIndex = -1;
		var mBeforeSubIndex = -1;


		view.addEvent("mousedblclick", onMouseDblClick);
		function onMouseDblClick(e) {
			var p = this.screenToClient(GUI.mouseX,GUI.mouseY);
			e.etype = "itemDblClick";
			e.itemIndex = this.getItemIndex(p.y);
			e.itemSubIndex = this.getSubItemIndex(p.x);
			if (e.itemIndex >= 0)
				view.callEvent(e);
		}
		view.getItemArea = function(index,index2){
			for(var i=mHeader.length;i<mNodes.length;i+=mHeader.length){
				var node = mNodes[i];
				if(node.itemIndex == index){
					var node2 = mNodes[index2];
					if(!node || !node2)
						return null;
					var x = node2.offsetLeft+this.getAbsX();
					var y = node.offsetTop+this.getAbsY();
					return {x:x,y:y,width:node2.clientWidth,height:node.clientHeight};
				}
			}
			return null;
		}
		view.getSubItemIndex = function (x) {
			for (var index = 0; index < mHeader.length; index++) {
				var node = mNodes[index];
				if (node && node.offsetLeft + node.clientWidth > x)
					return index;
			}
			return -1;
		}
		view.getItemIndex = function (y) {
			for (var index = 0; index < mNodes.length; index+=mHeader.length) {
				var node = mNodes[index];

				if (node.offsetTop + node.offsetHeight > y)
					return node.itemIndex;
			}
			return -1;
		}
		var mNodes = [];
		var mItemPadding = 3;
		function createSel(index) {
			if (mNodes[index]) {
				return mNodes[index];
			}
			var node = document.createElement("div");
			node.className = "Item";
			node.style.padding = mItemPadding + "px";
			node.style.margin = 0;
			node.setSize = function (width, height) {
				this.style.width = width + "px";
				this.style.height = height + "px";
				this.childNodes[0].style.width = width - mItemPadding * 2 + "px";
				this.childNodes[0].style.height = height - mItemPadding * 2 + "px";

			}
			node2 = document.createElement("div");
			node2.style.display = "table-cell";
			node2.style.verticalAlign = "middle";
			node2.style.overflow = "hidden";
			node.appendChild(node2);
			node.setPos = function (x, y) {
				this.style.left = x + "px";
				this.style.top = y + "px";

			}
			node.addChild = function (n) {
				this.innerHTML = "";
				this.appendChild(n);
			}
			mNodes.push(node);
			return node;
		}

		view.redraw = function () {
			if (!mRedraw)
			{
				mRedraw = true;
				setTimeout(function () { view._redraw(); }, 0);
			}
		}

		view._redraw = function () {
			if (!mRedraw || mRedrawing)
				return;
			if (!this.isVisible())
				return;
			mRedrawing = true;

			var x = this.getScrollX();
			var y = this.getScrollY();

			var splitX = 0;
			for (var i = 0; mWidths[i]; i++) {
				splitX += mWidths[i] + 1;
				var split = mHeaderNode.childNodes[i].split;
				split.__setPos(splitX - split.getWidth() / 2 + 1 - x, 0);
			}

			var parent = document.createElement("div");
			var headerHeight = this.getHeaderHeight() + mItemPadding * 2;
			var clientWidth = this.getClientWidth();
			var clientHeight = this.getClientHeight();
			var posX = 0;
			var posY = 0;
			//mNodes = [];
			var nodeIndex = 0;
			for (var i = 0; i < mHeader.length; i++) {
				var item = mHeader[i];
				var node = createSel(nodeIndex++);
				node.className = "Item Header";
				if (mOverHeaderIndex == i)
					node.className += " Select";

				node.itemIndex = -2;
				node.addChild(item.cloneNode(true));
				parent.appendChild(node);
				var width = mWidths[i];
				node.setPos(posX - x, 0);
				node.setSize(width, headerHeight);
				posX += width + 1;

			}

			posY += headerHeight + 1;
			for (var index = 0 ; index < mItemNode.childNodes.length; index++) {
				var itemLineNode = mItemNode.childNodes[index];
				var itemLine = itemLineNode.childNodes;
				var lineHeight = this.getLineHeight(index) + mItemPadding * 2;
				if (posY <= y - lineHeight) {
					posY += lineHeight + 1;
					continue;
				}
				if (posY - y >= clientHeight)
					break;
				posX = 0;
				for (var i = 0; i < mHeader.length; i++) {
					var item = itemLine[i];
					if (!item)
						continue;
					var node = createSel(nodeIndex++);
					node.itemIndex = index;
					if (mColumnType[i] === 1)
						node.style.textAlign = 'right';

					var className = "Item Item"+(index % 2);
					if (item){
						node.addChild(item.cloneNode(true));
					}
					if(mOverItemIndex == index)
						className += " ItemOver";

					if (mSelectIndex.indexOf(index) != -1) {
						className += " ItemSelect";
					}
					if(node.className != className)
						node.className = className;
					parent.appendChild(node);

					node.setPos(posX - x, posY - y);
					node.setSize(mWidths[i], lineHeight);

					posX += mWidths[i] + 1;
				}
				posY += lineHeight + 1;

			}
			if (mNodes.length > nodeIndex)
				mNodes.splice(nodeIndex, mNodes.length - nodeIndex);

			view.getClientNode().removeChild(mClient);
			view.getClientNode().appendChild(parent);
			mClient = parent;

			this.setScrollSize(this.getHeaderWidths(), this.getItemHeight() + headerHeight + 1);

			mRedrawing = false;
			mRedraw = false;

		}
		function onSized(e) {
			this.redraw();

		}
		view.addEvent("sized", onSized);
		view.onScroll = function (x, y) {
			this.redraw();
		}
		//---------------------------------------
		//ヘッダの追加
		//	[引数]   value  ヘッダ文字列
		//	[戻り値] インデックス番号
		view.addHeader = function (value,width) {
			var node = createNode(value);
			mHeaderNode.appendChild(node);

			var index = mHeaderNode.childNodes.length - 1;

			var split = createSplit();
			split.index = index;
			node.split = split;

			if(width == null)
				width = node.clientWidth + mItemPadding * 2;
			this.setHeaderWidth(index, width);
			return index;
		}

		//---------------------------------------
		//幅の自動設定
		//	[引数]   無し
		//	[戻り値] 無し
		view.autoWidth = function () {
			function call() {
				var width = view.getClientWidth() - 2;
				var widthAll = 0;
				var widths = [];
				var nodes = mHeaderNode.childNodes;
				for (var index = 0; nodes[index]; index++) {
					widths[index] = view.getContentWidth(index) + mItemPadding * 2;
					widthAll += widths[index];
				}
				var r = width / widthAll;
				for (var index = 0; nodes[index]; index++) {
					view.setHeaderWidth(index, parseInt(widths[index] * r));

				}
				view.redraw();
			}
			setTimeout(call, 0);
		}
		view.getContentWidth = function (index) {
			var width = 0;
			var node = mHeaderNode.childNodes[index];
			width = node.clientWidth;

			for (var i = 0; i < mItemNode.childNodes.length; i++) {
				var items = mItemNode.childNodes[i];
				var node = items.childNodes[index];
				if (node != null) {
					var w = items.childNodes[index].clientWidth;
					width = width > w ? width : w;
				}
			}
			return width;
		}
		view._sort = function (index) {
			if (index < 0)
				return;
			view.sort(index, !mSortFlag[index]);
		}
		var mSortFunc = [];
		var mSortIndex = 0;
		view.setSortFunc = function (index, func) {
			mSortFunc[index] = func;
		}
		view.isSortFlag = function (index) {
			return mSortFlag[index];
		}
		view.sort = function (index, flag) {
			if (index == null) {
				index = mSortIndex;
				flag = mSortFlag[index];
			}

			function sort(a, b) {
				var valueA = view.getItemText(a, index);
				var valueB = view.getItemText(b, index);
				if(mColumnType[index] === 1){
					if (valueA == '')
						return 1;
					if (valueB == '')
						return -1;
					valueA = parseFloat(valueA);
					valueB = parseFloat(valueB);
				}
				if (valueA < valueB)
					return -1 * sortFlag;
				if (valueA == valueB)
					return 0;
				return sortFlag;
			}
			mSortIndex = index;
			mSortFlag[index] = flag;
			var sortFlag = flag ? 1 : -1;

			var list = [];
			var listNode = [];
			for (var i = 0; i < mItemNode.childNodes.length; i++) {
				list.push(i);
				listNode.push(mItemNode.childNodes[i]);
			}
			if (mSortFunc[index])
				list.sort(mSortFunc[index]);
			else
				list.sort(sort);

			var nodes = document.createElement("div");
			for (var i = 0; i < list.length; i++) {
				nodes.appendChild(listNode[list[i]]);
			}


			mHView.appendChild(nodes);
			mHView.removeChild(mItemNode);
			mItemNode = nodes;

			this.redraw();
		}

		function createNode(value,type) {
			if (value != null && typeof (value) == "object")
				return value;
			var node = document.createElement("div");
			node.textContent = value;
			return node;
		}
		//---------------------------------------
		//アイテムの追加
		//	[引数]   value  アイテム文字列/タグ
		//	[戻り値] アイテム番号
		view.addItem = function (value) {
			var item = document.createElement("div");
			item.value = -1;
			item.style.top = "0px";
			item.style.left = "0px";
			item.appendChild(createNode(value), mColumnType[0]);

			//空データの追加
			var count = this.getHeaderCount();
			while (item.childNodes.length <= count)
				item.appendChild(createNode("", mColumnType[item.childNodes.length]));

			mItemNode.appendChild(item);

			this.redraw();
			return mItemNode.childNodes.length - 1;
		}
		//---------------------------------------
		//アイテムのクリア
		//	[引数]   無し
		//	[戻り値] 無し
		view.clearItem = function () {
			mSelectIndex = [];
			mOverItemIndex = -1;
			while (mItemNode.childNodes.length)
				mItemNode.removeChild(mItemNode.childNodes[0]);
			this.redraw();
		}
		//---------------------------------------
		//アイテムの設定
		//[引数]
		//index1 列番号
		//index2 行番号
		//value  表示内容(テキスト/エレメント)
		//[戻り値] 無し
		view.setItem = function (index1, index2, value) {
			var item = mItemNode.childNodes[index1];
			//空データの追加
			while (item.childNodes.length <= index2)
				item.appendChild(createNode(""));
			var node = createNode(value);
			node._value = item.childNodes[index2]._value;
			item.replaceChild(node, item.childNodes[index2]);
			this.redraw();
		}
		view.getItem = function (index1, index2) {
			var item = mItemNode.childNodes[index1];
			if (item) {
				var node = item.childNodes[index2];
				if (node) {
					return node;
				}
			}
			return null;
		}
		view.getItemText = function (index1, index2) {
			var item = mItemNode.childNodes[index1];
			if (item) {
				var node = item.childNodes[index2];
				if (node) {
					if (node.textContent)
						return node.textContent;
					else
						return node.textContent;
				}
			}
			return null;
		}
		view.setItemValue = function () {
			var index1 = arguments[0];
			var index2 = 0;
			var value;
			if (arguments.length > 2) {
				index2 = arguments[1];
				value = arguments[2];
			}
			else
				value = arguments[1];

			var item = mItemNode.childNodes[index1];
			//空データの追加
			while (item.childNodes.length <= index2)
				item.appendChild(createNode(""));
			item.childNodes[index2]._value = value;
		}
		view.getItemValue = function () {
			var index1 = arguments[0];
			var index2 = 0;
			if (arguments.length > 1) {
				index2 = arguments[1];
			}

			var item = mItemNode.childNodes[index1];
			if (item) {
				var node = item.childNodes[index2];
				if (node)
					return node._value;
			}
			return null;
		}
		view.editItem = function (index1,index2) {
			var item = mItemNode.childNodes[index1];
			if (item) {
				var node = item.childNodes[index2];
				node.focus();
			}
			return null;
		}
		view.setLineColor = function (index1, value) {
			var item = mItemNode.childNodes[index1];
			item._color = value;
		}

		view.setItemColor = function (index1, index2, value) {
			var item = mItemNode.childNodes[index1];
			item.childNodes[index2]._color = value;
		}
		view.setHeaderWidth = function (index, width) {
			mWidths[index] = width;
			this.redraw();
		}
		view.getHeaderWidths = function () {
			var x = 0;
			for (var i = 0; mWidths[i]; i++) {
				x += mWidths[i] + 1;
			}
			return x - (i ? 1 : 0);
		}
		view.getHeaderHeight = function () {
			var size = 0
			for (var index in mHeader) {
				var value = mHeader[index];
				if (value.offsetHeight) {
					size = value.offsetHeight > size ? value.offsetHeight : size;
				}
			}
			return size;
		}
		view.getItemHeight = function () {
			var height = 0;
			for (var index = 0; index < mItemNode.childNodes.length; index++) {
				height += this.getLineHeight(index) + 1;
			}
			height += index * mItemPadding * 2;
			return height;
		}
		view.getLineHeight = function (index) {
			var items = mItemNode.childNodes[index];
			var height = 0;
			for (var i = 0; items.childNodes[i]; i++) {
				height = height > items.childNodes[i].offsetHeight ? height : items.childNodes[i].offsetHeight;
			}
			return height;
		}
		view.getItemCount = function () {
			return mItemNode.childNodes.length;
		}
		view.getHeaderCount = function () {
			return mHeader.length;
		}
		view.findItem = function(value){
			var count = this.getItemCount();
			for(var i=0;i<count;i++){
				if(this.getItemValue(i) == value)
					return i;
			}
			return -1;
		}
		function createSplit() {
			var fl = GUI.createWindow();
			fl.setBackgroundColor(0);
			//fl.style.zIndex = 100;
			//fl.setOrderTop(true);
			fl.setMove(true);
			fl.setSize(10, 32);
			fl.style.backgroundColor = "";
			fl.style.cursor = "w-resize";
			var mSetPos = fl.setPos;
			fl.__setPos = fl.setPos;
			fl.setPos = function (x, y) {
				this._callback = mSetPos;
				this._callback(x, 0);

				var posX = 0;
				var index = this.index;
				for (var i = 0; i < index; i++)
					posX += mWidths[i] + 1;
				width = x - posX + fl.getWidth() / 2 + view.getScrollX();
				view.setHeaderWidth(index, width);
			}

			view.addChild(fl);
			return fl;
		}


		view.redraw();
		return view;
	}
	GUI.createMoveNode = function(baseX,baseY){
		var node = document.createElement("div");
		node.GUI = {events:[]};

		node.className = "GUIMoveNode";
		node.style.width = "64px";
		node.style.height = "64px";

		node.setPos = function(x,y){
			this.style.left = x+"px";
			this.style.top = y+"px";
		}
		node.isEvent = function(){
			var eventList = this.GUI.events[e.etype];
			if(eventList != null && eventList.length > 0)
				return true;
			return false;
		}
		node.callEvent = function(e){
			var eventList = this.GUI.events[e.etype];
			if(eventList){
				for(var i=0;i<eventList.length;i++)
					eventList[i].call(this,e);
			}
		}
		node.addEvent = function(name,func){
			var eventList = this.GUI.events[name];
			if(!eventList){
				eventList = [];
				node.GUI.events[name] = eventList;
			}
			eventList.push(func);
		}
		node.delEvent = function(name,func){
			if(func == null){
				delete node.GUI.events[name];
			}else{
				var eventList = this.GUI.events[name];
				for(var index in eventList){
					if(eventList[index] == func){
						delete eventList[index];
					}
				}
			}
		}

		var x = GUI.getMouseX();
		var y = GUI.getMouseY();

		function onMouseUp(){
			document.removeEventListener("mouseup",onMouseUp);
			document.removeEventListener("mousemove",onMouseMove);
			node.parentNode.removeChild(node);
			var e = {etype:"drag"};
			node.callEvent(e);
		}
		function onMouseMove(){
			var mx = x - GUI.getMouseX();
			var my = y - GUI.getMouseY();
			node.setPos(baseX-mx,baseY-my);
		}
		document.addEventListener("mouseup",onMouseUp);
		document.addEventListener("mousemove",onMouseMove);
		node.setPos(x,y);
		document.body.appendChild(node);
		return node;
	}
	GUI.createSelectView = function(){
		var win = GUI.createWindow();
		win.id = "overlap";
		var client = win.getClient();
		client.className = "GUISelect";

		win.show = function(node){
			var r = node.getBoundingClientRect();
			this.setSize(r.width,200);
			this.setPos(r.left,r.top+r.height);
			this.setOrderSystem(true);
		}
		win.addText = function(name,value){
			var div = document.createElement("div");
			div.textContent = name;
			if(value == null)
				div.value = name;
			else
				div.value = value;
			div.addEventListener("click",onClick);
			client.appendChild(div);
		}
		function onClick(e){
			e.etype = "select";
			e.name = this.textContent;
			e.value = this.value;
			win.close();
			win.callEvent(e);
		}
		function onBlur(e){
			win.close();
		}
		client.addEventListener("blur",onBlur);
		client.addEventListener("mouseleave",onBlur);
		function onForeground(e){
			if(!e.foreground)
				win.close();
		}
		win.addEvent("foreground",onForeground);
		win.setOrderTop(true);
		win.setForeground();
		client.blur();
		return win;
	}


	GUI.createTextInputWindow = function(){
		function onKeydown(e){
			switch(e.keyCode){
				case 9:
				case 13:
					onEnter();
				case 27:
					win.close();
					e.preventDefault();
					break;
			}
		}
		function onEnter(){
			var e = {"etype":"enter","value":input.value};
			win.callEvent(e);
		}

		var win = GUI.createFrameWindow();
		win.setSize(300,64);
		var textView = GUI.createWindow();
		var buttonView = GUI.createWindow();
		buttonView.setSize(40,32);
		win.getClient().classList.add("GUITextInput");
		win.addChild(textView,"client");
		win.addChild(buttonView,"right");
		textView.getClient().innerHTML = "<input>";
		buttonView.getClient().innerHTML = "<button>OK</button>";

		var input = textView.getClient().querySelector("input");
		var button = buttonView.getClient().querySelector("button");

		input.addEventListener("keydown",onKeydown);
		button.addEventListener("click",onEnter);

		win.setPos();
		input.focus();
		return win;
	}
	GUI.createEditView = function(){
		var win = GUI.createWindow();
		win.id = "overlap";
		var client = win.getClient();
		client.className = "GUIEditText";
		client.contentEditable = "true";
		var mText = "";
		function onKeydown(e){
			switch(e.keyCode){
				case 9:
				case 13:
					if(mText != client.textContent){
						e.etype = "enter";
						e.value = client.textContent;
						win.callEvent(e);
					}
				case 27:
					win.close();
					e.preventDefault();
					break;
			}
		}
		function onPaste(e){
			var text = e.clipboardData.getData("text/plain");
			document.execCommand("insertHTML", false, text);
			e.preventDefault();
		}
		function onBlur(e){
			if(!win.getParent())
				return;
			if(mText != client.textContent){
				var e = {};
				e.etype = "enter";
				e.value = client.textContent;
				win.callEvent(e);
			}
			win.close();
		}

		client.addEventListener("keydown",onKeydown);
		client.addEventListener("paste",onPaste);
		client.addEventListener("blur",onBlur);
		client.addEventListener("mouseleave",onBlur);

		win.setFocus = function(){
			GUI.setFocus(client);
		}
		win.setText = function(value){
			mText = value;
			client.textContent = value;
		}
		win.getText = function(){
			return client.innerHTML;
		}
		win.setOrderTop(true);
		return win;
	}
	GUI.createPanel = function(){
		var win = this.createWindow();
		win.setSize(32,32);
		win.getClient().className = "GUIPanel";
		win.setPadding(1,1,1,1);
		return win;
	}
	GUI.createButton = function(text){
		var button = document.createElement("button");
		button.className = "BUTTON";
		button.textContent = text;
		return button;
	}
	GUI.createMessageBox = function(title,msg,buttons,proc){
		var win = GUI.createFrameWindow();
		win.classList.add("GUIMessageBox");
		win.setSize(300,200);
		win.setTitle(title);
		win.setPos();

		var msgView = GUI.createWindow();
		msgView.getClient().classList.add("MSG");
		win.addChild(msgView,"client");
		msgView.getClient().textContent = msg;

		if(buttons != null){
			var msgPanel = GUI.createPanel();
			msgPanel.getClient().classList.add("PANEL");
			win.addChild(msgPanel,"bottom");
			for(var index in buttons){
				var b = buttons[index];
				var button = GUI.createButton(b);
				button.value = index;
				msgPanel.getClient().appendChild(button);
				button.addEventListener("click",onClick);
			}
		}


		function onClick(e){
			if(proc != null)
				proc(this.value);
			win.close();
		}
		return win;
	}

	GUI.createColorPicker = function () {
		//色初期設定
		var mC = [0, 0, 0];
		var mL = [255, 255, 255];
		var mTriangle;
		var mTargetSize = 32;

		var win = GUI.createWindow();

		var frame = win.getClient();
		frame.style.userSelect = "none";
		frame.style.backgroundColor = "black";
		win.addEvent("sized",size);

		var canvasTarget = document.createElement("canvas");
		canvasTarget.style.position = "absolute";
		frame.appendChild(canvasTarget);

		var canvasLevel = document.createElement("canvas");
		canvasLevel.style.position = "absolute";
		canvasLevel.style.cursor = "crosshair";
		frame.appendChild(canvasLevel);

		var canvas = document.createElement("canvas");
		canvas.style.position = "absolute";
		canvas.style.cursor = "crosshair";
		frame.appendChild(canvas);


		canvas.addEventListener("mousemove", function (e) {
			if(e.buttons == 0)
				return;
			setTriangleColor(e);
		}, false);
		canvas.addEventListener("click", setTriangleColor, false);

		function setTriangleColor(e){
			var rect = e.target.getBoundingClientRect();
			mouseX = e.clientX - rect.left;
			mouseY = e.clientY - rect.top;
			var r = getColor(mouseX, mouseY, point[0][0], point[0][1]);
			var g = getColor(mouseX, mouseY, point[1][0], point[1][1]);
			var b = getColor(mouseX, mouseY, point[2][0], point[2][1]);
			setLevel(r,g,b);
		}

		canvasLevel.addEventListener("mousemove", function (e) {
			if(e.buttons == 0)
				return;
			var rect = e.target.getBoundingClientRect();
			mouseX = e.clientX - rect.left;
			mouseY = e.clientY - rect.top;
			mL[0] = getColorLevel(mouseY, mC[0]);
			mL[1] = getColorLevel(mouseY, mC[1]);
			mL[2] = getColorLevel(mouseY, mC[2]);
			setTarget();
		}, false);
		win.setColor = function(color){
			mL = [color>>16, (color>>8)&0xff, color&0xff];
		}

		size();
		return win;

		function size(){
			//一端サイズ確定
			win.layout();

			canvasTarget.width = mTargetSize;
			canvasTarget.height = mTargetSize;

			canvasLevel.style.top = mTargetSize+"px";
			canvasLevel.width = mTargetSize;
			canvasLevel.height = win.getClientHeight()-mTargetSize;
			canvasLevel.style.marginRight = "2px";

			canvas.style.left = mTargetSize+"px";
			canvas.width = win.getClientWidth()-mTargetSize;
			canvas.height = win.getClientHeight();

			setLevel();
			drawTriangle();
		}



		function setTarget() {
			var ctx = canvasTarget.getContext('2d');
			ctx.fillStyle = "rgb(" + (255 - mL[0]) + "," + (255 - mL[1]) + "," + (255 - mL[2]) + ")";
			ctx.fillRect(0, 0, canvasTarget.width, canvasTarget.height);
			ctx.fillStyle = "rgb(" + mL[0] + "," + mL[1] + "," + mL[2] + ")";
			ctx.fillRect(2, 2, canvasTarget.width - 4, canvasTarget.height - 4);

			win.callEvent({etype:"color",r:mL[0],g:mL[1],b:mL[2]});
		}
		function getColor(px, py, cx, cy) {
			var value = parseInt((1 - Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2)) / mTriangle) * 255 * 1.1);
			if (value < 0)
				value = 0;
			else if (value > 255)
				value = 255;
			return value;
		}
		function setLevel(r, g, b) {
			if(r == null || g == null || b == null){
				r = mC[0];
				g = mC[1];
				b = mC[2];
			}
			else{
				mC[0] = r;
				mC[1] = g;
				mC[2] = b;
				mL[0] = r;
				mL[1] = g;
				mL[2] = b;
			}

			var ctxLevel = canvasLevel.getContext('2d');
			var grad = ctxLevel.createLinearGradient(0, canvasLevel.height, 0, 0);
			grad.addColorStop(0 + (1 - 1 / 1.1), "rgb(0,0,0)");
			grad.addColorStop(0.5, "rgb(" + r + "," + g + "," + b + ")");
			grad.addColorStop(1 - (1 - 1 / 1.1), "rgb(255,255,255)");
			ctxLevel.fillStyle = grad;
			ctxLevel.fillRect(0, 0, canvasLevel.width, canvasLevel.height);

			setTarget();
		}
		function getColorLevel(py, color) {
			var length = canvasLevel.height / 2;
			var level = (py - length) / length * 1.1;
			if (level < 0) {
				value = parseInt(255 * (-level) + color * (1 + level));
			}
			else {
				value = parseInt(color * (1 - level));
			}
			if (value < 0)
				value = 0;
			else if (value > 255)
				value = 255;
			return value;
		}

		function drawTriangle(){
			//クライアントサイズの取得
			var width = win.getClientWidth() - mTargetSize;
			var height = win.getClientHeight();
			//キャンバスサイズの修正
			canvas.width = width;
			canvas.height = height;

			var ctx = canvas.getContext('2d');
			ctx.clearRect(0,0, width, height)
			//トライアングルサイズの補正
			mTriangle = Math.min(width,height)*0.9;
			width = mTriangle
			height = mTriangle;

			var x = (canvas.width - width) / 2;
			var y = (canvas.height - height) / 2;
			point = [[x + width / 2, y], [x, y + height], [x + width, y + height]];
			var color = [
				['RGBA(255,0,0,255)', 'RGBA(0,0,0,255)'],
				['RGBA(0,255,0,255)', 'RGBA(0,0,0,255)'],
				['RGBA(0,0,255,255)', 'RGBA(0,0,0,255)']
			];
			ctx.globalCompositeOperation = "lighter";
			for (var i = 0; i < 3; i++) {
				var i0 = i % 3;
				var i1 = (i + 1) % 3;
				var i2 = (i + 2) % 3;
				/* 三角形を描く */
				var grad = ctx.createLinearGradient(point[i0][0], point[i0][1], (point[i1][0] + point[i2][0]) / 2, (point[i1][1] + point[i2][1]) / 2);
				grad.addColorStop(0, color[i][0]);
				grad.addColorStop(1 / 1.1, color[i][1]);
				ctx.fillStyle = grad;

				ctx.beginPath();
				ctx.moveTo(point[i0][0], point[i0][1]);
				ctx.lineTo(point[i1][0], point[i1][1]);
				ctx.lineTo(point[i2][0], point[i2][1]);
				ctx.closePath();
				/* 三角形を塗りつぶす */
				ctx.fill();
			}
		}


	}
	})();