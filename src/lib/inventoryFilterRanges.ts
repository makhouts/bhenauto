export interface NumericRangeConfig {
    min: number;
    max: number;
    step: number;
}

export const PRICE_RANGE_CONFIG: NumericRangeConfig = {
    min: 0,
    max: 250000,
    step: 5000,
};

export const MILEAGE_RANGE_CONFIG: NumericRangeConfig = {
    min: 0,
    max: 200000,
    step: 5000,
};

export function clampRangeValue(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function normalizeQueryRange(
    minRaw: string | null | undefined,
    maxRaw: string | null | undefined,
    config: NumericRangeConfig
): { min: number; max: number } {
    const parsedMin = Number.parseInt(minRaw ?? "", 10);
    const parsedMax = Number.parseInt(maxRaw ?? "", 10);

    let min = clampRangeValue(Number.isNaN(parsedMin) ? config.min : parsedMin, config.min, config.max);
    let max = clampRangeValue(Number.isNaN(parsedMax) ? config.max : parsedMax, config.min, config.max);

    if (min > max) {
        [min, max] = [max, min];
    }

    return { min, max };
}
