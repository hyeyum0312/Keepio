#!/usr/bin/env python3
"""Check staged HISTORY is prepended only; use in pre-commit and CI diff checks.

Usage: python scripts/check-history.py [BASE_REF]
With BASE_REF: compare git show BASE_REF:docs/HISTORY.md to working HEAD's file
(default: compare Git index to HEAD, for pre-commit).
"""
import subprocess, sys
PATH='docs/HISTORY.md'
def git(*args):
 p=subprocess.run(['git',*args],text=True,capture_output=True)
 return p.returncode,p.stdout

def main():
 base=sys.argv[1] if len(sys.argv)>1 else 'HEAD'
 code,old=git('show',f'{base}:{PATH}')
 if code: old='' # first commit / first history file
 if len(sys.argv)>1:
  code,new=git('show',f'HEAD:{PATH}')
 else:
  code,new=git('show',f':{PATH}')
 if code:
  print(f'ERROR: stage {PATH} before commit (or ensure it exists at HEAD in CI)')
  return 1
 marker='<!-- 새 기록은 이 주석 바로 아래, 기존 기록 위에 추가한다. -->'
 if marker not in new:
  print('ERROR: history insertion marker missing');return 1
 if old:
  if marker not in old:
   print('ERROR: baseline history lacks marker; migrate explicitly');return 1
  prefix_old,suffix_old=old.split(marker,1)
  prefix_new,suffix_new=new.split(marker,1)
  # Existing records must remain verbatim at bottom. New records appear immediately after marker.
  if prefix_old!=prefix_new or not suffix_new.endswith(suffix_old) or suffix_new==suffix_old:
   print('ERROR: append a new history entry at the top; preserve existing entries verbatim');return 1
  added=suffix_new[:len(suffix_new)-len(suffix_old)] if suffix_old else suffix_new
 else:
  added=new.split(marker,1)[1]
 if '## ' not in added or not all(k in added for k in ['- Feature:', '- 목적:', '- 변경:', '- 영향:', '- 검증:', '- 주의/롤백:']):
  print('ERROR: new entry missing heading or required fields');return 1
 print('History structure OK (does not verify truthfulness of test claims)')
 return 0
if __name__=='__main__':sys.exit(main())
