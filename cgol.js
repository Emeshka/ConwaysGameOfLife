//данные, необходимые для корректной и быстрой анимации
var animationArgs = {};

//alert("-2");
animationArgs.main = null;//канвас
animationArgs.counterGen = null;
animationArgs.stop = true;//остановить анимацию. когда мы первый раз кликаем, он переключается на false
animationArgs.drawMode = true;//способ ввода: true, если можно рисовать на канвасе мышкой; false, если щелчок по канвасу выбирает место вставки шаблонной фигуры
animationArgs.fig = '';//выбранная фигура
animationArgs.figRotate = 0;//0/1/2/3 - повернуть по часовой стрелке на это количество оборотов
animationArgs.figureMap = null;//карта уже повернутой фигуры
animationArgs.mouseDown = false;//левая кнопка мыши зажата и находится внутри канваса
animationArgs.lastCell = [-1, -1];//последняя клетка, которую мы раскрасили. Нужно чтобы mousemove не срабатывал сто раз на одной клетке подряд

var currentGen = null;
var numberOfGens = 0;
/*
Т.к. у нас есть различие 4-х состояний - жив, мертв, только что ожил, когда-то был жив, - то нам надо инты а не булевы.
0 - мертв
1 - мертв, но когда-то был жив
2 - жив, но только что ожил
3 - жив сейчас и был жив еще до текущего поколения
*/

//alert("-1");
//настройки анимации и отображения
var settings = {
	interval: 200,		//интервал смены кадров
	width: 50,		//ширина поля в клетках (квадратное)
	cell: 10,		//ширина клетки в пикселях (квадратная)
	aliveBack: '#035600',	//цвет живой клетки
	deadBack: '#ffffff',	//цвет неживой клетки
	highlightNew: '#004E70',//подсветить клетки, которые ожили только в этом поколении
	highlightUsed: '#D9E4CE',//подсветить клетки, в которых когда-либо была жизнь
	highlightImaginary: '#EFC46C',//подсветить клетки в которых будет расположена не поставленная еще фигура
	border: '#bbbbbb',//цвет границы между клетками
	pageBack: '#ffffff'//цвет фона страницы
};

function makeMatrix() {
	//console.log("makeMatrix()");
	var matrix = [];
	for (var i = 0; i<settings.width; i++) {
		matrix.push([]);
		for (var j = 0; j<settings.width; j++) {
			////console.log(i+', '+j);
			matrix[i].push(0);
		}
	}
	return matrix;
}

//предикат - запущен ли gui на движке Java FX
function runsUnderJavaFx() {
	return window.navigator.userAgent.toLowerCase().indexOf('javafx') > -1;
}

//alert('1');
//переопределение alert, чтобы в браузере не вылазили сообщения, предназначающиеся java
//переопределение //console.log, чтобы
//1)если в коде используется эта функция, мы смогли увидеть вывод, когда запускаем страницу под JavaFX
//2)смогли увидеть, даже если не подключен мост(мало ли), поэтому через alert (у него есть слушатель всегда)
if (runsUnderJavaFx()) {
	console._log = console.log;
	console.log = function(s) {
		alert('java::log()'+s);
	}
} else {
	window._alert = window.alert;
	window.alert = function(s) {
		if (s.startsWith('java::')) console.warn(s);
		else _alert(s);
	}
}

//alert('1.5');

//отладочная функция-наэкранный заменитель лога
function error(str) {
	var where = document.getElementById('error');
	if (where) where.innerHTML += str+"<br>";
	else //console.log("(error()) "+str);
	where.scrollTop = where.scrollHeight;
}
/*
//функция для автоскроллинга ответа по мере добавления записей
function out(str) {
	var where = document.getElementById('output');
	if (where) where.innerHTML += str+"<br>";
	else //console.log("(out()) "+str);
	where.scrollTop = where.scrollHeight;
}*/

//функция переключает видимость объекта
//только для блочных элементов
function toggle_show(id) {
	var elem = document.getElementById(id);
	elem.style.display = (elem.style.display=='block') ? 'none' : 'block';
}

function showSettings() {
	toggle_show('settings_list');
	toggle_show('settings_placeholder');
}
//alert('2');
//инициализируем
var initialize = function() {
	window.htmlLoaded = true;
	if (window.java) getSettings();
	//console.log('getSettings() finished');
	animationArgs.main = document.getElementById("main");//канвас
	if (!animationArgs.main) {
		alert('There\'s no element with id "main" on the page; animation cannot be played');
		return;
	}
	var ctx=animationArgs.main.getContext("2d");
	animationArgs.main.listenerOver = function(e) {
		if (animationArgs.drawMode) {
			if (!animationArgs.mouseDown) return;
			var mouse = {//относительно канваса
				x: e.offsetX==undefined ? e.layerX : e.offsetX,
				y: e.offsetY==undefined ? e.layerY : e.offsetY
			}
			var cellX = Math.floor(mouse.x / (settings.cell+1));
			var cellY = Math.floor(mouse.y / (settings.cell+1));
			if (cellX == animationArgs.lastCell[0] && cellY == animationArgs.lastCell[1]) return;
			if (cellX < 0 || cellY < 0 || cellX > settings.width || cellY > settings.width) return;
			////console.log("cell at position: "+cellX+", "+cellY);
			var alive = currentGen[cellX][cellY];
			if (alive == 2 || alive == 3) {
				ctx.fillStyle = settings.deadBack;
				currentGen[cellX][cellY] = 0;
				//console.log('was killed');
			} else {
				ctx.fillStyle = settings.aliveBack;
				currentGen[cellX][cellY] = 3;
				//console.log('became alive');
			}
			ctx.fillRect(1+cellX*(settings.cell+1), 1+cellY*(settings.cell+1), settings.cell, settings.cell);
			animationArgs.lastCell[0] = cellX;
			animationArgs.lastCell[1] = cellY;
			
		} else {// водим мышкой и выбираем, как поставить фигуру
			if (animationArgs.fig == '') return;
			if (!animationArgs.stop) return;
			var mouse = {
				x: e.offsetX==undefined ? e.layerX : e.offsetX,
				y: e.offsetY==undefined ? e.layerY : e.offsetY
			}
			var cellX = Math.floor(mouse.x / (settings.cell+1));
			var cellY = Math.floor(mouse.y / (settings.cell+1));
			if (cellX == animationArgs.lastCell[0] && cellY == animationArgs.lastCell[1]) return;
			if (cellX < 0 || cellY < 0 || cellX > settings.width || cellY > settings.width) return;
			////console.log("cell at position: "+cellX+", "+cellY);
			draw();
			var figureMap = animationArgs.figureMap;// уже повернута
			for (var i = 0; i < figureMap.length; i++) {
				for (var j = 0; j < figureMap[i].length; j++) {
					if (figureMap[i][j] == 0) continue;
					if (cellX+i >= settings.width || cellY+j >= settings.width) continue;
					
					ctx.fillStyle = settings.highlightImaginary;
					ctx.fillRect(1+(cellX+i)*(settings.cell+1), 1+(cellY+j)*(settings.cell+1), settings.cell, settings.cell);
				}
			}
			
			animationArgs.lastCell[0] = cellX;
			animationArgs.lastCell[1] = cellY;
		}
	}
	animationArgs.main.addEventListener('mousemove', animationArgs.main.listenerOver);
	currentGen = makeMatrix();
	draw();
	//makeRotatedMap(); - при старте фигура еще не выбрана
	var listenerDown = function(e) {
		animationArgs.mouseDown = true;
		if (animationArgs.drawMode) {
			animationArgs.main.listenerOver(e);
		} else {
			////console.log("put figure");
			if (animationArgs.fig == '') return;
			if (!animationArgs.stop) return;
			var mouse = {
				x: e.offsetX==undefined ? e.layerX : e.offsetX,
				y: e.offsetY==undefined ? e.layerY : e.offsetY
			}
			var cellX = Math.floor(mouse.x / (settings.cell+1));
			var cellY = Math.floor(mouse.y / (settings.cell+1));
			////console.log(cellX == animationArgs.lastCell[0] && cellY == animationArgs.lastCell[1]);
			//if (cellX == animationArgs.lastCell[0] && cellY == animationArgs.lastCell[1]) return;
			if (cellX < 0 || cellY < 0 || cellX > settings.width || cellY > settings.width) return;
			////console.log("ok");
			var figureMap = animationArgs.figureMap;// уже повернута
			for (var i = 0; i < figureMap.length; i++) {
				for (var j = 0; j < figureMap[i].length; j++) {
					if (figureMap[i][j] == 0) continue;
					if (cellX+i >= settings.width || cellY+j >= settings.width) continue;
					currentGen[cellX+i][cellY+j] = 3;
					/*ctx.fillStyle = settings.highlightImaginary;
					ctx.fillRect(1+(cellX+i)*(settings.cell+1), 1+(cellY+j)*(settings.cell+1), settings.cell, settings.cell);*/
				}
			}
			draw();
			
			animationArgs.lastCell[0] = cellX;
			animationArgs.lastCell[1] = cellY;
		}
		////console.log("onmousedown on canvas");
	}
	var listenerUp = function(e) {
		animationArgs.mouseDown = false;
		animationArgs.lastCell = [-1, -1];
		////console.log("onmouseup on body");
	}
	animationArgs.main.addEventListener('mousedown', listenerDown);
	document.body.addEventListener('mouseup', listenerUp);
	animationArgs.main.listener = function() {
		if (!animationArgs.stop) {
			numberOfGens++;
			animationArgs.counterGen.innerHTML = numberOfGens;
			var cur = JSON.stringify(currentGen);
			var result = java.nextGeneration(cur);
			////console.log("java.nextGeneration() replied");
			currentGen = JSON.parse(result);
			draw();
		} else {
			stop();
		}
	};

	animationArgs.counterGen = document.getElementById('counter_gen');
	document.getElementById('go').onclick = function() {
		animationArgs.stop = !animationArgs.stop;
		if (!animationArgs.stop) {
			if (window.htmlLoaded) start();
			else alert('Wait until window is loaded');
		} else {
			setReady('animationFinishedIndicator', 'Чтобы начать анимацию, нажмите кнопку Start!');
			var go_button = document.getElementById('go');
			go_button.value = 'Start!';
			go_button.className = 'button_designed_good';
		}
	};

	document.getElementById('right_column').style.display = 'block';
	document.getElementById('clear_button').style.display = 'none';
	var settingsChange = document.getElementById('settingsChange');
	if (settingsChange) {
		settingsChange.oninput = function() {//oninput всплывает
			setUnready('settingsAppliedIndicator', 'настройки не сохранены');
		};
	} else {
		alert('There\'s no element with id "settingsChange" on the page. You will not be able to change any settings using the textfields below.');
	}
	setReady('animationFinishedIndicator', 'Чтобы начать анимацию, нажмите кнопку Start!');
	setReady('settingsAppliedIndicator', 'Настройки не изменялись');
	document.getElementById('settings_list').style.display = 'none';
	document.getElementById('settings_placeholder').style.display = 'block';
	collectFigures();
	//console.log('initialize() finished');
};

//alert('3');
if (runsUnderJavaFx()) {
	//console.log('I\'m running under javafx');
} else {
	//console.log('I\'m running under some browser');
}

//alert('4');

//выход
function exit() {
	java.exit();
}

function setReady(id, message) {//id индикатора состояния какого-либо процесса
	var indicator = document.getElementById(id);
	indicator.style.backgroundColor = '#99ff99';
	indicator.style.borderColor = '#2BB62B';
	indicator.setAttribute('title', message);
}

function setUnready(id, message) {//id индикатора состояния какого-либо процесса
	var indicator = document.getElementById(id);
	indicator.style.backgroundColor = '';
	indicator.style.borderColor = '';
	indicator.setAttribute('title', message);
}

function draw() {// drawing matrix on canvas
	////console.log('draw()');
	var widthPixels = settings.width*(settings.cell + 1)+1;
	animationArgs.main.width = widthPixels;
	animationArgs.main.height = widthPixels;
	
	var ctx=animationArgs.main.getContext("2d");
	ctx.fillStyle = settings.border;
	ctx.fillRect(0, 0, animationArgs.main.width, animationArgs.main.height);

	var iBordersError = 1; var jBordersError = 1;
	for (var i = 1; i<widthPixels; i += settings.cell+1) {
		for (var j = 1; j<widthPixels; j += settings.cell+1) {
			////console.log(i+", "+j);
			var alive = currentGen[Math.floor((i-iBordersError) / settings.cell)][Math.floor((j-jBordersError) / settings.cell)];
			if (alive == 3) {
				ctx.fillStyle = settings.aliveBack;
			} else if (alive == 2) {
				ctx.fillStyle = settings.highlightNew;
			} else if (alive == 1) {
				ctx.fillStyle = settings.highlightUsed;
			} else if (alive == -1) {
				ctx.fillStyle = settings.highlightImaginary;
			} else {
				ctx.fillStyle = settings.deadBack;
			}
			ctx.fillRect(i, j, settings.cell, settings.cell);
			jBordersError++;
		}
		iBordersError++;
		jBordersError=0;
	}
	
	setTimeout("animationArgs.main.dispatchEvent(new Event('anim'));", settings.interval);
}

function getSettings() {
	//console.log('trying to load preferences');
	var json = java.loadPreferences();
	//console.log('java replied:');
	//console.log('\''+json+'\'');
	if (!json) return;
	var loadedSettings = JSON.parse(json);
	//console.log(loadedSettings);
	if (loadedSettings) settings = loadedSettings;
	/*for (var p in settings) {
		//console.log(p+': '+settings[p]);
	}*/
}

function saveSettings() {
	java.savePreferences(JSON.stringify(settings));
}

function applySettings() {
	for (var p in settings) {
		var field = document.getElementById('set_'+p);
		////console.log(p);
		if (field && field.value) {
			////console.log(field.value);
			var value;
			if ("0" <= field.value[0] && field.value[0] <= "9") {
				value = field.value*1; //parseFloat слишком терпим к некорректным символам
			} else value = field.value;
			if (isNaN(value) && !(typeof value == 'string')) {
				alert('Field \''+p+'\' in settings is syntactically incorrect, settings will not change');
			} else {
				////console.log(value + " type of " + (typeof value));
				settings[p] = value;
			}
		}
	}
	if (window.java) saveSettings();
	style();
	setReady('settingsAppliedIndicator', 'Настройки успешно применены');
}

function style() {
	document.body.style.background = settings.pageBack;
	makeClean();
	currentGen = makeMatrix();
	draw();
}

function stop() {
	//console.log('stopped');
	animationArgs.main.removeEventListener('anim', animationArgs.main.listener, false);
	//setReady('animationFinishedIndicator', 'Чтобы начать анимацию, нажмите кнопку Start!');
}

function makeClean() {
	//console.log('cleared');
	numberOfGens = 0;
	animationArgs.counterGen.innerHTML = '0';
	document.getElementById('clear_button').style.display = 'none';
	animationArgs.stop = true;//Clear могут нажать перед тем, как нажать Stop
	animationArgs.main.removeEventListener('anim', animationArgs.main.listener, false);
	currentGen = makeMatrix();
	draw();
	setReady('animationFinishedIndicator', 'Чтобы начать анимацию, нажмите кнопку Start!');
	var go_button = document.getElementById('go');
	go_button.value = 'Start!';
	go_button.className = 'button_designed_good';
}

/*var java = {};
java.nextGeneration = function(json) {
	//console.log("random next generation");
	var matrix = [];
	for (var i = 0; i<settings.width; i++) {
		matrix.push([]);
		for (var j = 0; j<settings.width; j++) {
			var rand = Math.floor(Math.random()*4);
			matrix[i].push(rand);
			//if (rand == 1) //console.log('1 at pos '+i+', '+j);
		}
	}
	return JSON.stringify(matrix);
}*/

//сбор и отправка данных java в виде JSON, а затем получение ответа в той же форме
function start() {// или при желании continue - ему плевать, начинает он анимировать с начала или с середины
	////console.log('adsssss');
	document.getElementById('clear_button').style.display = 'inline';
	var go_button = document.getElementById('go');
	go_button.value = 'Stop';
	go_button.className = 'button_designed_bad';
	// надо хранить живые клетки в двумерном массиве, обновлять по onclick. Все это глобально

	setUnready('animationFinishedIndicator', 'анимация не закончилась');
	//var label = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5).toUpperCase();
	animationArgs.main.addEventListener('anim', animationArgs.main.listener);
	animationArgs.main.dispatchEvent(new Event('anim'));
}

function figureSelectHandler(selectedFigure) {
	//console.log(selectedFigure+' selected.');
	animationArgs.fig = selectedFigure;
	makeRotatedMap();
}

function rotationSwitcher(angle) {//0,1,2,3
	animationArgs.figRotate = angle;
	makeRotatedMap();
	document.getElementById('rotator_display').innerHTML = angle*90;
}

function pullRightColumn(caller) {
	var rightColumn = document.getElementById('right_column');
	var isPulledOff = rightColumn.style.display == 'block';
	if (isPulledOff) {
		caller.style.backgroundImage = "url('./pulloff.png')";
		caller.style.right = '0';
		rightColumn.style.display = 'none';
	} else {
		caller.style.backgroundImage = "";
		caller.style.right = '';
		rightColumn.style.display = 'block';
	}
}

function switchInputMode(e, mode) {
	console.log(e);
	if (animationArgs.stop) {//только если на паузе
		animationArgs.drawMode = mode == 'draw';
		if (animationArgs.drawMode) draw();//если не перерисовать, останется воображаемая фигура, если мы ее до этого перетаскивали
	} else {//не давать переключать пока идет анимация
   		e.stopPropagation();
		e.preventDefault();
		toggle_show('cannot_switch');
		setTimeout("toggle_show('cannot_switch');", 3000);
	}
}

function makeRotatedMap() {//вызывается с гуя по нажатию на кнопки выбора угла и с initialize()
	if (!animationArgs.fig) return;
	animationArgs.figureMap = rotateArray(figures[animationArgs.fig], animationArgs.figRotate);
}

function calculArray(name) {
	var output = {};
	for (var fig in figuresTemp) {
		output[fig] = [];
		var maxY = -1;
		for (var i = 0; i<figuresTemp[fig].length; i++) {
			var x = figuresTemp[fig][i][0];
			var y = figuresTemp[fig][i][1];
			if (!output[fig][x]) output[fig][x] = [];
			output[fig][x][y] = 3;
			if (y > maxY) maxY = y;
		}
		for (var x = 0; x < output[fig].length; x++) {
			//console.log(x);
			if (!output[fig][x]) output[fig][x] = [];
			for (var y = 0; y <= maxY; y++) {
				if (!output[fig][x][y]) output[fig][x][y] = 0;
			}
		}
	}
	////console.log(output);
	console.log(JSON.stringify(output));
}

/* Для поворота фигур использую функцию поворота двумерного массива (с незначительными изменениями)
источник: http://www.cyberforum.ru/javascript/thread420564.html#15 */
/*
    Поворачивает двухмерный массив на нужное число градусов, кратое 90.
 и возвращает результат поворота. Не меняет исходный массив.
    Интересный момент: большая часть переменных объявляется один раз
при первом вызове функции, а при последующих уже просто используются.

*/
var rotateArray = function(array, angle) {
    var x, y;
    var result = [];
    var func;
    switch (angle+'') {
           case "1": func = function () {
                for (x = 0; x < array[0].length; x++) {
                    result.push([])
                    for (y = array.length - 1; y >= 0; y--) {
                        result[result.length - 1].push(array[y][x]);
                    }
                }
                return result;
           };
           break;
           case "2": func = function () {
                // не используем reverse, чтобы не изменялся исходный массив.
                for (x = array.length - 1; x >= 0; x--) {
                    result.push([]);
                    for (y = array[x].length - 1; y >=0; y--) {
                        result[result.length - 1].push(array[x][y]);
                    }
                }
                return result;
           };
           break;
           case "3": func = function () {
                for (x = array[0].length - 1; x >= 0; x--) {
                    result.push([])
                    for (y = 0; y < array.length; y++) {
                        result[result.length - 1].push(array[y][x]);
                    }
                }
                return result; 
           };
           break;
    };
    return func ? func() : array;
};
