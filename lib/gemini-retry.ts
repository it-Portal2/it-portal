import { RetryAttempt, GEMINI_CONFIG } from "@/lib/types";

/**
 * Fixed Dynamic Retry Strategy Generator
 * Creates rotating attempts across all keys with progressive timeout scaling
 */
export function generateDynamicRetryStrategy(numKeys: number): RetryAttempt[] {
  if (numKeys <= 0) {
    console.warn("No keys available for retry strategy");
    return [];
  }

  const { MAX_EXECUTION_TIME, BASE_TIMEOUT, MAX_TIMEOUT, TIMEOUT_BUFFER } = GEMINI_CONFIG;
  
  // Fix: Calculate based on minimum timeout per attempt, not per rotation
  const minTimeoutPerAttempt = BASE_TIMEOUT;
  const maxPossibleAttempts = Math.floor((MAX_EXECUTION_TIME - TIMEOUT_BUFFER) / minTimeoutPerAttempt);
  
  if (maxPossibleAttempts <= 0) {
    console.warn("Insufficient time budget for any attempts");
    return [];
  }

  // Calculate realistic number of rotations based on available attempts
  const attemptsPerRotation = numKeys;
  const maxRotations = Math.ceil(maxPossibleAttempts / attemptsPerRotation);
  
  console.log(`Planning dynamic retry strategy for ${numKeys} keys across ${maxRotations} potential rotations`);

  const attempts: RetryAttempt[] = [];
  let cumulativeTime = 0;
  
  for (let rotation = 0; rotation < maxRotations; rotation++) {
    // Progressive timeout scaling: each rotation gets 20% more time
    const timeoutMultiplier = 1 + (rotation * 0.2);
    const rotationTimeout = Math.min(BASE_TIMEOUT * timeoutMultiplier, MAX_TIMEOUT);
    
    for (let keyIndex = 0; keyIndex < numKeys; keyIndex++) {
      // Check if we have enough time for this attempt
      if (cumulativeTime + rotationTimeout > MAX_EXECUTION_TIME - TIMEOUT_BUFFER) {
        console.log(`Time budget exhausted at rotation ${rotation + 1}, key ${keyIndex + 1}`);
        break;
      }
      
      attempts.push({
        keyIndex,
        timeout: Math.floor(rotationTimeout),
        rotation: rotation + 1
      });
      
      cumulativeTime += rotationTimeout;
    }
    
    // Break if we've exceeded time budget
    if (cumulativeTime > MAX_EXECUTION_TIME - TIMEOUT_BUFFER) {
      break;
    }
  }

  console.log(`Generated ${attempts.length} attempts across ${Math.max(...attempts.map(a => a.rotation))} rotations`);
  console.log(`Total planned time: ${cumulativeTime}ms (${((cumulativeTime / MAX_EXECUTION_TIME) * 100).toFixed(1)}% of budget)`);
  
  return attempts;
}

/**
 * Enhanced Timeout Wrapper with Context
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  context: string = "Operation"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`${context} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  return Promise.race([promise, timeoutPromise]);
}
