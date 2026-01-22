/**
 * Promise pool for controlling concurrency
 * Allows processing multiple async tasks with a concurrency limit
 */

/**
 * Process items with controlled concurrency
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} concurrency - Max number of concurrent operations
 * @returns {Promise<Array>} Results array with success and errors
 */
async function processWithConcurrency(items, processor, concurrency = 3) {
  const results = [];
  const executing = [];
  
  for (const [index, item] of items.entries()) {
    // Create promise for this item
    const promise = Promise.resolve().then(() => processor(item, index));
    results.push(promise);
    
    // If we've hit concurrency limit, wait for one to complete
    if (concurrency <= items.length) {
      const executing = promise.then(() => {
        return executing.splice(executing.indexOf(executing), 1);
      });
      executing.push(executing);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  
  // Wait for all remaining promises
  return Promise.allSettled(results);
}

/**
 * Simpler batch processor - processes items in batches
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} batchSize - Size of each batch
 * @returns {Promise<Array>} Results array
 */
async function processBatches(items, processor, batchSize = 3) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item, index) => processor(item, i + index))
    );
    results.push(...batchResults);
  }
  
  return results;
}

module.exports = {
  processWithConcurrency,
  processBatches,
};
