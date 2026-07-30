'use strict';

/**
 * playerImportParser.js
 * Handles Excel file parsing, validation, deduplication, and import logic
 * for the Cricket Auction Application player roster migration
 */

/**
 * Parse Excel file from FormData
 * Requires: xlsx library or server-side Excel parsing
 * @param {File} file - Excel file from FormData
 * @returns {Promise<Array>} - Array of parsed rows with headers
 */
export async function parseExcelFile(file) {
  // This would use a library like 'xlsx' or server-side processing
  // For now, return mock structure that callers can extend
  try {
    const buffer = await file.arrayBuffer();
    // Placeholder: actual implementation requires xlsx or equivalent
    // In a real implementation, use: import XLSX from 'xlsx';
    // const workbook = XLSX.read(buffer, { type: 'array' });
    // const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // return XLSX.utils.sheet_to_json(sheet);
    console.log('Excel parsing placeholder - implement with xlsx library');
    return [];
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Validate player record against required fields and constraints
 * @param {Object} row - Player data row
 * @param {number} rowIndex - Row number in spreadsheet (for error reporting)
 * @returns {Object} - { valid: boolean, errors: [], player: {...} }
 */
export function validatePlayerRecord(row, rowIndex) {
  const errors = [];
  const player = {};

  // Extract required fields
  const serialNumber = row.serial_number || row['Serial Number'] || row['Sl.No'];
  const name = row.name || row['Name'] || row['Player Name'];
  const role = row.role || row['Role'] || row['Category'];
  const basePrice = row.base_price || row['Base Price'] || row['Price'];

  // Validate serial_number: required, numeric, > 0
  if (!serialNumber) {
    errors.push('Missing serial_number');
  } else if (isNaN(serialNumber) || parseInt(serialNumber) <= 0) {
    errors.push(`Invalid serial_number: "${serialNumber}" (must be numeric > 0)`);
  } else {
    player.serial_number = parseInt(serialNumber);
  }

  // Validate name: required, non-empty string
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Missing or invalid name');
  } else {
    player.name = name.trim();
  }

  // Validate role: required, must be in allowed set
  const validRoles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
  if (!role || typeof role !== 'string') {
    errors.push('Missing role');
  } else if (!validRoles.includes(role.trim())) {
    errors.push(`Invalid role: "${role}" (must be one of: ${validRoles.join(', ')})`);
  } else {
    player.role = role.trim();
  }

  // Validate base_price: required, numeric, > 0
  if (!basePrice) {
    errors.push('Missing base_price');
  } else if (isNaN(basePrice) || parseInt(basePrice) <= 0) {
    errors.push(`Invalid base_price: "${basePrice}" (must be numeric > 0)`);
  } else {
    player.base_price = parseInt(basePrice);
  }

  // Optional fields
  if (row.photo_url) player.photo_url = row.photo_url;
  if (row.mobile) player.mobile = row.mobile;
  if (row.rating) player.rating = Math.min(3, Math.max(0, parseInt(row.rating)));
  if (row.entry_fee) player.entry_fee = parseInt(row.entry_fee);
  if (row.source_group) player.source_group = row.source_group;

  // Add queue_order: will be set based on serial_number sequence
  player.queue_order = player.serial_number;
  player.status = 'pending';

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors.map((e) => `Row ${rowIndex}: ${e}`) : [],
    player: errors.length === 0 ? player : null,
  };
}

/**
 * Detect duplicate players in a roster
 * @param {Array} players - Array of validated player objects
 * @returns {Object} - { duplicates: [...], clean: [...] }
 */
export function detectDuplicates(players) {
  const seen = new Map(); // Map<serial_number | name, indices>
  const duplicates = [];
  const clean = [];

  players.forEach((player, idx) => {
    // Check by serial_number
    if (seen.has(player.serial_number)) {
      duplicates.push({
        index: idx,
        reason: `Duplicate serial_number: ${player.serial_number}`,
        player,
      });
    } else if (seen.has(player.name.toLowerCase())) {
      duplicates.push({
        index: idx,
        reason: `Duplicate player name: ${player.name}`,
        player,
      });
    } else {
      seen.set(player.serial_number, idx);
      seen.set(player.name.toLowerCase(), idx);
      clean.push(player);
    }
  });

  return { duplicates, clean };
}

/**
 * Sort players by serial_number to preserve source order
 * @param {Array} players - Player array
 * @returns {Array} - Sorted players
 */
export function sortPlayersBySerialNumber(players) {
  return [...players].sort((a, b) => a.serial_number - b.serial_number);
}

/**
 * Generate import report summary
 * @param {Object} result - Import result object
 * @returns {string} - Human-readable summary
 */
export function generateImportReport(result) {
  const { totalRows, validPlayers, validationErrors, duplicates, importedCount } = result;

  return `
=== PLAYER IMPORT REPORT ===
Total rows in file: ${totalRows}
Valid players: ${validPlayers}
Validation errors: ${validationErrors}
Duplicates detected: ${duplicates}
Successfully imported: ${importedCount}

Status: ${importedCount === validPlayers ? '✓ SUCCESS' : '⚠ PARTIAL'}
  `.trim();
}

/**
 * Format player for database insertion
 * @param {Object} player - Validated player object
 * @returns {Object} - Database-ready player record
 */
export function formatPlayerForDb(player) {
  return {
    serial_number: player.serial_number,
    name: player.name,
    role: player.role,
    base_price: player.base_price,
    photo_url: player.photo_url || null,
    mobile: player.mobile || null,
    rating: player.rating || 0,
    entry_fee: player.entry_fee || null,
    source_group: player.source_group || null,
    queue_order: player.queue_order,
    status: 'pending',
  };
}

/**
 * Complete import pipeline: parse -> validate -> deduplicate -> format
 * @param {Array} rows - Raw rows from Excel
 * @returns {Object} - { success: boolean, players: [], errors: [], report: string }
 */
export function processPlayerImport(rows) {
  const validPlayers = [];
  const validationErrors = [];

  // Step 1: Validate each row
  rows.forEach((row, idx) => {
    const result = validatePlayerRecord(row, idx + 2); // +2 because headers are row 1
    if (result.valid) {
      validPlayers.push(result.player);
    } else {
      validationErrors.push(...result.errors);
    }
  });

  // Step 2: Detect duplicates
  const { duplicates, clean } = detectDuplicates(validPlayers);
  duplicates.forEach((dup) => {
    validationErrors.push(`Row ${dup.index + 2}: ${dup.reason}`);
  });

  // Step 3: Sort by serial_number to preserve order
  const sorted = sortPlayersBySerialNumber(clean);

  // Step 4: Format for database
  const dbReady = sorted.map(formatPlayerForDb);

  // Step 5: Generate report
  const report = generateImportReport({
    totalRows: rows.length,
    validPlayers: validPlayers.length,
    validationErrors: validationErrors.length,
    duplicates: duplicates.length,
    importedCount: dbReady.length,
  });

  return {
    success: validationErrors.length === 0,
    players: dbReady,
    errors: validationErrors,
    report,
    stats: {
      total: rows.length,
      valid: validPlayers.length,
      duplicates: duplicates.length,
      imported: dbReady.length,
    },
  };
}
