import{encodeHTML,decodeHTML}from'entities';
export function convertHtmlEntities(text:string,decode=false){if(text.length>100000)throw Error('Input limit');const result=decode?decodeHTML(text):encodeHTML(text);if(result.length>2000000)throw Error('Output limit');return result;}
