declare module 'csso' {
 export const syntax:{parse(source:string,options?:{onParseError?:(error:Error)=>never}):unknown};
 export function minify(source:string,options?:{restructure?:boolean;comments?:string}):{css:string};
}
