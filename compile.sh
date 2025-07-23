#!/bin/bash

glib-compile-schemas schemas

DIR="po"
SUFFIX="po"

xgettext --from-code='utf-8' -k_ -kN_ -o $DIR/notes-with-history.pot extension.js prefs.js

if ! [ -x "$DIR"/en.$SUFFIX ]
then
    msginit --input="$DIR/notes-with-history.pot" --output-file="$DIR/en.po" --no-translator
else
    for file in "$DIR"/*.$SUFFIX 
    do
        msgmerge --previous --update "$DIR/$file" "$DIR/notes-with-history.pot"
    done
fi

for file in "$DIR"/*.$SUFFIX
do 
	lingua=${file%.*}
	lingua=${lingua#*/}
	msgfmt $file
	mkdir locale/$lingua/LC_MESSAGES -p
	mv messages.mo locale/$lingua/LC_MESSAGES/notes-with-history.mo
done
