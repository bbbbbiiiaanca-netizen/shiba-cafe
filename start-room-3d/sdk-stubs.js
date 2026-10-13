// Stubs for platform SDKs. Nothing here talks to a network or charges money.
export const SDK={
 playGames:{signedIn:false,async signIn(){return {ok:false,stub:true,msg:'Play Games 로그인은 아직 연결 전(스텁)'};},
  async cloudSave(state){return {ok:false,stub:true,msg:'클라우드 저장은 아직 연결 전(스텁) · 기기 저장만 됨'};},async cloudLoad(){return null;}},
 ads:{async rewarded(kind){return {ok:true,stub:true,kind};}}, // stub: grants reward immediately, no ad shown
 iap:{products:[{id:'paws_10',name:'발바닥 10개',price:'₩1,200'},{id:'paws_60',name:'발바닥 60개',price:'₩5,900'}],
  async buy(id){return {ok:false,stub:true,msg:'결제는 아직 연결 전(스텁)'};}},
 sfx(name){}, // stub: slots in CFG.sfx (sfx-button-click etc.), no audio files yet
};
