/**
 * Splits an array into chunks of a specified size.
 * * @template T - The type of elements in the array.
 * @param {T[]} array - The original array to be split.
 * @param {number} size - The maximum size of each chunk.
 * @returns {T[][]} - A new 2D array containing the chunks.
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
    if (size <= 0) {
        throw new Error("Size must be a positive number.");
    }

    const result: T[][] = [];

    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        result.push(chunk);
    }

    return result;
};