function createCalendar(parent) {
	var view = createCalendarView();
	view.changeFrameWindow();
	view.setSize(400, 300);
	return view;
}
function createHolidayCanendar(parent) {
	var window = createCalendar(parent);
	function onClick(e) {
		var cell = e.currentTarget;
		var text = cell.childNodes[1];
		var rect = text.getBoundingClientRect();
		var edit = GUI.createEditView();


		edit.setText(text.innerText);
		edit.setSize(rect.width, rect.height);
		edit.setPos(rect.left, rect.top);
		edit.setOrderSystem(true);
		edit.setFocus();
		edit.addEvent("enter", function (e) {
			var values = {
				"command": "setHoliday", "sessionHash": sessionStorage.getItem("sessionHash"),
				"date": cell.date.toLocaleString(), "name": e.value
			};
			AFL.sendJson(SCRIPT_URL, values, function (r) {
				if (r != null && r.result) {
					text.innerText = e.value;
					cell.id = e.value == "" ? "" : "Holiday";
				}
			});
		});
	}
	window.getCalendar().addEvent("clickDay", onClick);
}
function createCalendarView() {
	var week = "日月火水木金土";
	var window = GUI.createWindow();
	window.GUI.date = new Date();
	var client = window.getClient();
	client.className = "GUICalendar";

	var table = document.createElement("table");
	client.appendChild(table);
	var titleLine = table.insertRow(-1);
	titleLine.className = "TitleLine";
	var prev = titleLine.insertCell(-1);
	prev.className = "Button";
	prev.innerText = "⇐";
	prev.addEventListener("click", prevMonth);
	var titleText = titleLine.insertCell(-1);
	titleText.colSpan = 5;
	titleText.className = "TitleText";

	var next = titleLine.insertCell(-1);
	next.innerText = "⇒";
	next.className = "Button";
	next.addEventListener("click", nextMonth);

	var cells = {};
	for (var j = 0; j < 7; j++) {
		var line = table.insertRow(-1);
		line.className = "Line";

		for (var i = 0; i < 7; i++) {
			var cell = line.insertCell(-1);
			cell.className = "Cell";
			cell.addEventListener("click", function (e) {
				var d = this.date.toLocaleDateString();
				if (window.GUI.eventDate && window.GUI.eventDate[d] != null)
					e.value = window.GUI.eventDate[d];
				e.etype = "clickDay";
				e.date = this.date;
				window.callEvent(e);
			});
			if (j == 0)
				cell.innerHTML = week.substr(i, 1);
			else {
				var cellBody = document.createElement("div");
				cellBody.className = "CellBody";
				cell.appendChild(cellBody);

				var day = document.createElement("div");
				day.className = "Day";
				cellBody.appendChild(day);
				var dayText = document.createElement("div");
				dayText.className = "DayText";
				cellBody.appendChild(dayText);


			}
		}
	}
	function nextMonth() {
		var date = window.GUI.date;
		window.setDate(new Date(date.getFullYear(), date.getMonth() + 1));
	}
	function prevMonth() {
		var date = window.GUI.date;
		window.setDate(new Date(date.getFullYear(), date.getMonth() - 1));
	}

	function getHoliday(dateStart) {
		var dateEnd = new Date(dateStart.getTime());
		dateEnd.setDate(dateEnd.getDate() + 42);
		ADP.exec("Calendar.getHoliday", dateStart, dateEnd).on = function (value) {
			if (value) {
				for (var i = 0; i < value.length; i++) {
					var value = value[i];
					var d = value[0].split('-').join('/');;
					var date = new Date(d);
					var cell = cells[date];
					if (cell) {
						cell.id = "Holiday"
						cell.childNodes[0].childNodes[1].innerText = value[1];
					}
				}
			}
		}
	}
	var mHolidays = {};
	function getHoliday(dateStart) {
		function drawHoliday(holidays) {
			for (var i = 0; i < holidays.length; i++) {
				var value = holidays[i];
				var d = value[0].split('-').join('/');;
				var date = new Date(d);
				var cell = cells[date];
				if (cell) {
					cell.id = "Holiday"
					cell.childNodes[0].childNodes[1].textContent = value[1];
				}
			}
		}

		var dateEnd = new Date(dateStart.getTime());
		dateEnd.setDate(dateEnd.getDate() + 42);
		var d = dateStart.toLocaleDateString() + dateEnd.toLocaleDateString();
		if (mHolidays[d] != null) {
			drawHoliday(mHolidays[d]);
			return;
		}

		ADP.exec("Calendar.getHoliday", dateStart, dateEnd).on = function (value) {
			if (value) {
				mHolidays[d] = value;
				drawHoliday(value);
			}
		};
	}

	window.redraw = function () {
		var now = new Date();
		var date = new Date(this.GUI.date.getFullYear(), this.GUI.date.getMonth(), 1);
		table.rows[0].cells[1].innerText = AFL.sprintf("%d年%d月", date.getFullYear(), date.getMonth() + 1);

		date.setDate(date.getDate() - date.getDay());
		var dateStart = new Date(date.getTime());
		this.GUI.start = dateStart;
		this.GUI.end = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate() + 42);

		cells = {};
		for (var j = 2; j < 8; j++) {
			for (var i = 0; i < 7; i++) {
				var d = new Date(date.getTime());
				var cell = table.rows[j].cells[i];
				cells[d] = cell;
				cell.date = d;
				cell.id = "";
				cell.childNodes[0].id = now.toLocaleDateString() == date.toLocaleDateString() ? "now" : "";
				cell.childNodes[0].childNodes[0].innerText = date.getDate();
				cell.childNodes[0].childNodes[1].innerText = "";

				if (this.GUI.eventDate != null && this.GUI.eventDate[date.toLocaleDateString()] != null)
					cell.classList.add("Event");
				else
					cell.classList.remove("Event");
				date.setDate(date.getDate() + 1);
			}
		}
		getHoliday(dateStart);
	}
	window.setEventDate = function (dates) {
		this.GUI.eventDate = dates;
	}
	window.setDate = function (date, flag) {
		this.GUI.date = new Date(date.getTime());
		this.redraw();
		var e = {};
		e.etype = "changeDate";
		e.date = this.GUI.date;
		e.start = this.GUI.start;
		e.end = this.GUI.end;
		e.redraw = flag == null ? true : flag;
		window.callEvent(e);
	}
	window.getDate = function () {
		return this.GUI.date;
	}
	window.redraw();
	return window;
}

function importHoliday() {
	var win = GUI.createWindow();
	win.setTitle("祝日のインポート(内閣府データ)");
	win.setSize(400, 200);
	win.setPos();

	var client = win.getClient();
	client.className = "IMPORT_CALENDAR";
	client.innerHTML = "<BUTTON>インポート実行</BUTTON>";
	var button = client.querySelector("button");
	button.addEventListener("click", function () {
		ADP.exec("Calendar.importHoliday").on = function (value) {
			if (value) {
				client.innerHTML = "正常終了";
			} else
				client.innerHTML = "異常終了";
		}
	});
	return win;
}