[ChanHaRi Extension]

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
1. extension icon Ŭ���� background.js �ڵ鷯 �����Ͽ� bar.html�� ���
2. bar.js���� �������� ������������ html�ڵ� ���� bar.html �ڵ带 ����.

<py>
server.py : extension���� ��û�� �������� �м��Ͽ� ������̹� �����ϴ� ����

<html>
background.html : ����ִ� default
bar.html : ChanHaRi Extension�� ū ������ ���

<css>
bar.css : extension ������ �� ������ ���
content.css : extension ū Ʋ�� css�� ���. (size, float, font ��)
index.css : bootstrap ���

<js>
background.js : extension icon Ŭ�� �̺�Ʈ �ڵ鷯
bar.js : extension ��ü ���� ���
content.js : extension ū Ʋ�� ��Ʈ�ѷ�

<json>
manifest.json : extension�� �⺻ ȯ�漳��
command.json : server�� �ְ���� �������� ����


