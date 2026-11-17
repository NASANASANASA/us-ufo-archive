#!/usr/bin/env python3
"""Repair legacy descriptions missing the official video timeline.

Only descZh is updated. Time labels and paragraph boundaries are copied from
the English source without sending them through translation. A hash log records
every authorized legacy correction for the regression audit.
"""
import concurrent.futures
import csv
import fcntl
import hashlib
import importlib.util
import json
import pathlib
import re
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('translation', ROOT / 'scripts/translate-releases.py')
translation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(translation)
LABEL = re.compile(r'^(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?)?\s*[:：]?)(\s*)(.*)$')
RANGE = re.compile(r'\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}')
REPAIR_CODES = {f'DOW-UAP-PR{number:03}' for number in [
    24, 30, 36, 46, 47, 48, *range(100, 117)
]}
LOG = ROOT / 'docs/record-description-repairs.json'
lock = threading.Lock()


def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()


def main():
    process_lock = open('/tmp/uap-repair-timeline-translations.lock', 'w')
    fcntl.flock(process_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    rows = list(csv.DictReader((ROOT / 'assets/uap-data.csv').open(encoding='utf-8-sig')))
    changes = json.loads(LOG.read_text()) if LOG.exists() else []
    completed = {(x['language'], x['index']) for x in changes}

    def work(lang):
        path = ROOT / f'assets/i18n-{lang}.json'
        entries = json.loads(path.read_text())
        for index, row in enumerate(rows):
            source = row['Description Blurb']
            entry = entries[index]
            if (lang, index) in completed or row['Title'].split(',')[0] not in REPAIR_CODES:
                continue
            # This repair is limited to the six legacy language datasets with
            # incomplete summaries; other translations keep their existing prose.
            before = entry['descZh']
            output = []
            for line in source.splitlines():
                match = LABEL.match(line)
                if match:
                    label, space, body = match.groups()
                    output.append(label + (' ' + translation.translate(body, lang) if body else ''))
                else:
                    output.append(translation.translate(line, lang) if line.strip() else '')
            after = '\n'.join(output).strip()
            assert len(RANGE.findall(after)) == len(RANGE.findall(source))
            entry['descZh'] = after
            with lock:
                changes.append({'language': lang, 'index': index, 'record': row['Title'].split(',')[0],
                                'beforeSha256': digest(before), 'afterSha256': digest(after),
                                'reason': 'Restore omitted official narrative and timestamped video description'})
                temporary = path.with_suffix('.json.tmp')
                temporary.write_text(json.dumps(entries, ensure_ascii=False, indent=1) + '\n')
                temporary.replace(path)
                temporary_log = LOG.with_suffix('.json.tmp')
                temporary_log.write_text(json.dumps(changes, ensure_ascii=False, indent=2) + '\n')
                temporary_log.replace(LOG)
                print(f'{lang} {index}: {row["Title"].split(",")[0]}', flush=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        list(executor.map(work, ['pt', 'ru', 'fr', 'de', 'ko', 'ar']))
    print(f'Completed {len(changes)} description repairs.', flush=True)


if __name__ == '__main__':
    main()
