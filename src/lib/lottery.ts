/**
 * Lottery Engine — Weight-based probability with inventory management
 */

interface PrizeOption {
  id: string;
  name: string;
  probability: number; // weight
  remaining: number;
  isConsolation: boolean;
}

export interface LotteryResult {
  prizeId: string;
  prizeName: string;
  isWin: boolean;
  isConsolation: boolean;
}

/**
 * Draw a prize based on weighted probability.
 * Prizes with 0 remaining stock are excluded (redirected to consolation/miss).
 */
export function drawPrize(prizes: PrizeOption[]): LotteryResult {
  // Filter out prizes with no stock (except consolation prizes which have unlimited effective stock)
  const available = prizes.filter(p => p.remaining > 0 || p.isConsolation);
  
  if (available.length === 0) {
    return {
      prizeId: '',
      prizeName: '再接再厲',
      isWin: false,
      isConsolation: true,
    };
  }

  // Calculate total weight
  const totalWeight = available.reduce((sum, p) => sum + p.probability, 0);
  
  // Generate random number
  let random = Math.random() * totalWeight;
  
  // Select prize based on weight
  for (const prize of available) {
    random -= prize.probability;
    if (random <= 0) {
      return {
        prizeId: prize.id,
        prizeName: prize.name,
        isWin: !prize.isConsolation,
        isConsolation: prize.isConsolation,
      };
    }
  }
  
  // Fallback to last prize
  const lastPrize = available[available.length - 1];
  return {
    prizeId: lastPrize.id,
    prizeName: lastPrize.name,
    isWin: !lastPrize.isConsolation,
    isConsolation: lastPrize.isConsolation,
  };
}
