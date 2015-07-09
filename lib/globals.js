/*
globals beginning:
	__ = classes
	_  = functions
	$  = vars
*/
Object.values = function(o){
	var r = [];
	for(var i in o){
		r.push(o[i]);
	}
	return r;
}
//----------[GLOBAL_CLASSES]begin----------
function __tree (init) {
/*
var obj=new __tree({ff:{tt:'gg'}});

obj.set('ff','ss');
obj.set({'tt':'yyy','uu':77});

obj.get('ff');
obj.get();

obj.getAt(0);
obj.getAt(-2,1);

obj.keys();
obj.values();

obj.del('ff');

obj.len();

obj.setPath('/ff/tt') //=> this // direct to path

obj.getPath() //=> '/ff/tt' //string current path
obj.getPath('') //=> 'gg' // value by current path
obj.getPath('/') //=> {ff:{tt:'gg'}} // value from root 
obj.getPath('/ff/tt') //=> 'gg' // value by path

obj.resetPath() //=> this // direct to root
*/
	var me = {};
	var curPath = '/';
    me.source = {},
	me.findKey=function (key,match_case) {
		var mc=(typeof(match_case)=='boolean'?match_case:true);
		var keys = me.keys();
		return keys.filter(
			(
				key.constructor == Function?key:
				function(v,i,a){
					if(!mc)v=v.toLowerCase();
					if(key.constructor == RegExp)
						return (key.exec(v)!=null);
					if(key.constructor == String)
						return (v.substr(0,key.length)==key);
				}
			)
		)
	},
	me.findValue=function (value,match_case) {
		var mc=(typeof(match_case)=='boolean'&& match_case),
		r=[],keys = me.keys(),values =  me.values();
		values.filter(
			(
				value.constructor == Function?value:
				function(v,i,a){
					if(typeof(v)!='string') return false;
					if(!mc)v=v.toLowerCase();
					var b=false;
					if(value.constructor == RegExp)b=(value.exec(v)!=null);
					if(value.constructor == String)b=(v.substr(0, value.length)==value);
					if(b)r.push(keys[i]);
					return b;
				}
			)
		)
		return r;
	},
	me.get=function (key) {
		return typeof(key)=='undefined'?me.data:(typeof(me.data)=='object'?me.data[key]:undefined);
	},
	me.getAt=function (ind,asobj) {
		var r;
		if(typeof(me.data) == 'object'){
			keys = me.keys();
			if(ind<0&& keys.length+ind>-1)ind=keys.length+ind;
			if(typeof(ind)=='number',typeof(asobj)=='number'){
				for(var i=ind;i<ind+asobj;i++){
					if(typeof(keys[i])!='undefined') r[keys[i]]=me.data[keys[i]];
				}
			}else
			if(typeof(asobj)!='undefined')
				r[keys[ind]]=me.data[keys[ind]];
			else
				r=me.data[keys[ind]];
		}
		return r;
	},
	me.set=function (key, value) {
		var c = 0;
		if(typeof(key)=='object'&&typeof(value)=='undefined'){
			for(var i in key){
				me.data[i] = key[i];
				c++;
			}
		}else{
			me.data[key] = value;
			c++;
		}
		return c;
	},
	me.del=function (key) {
		delete me.data[key];
		return me;
	},
	me.clear=function () {
		me.source = {};
		me.resetPath();
		return me;
	},
	me.len=function(){
		return me.keys().length;
	},
	me.keys=function(){
		return typeof(me.data)=='object'?Object.keys(me.data):[];
	},
	me.values=function(){
		return typeof(me.data)=='object'?Object.values(me.data):[];
	},
	me.resetPath=function(){
		curPath = '/';
		me.data = me.source;
		return me;
	},
	me.getPath=function(path,def){
		var res;
		if( typeof(path) == 'undefined' ){
			res = curPath;
		}else if( path == '' || path == '/' ){
			res = ( path == '/' ?  me.source :  me.data );
		}else{
			var path = path.split('/'), data = me.data;
			if(path[0] == ''){
				data = me.source;
				path = path.slice(1);
			}
			res = _getPath(path, data, def);
		}
		return res;
	},
	me.setPath=function(path){
		if( typeof(path) == 'undefined' || path == '' ){
			me.resetPath();
		}else{
			me.data = me.getPath(path);
			curPath = (path.charAt(0) == '/' ? path : ( curPath == '/' ? '/' + path : curPath +'/'+ path ) );
		}
		return me;
	}

	me.data = me.source;
	if(typeof(init)=='object'){ me.set(init); }
	return me;
}

function __cookie(){
	var curPath = '/';
	this.load = function(){
		this.clear();
		if( document.cookie.search('=') > -1 ){
			var g=document.cookie.split(';');
			for(var i in g){
				g[i]=g[i].trim().split('=');
				if( typeof(g[i][1])!='undefined'){
					this.data[g[i][0]] = decodeURIComponent(g[i][1]);
					try{
						this.data[g[i][0]] = JSON.parse(this.data[g[i][0]]);
					}catch(e){
						
					}
				}else{ 
					this.data[g[i][0]]='';
				}
			}
		}
		return this;
	}
	this.load();
}

__cookie.prototype=new __tree();
__cookie.prototype.set=function (name, value, props) {
	var count = 0, curPath = this.getPath();
	if( typeof(this.data) == 'object' && ( typeof(name) == 'string' || typeof(name) == 'number' )){
		var root = ( curPath == '/' ? name : curPath.split('/')[1] );
		if( typeof(value) == 'undefined' ){
			delete this.data[name];
			if( curPath == '/' ){
				props = { expires: -1 };
			}
		}else{
			this.data[name] = value;
		}
		var props = props || {};
		var exp = props.expires;
		if (typeof exp == "number" && exp) {
			var d = new Date(new Date().toUTCString());
			d.setTime(d.getTime() + exp*1000);
			exp = props.expires = d;
		}
		if(!props['path']) { props.path = '/' }
		if(exp && exp.toUTCString) { props.expires = exp.toUTCString() }

		var updatedCookie = root + "=" + encodeURIComponent(JSON.stringify(this.source[root]))
		for(var propName in props){
			updatedCookie += "; " + propName
			var propValue = props[propName]
			if(propValue !== true){ updatedCookie += "=" + propValue }
		}
		document.cookie = updatedCookie;
		count = 1;
	}
	return count;
}
__cookie.prototype.del=function (name) {
	this.set(name, undefined);
}
//----------[GLOBAL_CLASSES]end----------
//----------[GLOBAL_FUNCTIONS]begin----------
/*_getPath=function(path,obj){
	var res = undefined,path = (typeof(path)=='string'?path.split('/'):path);
	if(!_empty(path) && typeof(obj)!='undefined'){
		res = (_count(path)>1?_getPath(path.slice(1), obj[path[0]]): obj[path[0]]);
	}
	return res;
}*/
_getPath=function(path,obj,def){//_getPath('k1/0',{k1:[5,7,4]})||_getPath('k1/0',{k1:[5,7,4]},0)
	var res = def,path = ( typeof(path)=='string' ? ( ( path.charAt(0) == '/' ? path.substr(1): path ).split('/') ) : path );
	for( var i in path ){
		if( ( typeof(obj)=='undefined' || obj==null ) || typeof(obj[path[i]])=='undefined'){ return def; }
		res = obj = obj[path[i]];
	}
	return res;
}
_setPath=function(path,obj,val){//_setPath('k1/0',{k1:[5,7,4]},'some_val')
	var res = false,path = (typeof(path)=='string'?path.split('/'):path);
	if(!_empty(path)){
		var obj = _getPath(path.slice(0,-1),(!_empty(obj)?obj:undefined));
		if(typeof(obj)=='object'){
			obj[path[path.length-1]] = val;
			res = true;
		}
	}
	return res;
}
_count=function(o){//_count('ffkr')||_count({f:'rr'})||_count([7,'rr'])
    var c=0, t=typeof(o);
	if(t=='string'){
		c=o.length;
	}else{
		for(var i in o){
			c++;
		}
	}
    return c;
}
function _empty () {
  // Checks if the argument variable is empty
  // undefined, null, false, number 0, empty string,
  // string "0", objects without properties and empty arrays
  // are considered empty
  //
  // From: http://phpjs.org/functions
  // +   original by: Philippe Baumann
  // +      input by: Onno Marsman
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: LH
  // +   improved by: Onno Marsman
  // +   improved by: Francesco
  // +   improved by: Marc Jansen
  // +      input by: Stoyan Kyosev (http://www.svest.org/)
  // +   improved by: Rafal Kukawski
  // *     example 1: empty(null);
  // *     returns 1: true
  // *     example 2: empty(undefined);
  // *     returns 2: true
  // *     example 3: empty([]);
  // *     returns 3: true
  // *     example 4: empty({});
  // *     returns 4: true
  // *     example 5: empty({'aFunc' : function () { alert('humpty'); } });
  // *     returns 5: false
	var undef, key, i, len,mixed_var;
	var emptyValues = [undef, null, false, 0, "", "0"];
	for(var k in arguments){
		mixed_var=arguments[k];
		for (i = 0, len = emptyValues.length; i < len; i++) {
			if (mixed_var === emptyValues[i]) {
				return true;
			}
		}

		if (typeof mixed_var === "object") {
			for (key in mixed_var) {
				// TODO: should we check for own properties only?
				//if (mixed_var.hasOwnProperty(key)) {
				return false;
				//}
			}
			return true;
		}

		
	}
	return false;
}
exports.__tree = __tree;