import{testRegex}from'./regex-engine.ts';
self.onmessage=(event:MessageEvent<{pattern:string;flags:string;text:string}>)=>{try{const{pattern,flags,text}=event.data;self.postMessage({result:testRegex(pattern,flags,text)});}catch{self.postMessage({error:true});}};
