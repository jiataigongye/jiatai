@echo off
@title �Զ�������վ��Դ

set path=%path%;C:\Program Files (x86)\Git\cmd

git config user.name "faceOnKeyboard"
git config user.email "943940886@qq.com"
git config remote "origin".url "http://faceOnKeyboard:123456@git.oschina.net/tansuyun/jtid.git"

git add -v .
git commit -m '��Դ����'
git push origin

echo ��ɡ���
pause
