export const SYSTEMS = {
  oxygen: {
    id: "oxygen",
    symbol: "O₂",
    nameZh: "氧氣感應器",
    nameEn: "Oxygen Sensor",
    shortZh: "氧氣",
    unit: "%",
    min: 16,
    max: 23,
    step: 0.5,
    idealThreshold: 19,
    goodRange: [18.5, 20],
    condition: "低於",
    conditionEn: "BELOW",
    actuator: "oxygenator",
    actuatorZh: "製氧機",
    actuatorEn: "Oxygen Generator",
  },
  temperature: {
    id: "temperature",
    symbol: "°C",
    nameZh: "溫度感應器",
    nameEn: "Temperature Sensor",
    shortZh: "溫度",
    unit: "°C",
    min: 18,
    max: 32,
    step: 1,
    idealThreshold: 24,
    goodRange: [22, 25],
    condition: "高於",
    conditionEn: "ABOVE",
    actuator: "cooling",
    actuatorZh: "冷卻系統",
    actuatorEn: "Cooling System",
  },
  water: {
    id: "water",
    symbol: "H₂O",
    nameZh: "水量感應器",
    nameEn: "Water Level Sensor",
    shortZh: "儲水量",
    unit: "%",
    min: 25,
    max: 75,
    step: 5,
    idealThreshold: 45,
    goodRange: [40, 55],
    condition: "低於",
    conditionEn: "BELOW",
    actuator: "pump",
    actuatorZh: "循環水泵",
    actuatorEn: "Circulation Pump",
  },
};

export const ACTUATORS = [
  { id: "oxygenator", code: "OX-GEN", nameZh: "製氧機", nameEn: "Oxygen Generator" },
  { id: "cooling", code: "THERM", nameZh: "冷卻系統", nameEn: "Cooling System" },
  { id: "pump", code: "H₂O-P", nameZh: "循環水泵", nameEn: "Circulation Pump" },
];

export const MISSIONS = [
  {
    number: "01",
    titleZh: "氧氣危機",
    titleEn: "Oxygen Emergency",
    objective: "基地氧氣含量正在下降。建立自動規則，在危險水平前啟動製氧機。",
    ai: "氧氣正在下降。請保持冷靜——火星暫時未提供即日送貨服務。",
    required: ["oxygen"],
    setupTime: 75,
    start: { oxygen: 17.5, temperature: 22, water: 64 },
    guided: true,
  },
  {
    number: "02",
    titleZh: "溫室熱浪",
    titleEn: "Greenhouse Heatwave",
    objective: "太陽風暴令溫室急速升溫。選擇正確輸入及輸出，防止農作物受損。",
    ai: "葉片溫度持續上升。今次由你決定感應器、門檻值和執行裝置。",
    required: ["temperature"],
    setupTime: 75,
    start: { oxygen: 20.5, temperature: 31, water: 62 },
    guided: false,
  },
  {
    number: "03",
    titleZh: "水庫洩漏",
    titleEn: "Reservoir Leak",
    objective: "基地儲水量跌至危險水平。建立水量監察規則，讓循環水泵及時補充溫室用水。",
    ai: "偵測到水庫洩漏。火星上每一滴水都很珍貴——咖啡配額亦包括在內。",
    required: ["water"],
    setupTime: 70,
    start: { oxygen: 20.5, temperature: 23, water: 29 },
    guided: false,
  },
  {
    number: "04",
    titleZh: "溫室資源失衡",
    titleEn: "Greenhouse Imbalance",
    objective: "高溫令溫室水分加速流失。同時管理溫度和水量，避免農作物枯萎。",
    ai: "兩個警報同時出現。先分辨 Inputs，再為每個系統接上正確的 Output。",
    required: ["temperature", "water"],
    setupTime: 95,
    start: { oxygen: 20.4, temperature: 29, water: 32 },
    guided: false,
  },
  {
    number: "05",
    titleZh: "生命系統連鎖故障",
    titleEn: "Life-support Cascade",
    objective: "三套系統同時失靈。為氧氣、溫度及水量各建立一條可靠而節能的自動規則。",
    ai: "最後考驗：三個 Inputs、三個 Outputs。接錯一條線，整個基地都會知道。",
    required: ["oxygen", "temperature", "water"],
    setupTime: 120,
    start: { oxygen: 17.8, temperature: 30, water: 28 },
    guided: false,
  },
];

export const DEFAULT_THRESHOLDS = { oxygen: 19, temperature: 24, water: 45 };

export function isRuleValid(rule) {
  const system = SYSTEMS[rule.sensor];
  return Boolean(
    system &&
      rule.actuator === system.actuator &&
      rule.threshold >= system.goodRange[0] &&
      rule.threshold <= system.goodRange[1],
  );
}

export function validateRules(mission, rules) {
  const issues = [];
  for (const sensorId of mission.required) {
    const system = SYSTEMS[sensorId];
    const rule = rules.find((item) => item.sensor === sensorId);
    if (!rule) {
      issues.push(`尚未為${system.shortZh}建立規則。`);
      continue;
    }
    if (rule.actuator !== system.actuator) {
      issues.push(`${system.nameZh}接駁了錯誤的執行裝置。`);
      continue;
    }
    if (rule.threshold < system.goodRange[0] || rule.threshold > system.goodRange[1]) {
      issues.push(`${system.shortZh}門檻值不安全；建議範圍為 ${system.goodRange[0]}–${system.goodRange[1]}${system.unit}。`);
    }
  }
  return { success: issues.length === 0, issues };
}

export function calculateEnergy(mission, rules) {
  let remaining = 100;
  for (const sensorId of mission.required) {
    const system = SYSTEMS[sensorId];
    const rule = rules.find((item) => item.sensor === sensorId);
    if (!rule || rule.actuator !== system.actuator) {
      remaining -= 18;
      continue;
    }
    const waste = Math.abs(rule.threshold - system.idealThreshold) * 1.6;
    remaining -= 8 + waste;
  }
  return Math.max(18, Math.round(remaining));
}

export function advanceReadings(readings, mission, rules) {
  const next = { ...readings };
  for (const sensorId of mission.required) {
    const rule = rules.find((item) => item.sensor === sensorId);
    const valid = rule && isRuleValid(rule);
    if (sensorId === "oxygen") next.oxygen = Math.min(21, readings.oxygen + (valid ? 0.5 : -0.2));
    if (sensorId === "temperature") next.temperature = Math.max(23, readings.temperature + (valid ? -1 : 0.35));
    if (sensorId === "water") next.water = Math.min(58, readings.water + (valid ? 3.8 : -1.5));
  }
  return next;
}

export function calculateScore(mission, rules, timeLeft, mistakes) {
  const energy = calculateEnergy(mission, rules);
  const raw = 900 + energy * 4 + timeLeft * 2 - mistakes * 80;
  return Math.max(300, Math.round(raw));
}
