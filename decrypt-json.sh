#!/bin/sh

FILE=$1
echo "Decrypting $FILE"
openssl aes-256-cbc -d -a -in $FILE -out "${FILE%.enc}"
