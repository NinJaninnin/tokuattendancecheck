import os
import sys
import json
import zipfile
import xml.etree.ElementTree as ET

# Ensure stdout uses UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
XLSX_PATHS = [
    os.path.join(ROOT_DIR, 'toku_attendancecheck.xlsx'),
    os.path.join(ROOT_DIR, 'tokuattendancecheck', 'toku_attendancecheck.xlsx'),
    os.path.join(ROOT_DIR, 'data', 'toku_attendancecheck.xlsx')
]

OUTPUT_JSON = os.path.join(ROOT_DIR, 'data', 'sheet_cache.json')

def find_xlsx():
    for p in XLSX_PATHS:
        if os.path.exists(p):
            return p
    return None

def parse_xlsx(file_path):
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    
    with zipfile.ZipFile(file_path, 'r') as z:
        # 1. Parse workbook to find sheets
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheet_map = {}
        for s in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            name = s.attrib['name'].strip().lower()
            rel_id = s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
            sheet_map[name] = rel_id

        # Read workbook.xml.rels to resolve targets
        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_map = {}
        for r in rels_tree.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            rel_map[r.attrib['Id']] = r.attrib['Target']

        # 2. Shared strings
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            sst_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in sst_tree.findall('.//s:si', ns):
                text = ''.join([t.text for t in si.findall('.//s:t', ns) if t.text])
                strings.append(text)

        def read_rows_by_name(target_sheet_name):
            target_rel = sheet_map.get(target_sheet_name)
            if not target_rel or target_rel not in rel_map:
                return []
            target_path = 'xl/' + rel_map[target_rel].lstrip('/')
            sheet_tree = ET.fromstring(z.read(target_path))
            rows = []
            for r in sheet_tree.findall('.//s:row', ns):
                row_data = []
                for c in r.findall('.//s:c', ns):
                    t = c.attrib.get('t')
                    v = c.find('s:v', ns)
                    val = v.text if v is not None else ''
                    if t == 's' and val:
                        try:
                            val = strings[int(val)]
                        except:
                            pass
                    row_data.append(str(val).strip())
                if any(row_data):
                    rows.append(row_data)
            return rows

        # --- 3. Parse cardrank ---
        rank_rows = read_rows_by_name('cardrank')
        cardrank = []
        rank_sp_map = {}
        rank_name_korean = {
            'SUHR': '슈퍼 울트라 히어로 레어',
            'HR': '히어로 레어',
            'UR': '울트라 레어',
            'SR': '슈퍼 레어',
            'R': '레어',
            'N': '노멀'
        }
        rank_colors = {
            'SUHR': '#ff0055',
            'HR': '#ff7700',
            'UR': '#a855f7',
            'SR': '#3b82f6',
            'R': '#10b981',
            'N': '#64748b'
        }

        if rank_rows and len(rank_rows) > 1:
            headers = [h.lower() for h in rank_rows[0]]
            rarity_idx = headers.index('rarity') if 'rarity' in headers else 0
            sp_idx = headers.index('sp') if 'sp' in headers else 1

            for r in rank_rows[1:]:
                if len(r) > rarity_idx and r[rarity_idx]:
                    rk = r[rarity_idx].upper()
                    try:
                        sp_val = float(r[sp_idx]) if len(r) > sp_idx else 30.0
                    except:
                        sp_val = 30.0
                    sp_int = int(sp_val)
                    rank_sp_map[rk] = sp_int
                    cardrank.append({
                        'rank': rk,
                        'sp_point': sp_int,
                        'name': rank_name_korean.get(rk, rk),
                        'color': rank_colors.get(rk, '#fbbf24')
                    })

        # --- 4. Parse gacha ---
        gacha_rows = read_rows_by_name('gacha')
        gacha = []
        if gacha_rows and len(gacha_rows) > 1:
            headers = [h.lower() for h in gacha_rows[0]]
            rarity_idx = headers.index('rarity') if 'rarity' in headers else 0
            prob_idx = headers.index('probability') if 'probability' in headers else 1

            for r in gacha_rows[1:]:
                if len(r) > rarity_idx and r[rarity_idx]:
                    rk = r[rarity_idx].upper()
                    try:
                        prob_val = float(r[prob_idx]) if len(r) > prob_idx else 0.0
                        # All values in the sheet sum to 100.0 (71.0, 22.0, 4.0, 2.0, 0.9, 0.1)
                        prob_val = prob_val / 100.0
                    except:
                        prob_val = 0.0
                    gacha.append({
                        'rank': rk,
                        'rate': prob_val
                    })

        # --- 5. Parse cardlist ---
        card_rows = read_rows_by_name('cardlist')
        cardlist = []
        valid_ranks = set(rank_sp_map.keys())

        if card_rows and len(card_rows) > 1:
            headers = [h.lower() for h in card_rows[0]]
            id_idx = headers.index('card_id') if 'card_id' in headers else 0
            rank_idx = headers.index('cardrank') if 'cardrank' in headers else (headers.index('rank') if 'rank' in headers else 1)
            name_idx = headers.index('name') if 'name' in headers else 2
            jp_idx = headers.index('name_jp') if 'name_jp' in headers else -1
            en_idx = headers.index('name_en') if 'name_en' in headers else -1

            for r in card_rows[1:]:
                card_id = r[id_idx] if len(r) > id_idx else ''
                rank = r[rank_idx].upper() if len(r) > rank_idx else ''
                name = r[name_idx] if len(r) > name_idx else ''
                name_jp = r[jp_idx] if jp_idx >= 0 and len(r) > jp_idx else ''
                name_en = r[en_idx] if en_idx >= 0 and len(r) > en_idx else ''

                if not card_id:
                    continue

                # Check completeness
                is_comp = bool(
                    card_id and len(card_id) >= 3 and
                    name and name.strip() and name not in ['-', 'NULL', 'UNDEFINED', '#N/A', '미정', '준비중'] and
                    rank and rank in valid_ranks
                )

                sp_point = rank_sp_map.get(rank, 30)

                cardlist.append({
                    'card_id': card_id,
                    'name': name,
                    'rank': rank,
                    'sp_point': sp_point,
                    'name_jp': name_jp,
                    'name_en': name_en,
                    'is_complete': is_comp
                })

        output_data = {
            'connected': True,
            'source': os.path.basename(file_path),
            'synced_at': str(os.path.getmtime(file_path)),
            'cardrank': cardrank,
            'gacha': gacha,
            'cardlist': cardlist
        }

        os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as fp:
            json.dump(output_data, fp, ensure_ascii=False, indent=2)

        complete_count = len([c for c in cardlist if c['is_complete']])
        print(f"Successfully parsed '{os.path.basename(file_path)}': {len(cardlist)} total cards ({complete_count} complete).")
        return output_data

if __name__ == '__main__':
    target = find_xlsx()
    if target:
        parse_xlsx(target)
    else:
        print("No xlsx file found in paths.")
