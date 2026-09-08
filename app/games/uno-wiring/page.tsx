import { WiringLab } from './WiringLab';
import './game.css';
export const dynamic = 'force-static';
export const metadata = { title: '接線任務：點亮第一顆 LED | Lui Sir’s ICT Game Lab', description: 'Arduino Uno 接線與數位輸出：兩輪互動操作練習。' };
export default function Page() { return <WiringLab />; }
