function createTextEditor(){
	function convertLine(value){
		//開業補正
		var s = value.replace(/(?!(\r\n|\n|\r))(<div *)/g, '$1\n$2');
		s = s.replace(/(?!(\r\n|\n|\r))(<p *)/g, '$1\n$2');
		s = s.replace(/<br>(?!(\r\n|\n|\r))/g, '<br>\n$1');
		s = s.replace(/(\r\n|\n|\r){2}/g, '\n');
		return s;
	}
	function drawColorPicker(button) {
		var frame = GUI.createFrameWindow();
		var colorPicker = GUI.createColorPicker();
		frame.setTitle("カラーピッカー");
		colorPicker.setColor(button._color);
		colorPicker.addEvent("color",function (e)
		{
			var color = (255 << 24) + (e.r << 16) + (e.g << 8) + e.b;
			button._color = color;
			button.style.color = GUI.getARGB(color);
		});

		frame.addChild(colorPicker,"client");
		frame.setSize(400, 400);
		frame.setOrderSystem(true);
		frame.setPos();
	}
	function createLink(select)
	{
		function onLink(e){
			win.sendCommand("createLink",null,e.value);
			select.anchorNode.parentElement.target = '_blank';
			input.close();
		}
		var input = GUI.createTextInputWindow();
		input.setTitle("リンク");
		input.addEvent("enter",onLink);
		input.setOrderSystem(true);
		input.setSize(400,30);

	}

	function setPGCode(select){
		var range = select.getRangeAt(0);
		var text = range.toString();
		var text = text.replace(
			/["&'<>]/g,
			function( ch ) { return { '"':'&quot;', '&':'&amp;', '\'':'&#39;', '<':'&lt;', '>':'&gt;' }[ ch ]; }
			);
		range.deleteContents();
		range.insertNode(range.createContextualFragment("<code>" + text + "</code>"));
		updateHtmlTimer();
	}
	function createStdPanel(){
		function createButton(name,proc){
			var button = document.createElement("button");
			button.innerHTML = name;
			button.addEventListener("click",proc);
			return button;
		}
		function addButton(name,proc){
			var button = createButton(name,proc);
			panel.getClient().appendChild(button);
			return button;
		}

		var panel = win.addPanel();
		panel.addButton = addButton;
		var button;

		addButton("解",function(){win.sendCommand("removeFormat");});
		addButton("<strong>太</strong>",function(){win.sendCommand("bold");});
		addButton("<em>斜</em>",function(){win.sendCommand("italic");});
		addButton("<u>線</u>",function(){win.sendCommand("underline");});
		addButton("<del>消</del>",function(){win.sendCommand("strikeThrough");});
		addButton("Ａ",function(){createLink(iframe.contentWindow.getSelection());});
		addButton("CODE",function(){setPGCode(iframe.contentWindow.getSelection());});

		//文字サイズ
		addButton("大",function(){
			var r = this.getBoundingClientRect();
			var select = GUI.createSelectView();
			for(var i=1;i<=7;i++)
				select.addText(i);
			select.setSize(r.width,200);
			select.setPos(r.left,r.top+r.height);
			select.setOrderSystem(true);
			select.addEvent("select",function(e){win.sendCommand("fontSize",false,e.value);});
			});

		var group;
		//文字色
		group = document.createElement("span");
		group.className="group";
		panel.getClient().appendChild(group);
		button = createButton("色",function(){win.sendCommand("foreColor",false,colorButton.style.color);});
		group.appendChild(button);
		var colorButton = createButton("■",function(){drawColorPicker(this);});
		colorButton._color = 0xff000000;
		group.appendChild(colorButton);

		//背景色
		group = document.createElement("span");
		group.className="group";
		panel.getClient().appendChild(group);
		button = createButton("背",function(){win.sendCommand("backColor",false,colorButton2.style.color);});
		group.appendChild(button);
		var colorButton2 = createButton("■",function(){drawColorPicker(this);});
		colorButton2._color = 0xff000000;
		group.appendChild(colorButton2);

		return panel;
	}


	var win = GUI.createFrameWindow();
	win.classList.add("TextEdit");
	win.setTitle("テキストエディタ");
	win.setSize(1000,600);

	win.addPanel = function(){
		var panel = GUI.createPanel();
		panel.getClient().classList.add("PanelArea");
		win.addChild(panel,"top");
		return panel;
	}
	win.createElement = function(name){
		return iframe.contentDocument.createElement(name);
	}
	win.insertNode = function(node){
		var r = iframe.contentDocument.getSelection().getRangeAt(0);
		r.deleteContents();
		r.insertNode(node);
		updateHtmlTimer();
	}
	win.sendCommand = function(a,b,c){
		iframe.contentDocument.execCommand(a,b,c);
	}
	win.setHtml = function(value){
		mText.value = value;
		mHtml.innerHTML = value;
	}
	win.getHtml = function(){
		return convertLine(mHtml.innerHTML);
	}
	win.getHtmlBox = function(){
		return mHtml;
	}
	win.getTextBox = function(){
		return mText;
	}
	win.getStdPanel = function(){
		return mPanel;
	}
	win.getSelect = function(){
		return iframe.contentWindow.getSelection();
	}


	//ウインドウ分割
	var separate = GUI.createSeparate();
	separate.setSeparatePos(800,"we");
	win.addChild(separate,"client");
	var client0 = separate.getChild(0).getClient();
	client0.classList.add("HtmlEditArea");
	var client1 = separate.getChild(1).getClient();

	//テキスト編集エリアの作成の作成
	var iframe = document.createElement("iframe");
	client0.appendChild(iframe);
	iframe.contentDocument.head.innerHTML =
		"<style>body{word-break: break-all;}code{white-space:pre;display:block;background-color:#dddddd;}</style>";
	iframe.contentDocument.body.contentEditable = "true";
	var mHtml = iframe.contentDocument.body;

	var mText = document.createElement("textarea");
	client1.classList.add("TextEditArea");
	client1.appendChild(mText);

	//編集内容の更新用
	var mHtmlTimer;
	var mTextTimer;
	function updateHtmlTimer(){
		if(mHtmlTimer != null)
			clearTimeout(mHtmlTimer);
		mHtmlTimer = setTimeout(function(){
			mHtmlTimer = null;
			var s = convertLine(mHtml.innerHTML);
			if(s != mText.value)
				mText.value = s;
		},500);
	}
	function updateTextTimer(){
		if(mTextTimer != null)
			clearTimeout(mTextTimer);
		mTextTimer = setTimeout(function(){
			mTextTimer = null;
			if(mHtml.innerHTML != mText.value)
				mHtml.innerHTML = mText.value;
		},500);
	}

	if(window.document.documentMode){
		mHtml.addEventListener("keydown",function(){
			updateHtmlTimer();
		});
	}
	else{
		mHtml.addEventListener("input",function(){
			updateHtmlTimer();
	});
	}

	mText.addEventListener("input",function(){
		updateTextTimer();
	});

	mHtml.addEventListener("keydown",function(e){
		// if(e.keyCode == 13){
		// 	win.sendCommand("insertHtml",false,"<br>\u200C");
		// 	e.preventDefault();
		// }

	});
	function insertImage(files){
		//画像ファイルならDataURLに変換して貼り付ける
		for(var i=0;i<files.length;i++){
			var file = files[i];
			if(file.type.indexOf("image") != -1){
				var reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = function() {
					win.sendCommand("insertImage",false,reader.result);
				};
			}
		}
	}
	mHtml.addEventListener("paste",function(e){
		if(e.clipboardData.files.length){
			//insertImage(e.clipboardData.files);
		}else{
			var text = e.clipboardData.getData("text/plain");
			//text = text.replace(/\t/g,'    ');

			var text = text.replace(
				/(["&'<>\n\t ])/g,
				function( ch )
				{ return {
					'"':'&quot;', '&':'&amp;', '\'':'&#39;', '<':'&lt;', '>':'&gt;','\n':'<br>',
					' ':'&nbsp;','\t':'&nbsp;&nbsp;&nbsp;&nbsp;' }[ ch ]; });
			//win.sendCommand("insertText", false, text);
			win.sendCommand("insertHtml", false, text);

		}
		e.preventDefault();
	});
	mHtml.addEventListener("drop",function(e){
		//insertImage(e.dataTransfer.files);
		//e.preventDefault();
	});
	mHtml.ondragover = function (e) {
		e.preventDefault();
	}
	var mPanel = createStdPanel();


	mHtml.focus();
	return win;
}
