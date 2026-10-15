/* 로컬 전용. 실패한 원본은 덮어쓰지 않는다. */
(function(root){'use strict';
class LocalStorageAdapter {
 constructor(storage,key='shibaCafe_v1'){this.storage=storage;this.key=key;}
 read(){return this.storage.getItem(this.key);}
 write(raw){this.storage.setItem(this.key,raw);}
 backup(raw){this.storage.setItem(this.key+'_backup',raw);}
 readBackup(){return this.storage.getItem(this.key+'_backup');}
}
class PlayGamesAdapter {
 read(){throw new Error('unavailable');} write(){throw new Error('unavailable');}
}
class SaveService {
 constructor(adapter,version,migrations){this.adapter=adapter;this.version=version;this.migrations=migrations;this.blocked=false;this.error=null;}
 validate(s){if(!s||!Number.isFinite(s.coins)||s.coins<0||!Array.isArray(s.pups)||!Array.isArray(s.adopted))throw new Error('invalid save');return s;}
 load(){
  try {
   const raw=this.adapter.read();if(!raw)return null;
   let s=this.validate(JSON.parse(raw)),v=s.schemaVersion||s.ver||1;
   if(!Number.isInteger(v)||v<1)throw new Error('invalid version');
   if(v>this.version)throw new Error('newer save');
   while(v<this.version){if(!this.migrations[v])throw new Error('missing migration');s=this.migrations[v](s);s.schemaVersion=++v;this.validate(s);}
   return s;
  }catch(e){this.blocked=true;this.error=e.message;return null;}
 }
 save(s){if(this.blocked)return false;
  try {
   this.validate(s);s.schemaVersion=this.version;s.saveId ||= 'local-'+Date.now().toString(36);s.modifiedAt=Date.now();
   const raw=JSON.stringify(s),prior=this.adapter.read();
   if(prior){this.validate(JSON.parse(prior));this.adapter.backup(prior);}
   this.adapter.write(raw);return true;
  }catch(e){this.error=e.message;return false;}
 }
}
const api={LocalStorageAdapter,PlayGamesAdapter,SaveService};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CafeSave=api;
})(this);
