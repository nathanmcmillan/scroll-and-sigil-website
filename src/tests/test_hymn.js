/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { fetchText } from '../client/net.js'
import { Hymn } from '../hymn/hymn.js'

async function main() {
  const input = await fetchText('./test_hymn_1.hm')
  console.log('input:', input)
  const hymn = new Hymn(input)
  const output = hymn.eval()
  console.log('output:', output)
}

main()
