#!/bin/bash
# Downloads every photo listed in photo_urls.txt into photos/ at full resolution.
# Re-runnable: skips files that already exist.
cd "$(dirname "$0")" || exit 1
mkdir -p photos

export UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

fetch() {
  local idx="$1" url="$2"
  local n tmp code ext
  n=$(printf '%03d' "$idx")

  if ls "photos/${n}."* >/dev/null 2>&1; then return 0; fi

  tmp=$(mktemp)
  code=$(curl -sS -L --max-time 120 --retry 3 --retry-delay 2 \
      -H "Referer: https://www.google.com/" -A "$UA" \
      -o "$tmp" -w '%{http_code}' "$url")

  if [ "$code" != "200" ] || [ ! -s "$tmp" ]; then
    echo "FAIL $n http=$code"
    rm -f "$tmp"
    return 1
  fi

  case "$(file -b --mime-type "$tmp")" in
    image/jpeg) ext=jpg ;;
    image/png)  ext=png ;;
    image/webp) ext=webp ;;
    image/gif)  ext=gif ;;
    *)          ext=bin ;;
  esac
  mv "$tmp" "photos/${n}.${ext}"
  chmod 644 "photos/${n}.${ext}"
  echo "OK ${n}.${ext}"
}
export -f fetch

# idx and url are whitespace-free, so -n 2 pairs them correctly
awk -F'\t' 'NF==2 {print $1, $2}' photo_urls.txt \
  | xargs -P 6 -n 2 bash -c 'fetch "$0" "$1"'
