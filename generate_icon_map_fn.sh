#!/usr/bin/env bash
echo '
function icon_map() {
  case "$1" in
'"$(find ./mappings/ -type f -exec sh -c 'x={};echo "${x#*/}\t$(cat {})"' \; | awk -F "\t" '{print "  " $2 ")\n    icon_result=\"" $1 "\"\n    ;;"}')"'
  *)
    icon_result=":default:"
    ;;
  esac
}
' > dist/icon_map_fn.sh

