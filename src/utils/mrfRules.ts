import { MRFLineItem, MRFDocument } from '../types/mrf';
import { generateMRFNumber, getTodayDateStr } from './storage';
import sitesDataRaw from '../data_sites.json';
import itemsDataRaw from '../data_items.json';

export interface MRFAutomationInput {
  // Q1: What equipment to install? MF2, DF16, FX4, FX8 (Refer to Database)
  equipmentType: 'MF2' | 'DF16' | 'FX4' | 'FX8';

  // Q2: Is the site Outdoor or Indoor?
  // Purpose: determine if the site needs to use LTC and Connectors (25 PA for power, 15 PA for uplink)
  environment: 'Outdoor' | 'Indoor';

  // Q3: For outdoor, is Transport Equipment located outside Proposed OLT Proposal? Distance?
  // Purpose: If yes, use 15 PA LTC and 2x 15 PA Connector. If not, don't. Distance bases: 3m, 5m, 8m.
  transportOutside: boolean;
  transportDistance: 3 | 5 | 8; // in meters
  // User specifies exactly how many patchcords are needed rather than assigning 2 directly
  patchcordCount?: number;
  // Maximum of 2 ESFPs (1 run of uplink requires 2 LC-LC cords for 1 ESFP)
  esfpCount?: number;

  // Q4: Is the Tapping point separated from OLT location?
  // 1: single cable to separated RS -> Powercable exceeds distance, outdoor: 25 PA LTC + 4x connector
  // 2 (separated): 2 separated RS -> distance to RS1 & RS2 -> Powercable exceeds bigger distance (2x), outdoor: 2x 25 PA LTC + 4x connector
  // 2 (same RS): same RS -> both cables laid together in 25 PA LTC, outdoor: 2x connector
  tappingPointConfig: 'two_separated' | 'one_separated' | 'two_same_rs';
  distanceToRS1: number; // in meters (to RS1 or single RS)
  distanceToRS2?: number; // in meters (to RS2 when two separated)

  // Q5: How long is the grounding cable?
  // Will NOT use LTC. Same logic with power cable: use items that exceed given distance.
  groundingDistance: number; // in meters

  // Q6: Does RS need change breakers? Yes or no? How many? Rating?
  // Purpose: auto load breaker from database.
  needChangeBreakers: boolean;
  breakerCount: number; // 1, 2, ...
  breakerRating: '16A' | '20A' | '25A' | '32A' | '63A';

  // Q7: How long is Downlink cable?
  // Suggestion is 2m if ODF is just below equipment. Options: 1.5m, 2m, 3m, 5m, 8m, 10m, 15m.
  downlinkDistance: number; // in meters

  // Q8: How many LT Cards (For MF2)?
  // If 2: uses 16 GPON and 16 XGPON. If 1: uses 8 GPON and 8 XGPON and a universal dummy plate.
  ltCardCount: 1 | 2;
  // User decides if SW STAGED (3FE76353AA-S) or standard (3FE76353AA)
  swStaged?: boolean;

  // Destination site parameters
  sitePlaid?: string;
  fromWarehouse?: string;
  requisitionerName?: string;
  requisitionerTitle?: string;
}

/**
 * Validates that an item code exists in the database
 */
const DB_MAP = new Map(
  itemsDataRaw.map((it: any) => [it.code.toLowerCase(), it])
);

function getItemDetails(code: string, fallbackDesc: string, fallbackUom = 'pc', fallbackCat = 'Equipment') {
  const hit = DB_MAP.get(code.toLowerCase());
  if (hit) {
    return {
      partNumber: hit.partNumber || hit.code,
      description: hit.description,
      uom: fallbackUom || hit.uom || 'pc',
      category: hit.category || fallbackCat,
    };
  }
  return {
    partNumber: code,
    description: fallbackDesc,
    uom: fallbackUom,
    category: fallbackCat,
  };
}

export function generateAutomatedBoQ(input: MRFAutomationInput): {
  mainItems: MRFLineItem[];
  localMaterials: MRFLineItem[];
  explanations: Record<string, string>;
} {
  const mainItems: MRFLineItem[] = [];
  const localMaterials: MRFLineItem[] = [];
  const explanations: Record<string, string> = {};

  const addMain = (
    code: string,
    fallbackDesc: string,
    qty: number,
    _packageNo = '',
    category = 'Equipment',
    uom = 'PC'
  ) => {
    const details = getItemDetails(code, fallbackDesc, uom, category);
    const finalUom = details.uom || uom || 'PC';
    mainItems.push({
      id: `mi_auto_${mainItems.length + 1}`,
      partNumber: details.partNumber,
      description: details.description,
      packageNo: '', // Do not fill Package No.
      uom: finalUom,
      qtyReq: qty,
      qtyIssued: finalUom, // Values in UOM column copied and placed under issued column in WHSE QUANTITY
      qtyReceived: '',
      qtyBalance: '',
      category: details.category,
    });
  };

  const addLocal = (
    code: string,
    fallbackDesc: string,
    qty: number,
    _packageNo = '',
    category = 'Local Accessories',
    uom = 'pcs'
  ) => {
    const details = getItemDetails(code, fallbackDesc, uom, category);
    const finalUom = details.uom || uom || 'pcs';
    localMaterials.push({
      id: `lm_auto_${localMaterials.length + 1}`,
      partNumber: details.partNumber,
      description: details.description,
      packageNo: '', // Do not fill Package No.
      uom: finalUom,
      qtyReq: qty,
      qtyIssued: finalUom, // Values in UOM column copied and placed under issued column in WHSE QUANTITY
      qtyReceived: '',
      qtyBalance: '',
      category: details.category,
    });
  };

  // --------------------------------------------------------------------------
  // 1. QUESTION 1 & QUESTION 8: MAIN EQUIPMENT (Rows 18–25)
  // Exact order and row placement strictly matching official benchmark MRF:
  // Row 18: Shelf incl. fan unit
  // Row 19: Fan Module
  // Row 20: DC Power Module (2 pcs)
  // Row 21: Optical Transceiver SFP+ (2 pcs)
  // Row 22: PON Transceiver GPON SFP B+ (8 or 16 pcs)
  // Row 23: Transcvr XGS-PON/GPON MPM B+ (8 or 16 pcs)
  // Row 24: NT with clock sync (2 pcs)
  // Row 25: Multi-PON Line board (1 or 2 pcs)
  // --------------------------------------------------------------------------
  if (input.equipmentType === 'MF2') {
    // Row 18: 1x MF-2 Shelf
    addMain(
      '3FE76762AA',
      'Lightspan MF-2 shelf incl. fan unit (LMXR-A)',
      1,
      '',
      'MF2'
    );
    // Row 19: 1x Fan Module
    addMain('3FE76518AA', 'MF2-FAN Module', 1, '', 'MF2');
    // Row 20: 2x DC Power Module
    addMain(
      '3FE76559BA',
      'Lightspan MF-2 DC power module (LPWR-B DC)',
      2,
      '',
      'MF2'
    );
    // Row 21: 10G Optical Transceiver SFP+ (ESFP) - MAXIMUM OF 2 ESFPs
    // Consideration: 1 run of uplink requires two LC-LC for 1 SFP.
    // If user inputs 4 patch cords, it means two uplinks (2 runs) -> 2 ESFPs.
    // MAXIMUM OF 2 ESFPs!
    const pCountForEsfp = typeof input.patchcordCount === 'number' ? input.patchcordCount : 2;
    const computedEsfps = pCountForEsfp > 0 ? Math.min(2, Math.max(1, Math.ceil(pCountForEsfp / 2))) : 0;
    const finalEsfpQty = typeof input.esfpCount === 'number'
      ? Math.min(2, Math.max(0, input.esfpCount))
      : (typeof input.patchcordCount === 'number' ? computedEsfps : 2);

    if (finalEsfpQty > 0) {
      addMain(
        '3FE62600AA',
        'Optical Transceiver SFP+,1310nm SM,10km(brand: Nokia) (10GBase-LR)',
        finalEsfpQty,
        '',
        'MF2'
      );
      explanations['q3_esfp'] = `Uplink Optical Transceivers: ${finalEsfpQty}x 10G SFP+ (ESFP, max 2) for ${pCountForEsfp} LC-LC patch cords (${Math.min(2, Math.ceil(pCountForEsfp / 2))} uplink run(s)).`;
    } else {
      explanations['q3_esfp'] = '0 uplink transceivers requested: 10G SFP+ optical transceivers omitted.';
    }

    // Row 22: PON Transceiver GPON SFP B+ (8 pcs for 1 LT card, 16 pcs for 2 LT cards)
    addMain(
      '3FE53441AA',
      'PON Transceiver20km 1310nm(Tx)1490nm(Rx) - GPON SFP B+',
      input.ltCardCount === 2 ? 16 : 8,
      '',
      'Patch Cord'
    );

    // Row 23: Transcvr XGS-PON/GPON MPM B+ (8 pcs for 1 LT card, 16 pcs for 2 LT cards)
    addMain(
      '3FE47581AB',
      'Transcvr XGS-PON/GPON MPM B+(28dBm)Ctemp',
      input.ltCardCount === 2 ? 16 : 8,
      '',
      'Patch Cord'
    );

    // Row 24: 2x NT with clock sync
    addMain(
      '3FE76476AA',
      'LightspanMF-2 240Gbps NT with clock sync(brand: Nokia) (LMNT-A)',
      2,
      '',
      'MF2'
    );

    // Row 25: Q8: LT Cards for MF2 (1 or 2 pcs)
    const ltCardCode = input.swStaged ? '3FE76353AA-S' : '3FE76353AA';
    const ltCardDesc = input.swStaged
      ? 'Lightspan MF 16port Multi-PON Line board (LWLT-C) - SW STAGED'
      : 'Lightspan MF 16port Multi-PON Line board (LWLT-C)';
    const stagedLabel = input.swStaged ? ' (SW STAGED)' : ' (Standard)';

    addMain(
      ltCardCode,
      ltCardDesc,
      input.ltCardCount,
      '',
      'MF2'
    );

    if (input.ltCardCount === 1) {
      explanations['q8'] = `1 LT Card selected${stagedLabel}: 1x 16-port Multi-PON board (${ltCardCode}), 8x GPON B+, 8x XGS-PON MPM, and 1x Universal dummy plate.`;
    } else {
      explanations['q8'] = `2 LT Cards selected${stagedLabel}: 2x 16-port Multi-PON boards (${ltCardCode}), 16x GPON B+, 16x XGS-PON MPM, Universal dummy plate omitted.`;
    }
  } else if (input.equipmentType === 'DF16') {
    // DF16 from user sample and Blaine database
    addMain(
      '3FE71774AA',
      'CFXR-H DF16',
      1,
      '',
      'DF16'
    );
    addMain(
      '3FE77670AA',
      'Lightspan DF-16GM shelf incl. fan unit, w/o dust filter(brand: Nokia)',
      1,
      '',
      'DF16'
    );
    addMain(
      '3FE77645AA',
      'Lightspan DF-16GM DC power module(brand: Nokia)',
      2,
      '',
      'DF16'
    );
    addMain(
      '3FE53441AC',
      'GPON Small form factor pluggable B+ (I-temp) OLT(brand: Nokia)',
      8,
      '',
      'DF16'
    );
    addMain(
      '3FE47581AB',
      'Transcvr XGS-PON/GPON MPM B+(28dBm)Ctemp',
      4,
      '',
      'Patch Cord'
    );
    explanations['q1'] = 'DF16 chassis with CFXR-H NT, dual DC power modules, 8x GPON SFPs, and 4x XGS-PON optics.';
  } else if (input.equipmentType === 'FX4') {
    addMain(
      '3FE64991AB',
      'Shelf 7360 ISAM FX-4 48V only(brand: Nokia)',
      1,
      '',
      'FX4'
    );
    addMain(
      '3FE71256AB',
      '7360 ISAM FX 1280Gbps NT with network clock synchronization capabilities, withoutSFPs (ETSI variant)(brand: Nokia)',
      1,
      '',
      'FX4'
    );
    addMain(
      '3FE76986AA',
      'ISAM FX 16port GPON line card(brand: Nokia)',
      1,
      '',
      'FX4'
    );
    addMain(
      '3FE53441AC',
      'GPON Small form factor pluggableB+ (I-temp) OLT(brand: Nokia)',
      8,
      '',
      'DF16'
    );
    explanations['q1'] = 'Nokia 7360 ISAM FX-4 shelf with 1280G NT card and 16-port GPON line card.';
  } else if (input.equipmentType === 'FX8') {
    addMain(
      '3FE64936AB',
      '7360 ISAM FX-8 shelf (ETSI variant), 48V only,incl. BFAN unit(brand: Nokia)',
      1,
      '',
      'FX8'
    );
    addMain(
      '3FE71256AB',
      '7360 ISAM FX 1280Gbps NT with network clock synchronization capabilities, withoutSFPs (ETSI variant)(brand: Nokia)',
      2,
      '',
      'FX4'
    );
    addMain(
      '3FE76986AA',
      'ISAM FX 16port GPON line card(brand: Nokia)',
      1,
      '',
      'FX4'
    );
    addMain(
      '3FE53441AC',
      'GPON Small form factor pluggableB+ (I-temp) OLT(brand: Nokia)',
      16,
      '',
      'DF16'
    );
    explanations['q1'] = 'Nokia 7360 ISAM FX-8 shelf with dual 1280G NT cards and 16-port GPON optics.';
  }

  // --------------------------------------------------------------------------
  // 2. LOCAL MATERIALS / ACCESSORIES (Rows 27–46)
  // Strictly organized to match the official benchmark MRF:
  // Row 27: Uplink patch cord (LC-LC) - user specifies exact count, not hardcoded 2
  // Row 28: Spiral Wrap 10mmx10ft (Blaine-Spiral-1/2mmx10ft)
  // Row 29: Velcro Roll Black 10m (L00HLT_VELCRO_10M)
  // Row 30: Shrinkable tube 16mm x 200mm (Blaine-16mm-Shrinkable)
  // Row 31: Shrinkable tube 8mm x 200mm (Blaine-8mmShrinkable)
  // Row 32: Shrinkable tube 12mm x 200mm (Blaine-12mmShrinkable)
  // Row 33: Labeller tape (Blaine-Cartridge9mm)
  // Row 34: Cable shoe (#14 AWG) (L00TL14AWG)
  // Row 35: 10mm2 Terminal Lugs (L00Lugs10mm2)
  // Row 36: 16-10mm2 Terminal Lugs (L00Lugs16mm2)
  // Row 37: 8mm2 Terminal Lugs (L00Lugs8mm2)
  // Row 38: Positive Power Cable Black/10M (3FE77365BAAA)
  // Row 39: Downlink Patch Cord SC/UPC - SC/APC (3FE60713CAAA)
  // Row 40: Wire Grounding Cable Yellow/Green 16mm (L00YG16MM2)
  // Row 41: Dummy Plate (3FE77035BA) - if 1 LT card
  // Row 42: Plastic Cable Tie White (Blaine-8"Tie)
  // Rows 43–46: Conduits / connectors if outdoor, or breakers
  // NOTE: SEALANTS (Blaine-Sealant White or any silicon sealant) ARE NEVER ADDED (0 stock in warehouse).
  // --------------------------------------------------------------------------

  // Row 27: Uplink Patch Cord (Question 3 & user customizable count)
  const uplinkDist = input.transportDistance || 8;
  const pCount = typeof input.patchcordCount === 'number' ? input.patchcordCount : 2;

  if (pCount > 0) {
    if (uplinkDist === 3) {
      addLocal(
        '3FE52344DAAA',
        'Patch cord 3M LC-LC SM  (brand: AVIC)',
        pCount,
        '',
        'Patch Cord',
        'pcs'
      );
      explanations['q3_cable'] = `${uplinkDist}m Simplex LC-LC patch cords (${pCount} pcs) selected for uplink transport.`;
    } else if (uplinkDist === 5) {
      addLocal(
        '3FE52344ELAA',
        'Patch cord 5M LC-LC SM',
        pCount,
        '',
        'Patch Cord',
        'pcs'
      );
      explanations['q3_cable'] = `${uplinkDist}m Simplex LC-LC patch cords (${pCount} pcs) selected for uplink transport.`;
    } else {
      addLocal(
        '3FE52344FLAA',
        'Simplex patch cord, LC/UPC - LC/UPC 8m(brand: Nokia)',
        pCount,
        '',
        'Patch Cord',
        'pcs'
      );
      explanations['q3_cable'] = `${uplinkDist}m Simplex LC-LC patch cords (${pCount} pcs) selected for uplink transport.`;
    }
  } else {
    explanations['q3_cable'] = 'No uplink patch cords requested (0 pcs).';
  }

  // Rows 28–37: Standard Consumables and Lugs
  addLocal('Blaine-Spiral-1/2mmx10ft', 'Spiral Wrap 10mmx10ft', 1, '', 'Consumables', 'pc');
  addLocal('L00HLT_VELCRO_10M', 'VELCRO (HOOK & LOOP TIE) BLACK 10m/roll', 1, '', 'Consumables', 'pc');
  addLocal('Blaine-16mm-Shrinkable', 'Shrinkable tube 16mm x 200mm', 2, '', 'Consumables', 'pcs');
  addLocal('Blaine-8mmShrinkable', 'Shrinkable tube 8mm x 200mm', 2, '', 'Consumables', 'pcs');
  addLocal('Blaine-12mmShrinkable', 'Shrinkable tube 12mm x 200mm', 2, '', 'Consumables', 'pcs');
  addLocal('Blaine-Cartridge9mm', 'Labeller tape', 1, '', 'Consumables', 'pc');
  addLocal('L00TL14AWG', 'cable shoe (#14 AWG)', 4, '', 'Hardware', 'pcs');
  addLocal('L00Lugs10mm2', '10mm2 Terminal Lugs', 6, '', 'Hardware', 'pcs');
  addLocal('L00Lugs16mm2', '16-10mm2 Terminal Lugs', 2, '', 'Hardware', 'pcs');
  addLocal('L00Lugs8mm2', 'terminal lugs 8mm', 6, '', 'Hardware', 'pcs');

  // Row 38: Power Cable (Question 4)
  let maxPwrDist = input.distanceToRS1 || 8;
  if (input.tappingPointConfig === 'two_separated' && input.distanceToRS2) {
    maxPwrDist = Math.max(input.distanceToRS1, input.distanceToRS2);
  }

  if (input.equipmentType === 'DF16') {
    if (maxPwrDist <= 10) {
      addLocal(
        '3FE72993GA',
        'DF 16GM POWER CABLES(10M)(BRAND: NOKIA)',
        2,
        '',
        'DF16',
        'pcs'
      );
      explanations['q4_pwr'] = 'DF16 dedicated DC power cables (10m, 2 pcs) loaded from database.';
    } else {
      addLocal(
        '3FE72993GB',
        'DF 16GM POWER CABLES(20M)(BRAND: NOKIA)',
        2,
        '',
        'DF16',
        'pcs'
      );
      explanations['q4_pwr'] = 'DF16 dedicated DC power cables (20m, 2 pcs) loaded from database.';
    }
  } else {
    // MF2 Power Cable logic matching sample benchmark (3FE77365BAAA)
    if (maxPwrDist <= 10) {
      addLocal(
        '3FE77365BAAA',
        'POSITIVE POWER CABLE BLACK/10M',
        2,
        '',
        'Power Cable',
        'pcs'
      );
      explanations['q4_pwr'] = `Distance ${maxPwrDist}m <= 10m: Selected 10m positive power cable (3FE77365BAAA, 2 pcs).`;
    } else if (maxPwrDist <= 15) {
      addLocal(
        '3FE77365BA-15M',
        'Power Cable Blue/Black 15m',
        2,
        '',
        'Power Cable',
        'pcs'
      );
      explanations['q4_pwr'] = `Distance ${maxPwrDist}m <= 15m: Selected 15m Power Cable Blue/Black (2 pcs).`;
    } else {
      addLocal(
        '3FE77365AA_20m',
        'Power Cable Blue/Black 20m',
        2,
        '',
        'Power Cable',
        'pcs'
      );
      explanations['q4_pwr'] = `Distance ${maxPwrDist}m > 15m: Selected 20m Power Cable Blue/Black (2 pcs).`;
    }
  }

  // Row 39: Downlink Patch Cord (Question 7 - ODF Patch Cords SC/UPC - SC/APC)
  let downlinkQty = 16;
  if (input.equipmentType === 'MF2') {
    downlinkQty = input.ltCardCount === 2 ? 32 : 16;
  } else if (input.equipmentType === 'FX8') {
    downlinkQty = 32;
  }

  const dlDist = input.downlinkDistance || 2;
  let dlCode = '3FE60713CAAA';
  let dlDesc = 'Simplex Patch Cord, SC/UPC - SC/APC 2m(brand: Nokia)';

  if (dlDist <= 1.5) {
    dlCode = '3FE60713BLAA';
    dlDesc = 'Simplex patch cord, SC/UPC -SC/APC 1.5m(brand: Nokia)';
  } else if (dlDist <= 2) {
    dlCode = '3FE60713CAAA';
    dlDesc = 'Simplex Patch Cord, SC/UPC - SC/APC 2m(brand: Nokia)';
  } else if (dlDist <= 3) {
    dlCode = '3FE60713DA';
    dlDesc = 'Simplex patch cord, SC/UPC -SC/APC 3m(brand: Nokia)';
  } else if (dlDist <= 5) {
    dlCode = '3FE60713ELAA';
    dlDesc = 'Simplex patch cord, SC/UPC -SC/APC 5m(brand: Nokia)';
  } else if (dlDist <= 8) {
    dlCode = '3FE60713FLAA';
    dlDesc = 'Simplex patch cord, SC/UPC -SC/APC 8m(brand: Nokia)';
  } else if (dlDist <= 10) {
    dlCode = '3FE60713GAAA';
    dlDesc = 'Simplex patch cord, SC/UPC -SC/APC 10m(brand: Nokia)';
  } else {
    dlCode = '3FE60713GLAA';
    dlDesc = 'Simplex patch cord, SC/UPC -SC/APC 15m(brand: Nokia)';
  }

  addLocal(dlCode, dlDesc, downlinkQty, '', 'Patch Cord', 'pcs');
  explanations['q7_downlink'] = `ODF Downlink: ${downlinkQty} pcs of ${dlDist}m SC/UPC-SC/APC patch cord (${dlCode}).`;

  // Row 40: Grounding Cable (Question 5 - No LTC)
  const gndDist = input.groundingDistance || 10;
  const gndQty = gndDist <= 5 ? 5 : 10;
  addLocal(
    'L00YG16MM2',
    'WIRE GROUNDING CABLE YELLOW/GREEN 16MM N/A',
    gndQty,
    '',
    'Power Cable',
    'm'
  );
  explanations['q5_gnd'] = `Grounding distance ${gndDist}m: Selected ${gndQty}m WIRE GROUNDING CABLE YELLOW/GREEN 16MM N/A (L00YG16MM2).`;

  // Row 41: Universal Dummy Plate (MF2 with 1 LT card ONLY)
  if (input.equipmentType === 'MF2' && input.ltCardCount === 1) {
    addLocal(
      '3FE77035BA',
      'Lightspan MF LT dmmy plte (388x204x25)mm',
      1,
      '',
      'MF2',
      'pcs'
    );
  }

  // Row 42: Plastic Cable Tie White
  addLocal('Blaine-8"Tie', 'Plastic Cable Tie white', 1, '', 'Consumables', 'pcs');

  // Rows 43–46: Optional External Conduit & Breakers
  // Outdoor Transport Conduits (15 PA LTC + Connectors)
  // Consideration: 1 run of uplink requires two LC-LC for 1 SFP.
  // If user inputs 4 patch cords, it means two uplinks (2 runs), and LTC count is 2x the route distance with 4x connectors (2 per run).
  // MAXIMUM OF 2 ESFPs: Uplink runs cannot exceed 2.
  if (input.environment === 'Outdoor' && input.transportOutside) {
    const uplinkRuns = pCount > 0 ? Math.min(2, Math.max(1, Math.ceil(pCount / 2))) : 0;
    const totalTransportLtc = uplinkRuns * uplinkDist;
    const totalTransportConn = uplinkRuns * 2;

    if (totalTransportLtc > 0) {
      addLocal(
        '3FE82503AD',
        'LTC Metallic 15 PA Coating（Brand: Nokia)',
        totalTransportLtc,
        '',
        'QODC',
        'm'
      );
      addLocal(
        '3FE82502AD',
        'LTC Connector 15（Brand: Nokia)',
        totalTransportConn,
        '',
        'QODC',
        'pc'
      );
      explanations['q3_ltc'] = `Outdoor site with transport outside: ${uplinkRuns} uplink run(s) (${pCount} LC-LC cords, 2 per SFP, max 2 ESFPs) = ${totalTransportLtc}m 15 PA LTC conduit (${uplinkRuns}x ${uplinkDist}m) + ${totalTransportConn}x 15 PA Connectors (${uplinkRuns} run(s) x 2 connectors).`;
    } else {
      explanations['q3_ltc'] = '0 uplink patch cords requested: 15 PA LTC conduit and connectors omitted.';
    }
  } else if (input.environment === 'Outdoor') {
    explanations['q3_ltc'] = 'Transport equipment located inside/adjacent to proposal: 15 PA LTC and connectors omitted.';
  } else {
    explanations['q3_ltc'] = 'Indoor site: LTC conduits and connectors are not required.';
  }

  // Helper to calculate standard conduit length covering distance with installation slack
  const getConduitLengthForDistance = (distance: number): number => {
    const d = Math.max(1, distance || 8);
    if (d <= 10) return 10;
    if (d <= 15) return 15;
    if (d <= 20) return 20;
    return Math.ceil(d / 5) * 5; // Scales up to 25m, 30m, 35m, etc.
  };

  // Outdoor Power Conduits (25 PA LTC & Connectors)
  if (input.environment === 'Outdoor') {
    if (input.tappingPointConfig === 'two_separated') {
      const lenRS1 = getConduitLengthForDistance(input.distanceToRS1);
      const lenRS2 = getConduitLengthForDistance(input.distanceToRS2 || input.distanceToRS1);
      const ltcLen = lenRS1 + lenRS2;
      addLocal(
        '3FE82503AC',
        'LTC Metallic 25 PA Coating（Brand: Nokia)',
        ltcLen,
        '',
        'QODC',
        'm'
      );
      addLocal(
        '3FE82502AC',
        'LTC Connector 25（Brand: Nokia)',
        4,
        '',
        'QODC',
        'pc'
      );
      explanations['q4_ltc'] = `2 Separated RS runs: Route to RS1 (${lenRS1}m) + Route to RS2 (${lenRS2}m) = ${ltcLen}m total 25 PA LTC + 4x 25 PA Connectors (2 per route).`;
    } else if (input.tappingPointConfig === 'one_separated') {
      const ltcLen = getConduitLengthForDistance(input.distanceToRS1);
      addLocal(
        '3FE82503AC',
        'LTC Metallic 25 PA Coating（Brand: Nokia)',
        ltcLen,
        '',
        'QODC',
        'm'
      );
      addLocal(
        '3FE82502AC',
        'LTC Connector 25（Brand: Nokia)',
        4,
        '',
        'QODC',
        'pc'
      );
      explanations['q4_ltc'] = `1 Separated RS single run: ${ltcLen}m 25 PA LTC (${input.distanceToRS1}m route) + 4x 25 PA Connectors.`;
    } else {
      const ltcLen = getConduitLengthForDistance(input.distanceToRS1);
      addLocal(
        '3FE82503AC',
        'LTC Metallic 25 PA Coating（Brand: Nokia)',
        ltcLen,
        '',
        'QODC',
        'm'
      );
      addLocal(
        '3FE82502AC',
        'LTC Connector 25（Brand: Nokia)',
        2,
        '',
        'QODC',
        'pc'
      );
      explanations['q4_ltc'] = `Same RS: Both cables laid together in 1x 25 PA LTC (${ltcLen}m for ${input.distanceToRS1}m route) + 2x 25 PA Connectors.`;
    }
  }

  // Question 6: Breaker Replacement (if needed)
  if (input.needChangeBreakers && input.breakerCount > 0) {
    const rating = input.breakerRating || '16A';
    let breakerCode = 'L00CB16A-S';
    let breakerDesc = '16A CIRCUIT BREAKER (SCHNEIDER) 1P';

    if (rating === '20A') {
      breakerCode = 'L00CB20A-S';
      breakerDesc = '20A CIRCUIT BREAKER (SCHNEIDER) 1P';
    } else if (rating === '25A') {
      breakerCode = 'L00CB25A-S';
      breakerDesc = '25A CIRCUIT BREAKER (SCHNEIDER) 1P';
    } else if (rating === '32A') {
      breakerCode = 'L00CB32A-S';
      breakerDesc = '32A CIRCUIT BREAKER (SCHNEIDER) 1P';
    } else if (rating === '63A') {
      breakerCode = 'L00CB63A-N';
      breakerDesc = '63A CIRCUIT BREAKER (NADER) 1P';
    }

    addLocal(breakerCode, breakerDesc, input.breakerCount, '', 'RCO', 'pc');
    explanations['q6_breaker'] = `Loaded ${input.breakerCount}x ${rating} circuit breaker (${breakerCode}) from database.`;
  } else {
    explanations['q6_breaker'] = 'No circuit breaker replacement required on Rectifier System.';
  }

  // CRITICAL: Always remove Blaine-Sealant White Silicon Sealant (White) or any sealant as instructed. No warehouse availability.

  return { mainItems, localMaterials, explanations };
}

/**
 * Creates a complete MRF Document from the automation questionnaire inputs
 */
export function createAutomatedMRFDocument(input: MRFAutomationInput): MRFDocument {
  const { mainItems, localMaterials } = generateAutomatedBoQ(input);

  const verifiedSites = sitesDataRaw as Array<{
    plaid: string;
    siteName: string;
    address: string;
    warehouse: string;
    destinationHub?: string;
    vendor: string;
  }>;

  const site = input.sitePlaid
    ? verifiedSites.find((s) => s.plaid.toLowerCase() === input.sitePlaid!.toLowerCase())
    : verifiedSites[0];

  const targetSitePlaid = site ? site.plaid : 'MIN1371';
  const targetSiteName = site ? site.siteName : 'GNG-701';
  // Formatted as PLAID - SITE NAME as requested
  const targetSiteId = `${targetSitePlaid} - ${targetSiteName}`;
  const targetAddress = site
    ? site.address
    : 'HUAWEI CABINET CORNER CUERDORIZAL ST., FRONT OF DMS RTW , GINGOOG CITY';
  const targetWarehouse = input.fromWarehouse || 'Paranaque WHS';
  const targetDestination = (site as any)?.destinationHub || 'CAGAYAN DE ORO';

  const dateStr = getTodayDateStr();
  const mrfNumber = generateMRFNumber({
    siteId: `${targetSitePlaid}-${targetSiteName}`,
    dateStr,
    seq: 1,
    equipmentType: input.equipmentType,
    signeeOrEntity: input.requisitionerName || 'JOHN_CARLO_RABANES',
  });

  return {
    id: `mrf_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    header: {
      mrfNumber,
      fromWarehouse: targetWarehouse || 'Paranaque WHS',
      date: dateStr,
      destinationCode: targetSitePlaid,
      destination: targetDestination,
      siteId: targetSiteId,
      siteAddress: targetAddress,
      project: 'Globe Telecom / Nokia FN OLT Rollout',
    },
    mainItems,
    localMaterials,
    signatures: {
      requestedBy: {
        name: input.requisitionerName || '',
        title: input.requisitionerTitle || 'Field Engineer',
        date: dateStr,
      },
      preparedBy: {
        name: '',
        title: 'Paranaque WHS Supervisor',
        date: dateStr,
      },
      receivedBy: {
        name: '',
        title: 'Site Representative',
        date: dateStr,
      },
      status: 'Pending',
      remarks: `Automated BoQ Generated for ${input.equipmentType} (${input.environment}) rollout. Tapping: ${input.tappingPointConfig}.`,
    },
  };
}
