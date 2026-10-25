import{marked}from'marked';
self.onmessage=(event:MessageEvent<string>)=>{try{if(event.data.length>100000)throw Error('Limit');const result=marked.parse(event.data,{async:false,gfm:true});if(result.length>2000000)throw Error('Output limit');self.postMessage({result});}catch{self.postMessage({error:true});}};
