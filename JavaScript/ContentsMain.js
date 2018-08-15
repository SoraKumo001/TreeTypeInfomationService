var handle = null;
function scrollTo(node,pos){
	if(handle)
		clearInterval(handle);
	pos -= 20;
	if(pos < 0)
		pos = 0;
	handle = setInterval(function(){
		var p = pos - node.scrollTop;
		if(Math.abs(p) < 10){
			node.scrollTop = pos;
			clearInterval(handle);
			handle = null;
		}
		else
			node.scrollTop += p/3;

	},30);
}

function createContentsView(){
	var win = GUI.createWindow();
	var client = win.getClient();
	client.style = "overflow:auto;";
	var page = document.createElement("div");
	page.className = "ContentsPage";
	client.appendChild(page);
	win.loadContents = function(id){
		if (Contents.nodes[id]){
			scrollTo(client, Contents.nodes[id].offsetTop);
			return;
		}
		ADP.exec("Contents.getContentsPage",id).on=function(value){
			win.removeChildAll();
			if(value === null)
				return;
			Contents.nodes = [];
			while (page.childNodes.length)
				page.removeChild(page.childNodes[0]);
			page.appendChild(createContents(value));
		}
	}
	win.moveContents = function (id, vector){
		var node = Contents.nodes[id];
		if(node == null)
			return;
		var parent = node.parentNode;
		var childs = parent.childNodes;
		for (var i = 0; i < childs.length; i++) {
			if (childs[i] === node) {
				if (vector < 0) {
					if (i === 0)
						return false;
					parent.insertBefore(node, childs[i - 1]);
				} else {
					if (i === childs.length - 1)
						return false;
					parent.insertBefore(childs[i + 1], node);
				}
				break;
			}
		}
	}
	Contents.addEvent("update",function(r){
		var value = r.value;
		var contents = Contents.nodes[value["id"]];
		if (contents)
			contents.updateContents(value);
	});
	Contents.addEvent("delete", function (r) {
		var ids = r.ids;
		if (ids && ids.length > 0) {
			for (var i in ids) {
				var id = ids[i];
				var contents = Contents.nodes[id];
				if (contents) {
					contents.deleteContents();
				}
			}
		}
	});
	return win;
}
function createContents(value){
	var area = document.createElement('div');
	area.className = "ContentsArea";
	Contents.nodes[value["id"]] = area;
	var contents = document.createElement('div');
	contents.className = "Contents";
	area.appendChild(contents);

	//管理者用編集メニュー
	if (SESSION.isAuthority("SYSTEM_ADMIN"))
		contents.appendChild(createControlPanel(value["id"]));

	var title = document.createElement('div');
	title.className = "Title" + value["title_type"];
	contents.appendChild(title);

	var date = document.createElement('div');
	date.className = "Date";
	contents.appendChild(date);

	var body = document.createElement('div');
	body.className = "Body";
	contents.appendChild(body);

	var childs = document.createElement('div');
	childs.className = "Childs";
	area.appendChild(childs);

	var c = value["childs"];
	for(var i in c){
		childs.appendChild(createContents(c[i]));
	}
	area.updateContents = function(value){
		if (area.dataset.type === value["type"]){
			area.dataset.stat = value["stat"];
			title.textContent = value["title"];
			date.textContent = (new Date(value["date"])).toLocaleString();
			body.innerHTML = value["value"];
			body.querySelectorAll("img").forEach(function(node){
				node.onclick = function(){
					window.open(this.src, 'newtab');
				}
			});
		}
	}
	area.deleteContents = function () {
		area.parentNode.removeChild(this);
		Contents.nodes[value["id"]] = null;
	}
	area.dataset.type = value["type"];
	area.updateContents(value);
	return area;
}
function createControlPanel(id){
	function onClick(){
		switch(this.index){
		case 0:
			createCustomEditor(id);
			break;
		case 1:
			Contents.createContentsMenu(id, 'TEXT', this);
			break;
		case 2:
			Contents.moveContents(id, -1);
			break;
		case 3:
			Contents.moveContents(id, 1);
			break;
		}
	}

	var items = ["Edit", "🖹", "🔺", "🔻"];
	var panel = document.createElement('div');
	panel.className = "Panel";
	for(var i in items){
		var d = document.createElement('div');
		d.textContent = items[i];
		panel.appendChild(d);
		d.index = parseInt(i);
		d.addEventListener("click",onClick);
	}
	return panel;
}