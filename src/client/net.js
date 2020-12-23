export async function fetchText(path) {
  return fetch(path).then((data) => {
    return data.text()
  })
}

export async function fetchImage(path) {
  let image = new Image()
  image.src = path
  return new Promise(function (resolve) {
    image.onload = resolve
  }).then(() => {
    return image
  })
}

export async function fetchModule(path) {
  let module = await import(path)
  console.log(module)
}
