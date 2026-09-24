import { PDFParse } from 'pdf-parse';
import { KEYWORDS } from './keywords.js';

/**
 * Targeted Firetrade Engineering (FTE) procurement keywords & brands to detect inside BOQ / TOR / PR.4 / BK.01 attachments.
 * Scans for critical standards (UL, FM, NFPA), key brands, and technical equipment specs.
 */
const SPECIFIC_FIRE_PROTECTION_KEYWORDS = [
  // 1. Core Fire Alarm & Detection
  'fire alarm', 'smoke detector', 'heat detector', 'beam detector', 'facp', 'vesda',
  'แจ้งเหตุเพลิงไหม้', 'ตรวจจับควัน', 'ตรวจจับความร้อน', 'ตู้ควบคุมระบบแจ้งเหตุเพลิงไหม้',
  // 2. Sprinkler & Fire Pumps
  'sprinkler', 'fire pump', 'jockey pump', 'esfr', 'deluge valve', 'preaction', 'alarm check valve',
  'สปริงเกอร์', 'สปริงเกลอร์', 'เครื่องสูบน้ำดับเพลิง', 'ปั๊มดับเพลิง', 'หัวกระจายน้ำดับเพลิง',
  // 3. Clean Agent & Special Hazards
  'clean agent', 'fm-200', 'fm200', 'novec', 'novec 1230', 'fk-5-1-12', 'inergen', 'co2',
  'สารสะอาดดับเพลิง', 'ก๊าซดับเพลิง', 'ดับเพลิงห้องครัว', 'kitchen hood', 'water mist',
  'ถังดับเพลิง', 'เครื่องดับเพลิง', 'น้ำยาโฟมดับเพลิง', 'afff',
  // 4. Hydrant, Cabinets & Valves
  'fire hose cabinet', 'fire hose reel', 'siamese connection', 'fire hydrant', 'nibco',
  'ตู้ดับเพลิง', 'สายส่งน้ำดับเพลิง', 'หัวรับน้ำดับเพลิง', 'หัวดับเพลิง', 'วาล์วระบบดับเพลิง', 'grooved coupling',
  // 5. Emergency, Life Safety & PPE
  'emergency light', 'exit sign', 'ไฟฉุกเฉิน', 'ป้ายทางหนีไฟ', 'ป้ายทางออกฉุกเฉิน', 'max bright', 'maxbright',
  'flammable cabinet', 'ตู้เก็บสารเคมี', 'emergency shower', 'อ่างล้างตาฉุกเฉิน', 'scba', 'ชุดดับเพลิง', 'frc cable',
  // 6. Global Standards & FTE Top Brands
  'ul/fm', 'nfpa 20', 'nfpa 72', 'nfpa 13', 'notifier', 'honeywell', 'system sensor', 'morley', 'patterson', 'viking', 'tyco', 'ansul', 'kidde'
];

export const TARGET_SPEC_KEYWORDS = Array.from(new Set([...KEYWORDS, ...SPECIFIC_FIRE_PROTECTION_KEYWORDS]));

/**
 * Scan a PDF binary array in memory without saving ANY file to disk.
 * 
 * @param {Uint8Array} uint8Data - Binary PDF data held strictly in RAM
 * @param {Array<string>} customKeywords - Optional override keywords
 * @returns {Promise<{ hasMatch: boolean, matchedKeywords: string[], summary: string, snippets: Array<{ keyword: string, page: number, snippet: string }> }>}
 */
export async function scanPdfBuffer(uint8Data, customKeywords = TARGET_SPEC_KEYWORDS) {
  if (!uint8Data || !(uint8Data instanceof Uint8Array)) {
    return { hasMatch: false, matchedKeywords: [], summary: '', snippets: [] };
  }

  let parser = null;
  try {
    parser = new PDFParse(uint8Data);
    const parsed = await parser.getText();
    const pages = parsed.pages || [];
    
    const matchedKeywordsSet = new Set();
    const snippets = [];

    // Scan each page for target keywords and extract contextual snippet
    pages.forEach((pageObj, pageIdx) => {
      const pageNum = pageIdx + 1;
      const pageText = pageObj.text || '';
      const lowerPage = pageText.toLowerCase();

      for (const kw of customKeywords) {
        const lowerKw = kw.toLowerCase();
        let searchIndex = 0;
        
        while ((searchIndex = lowerPage.indexOf(lowerKw, searchIndex)) !== -1) {
          matchedKeywordsSet.add(kw);
          
          // Extract sentence / line context (~40 chars before and after)
          const start = Math.max(0, searchIndex - 40);
          const end = Math.min(pageText.length, searchIndex + kw.length + 50);
          let rawSnippet = pageText.substring(start, end).replace(/\s+/g, ' ').trim();
          
          // Add ellipsis if truncated
          if (start > 0) rawSnippet = '...' + rawSnippet;
          if (end < pageText.length) rawSnippet = rawSnippet + '...';

          // Avoid duplicate snippets for the same keyword on the same page
          const isDuplicate = snippets.some(s => s.keyword === kw && s.page === pageNum);
          if (!isDuplicate) {
            snippets.push({
              keyword: kw,
              page: pageNum,
              snippet: rawSnippet
            });
          }

          searchIndex += kw.length + 1;
        }
      }
    });

    const matchedKeywords = Array.from(matchedKeywordsSet);
    const hasMatch = matchedKeywords.length > 0;

    let summary = '';
    if (hasMatch) {
      const topSnippet = snippets[0];
      summary = `พบสเปกระบบดับเพลิง/แบรนด์ "${topSnippet.keyword.toUpperCase()}" ที่หน้า ${topSnippet.page} ("${topSnippet.snippet.slice(0, 70)}")`;
    }

    return {
      hasMatch,
      matchedKeywords,
      summary,
      snippets: snippets.slice(0, 8) // Limit to top 8 findings to keep payload lightweight
    };

  } catch (err) {
    console.error('[In-Memory PDF Scanner] Error during PDF buffer scan:', err.message);
    return { hasMatch: false, matchedKeywords: [], summary: '', snippets: [], error: err.message };
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (dErr) {
        // Ignore destruction errors
      }
    }
  }
}
