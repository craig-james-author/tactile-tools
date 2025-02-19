#!/bin/sh

set -e

usage() {
    echo $1
    echo "usage: $0 1|2 destination"
    echo "       example: $0 2 2025-01-27 \$HOME/tmp"
    exit 1;
}


if [ -z "$TEENSY" ] ; then
    usage "Environment variable TEENSY is not defined."
fi

version=$1
date=$2
destdir=$3
if [ -z "$version" -o -z "$date" -o -z "$destdir" ] ; then
    usage "Missing parameter"
fi
if [ "$version" != "1" -a "$version" != "2" ] ; then
    usage "Error: version must be 1 or 2";
fi
(cd /
 if [ ! -d $destdir ]; then
    usage "Destination must be an absolute path: $destdir"
 fi
)

srcdir=$TEENSY/Teensy-$version
if [ ! -d $srcdir ] ; then
    usage "Can't find source directory '$srcdir'";
fi

newdir=$destdir/Arduino
if [ -d $newdir ] ; then
    usage "Error: $newdir exists, please remove it."
fi

# Libraries and sketches
mkdir $newdir
cd $srcdir
find libraries sketches -print | grep -v '\.git' | grep -v '\.DS_Store' | cpio -pdmv $newdir

# Gemma-M0 files
cd $TEENSY/hardware/gemma-m0
ada=`ls adafruit-circuitpython-*.zip | tail -1`
uf2=`ls *.uf2 | tail -1`
files="README-installation.txt code.py $ada $uf2"
mkdir $newdir/gemma-m0
cp $files $newdir/gemma-m0

# tactile-builder
cd $TEENSY/tools
./compile-single-page-builder.sh $version $newdir/tactile-builder.html

# vibration designer
./compile-single-page-vib-designer.sh 2 $newdir/vibration-designer.html

# Make the TAR file
cd $destdir
zip -r Arduino-$date.zip Arduino
