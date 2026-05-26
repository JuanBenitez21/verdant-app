export interface WearableData {
  frecuenciaCardiaca: number;
  pasosDiarios: number;
  calidadSueno: number;
}

export function getSimulatedWearableData(diasTotales: number): WearableData {
  const noise = (range: number) => Math.random() * range * 2 - range;

  const frecuenciaCardiaca = Math.max(58, Math.round(76 - diasTotales * 0.15 + noise(2)));
  const pasosDiarios = Math.min(12000, Math.round(4200 + diasTotales * 80 + noise(500)));
  const calidadSueno = Math.min(95, Math.round(52 + diasTotales * 0.8));

  return { frecuenciaCardiaca, pasosDiarios, calidadSueno };
}

export function formatPasos(steps: number): string {
  return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps);
}
