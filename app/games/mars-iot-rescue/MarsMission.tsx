"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ACTUATORS,
  DEFAULT_THRESHOLDS,
  MISSIONS,
  SYSTEMS,
  advanceReadings,
  calculateEnergy,
  calculateScore,
  validateRules,
} from "./game-data.mjs";
import type { ActuatorId, Readings, Rule, SensorId } from "./game-data.mjs";

type Stage = "intro" | "play" | "running" | "result" | "complete";
type Result = { success: boolean; issues: string[]; score: number; stars: number; energy: number };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const sensorIds = Object.keys(SYSTEMS) as SensorId[];

function statusFor(id: SensorId, value: number) {
  if (id === "oxygen") return value >= 18.5 ? "safe" : "danger";
  if (id === "temperature") return value <= 25 ? "safe" : "danger";
  return value >= 40 ? "safe" : "danger";
}

function readingText(id: SensorId, value: number) {
  return `${id === "oxygen" ? value.toFixed(1) : Math.round(value)}${SYSTEMS[id].unit}`;
}

function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function MarsMission() {
  const [stage, setStage] = useState<Stage>("intro");
  const [missionIndex, setMissionIndex] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState<SensorId | null>(null);
  const [selectedActuator, setSelectedActuator] = useState<ActuatorId | null>(null);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [rules, setRules] = useState<Rule[]>([]);
  const [readings, setReadings] = useState<Readings>(MISSIONS[0].start);
  const [timeLeft, setTimeLeft] = useState(MISSIONS[0].setupTime);
  const [energy, setEnergy] = useState(100);
  const [runProgress, setRunProgress] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [feedback, setFeedback] = useState("等待建立自動規則。 Awaiting automation rule.");
  const [result, setResult] = useState<Result | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [missionStars, setMissionStars] = useState<number[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);

  const mission = MISSIONS[missionIndex];
  const selectedSystem = selectedSensor ? SYSTEMS[selectedSensor] : null;

  useEffect(() => {
    const hydratePreferences = window.setTimeout(() => {
      const storedBest = Number(window.localStorage.getItem("mars-iot-best") ?? 0);
      const storedSound = window.localStorage.getItem("mars-iot-sound");
      setBestScore(storedBest);
      if (storedSound === "off") setSoundOn(false);
    }, 0);
    return () => window.clearTimeout(hydratePreferences);
  }, []);

  const playTone = useCallback((kind: "click" | "alert" | "success" | "fail" | "ambient") => {
    if (!soundOn || typeof window === "undefined") return;
    const Context = window.AudioContext;
    if (!Context) return;
    const context = audioRef.current ?? new Context();
    audioRef.current = context;
    if (context.state === "suspended") void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { click: 520, alert: 220, success: 760, fail: 145, ambient: 86 };
    oscillator.type = kind === "alert" || kind === "fail" ? "sawtooth" : "sine";
    oscillator.frequency.value = frequencies[kind];
    gain.gain.setValueAtTime(kind === "ambient" ? 0.012 : 0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (kind === "ambient" ? 1.2 : 0.18));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === "ambient" ? 1.2 : 0.2));
  }, [soundOn]);

  useEffect(() => {
    if (!soundOn || (stage !== "play" && stage !== "running")) return;
    const ambient = window.setInterval(() => playTone("ambient"), 9000);
    return () => window.clearInterval(ambient);
  }, [playTone, soundOn, stage]);

  useEffect(() => {
    if (stage !== "play") return;
    const countdown = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current > 1) return current - 1;
        window.clearInterval(countdown);
        setResult({
          success: false,
          issues: ["危機倒數已結束。先閱讀任務目標，再把 Input 接到正確的 Output。"],
          score: 0,
          stars: 0,
          energy: 100,
        });
        setStage("result");
        playTone("fail");
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [playTone, stage]);

  useEffect(() => {
    if (stage !== "running") return;
    let tick = 0;
    const validation = validateRules(mission, rules);
    const finalEnergy = calculateEnergy(mission, rules);
    const simulation = window.setInterval(() => {
      tick += 1;
      setRunProgress((tick / 8) * 100);
      setReadings((current) => advanceReadings(current, mission, rules));
      setEnergy(Math.round(100 - ((100 - finalEnergy) * tick) / 8));
      if (tick >= 8) {
        window.clearInterval(simulation);
        const score = validation.success ? calculateScore(mission, rules, timeLeft, mistakes) : 0;
        const efficientTarget = 100 - mission.required.length * 9;
        const stars = validation.success ? (mistakes === 0 && finalEnergy >= efficientTarget ? 3 : 2) : 0;
        window.setTimeout(() => {
          setResult({ ...validation, score, stars, energy: finalEnergy });
          setStage("result");
          if (validation.success) {
            setTotalScore((current) => current + score);
            setMissionStars((current) => [...current, stars]);
            playTone("success");
            window.setTimeout(() => playTone("success"), 180);
          } else {
            playTone("fail");
          }
        }, 350);
      }
    }, 620);
    return () => window.clearInterval(simulation);
  }, [mission, mistakes, playTone, rules, stage, timeLeft]);

  const startMission = useCallback((index: number) => {
    const nextMission = MISSIONS[index];
    setMissionIndex(index);
    setSelectedSensor(null);
    setSelectedActuator(null);
    setThresholds(DEFAULT_THRESHOLDS);
    setRules([]);
    setReadings(nextMission.start);
    setTimeLeft(nextMission.setupTime);
    setEnergy(100);
    setRunProgress(0);
    setMistakes(0);
    setTutorialStep(0);
    setResult(null);
    setFeedback("等待建立自動規則。 Awaiting automation rule.");
    setStage("play");
    playTone("alert");
  }, [playTone]);

  const chooseSensor = (id: SensorId) => {
    setSelectedSensor(id);
    setFeedback(`INPUT 已選擇：${SYSTEMS[id].nameZh}`);
    if (missionIndex === 0 && id === "oxygen") setTutorialStep((current) => Math.max(current, 1));
    playTone("click");
  };

  const chooseActuator = (id: ActuatorId) => {
    setSelectedActuator(id);
    const actuator = ACTUATORS.find((item) => item.id === id);
    setFeedback(`OUTPUT 已選擇：${actuator?.nameZh}`);
    if (missionIndex === 0 && selectedSensor === "oxygen" && id === "oxygenator") {
      setTutorialStep((current) => Math.max(current, 2));
    }
    playTone("click");
  };

  const installRule = () => {
    if (!selectedSensor || !selectedActuator) {
      setFeedback("請先選擇一個感應器和一個執行裝置。");
      playTone("alert");
      return;
    }
    const nextRule: Rule = {
      sensor: selectedSensor,
      actuator: selectedActuator,
      threshold: thresholds[selectedSensor],
    };
    setRules((current) => [...current.filter((rule) => rule.sensor !== selectedSensor), nextRule]);
    if (SYSTEMS[selectedSensor].actuator !== selectedActuator) setMistakes((current) => current + 1);
    setFeedback(`規則已寫入控制中心：IF ${SYSTEMS[selectedSensor].shortZh} ${SYSTEMS[selectedSensor].condition} ${thresholds[selectedSensor]}${SYSTEMS[selectedSensor].unit}`);
    if (missionIndex === 0 && selectedSensor === "oxygen" && selectedActuator === "oxygenator") setTutorialStep(4);
    setSelectedSensor(null);
    setSelectedActuator(null);
    playTone("click");
  };

  const removeRule = (sensor: SensorId) => {
    setRules((current) => current.filter((rule) => rule.sensor !== sensor));
    setFeedback(`已移除${SYSTEMS[sensor].shortZh}規則。`);
    playTone("click");
  };

  const runSimulation = () => {
    if (rules.length < mission.required.length) {
      setFeedback(`尚欠 ${mission.required.length - rules.length} 條規則。先完成接線。`);
      setMistakes((current) => current + 1);
      playTone("alert");
      return;
    }
    setRunProgress(0);
    setStage("running");
    setFeedback("控制中心正在分析感應數據並發出指令……");
    playTone("alert");
  };

  const finishGame = () => {
    const nextBest = Math.max(bestScore, totalScore);
    setBestScore(nextBest);
    window.localStorage.setItem("mars-iot-best", String(nextBest));
    setStage("complete");
  };

  const toggleSound = () => {
    setSoundOn((current) => {
      window.localStorage.setItem("mars-iot-sound", current ? "off" : "on");
      return !current;
    });
  };

  const activeRuleSensors = useMemo(() => new Set(rules.map((rule) => rule.sensor)), [rules]);

  if (stage === "intro") {
    return (
      <main className="mars-game intro-screen">
        <Image className="intro-art" src={`${BASE_PATH}/og.png`} alt="Mars habitat and life-support control room" fill priority sizes="100vw" />
        <div className="intro-shade" />
        <header className="game-topbar intro-topbar">
          <a href={`${BASE_PATH}/`} className="lab-link">LUI SIR’S ICT GAME LAB</a>
          <button className="icon-button" onClick={toggleSound} aria-label={soundOn ? "Mute sound" : "Enable sound"}>{soundOn ? "SOUND ON" : "SOUND OFF"}</button>
        </header>
        <section className="intro-briefing">
          <span className="kicker">MISSION FILE // IoT-01</span>
          <h1>MARS <span>IoT</span> RESCUE</h1>
          <p className="intro-lead">火星 Elysium 基地的生命維持網絡發生故障。你有三個任務，必須利用感應數據建立自動規則，救回基地。</p>
          <div className="briefing-grid">
            <div><small>LEARNING FOCUS</small><b>Sensor → Network → Processing → Actuator</b></div>
            <div><small>MISSION TIME</small><b>6–8 minutes</b></div>
            <div><small>DATA POLICY</small><b>No login · On-device score</b></div>
          </div>
          <button className="primary-action" onClick={() => startMission(0)}>開始任務 <span>START MISSION</span></button>
        </section>
      </main>
    );
  }

  if (stage === "complete") {
    return (
      <main className="mars-game complete-screen">
        <div className="complete-orbit" aria-hidden="true"><div /></div>
        <section className="complete-card">
          <span className="kicker">MISSION REPORT // COMPLETE</span>
          <h1>BASE <span>SECURED</span></h1>
          <p>你成功運用 IoT 自動規則穩定火星基地的生命維持系統。</p>
          <div className="final-score"><small>TOTAL SCORE</small><strong>{totalScore.toLocaleString()}</strong><span>{missionStars.map((stars, index) => <i key={index}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</i>)}</span></div>
          <div className="learning-chain" aria-label="IoT data flow">
            <b>感應器<small>SENSOR</small></b><span>→</span><b>網絡<small>NETWORK</small></b><span>→</span><b>處理<small>PROCESSING</small></b><span>→</span><b>執行裝置<small>ACTUATOR</small></b>
          </div>
          <p className="best-score">Personal best on this device: <b>{bestScore.toLocaleString()}</b></p>
          <div className="complete-actions">
            <button className="primary-action" onClick={() => { setTotalScore(0); setMissionStars([]); startMission(0); }}>重新挑戰 <span>REPLAY</span></button>
            <a className="secondary-action" href={`${BASE_PATH}/`}>返回遊戲室 BACK TO LAB</a>
          </div>
        </section>
      </main>
    );
  }

  if (stage === "result" && result) {
    return (
      <main className={`mars-game result-screen ${result.success ? "result-success" : "result-fail"}`}>
        <header className="game-topbar"><a href={`${BASE_PATH}/`} className="lab-link">LUI SIR’S ICT GAME LAB</a><span>MISSION {mission.number} / 03</span></header>
        <section className="result-card">
          <span className="result-seal">{result.success ? "✓" : "!"}</span>
          <span className="kicker">{result.success ? "SYSTEM STABLE" : "SYSTEM FAILURE"}</span>
          <h1>{result.success ? "任務完成" : "需要重新配置"}</h1>
          {result.success ? (
            <>
              <div className="stars" aria-label={`${result.stars} out of 3 stars`}>{"★".repeat(result.stars)}<i>{"★".repeat(3 - result.stars)}</i></div>
              <div className="result-stats"><div><small>SCORE</small><b>{result.score.toLocaleString()}</b></div><div><small>ENERGY LEFT</small><b>{result.energy}%</b></div></div>
              <p>感應器收集數據，經網絡傳送到控制中心；系統分析數據後，向正確的執行裝置發出指令。</p>
            </>
          ) : (
            <div className="issue-panel"><b>基地 AI 診斷：</b>{result.issues.map((issue) => <p key={issue}>— {issue}</p>)}</div>
          )}
          <div className="learning-chain compact" aria-label="IoT data flow"><b>SENSOR</b><span>→</span><b>NETWORK</b><span>→</span><b>PROCESSING</b><span>→</span><b>ACTUATOR</b></div>
          {result.success ? (
            <button className="primary-action" onClick={() => missionIndex < 2 ? startMission(missionIndex + 1) : finishGame()}>{missionIndex < 2 ? "下一個任務" : "查看任務報告"}<span>{missionIndex < 2 ? "NEXT MISSION" : "FINAL REPORT"}</span></button>
          ) : (
            <button className="primary-action" onClick={() => startMission(missionIndex)}>重新配置 <span>TRY AGAIN</span></button>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className={`mars-game control-room ${stage === "running" ? "is-running" : ""}`}>
      <header className="game-topbar">
        <a href={`${BASE_PATH}/`} className="lab-link">LUI SIR’S ICT GAME LAB</a>
        <div className="mission-progress" aria-label={`Mission ${missionIndex + 1} of 3`}>
          {MISSIONS.map((item, index) => <i key={item.number} className={index <= missionIndex ? "active" : ""} />)}
          <span>MISSION {mission.number} / 03</span>
        </div>
        <button className="icon-button" onClick={toggleSound}>{soundOn ? "SOUND ON" : "SOUND OFF"}</button>
      </header>

      <section className="telemetry" aria-label="Live base readings">
        {sensorIds.map((id) => (
          <div key={id} className={`telemetry-item ${statusFor(id, readings[id])}`}>
            <span>{SYSTEMS[id].symbol}</span>
            <div><small>{SYSTEMS[id].shortZh}{" // LIVE"}</small><strong>{readingText(id, readings[id])}</strong></div>
            <i>{statusFor(id, readings[id]) === "safe" ? "STABLE" : "ALERT"}</i>
          </div>
        ))}
        <div className="telemetry-item energy"><span>⚡</span><div><small>能源{" // ENERGY"}</small><strong>{energy}%</strong></div><i>ONLINE</i></div>
      </section>

      <div className="control-grid">
        <aside className="mission-panel panel">
          <span className="panel-label">MISSION BRIEF</span>
          <p className="mission-count">{mission.number}</p>
          <h1>{mission.titleZh}</h1>
          <h2>{mission.titleEn}</h2>
          <p className="objective">{mission.objective}</p>
          <div className="ai-message"><span>BASE AI</span><p>「{mission.ai}」</p></div>
          <div className={`timer ${timeLeft < 20 ? "urgent" : ""}`}><small>危機倒數 // TIME LEFT</small><strong>{formatClock(timeLeft)}</strong></div>
          {mission.guided && stage === "play" && (
            <div className="tutorial-callout">
              <small>GUIDED LINK // {Math.min(tutorialStep + 1, 5)} OF 5</small>
              <b>{[
                "先選擇「氧氣感應器」作為 Input。",
                "很好。現在選擇「製氧機」作為 Output。",
                "把啟動門檻設定為 19%。",
                "按「安裝規則」寫入控制中心。",
                "規則完成，啟動模擬看看結果。",
              ][Math.min(tutorialStep, 4)]}</b>
            </div>
          )}
        </aside>

        <section className="wiring-panel panel">
          <div className="panel-heading"><span className="panel-label">SYSTEM MAP</span><span>CLICK TO CONNECT</span></div>
          <div className="io-heading"><b>01 — INPUT</b><span>感應器 SENSORS</span></div>
          <div className="device-grid sensor-grid">
            {sensorIds.map((id) => {
              const system = SYSTEMS[id];
              return (
                <button key={id} className={`device-card ${selectedSensor === id ? "selected" : ""} ${activeRuleSensors.has(id) ? "configured" : ""} ${mission.guided && tutorialStep === 0 && id === "oxygen" ? "guided" : ""}`} onClick={() => chooseSensor(id)} disabled={stage === "running"}>
                  <span className="device-symbol">{system.symbol}</span>
                  <b>{system.nameZh}</b><small>{system.nameEn}</small>
                  <i>{activeRuleSensors.has(id) ? "RULE SET" : "AVAILABLE"}</i>
                </button>
              );
            })}
          </div>

          <div className="data-bus" aria-label="Network and control center">
            <span className={selectedSensor ? "active" : ""}>DATA</span>
            <div><small>02 — COMMUNICATION</small><b>基地網絡 <em>BASE NETWORK</em></b></div>
            <span>→</span>
            <div><small>03 — PROCESSING</small><b>控制中心 <em>CONTROL CENTER</em></b></div>
            <span className={selectedActuator ? "active" : ""}>CMD</span>
          </div>

          <div className="io-heading"><b>04 — OUTPUT</b><span>執行裝置 ACTUATORS</span></div>
          <div className="device-grid">
            {ACTUATORS.map((actuator) => (
              <button key={actuator.id} className={`device-card actuator-card ${selectedActuator === actuator.id ? "selected" : ""} ${mission.guided && tutorialStep === 1 && actuator.id === "oxygenator" ? "guided" : ""}`} onClick={() => chooseActuator(actuator.id)} disabled={stage === "running"}>
                <span className="device-symbol actuator-symbol">{actuator.code}</span>
                <b>{actuator.nameZh}</b><small>{actuator.nameEn}</small><i>STANDBY</i>
              </button>
            ))}
          </div>
        </section>

        <aside className="rule-panel panel">
          <span className="panel-label">AUTOMATION RULE</span>
          <h2>設定自動反應</h2><p>Set how the base responds to sensor data.</p>
          <div className="rule-builder">
            <small>IF // 如果</small>
            <strong>{selectedSystem?.shortZh ?? "選擇感應器"}</strong>
            <span>{selectedSystem?.condition ?? "—"}</span>
            {selectedSystem ? (
              <>
                <output>{thresholds[selectedSystem.id]}{selectedSystem.unit}</output>
                <input type="range" min={selectedSystem.min} max={selectedSystem.max} step={selectedSystem.step} value={thresholds[selectedSystem.id]} onChange={(event) => { setThresholds((current) => ({ ...current, [selectedSystem.id]: Number(event.target.value) })); if (missionIndex === 0 && selectedSystem.id === "oxygen" && Number(event.target.value) === 19) setTutorialStep(3); }} disabled={stage === "running"} aria-label={`${selectedSystem.shortZh} threshold`} />
                <div className="range-labels"><span>{selectedSystem.min}{selectedSystem.unit}</span><span>{selectedSystem.max}{selectedSystem.unit}</span></div>
              </>
            ) : <div className="range-placeholder" />}
            <small>THEN // 就</small>
            <strong>{ACTUATORS.find((item) => item.id === selectedActuator)?.nameZh ?? "選擇執行裝置"}</strong>
          </div>
          <button className="install-button" onClick={installRule} disabled={stage === "running"}>＋ 安裝規則 INSTALL RULE</button>

          <div className="installed-rules">
            <div><small>INSTALLED RULES</small><b>{rules.length} / {mission.required.length}</b></div>
            {rules.length === 0 ? <p>尚未建立規則。</p> : rules.map((rule) => {
              const system = SYSTEMS[rule.sensor];
              const actuator = ACTUATORS.find((item) => item.id === rule.actuator);
              return <button key={rule.sensor} onClick={() => removeRule(rule.sensor)} disabled={stage === "running"} title="Click to remove rule"><span>{system.symbol}</span><p>IF {system.shortZh} {system.condition} {rule.threshold}{system.unit}<br />THEN {actuator?.nameZh}</p><i>×</i></button>;
            })}
          </div>
        </aside>
      </div>

      <footer className="command-bar">
        <div className="system-feedback"><i /><span>{feedback}</span></div>
        {stage === "running" ? (
          <div className="simulation-progress"><span>SIMULATING</span><div><i style={{ width: `${runProgress}%` }} /></div><b>{Math.round(runProgress)}%</b></div>
        ) : (
          <button className="run-button" onClick={runSimulation}>啟動模擬 <span>RUN SIMULATION</span><i>▶</i></button>
        )}
      </footer>
    </main>
  );
}
