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
			//client.scrollTop = Contents.nodes[id].offsetTop;
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

			//scrollTo(client, Contents.nodes[id].offsetTop);
			//client.scrollTop = Contents.nodes[id].offsetTop;
		}
	}
	return win;
}
function createContents(value){
	var area = document.createElement('div');
	area.className = "ContentsArea";
	Contents.nodes[value["id"]] = area;
	var contents = document.createElement('div');
	contents.className = "Contents";
	area.appendChild(contents);

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
		title.textContent = value["title"];
		date.textContent = (new Date(value["date"])).toLocaleString();
		body.innerHTML = value["value"];
	}
	area.updateContents(value);
	return area;
}
function createControlPanel(id){
	function onClick(){
		switch(this.index){
		case 0:
			createCustomEditor(id);
			break;
		case 3:
			Contents.createContents(id, 2, 'TEXT');
			break;
		}
	}

	var items = ["Edit","C↑","C↓","C→","M↑","M↓"];
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