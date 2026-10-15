// UI 아이콘 경로 모음 (2026-10-15): 새 그림이 오면 여기 경로만 바꾼다. v2 = 그림이 검수 통과 아이콘 9개(512×512 투명).
const V2='assets/drive/ui/v2/';
export const UI_ICONS={
 tab:{village:V2+'tab-village.png',shiba:V2+'tab-shibas.png',manage:V2+'tab-shop-manage.png',shop:V2+'tab-store.png',bag:V2+'tab-bag.png'},
 manageTab:{menu:V2+'mg-menu-dev.png',upgrade:V2+'mg-upgrade.png',ledger:V2+'mg-pnl.png',
  // 알바채용: 그림이 mg-hire 제작 중. 파일이 오면 다음 줄을 V2+'mg-hire.png'로 바꾼다(임시: 기존 승인 tab-alba).
  hire:'assets/drive/ui/tab-alba.png'},
 HIRE_FINAL:V2+'mg-hire.png',
 close:V2+'btn-close.png',
 lvBadge:'assets/drive/ui/ui-lv-badge.png',
};
