var globals = require("./globals");
var KB = {
	yandex:{key: "trnsl.1.1.20150513T101604Z.6c055e9e96b63e8f.7f8e3dab63bcba2eb12d4654e6de5f875b268b68"},
	data:require("sdk/self").data,
	db: globals.__tree((function(){
		var db = require("sdk/simple-storage");
		if(!db.storage.history)db.storage.history = { translate:{}, etymology:{}, selection:{text:'',html:''} };
		if (!db.storage.settings)db.storage.settings = { language : {def:'en', from:'en', to:'ru'}, mode:'translate' };
		return db.storage;
	})()
	),
	languages:{from:[{val:'en'},{val:'ru'}],to:[{val:'en'},{val:'ru'}]},
	setLanguage:function(key,lang){
		lang = ['ru','en'].indexOf(lang)>-1?lang:(KB.db.getPath('/settings/language/'+key,'en'));
		KB.db.getPath('/settings/language')[key] = lang;
		if(KB.languages[key]){
			for(var i in KB.languages[key]){
				KB.languages[key][i].sel = (lang == KB.languages[key][i].val);
			}
		}
	},
	setMode:function(mode){
		KB.db.getPath('/settings').mode = mode;
	},
	getMode:function(){
		KB.db.getPath('/settings/mode','translate');
	}
}
console.log('----db---',KB.db.get(),KB.db.getPath('/history/translate'));
var self = require("sdk/self");
// Create a button
require("sdk/ui/button/action").ActionButton({
	//var { ToggleButton } = require('sdk/ui/button/toggle');
	//var button = ToggleButton({
	id: "show-panel",
	label: "Knowledge Base",
	icon: {
		"16": "./icon-16.png",
		"32": "./icon-32.png",
		"64": "./icon-64.png"
	},
	onClick: handleClick
	//onChange: handleChange
});

var template = require("sdk/panel").Panel({
	contentURL: KB.data.url("template.html"),
	contentScriptFile: KB.data.url("control.js"),
	width: 500,
	height: 500,
	contextMenu:true
	//contentURL: "https://en.wikipedia.org/w/index.php?title=Jetpack&useformat=mobile"
	//onHide: handleHide
});

function handleClick(state) {
	template.show();
}
// function handleChange(state) {
//   if (state.checked) {
//     template.show({
//       position: button
//     });
//   }
// }
// function handleHide() {
//   button.state('window', {checked: false});
// }
template.port.on("log", function (text) {
	console.log(text);
});

template.port.on("exit", function (text) {
	template.hide();
});

template.port.on("changeLanguage", function () {
	KB.db.getPath('/settings/language').def = KB.db.getPath('/settings/language').def=="ru"?"en":"ru";
	console.log(KB.db.getPath('/settings/language').def);
	template.port.emit("changeLanguageCaption",KB.db.getPath('/settings/language').def);
	if(KB.db.getPath('/settings').mode == 'translate'){

	}else{
		searchMeaning(KB.db.getPath('/settings/language').def,KB.db.getPath('/history').selection.text,true);
	}
});
template.port.on("history-list", function () {
	template.port.emit("getHistory",KB.db.getPath('/history')[KB.db.getPath('/settings').mode]);
});

template.port.on("clear-history", function () {
	KB.db.getPath('/history')[KB.db.getPath('/settings').mode] = {};
});

template.on("show", function() {
	console.log(KB.db.getPath('/settings/language').def);
	template.port.emit("show",KB.db.getPath('/settings/language').def);//,formatMess('Simply right-click on selected text and choose "Search etymology".'));
});

var { Hotkey } = require("sdk/hotkeys");

var selection = require("sdk/selection");
selection.on('select', function () {
	if(selection.text!=null){
		KB.db.getPath('/history').selection.text = selection.text;
		KB.db.getPath('/history').selection.html = selection.html;
	}
  	console.log(selection.text);
  	//console.log(selection.html);
});
Hotkey({
  combo: "accel-/",
  onPress: function() {
  	translate(KB.db.getPath('/settings/language/from',''),KB.db.getPath('/settings/language/to',''),KB.db.getPath('/history').selection.text);
    template[(!template.isShowing?'show':'hide')]();
    
  }
});
Hotkey({
  combo: "accel-shift-/",
  onPress: function() {
  	searchMeaning(KB.db.getPath('/settings/language').def,KB.db.getPath('/history').selection.text,true);
    template[(!template.isShowing?'show':'hide')]();
  }
});

var formatMess = function(mess,type){
	var types = ['success','info','warning','danger'];
	return '<div class="alert alert-'+(types.indexOf(type)>-1?type:'info')+'" role="alert">...</div>'.replace('...',mess);
}

var searchText = '';
var contextMenu = require("sdk/context-menu"),
	Request = require("sdk/request").Request;
console.log(self.name);

var searchMeaning = function(lang,selectionText,b){
	KB.db.getPath('/settings').mode = 'etymology';
	console.log('----lang---'+lang+'----seltext---'+selectionText+'---------');
	var where = 'wikipedia';
	if((typeof selectionText != 'string' || selectionText=='') && (typeof lang == 'string' && lang != '')){
		var w = lang.match(/(wikipedia|wiktionary)/);
		if(w!=null && w[1]) where = w[1];
		selectionText = lang.match(/\/wiki\/([^\/]+)/);
		if(selectionText == null) selectionText = lang.match(/title=([^&]+)/);
		lang = '';
		selectionText = selectionText[1]?decodeURI(selectionText[1]):'';
	}
	lang = ['ru','en'].indexOf(lang)>-1?lang:KB.db.getPath('/settings/language/def','en');
	KB.db.getPath('/settings/language').def = lang;
	var wikiBase = "http://"+lang+"."+where+".org",
			url = '';
	if(typeof selectionText == 'string' && selectionText!=''){
		
		url = wikiBase+"/w/api.php?action=parse&format=json&prop=text&section="+(where == 'wikipedia'?0:1)+"&useformat=mobile&page="+selectionText;

		console.log(url);
		if(KB.db.getPath('/history').etymology[where+'|'+selectionText.toLowerCase()]){
			if(!template.isShowing){
				template.show();
			}
			template.port.emit("view",selectionText,KB.db.getPath('/history').etymology[where+'|'+selectionText.toLowerCase()]);
			console.log('from_history');
		}else{
			var quijote = Request({
				url: url,
				overrideMimeType: "text/plain; charset=utf8",
				onComplete: function (response) {
					var out = formatMess('...');
					try{
						console.log(response.text.parse);
						out = JSON.parse(response.text);
						out = out.parse.text['*'].replace(/<table class="infobox[\n\r\s\S.]+?<\/table>/,'')
							//.replace(/href="([^#])/g,'target="_blank" href="$1')
							.replace(/src="\/\//g,'src="https://')
							//.replace(/href="\//g,'href="'+wikiBase+'/')
							.replace(/href="([^"]+)"/g,' href="#" class="redirect-ref" url="$1"');
						KB.db.getPath('/history').etymology[where+'|'+selectionText.toLowerCase()] = out;
					}catch(e){
						console.log(e);
						console.log(response.text);
						if(typeof out.error != 'undefined' && !b){
							out = '...';
							searchMeaning(lang=='ru'?'en':'ru',selectionText,true);
						}else{
							try{
								out = formatMess(out.error.info,'danger');
							}catch(e){
								out = formatMess('Error getting information.','danger');
							}
						}
					}
					if(!template.isShowing){
						template.show();
					}
					template.port.emit("view",selectionText,out);
				}
			}).get();
		}
	}
}

var getTranslate = function(server,url,lang,selectionText,words,callback){
	var out = formatMess('...');
	if(!template.isShowing){
		template.show();
	}
	console.log(url);
	Request({
        url: url,
        onComplete: function (response) {
       		try{
				console.log('resp '+server+':',response.json);
				if(server=="yandex"){
					out = {word_top:'',translations:[],word_value:''};
					console.log('1');
	                out.word_value = selectionText;
	                console.log('2');
					out.translations.push({translate_value: response.json.text[0]});
					console.log('5');
					out.word_value = selectionText;
				}else{
					console.log('3');
					out = response.json.userdict3;
					console.log('4');
				}
				if(words.length==1){
					console.log('6');
					KB.db.getPath('/history').translate[selectionText.toLowerCase()] = out;
					console.log('7');
				}
				
				console.log('out',out);
			}catch(e){
				console.log('err',e);
				console.log('resp',response.text.substr(0,500));
				out = formatMess('Error getting information.','danger');
			}
			template.port.emit("translate",KB.languages,selectionText,out);
			if(typeof callback == 'function'){
				callback(out);
			}
        }
    }).get();
}

var translate = function(lFrom,lTo,selectionText,b){
	console.log('----------sel_text-['+selectionText+']--------');
	if(typeof selectionText == 'string' && selectionText!=''){
		var lang = KB.db.getPath('/settings/language');
		lang.from = ['ru','en'].indexOf(lFrom)>-1?lFrom:KB.db.getPath('/settings/language/from','en');
		lang.to = ['ru','en'].indexOf(lTo)>-1?lTo:KB.db.getPath('/settings/language/to','ru');
		KB.setLanguage('from',lang.from);
		KB.setLanguage('to',lang.to);
		selectionText = selectionText.trim();
		//https://translate.google.com/#en/ru/very
		var words = selectionText.split(/\s+/),
			urlBase = "http://lingualeo.com/ru/userdict3/"+(words.length>1?"getSentenceTranslations":"getTranslations"),
			url = urlBase+"?word_value="+selectionText,
			server = "lingualeo";
		if(selectionText.match(/[А-я-]+/)){
			server = "yandex";
			urlBase = "https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + KB.yandex.key + "&lang=ru-en&text=" + words.join(' ');
		}
		console.log(lang,KB.languages,url);
		if(KB.db.getPath('/history').translate[selectionText.toLowerCase()]){
			if(!template.isShowing){
				template.show();
			}
			template.port.emit("translate",KB.languages,selectionText,KB.db.getPath('/history').translate[selectionText.toLowerCase()]);
		}else{
			getTranslate(server,url,lang,selectionText,words,function (out) {
				if(!(out && out.translations && out.translations.length > 0)){
					server = "yandex";
					getTranslate(server,"https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + KB.yandex.key + "&lang=" + lang.from+'-'+lang.to + "&text=" + words.join(' '),
						lang,selectionText,words);
				}
			});
		}
	}
}

template.port.on("do-translate", translate);
template.port.on("do-search", searchMeaning);
template.port.on("translate-view", function () {
	KB.db.getPath('/settings').mode = 'translate';
	template.port.emit("translate",KB.languages,'Translate',{
		word_value:''
	});
});
template.port.on("etymology-view", function () {
	KB.db.getPath('/settings').mode = 'etymology';
	template.port.emit("view",'','');
});

var menuItem = contextMenu.Item({
	label: "Search etymology",
	context: contextMenu.SelectionContext(),
	contentScript: 'self.on("click", function () {' +
	'  var text = window.getSelection().toString();' +
	'  self.postMessage(text);' +
	'});',
	image: self.data.url("icon-16.png"),
	onMessage: function (selectionText) {
		searchText = selectionText;
		KB.db.getPath('/settings').mode = 'etymology';
		searchMeaning(KB.db.getPath('/settings/language').def,selectionText);
		
	}
});
var menuItem1 = contextMenu.Item({
	label: "Translate",
	context: contextMenu.SelectionContext(),
	contentScript: 'self.on("click", function () {' +
	'  var text = window.getSelection().toString();' +
	'  self.postMessage(text);' +
	'});',
	image: self.data.url("icon-16.png"),
	onMessage: function (selectionText) {
		searchText = selectionText;
		KB.db.getPath('/settings').mode = 'translate';
		console.log(KB.db.getPath('/settings/language'));
		translate(KB.db.getPath('/settings/language').from,KB.db.getPath('/settings/language').to,selectionText);
		
	}
});

const {components} = require("chrome");
	components.utils.import("resource://gre/modules/NetUtil.jsm");
	components.utils.import("resource://gre/modules/FileUtils.jsm");

var windows = require("sdk/windows").browserWindows;

windows.on('close', function(window) {
	components.utils.import("resource://gre/modules/FileUtils.jsm");

	var file = FileUtils.getFile("Home", ["translation.history"]);
	console.log(file.path);
	var foStream = components.classes["@mozilla.org/network/file-output-stream;1"].
	       createInstance(components.interfaces.nsIFileOutputStream);
	foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	var converter = components.classes["@mozilla.org/intl/converter-output-stream;1"].
	        createInstance(components.interfaces.nsIConverterOutputStream);
	converter.init(foStream, "UTF-8", 0, 0);
	converter.writeString(JSON.stringify(KB.db.getPath('/history').translate));
	converter.close();
//------[save etymology]--------
	file = FileUtils.getFile("Home", ["etymology.history"]);
	console.log(file.path);
	// file is nsIFile, data is a string
	foStream = components.classes["@mozilla.org/network/file-output-stream;1"].
	       createInstance(components.interfaces.nsIFileOutputStream);

	// use 0x02 | 0x10 to open file for appending.
	foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	// write, create, truncate
	// In a c file operation, we have no need to set file mode with or operation,
	// directly using "r" or "w" usually.

	// if you are sure there will never ever be any non-ascii text in data you can 
	// also call foStream.write(data, data.length) directly
	converter = components.classes["@mozilla.org/intl/converter-output-stream;1"].
	        createInstance(components.interfaces.nsIConverterOutputStream);
	converter.init(foStream, "UTF-8", 0, 0);
	converter.writeString(JSON.stringify(KB.db.getPath('/history').etymology));
	converter.close(); // this closes foStream
});

/*
var tabs = require("sdk/tabs");
tabs.on('ready', function(tab) {
	console.log('active: ' + tab.url);
  var worker = tab.attach({
      contentScriptFile: KB.data.url("content-script.js"),
      contentScriptOptions: {
        rem_blocks:['ads_holder_.*','sidebar'],
        currentURL: tab.url
      }
  });
});*/