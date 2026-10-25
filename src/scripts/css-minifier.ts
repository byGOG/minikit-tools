import{minify,syntax}from'csso';
export function minifyCss(text:string){if(text.length>100000)throw Error('Input limit');syntax.parse(text,{onParseError(error:Error):never{throw error;}});const result=minify(text,{restructure:false,comments:'exclamation'}).css;if(result.length>2000000)throw Error('Output limit');return result;}
