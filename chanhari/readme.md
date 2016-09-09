ChanHaRi Extension

[Install]
- Anaconda 4.0.4 (Python 3.5)

[pip -install]
- flask
- selenium
- webdriver
- json
- pickle
- reportlab
- dateutil
- schedule
- you-get

[Configure]
- Chrome 속성 창 대상 "\chrome.exe" 뒤에  --allow-running-insecure-content 추가

[Shortcut]
Ctrl+Shift+Z : ChanHaRi Extension on/off (background)
Ctrl+Shift+1 : task1
Ctrl+Shift+2 : task2
Ctrl+Shift+3 : task3
Ctrl+Shift+4 : task4
Ctrl+Shift+5 : task5
Ctrl+Shift+6 : ChanHaRi Extension on/off (chrome)
Ctrl+Shift+A : Run current task

[Code]
Default : background.html / background.js
1. extension icon 클릭시 background.js 핸들러 동작하여 bar.html를 띄움
2. bar.js에서 동적으로 웹페이지상의 html코드 내에 bar.html 코드를 삽입.

<py>
server.py : extension에서 요청한 프로토콜 분석하여 웹드라이버 실행하는 서버

<html>
background.html : 비어있는 default
bar.html : ChanHaRi Extension의 큰 구조를 담당

<css>
bar.css : extension 내부의 각 구조를 담당
content.css : extension 큰 틀의 css를 담당. (size, float, font 등)
index.css : bootstrap 담당

<js>
background.js : extension icon 클릭 이벤트 핸들러
bar.js : extension 전체 동작 담당
content.js : extension 큰 틀의 컨트롤러

<json>
manifest.json : extension의 기본 환경설정
command.json : server와 주고받을 프로토콜 예제


