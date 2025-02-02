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

dest=$1
if [ -z "$dest" ] ; then
    echo "Missing destination file."
    exit 1;
fi

cat builder.html | egrep -v -e "<link href=.*bootstrap" | egrep -v -e "<script.*</script>" >$dest

echo "<script>" >>$dest
cat builder.js | egrep -v -e "\\s*//" >>$dest
echo "</script>" >>$dest

echo "<style>" >>$dest
cat bootstrap.min.css >>$dest
echo "</style>" >>$dest
echo "Done: $dest"
