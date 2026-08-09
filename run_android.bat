@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME: %JAVA_HOME%
java -version
npx expo run:android
