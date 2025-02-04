#!/bin/sh
#======================================================================
# AUTHOR:	Craig A. James
# DESCRIPTION:
# This file is part of of the "Tactile" library.
#
# Tactile is free software: you can redistribute it and/or modify it under
# the terms of the GNU Lesser General Public License (LGPL) as published by
# the Free Software Foundation, either version 3 of the License, or (at
# your option) any later version.
#
# Tactile is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE. See the LGPL for more details.
#
# You should have received a copy of the LGPL along with Tactile. If not,
# see <https://www.gnu.org/licenses/>.
#
# Compiles the "builder" files (html, javascript, and Bootstrap css)
# into a single HTML file. This is for ease of delivery and so that
# it can be used even when the internet isn't available.
#	
# Copyright (c) 2025, Craig A. James
#======================================================================

version=$1
dest=$2

usage() {
    echo $1
    echo "usage: $0 1|2 destination"
    exit 1;
}

if [ "$version" != "1" -a "$version" != "2" ] ; then
    usage "Error: version must be 1 or 2";
fi
if [ -z "$dest" ] ; then
    usage "Error: Missing destination file."
    exit 1;
fi

cat builder-$version/builder.html | egrep -v -e "<link href=.*bootstrap" | egrep -v -e "<script.*</script>" >$dest

echo "<script>" >>$dest
cat builder-$version/builder.js | egrep -v -e "\\s*//" >>$dest
echo "</script>" >>$dest

echo "<style>" >>$dest
cat builder-$version/bootstrap.min.css >>$dest
echo "</style>" >>$dest
echo "Done: $dest"
