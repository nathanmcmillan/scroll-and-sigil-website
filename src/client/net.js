/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export async function fetchText(path) {
  return fetch(path).then((data) => {
    return data.text()
  })
}

export async function fetchImage(path) {
  const image = new Image()
  image.src = path
  return new Promise(function (resolve) {
    image.onload = resolve
  }).then(() => {
    return image
  })
}

export async function fetchModule(path) {
  const module = await import(path)
  console.log(module)
}
