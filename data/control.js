document.getElementById("exit-button").addEventListener('click', function onclick(event) {
  self.port.emit("exit");
}, false);
document.getElementById("auto-detect").addEventListener('click', function onclick(event) {
  self.port.emit("auto_detect",document.getElementById("auto-detect").checked);
}, false);
self.port.on("auto_detect", function (val) {
  self.port.emit("log",'auto_detect:'+val);
  document.getElementById("auto-detect").checked = !!val;
});
var prevButton = document.getElementById("prev-page");
prevButton.addEventListener('click', function onclick(event) {
  if(this.attributes.getNamedItem('url')){
    self.port.emit("do-search",this.attributes.getNamedItem('url').value);
  }
}, false);
var nextButton = document.getElementById("next-page");
nextButton.addEventListener('click', function onclick(event) {
  if(this.attributes.getNamedItem('url')){
    self.port.emit("do-search",this.attributes.getNamedItem('url').value);
  }
}, false);
var titleBox = document.getElementById("title-box"),
  viewBox = document.getElementById('view-box');
self.port.on("view", function onView(title,body) {
  titleBox.innerHTML = 'Etymology';
  viewBox.innerHTML = '<div class="translation-item panel panel-default">\
    <textarea id="search-input" class="form-control" style="width:98%;margin:2px;">'+title+'</textarea>\
      <button id="search-button" type="button" class="do-search btn form-control btn-info" >Search meaning</button>\
    <div class="panel-body">'+
    body+
  '</div></div>';
  var items = document.getElementsByClassName('redirect-ref');
  var itemsLen = items.length;
  for(var i = 0; i<itemsLen; i++){
    items.item(i).addEventListener('click', function onclick(event) {
      prevButton.attributes.getNamedItem('url').value = '/wiki/'+title;
      nextButton.attributes.getNamedItem('url').value = this.attributes.getNamedItem('url').value;
      self.port.emit("log",this.attributes.getNamedItem('url').value);
      self.port.emit("do-search",this.attributes.getNamedItem('url').value);
    });
  }
  document.getElementById('search-button').addEventListener('click', function onclick(event) {
      self.port.emit("log",this.id);
      var input = document.getElementById('search-input');
      self.port.emit("log",input);
      self.port.emit("log",input.value);
      self.port.emit("do-search",0,input.value);
    });
  //viewBox.innerHTML = body;
});
var language = document.getElementById("language");
language.addEventListener('click', function onclick(event) {
  self.port.emit("changeLanguage");
}, false);
self.port.on("show", function onShow(lang) {
  language.innerHTML = lang;
});
self.port.on("changeLanguageCaption", function (lang) {
  language.innerHTML = lang;
});

var translate = {
  visibled:false
};
var translateBttn = document.getElementById("history-list");
translateBttn.addEventListener('click', function onclick(event) {
//document.getElementById('translate-view').style.display = 'block';
  self.port.emit("history-list");
}, false);
self.port.on("getHistory", function (historyList) {
  self.port.emit("log",historyList);
  titleBox.innerHTML = 'History';
  var out = '<div class="navbar-header"><button id="clear-history" type="button" class="btn-xs btn navbar-btn btn-danger pull-right">Clear history</button></div>';
  for (var i in historyList) {
    var res = historyList[i];
    var list = '';
    if(res.translations)
      for(var j in res.translations){
        list +='<li class="list-group-item"><span class="badge">'+(res.translations[j].translate_votes?res.translations[j].translate_votes:'')+'</span>'+res.translations[j].translate_value+'</li>';
      }
    out += '<div class="history-item panel panel-default">\
  <div class="panel-body">'+
  (res.translations?
    '<div aria-label="Toolbar with button groups" role="toolbar" class="btn-toolbar">\
      <div aria-label="Third group" role="group" class="btn-group">\
      <button class="btn btn-info" type="button" onclick="this.firstChild.play()"><audio><source src="'+res.sound_url+'" type="audio/mpeg"></source>Your browser does not support the audio element.</audio>Play</button>\
      </div>\
      <div class="btn-group" role="group" aria-label="...">\
        <div class="btn-group" role="group">\
        <button type="button" class="btn btn-default">'+res.word_value +'</button>\
        </div>\
        <div class="btn-group" role="group">\
        <button type="button" class="btn btn-default">'+(res.transcription?res.transcription:'')+'</button>\
        </div>\
        <div class="btn-group" role="group">\
        <div class="btn btn-default" title="'+(res.translations[res.word_top]?res.translations[res.word_top].translate_value:'')+'" style="overflow:hidden;max-width:200px;">'+
          (res.translations[res.word_top]?res.translations[res.word_top].translate_value:'')+'</div>\
        <div id="history'+i+'" class="set-visibled btn btn-default"><span class="caret"></span>&nbsp;</div>\
        <button id="historyDel-'+i+'" name="'+i+'" class="del-btn btn btn-danger">x</button>\
        </div>\
      </div>\
    </div>\
    <div id="history'+i+'-view" style="display:none;"><ul class="list-group">'+list+'</ul></div>'
    :'<div class="btn btn-default" title="'+i+'" style="overflow:hidden;max-width:200px;">'+i+'</div>\
        <div id="history'+i+'" class="set-visibled btn btn-default"><span class="caret"></span>&nbsp;</div>\
      </div><div id="history'+i+'-view" style="display:none;">'+res+'</div>\
      <button id="historyDel-'+i+'" name="'+i+'" class="del-btn btn btn-danger">x</button>'
    )+
  '</div>\
</div>';
  };
  self.port.emit("log",out);

  viewBox.innerHTML=out;
  document.getElementById("clear-history").addEventListener('click', function onclick(event) {
    self.port.emit("clear-history");
    viewBox.innerHTML = '';
  }, false);
  var items = document.getElementsByClassName('del-btn');
  var itemsLen = items.length;
  for(var i = 0; i<itemsLen; i++){
    items.item(i).addEventListener('click', function onclick(event) {
      self.port.emit("log",this.id+';'+this.name);
      self.port.emit("history_del",this.name);
    });
  }
  var items = document.getElementsByClassName('set-visibled');
  var itemsLen = items.length;
  for(var i = 0; i<itemsLen; i++){
    items.item(i).addEventListener('click', function onclick(event) {
      self.port.emit("log",this.id);
      var style = document.getElementById(this.id+'-view').style;
      style.display = (style.display == 'none'?'block':'none');
    });
  }
});
self.port.on("translate", function (lang,word, res) {
  titleBox.innerHTML = 'Translation';
  if(typeof res == 'object'){
    var list = '',langFrom = '', langTo = '';
      if(res.translations){
        for(var j in res.translations){
          list +='<li class="list-group-item '+(j==res.word_top?'active':'')+'"><span class="badge">'+(res.translations[j].translate_votes?res.translations[j].translate_votes:'')+'</span>'+res.translations[j].translate_value+'</li>';
        }
        self.port.emit("log",list);
      }
      self.port.emit("log",lang);
      for(var j in lang.from){
        langFrom +='<option '+(lang.from[j].sel?'selected="1"':'')+'>'+lang.from[j].val+'</option>';
      }
      for(var j in lang.to){
        langTo +='<option '+(lang.to[j].sel?'selected="1"':'')+'>'+lang.to[j].val+'</option>';
      }
      viewBox.innerHTML = '<div class="translation-item panel panel-default">\
    <textarea id="translate-input" class="form-control" style="width:98%;margin:2px;">'+res.word_value+'</textarea>\
    <div class="col-xs-3">\
      <select id="translation-from" class="form-control  input-sm">'+langFrom+'</select>\
    </div>\
    <div class="col-xs-3">\
      <button id="change_direction" class="btn-xs btn btn-info" type="button"><=></button>\
    </div>\
    <div class="col-xs-3">\
      <select id="translation-to" class="form-control  input-sm">'+langTo+'</select>\
    </div>\
    <div class="col-xs-3">\
      <button id="translate-button" type="button" class="do-translate btn form-control btn-info" >Translate</button>\
    </div><br>\
    <div class="panel-body">'+
    (res.sound_url?'<div aria-label="Third group" role="group" class="btn-group">\
      <button class="btn-xs btn btn-info" type="button" onclick="this.firstChild.play()" style="margin:2px;"><audio><source src="'+res.sound_url+'" type="audio/mpeg"></source>Your browser does not support the audio element.</audio>Play</button>\
      </div>':'')+(res.transcription?' ['+res.transcription+']<br>':'')+
    '<div class="list-group">'+list+'</div>\
  </div>';
    document.getElementById('change_direction').addEventListener('click', function onclick(event) {
      var from_combo = document.getElementById('translation-from'),
        to_combo = document.getElementById('translation-to');
      var tmp = from_combo.value;
      self.port.emit("log",'from_combo:'+from_combo.value);
      self.port.emit("log",'to_combo:'+to_combo.value);
      from_combo.value = to_combo.value;
      to_combo.value = tmp;
      
      self.port.emit("log",'from_combo:'+from_combo.value);
      self.port.emit("log",'to_combo:'+to_combo.value);
      self.port.emit("change_direction",from_combo.value,to_combo.value);
    });
    document.getElementById('translate-button').addEventListener('click', function onclick(event) {
      self.port.emit("log",this.id);
      var input = document.getElementById('translate-input');
      self.port.emit("log",input);
      self.port.emit("log",input.value);
      self.port.emit("do-translate",document.getElementById('translation-from').value,document.getElementById('translation-to').value,input.value,value,document.getElementById('auto-detect').checked);
    });
  }else{
    viewBox.innerHTML = res;
  }
});
self.port.on("change_direction", function (lfrom,lto) {
    document.getElementById('translation-from').value = lfrom;
    document.getElementById('translation-to').value = lto;
    self.port.emit("change_direction",lfrom,lto);
});
var change_direction = function(){

}
var translateOne = document.getElementById("translate-one");
translateOne.addEventListener('click', function onclick(event) {
//document.getElementById('translate-view').style.display = 'block';
  self.port.emit("translate-view");
}, false);
var translateOne = document.getElementById("search-word-meaning");
translateOne.addEventListener('click', function onclick(event) {
  self.port.emit("etymology-view");
}, false);
