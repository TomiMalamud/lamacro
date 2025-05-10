export const TARGETS_TEM_BAJA = [0.005, 0.01, 0.015, 0.02, 0.025];
export const TARGETS_TEM_SUBA = [0.035, 0.04, 0.045, 0.05, 0.055];

export const DUAL_BONDS_COLORS: Record<string, string> = {
  tamar_tem_spot: "white",
  tamar_AVG: "white",
  TTM26: "#ff8888",
  TTJ26: "#fb9f3f",
  TTS26: "#4af6c3",
  TTD26: "#66CCFF",
  projection_AVG: "silver",
};

export const chartConfig = {
  tamar_tem_spot: {
    label: "TEM Spot TAMAR",
    color: DUAL_BONDS_COLORS.tamar_tem_spot,
  },
  tamar_AVG: {
    label: "Promedio Histórico TAMAR",
    color: DUAL_BONDS_COLORS.tamar_AVG,
  },
  TTM26_fixed_rate: {
    label: "TTM26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTM26,
  },
  TTJ26_fixed_rate: {
    label: "TTJ26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTJ26,
  },
  TTS26_fixed_rate: {
    label: "TTS26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTS26,
  },
  TTD26_fixed_rate: {
    label: "TTD26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTD26,
  },
  tamar_proy_AVG: {
    label: "Promedio Proyección TAMAR",
    color: DUAL_BONDS_COLORS.projection_AVG,
  },
} as const;
