#!/bin/sh

FILE=$1
echo Encrypting $FILE
openssl aes-256-cbc -a -salt -in $FILE -out $FILE.enc
