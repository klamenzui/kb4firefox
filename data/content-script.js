var url = self.options.currentURL.match(/([a-z]+:\/\/)(www\.)?([-a-zA-Z0-9_]{2,256}\.[a-z]{2,4})\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?/);
if(url && url[3]){
	switch(url[3]){
		case 'joyreactor.cc':

			document.getElementById('header').remove();
			var links = document.getElementsByTagName('div');
			document.getElementById('container').style.background = '#fff';
			var rem_blocks = self.options.rem_blocks;
			for(var i=0,l=links.length;i<l;i++){
					//console.log(links[i],links[i].id,typeof links[i].id);
				for(var j in rem_blocks)
				   	if(links[i] && links[i].id &&  typeof links[i].id == 'string' &&  links[i].id.match(rem_blocks[j])){
				   		links[i].innerHTML = '??';
			   			//console.log(links[i].id.match(rem_blocks[j]));
			  		}
			}
		break;
	}
}
var tags = document.getElementsByTagName('iframe');
for(var i in tags){
console.log(tags[i]);
  if(tags[i] && typeof tags[i].remove == 'function')tags[i].remove();
}