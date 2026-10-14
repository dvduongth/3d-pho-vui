import * as T from 'three';
import {block} from './world';
import {style as C} from './style';
export function createLakeBoard(scene:T.Scene){
 const root=new T.Group();root.position.set(-3,.4,11.5);root.rotation.y=.1;scene.add(root);
 for(const x of [-1.65,1.65])block(root,C.wood,x,1.3,0,.16,2.6,.2);
 block(root,C.wood,0,2.35,0,4,2.1,.22);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle=C.cream;ctx.fillRect(0,0,1024,512);ctx.strokeStyle=C.lavender;ctx.lineWidth=16;ctx.strokeRect(12,12,1000,488);
 ctx.textAlign='center';ctx.fillStyle=C.ink;ctx.font='bold 58px sans-serif';ctx.fillText('BẢNG VINH DANH HỒ SEN',512,110);
 ctx.font='38px sans-serif';ctx.fillText('Chưa có kết quả thi được xác thực',512,240);
 ctx.font='32px sans-serif';ctx.fillText('Câu mô phỏng và luyện tập không xếp hạng',512,320);
 ctx.fillStyle='#70597d';ctx.font='bold 34px sans-serif';ctx.fillText('Chạm bảng hoặc đến gần và nhấn E',512,430);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sign=new T.Mesh(new T.PlaneGeometry(3.8,1.9),new T.MeshBasicMaterial({map:texture}));sign.position.set(0,2.35,.13);root.add(sign);
 return root;
}
