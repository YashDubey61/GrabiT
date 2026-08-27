#!/bin/bash
# GRABIT ADB Reverse Watchdog
# Keeps adb reverse tcp:3000 tcp:3000 permanently active across device reconnects

while true; do
  DEVICE=$(adb devices 2>/dev/null | grep -w "device" | awk '{print $1}')
  if [ -n "$DEVICE" ]; then
    LIST=$(adb reverse --list 2>/dev/null | grep "tcp:3000")
    if [ -z "$LIST" ]; then
      adb reverse tcp:3000 tcp:3000 >/dev/null 2>&1
    fi
  fi
  sleep 2
done
