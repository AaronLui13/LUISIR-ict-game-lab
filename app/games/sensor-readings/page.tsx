import { SensorLab } from './SensorLab';
import './game.css';
export const dynamic='force-static';
export const metadata={title:'讓電腦看見光 · 單元三 | Lui Sir’s ICT Game Lab',description:'接好 LDR 感光電路，在 Serial Monitor 收集光暗讀數，以數據說明規律，再獨立重接 A0。'};
export default function Page(){return <SensorLab/>;}
