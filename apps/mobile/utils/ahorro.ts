interface AhorroParams {
  streakDays: number;
  cigarettesPerDay: number;
  pricePerPack: number;
  cigarettesPerPack?: number;
}

interface AhorroResult {
  diasLimpios: number;
  cigarrillosEvitados: number;
  ahorrosCOP: number;
}

// Calcula dinero ahorrado, días y cigarrillos evitados según racha del usuario
export function calcularAhorro({
  streakDays,
  cigarettesPerDay,
  pricePerPack,
  cigarettesPerPack = 20,
}: AhorroParams): AhorroResult {
  const cigarrillosEvitados = streakDays * cigarettesPerDay;
  const paquetesEvitados = cigarrillosEvitados / cigarettesPerPack;
  const ahorrosCOP = Math.round(paquetesEvitados * pricePerPack);

  return {
    diasLimpios: streakDays,
    cigarrillosEvitados,
    ahorrosCOP,
  };
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}
