#!/bin/sh

set -e

if [ -z "$TEENSY" ] ; then
    echo "Environment variable TEENSY is not defined."
    exit 1
fi

srcdir=$1
date=$2
destdir=$3
if [ -z "$srcdir" -o -z "$date" -o -z "$destdir" ] ; then
    echo "Usage: $0 source-dir date dest-dir"
    echo "       example: $0 Teensy-2 2025-01-27 \$HOME/tmp"
    exit 1
fi
(cd /
 if [ ! -d $destdir ]; then
    echo "destination must be an absolute path: $destdir"
 fi
)

if [ ! -d $srcdir ] ; then
    echo "Can't find source directory '$srcdir'";
    exit 1;
fi

newdir=$destdir/Arduino
if [ -d $newdir ] ; then
    echo "Error: $newdir exists, please remove it."
    exit 1
fi

# Libraries and sketches
mkdir $newdir
cd $TEENSY/$srcdir
find libraries sketches -print | grep -v '\.git' | grep -v '\.DS_Store' | cpio -pdmv $newdir

# Gemma-M0 files
cd $TEENSY/hardware/gemma-m0
ada=`ls adafruit-circuitpython-*.zip | tail -1`
uf2=`ls *.uf2 | tail -1`
files="README-installation.txt code.py $ada $uf2"
mkdir $newdir/gemma-m0
cp $files $newdir/gemma-m0

# tactile-builder
cd $TEENSY/tools/builder
./compile-single-page-builder.sh $newdir/tactile-builder.html

# Make the TAR file
cd $destdir
zip -r Arduino-$date.zip Arduino
