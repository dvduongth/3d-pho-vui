import type {Carnival} from './carnival';
export function canUseAdminTools(identity:{username:string}|null):boolean {
 return identity?.username.trim().toLowerCase()==='duongdv';
}
/** Only replenishes this player's simulation inventory; never publishes scores. */
export function supplyCarnival(c:Carnival){
 c.tickets=Math.max(c.tickets,100);c.silver=Math.max(c.silver,100);c.gold=Math.max(c.gold,10);
 c.luck=Math.max(c.luck,20);c.small=Math.max(c.small,27);c.medium=Math.max(c.medium,9);
 c.log='Đã cấp vật phẩm thử nghiệm: tối thiểu 100 vé, 100 bạc, 10 vàng, 20 Luck, 27 quà nhỏ, 9 quà vừa. Không tự trao linh kiện.';
}
