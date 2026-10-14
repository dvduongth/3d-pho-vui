const api=(p:string)=>`${import.meta.env.BASE_URL}api/${p}`;
const fail=(call:string,...why:unknown[]):null=>{console.error(`[backend] ${call} failed`,...why);return null;};
const failed=async(call:string,res:Response):Promise<null>=>fail(call,res.status,await res.text().catch(()=>''));
let devEmail=import.meta.env.DEV?localStorage.getItem('gf_dev_email'):null;
export function devSignIn(email:string):void{if(!import.meta.env.DEV)return;devEmail=email;localStorage.setItem('gf_dev_email',email);location.reload();}
export function devSignOut():void{if(!import.meta.env.DEV)return;devEmail=null;localStorage.removeItem('gf_dev_email');}
const apiFetch=(path:string,init:RequestInit={}):Promise<Response>=>{const headers=new Headers(init.headers);if(import.meta.env.DEV&&devEmail)headers.set('x-preview-dev-email',devEmail);return fetch(api(path),{...init,signal:init.signal??AbortSignal.timeout(10000),headers});};
export type Me={email:string;username:string;source?:'sso'|'dev'};
export async function me():Promise<Me|null>{try{const res=await apiFetch('me');if(!res.ok)return failed('GET me',res);return await res.json() as Me;}catch(e){return fail('GET me',e);}}

export type SaveResult = { ok: true; data: unknown; updatedAt: string | null } | { ok: false };
export async function loadSaveResult(): Promise<SaveResult> {
 try {
  const res=await apiFetch('save');
  if(!res.ok){await failed('GET save',res);return {ok:false};}
  const body=await res.json() as {data:unknown;updatedAt:string|null};
  return {ok:true,data:body.data,updatedAt:body.updatedAt};
 }catch(e){fail('GET save',e);return {ok:false};}
}
export async function storeSave(state:unknown):Promise<boolean>{
 try{
  const res=await apiFetch('save',{method:'PUT',keepalive:true,headers:{'content-type':'application/json'},body:JSON.stringify(state)});
  if(!res.ok)await failed('PUT save',res);
  return res.ok;
 }catch(e){fail('PUT save',e);return false;}
}
