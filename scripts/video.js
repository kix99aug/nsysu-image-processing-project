const file = document.querySelector("input#file")
const openfile = document.querySelector("a#openfile")
const canvasLt = document.querySelector("#lt canvas")
const zoomLt = document.querySelector("canvas#zoomLt")
const ctxLt = canvasLt.getContext("2d")
const ctxZoomLt = zoomLt.getContext("2d")
const images = []
let frame = 0,
    int

file.addEventListener("change", async e => {
    let loadedFiles = file.files
    if (!loadedFiles[0]) return
    for (let _i = 0; _i < loadedFiles.length; _i++) {
        let buffer = await new Response(loadedFiles[_i]).arrayBuffer()
        let array = new Uint8Array(buffer, 8)
        let a = array.slice(0,array.length-126)
        let b = array.slice(array.length-126,array.length)
        console.log(b)
        let image = new ImageData(256, 256)
        let data = image.data
        for (let i = 0; i < a.length; i++) {
            data[i * 4 + 0] = a[i]
            data[i * 4 + 1] = a[i]
            data[i * 4 + 2] = a[i]
            data[i * 4 + 3] = 255
        }
        images.push(image)
    }
    frame = 0
    previewImages()
    if(frame!=images.length) int = setInterval(previewImages, 1000/24)
})

function previewImages() {
    ctxLt.putImageData(images[frame++], 0, 0)
    ctxZoomLt.drawImage(canvasLt,0,0,8,8,0,0,8,8)
    if (frame == images.length) clearInterval(int)
}

openfile.addEventListener("click", e => {
    file.click()
})

document.addEventListener("keydown", e => {
    if (e.key == 'o' && e.ctrlKey) {
        e.preventDefault()
        file.click()
    }
})