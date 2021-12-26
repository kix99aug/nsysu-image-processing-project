const file = document.querySelector("input#file")
const openfile = document.querySelector("a#openfile")
const originalDetail = document.querySelector("#original span#detail")
const modifiedDetail = document.querySelector("#modified span#detail")
const canvasOriginal = document.querySelector("#original .canvasBox canvas")
const canvasModified = document.querySelector("#modified .canvasBox canvas")
const ctxOriginal = canvasOriginal.getContext("2d")
const ctxModified = canvasModified.getContext("2d")
const colorValues = document.querySelectorAll("input.color")

let originalImage = []
let image = []
let decodedHeader = null
let palette256 = null
let r = 255,
    g = 255,
    b = 255
let newWidth = null,
    newHeight = null,
    newBytePerRow = null

document.querySelector("input#colorR").addEventListener("input", e => {
    r = parseInt(e.target.value)
    updateImage()
})
document.querySelector("input#colorG").addEventListener("input", e => {
    g = parseInt(e.target.value)
    updateImage()
})
document.querySelector("input#colorB").addEventListener("input", e => {
    b = parseInt(e.target.value)
    updateImage()
})

file.addEventListener("change", e => {
    let loadedFile = file.files[0]
    if (!loadedFile) return
    let reader = new FileReader()
    reader.onload = ee => {
        let buffer = reader.result
        let array = new Uint8Array(buffer)

        if (file.files[0].name.split(".").pop().toLowerCase() == "pcx") {
            let header = array.slice(0, 128)
            decodedHeader = decodeHeader(header)
            if (!decodedHeader) {
                console.log("PCX decode failed.")
                return
            }
            console.log(decodedHeader)
            if (decodedHeader.planes == 1) {
                let data = array.slice(128, -769)
                palette256 = array.slice(-768)
                readdata8(decodedHeader, data)
            } else if (decodedHeader.planes == 3) {
                let data = array.slice(128)
                readdata24(decodedHeader, data)
            }
        } else { // bmp
            let header = array.slice(0, 54)
            decodedHeader = decodeHeaderBmp(header)
            if (!decodedHeader) {
                console.log("BMP decode failed.")
                return
            }
            console.log(decodedHeader)
            if (decodedHeader.bitsPerPixel == 8) {
                let palette = array.slice(54, 54 + 1024)
                let data = array.slice(54 + 1024)
                palette256 = []
                for (let i = 0; i < 1024; i += 4) {
                    palette256.push(palette[i + 2])
                    palette256.push(palette[i + 1])
                    palette256.push(palette[i])
                }
                readdata8bmp(decodedHeader, data)
            } else if (decodedHeader.bitsPerPixel == 24) {
                let data = array.slice(54)
                readdata24bmp(decodedHeader, data)
            }
        }
        loadImage()
        updateImage()
    }
    reader.readAsArrayBuffer(loadedFile)
})

openfile.addEventListener("click", e => {
    file.click()
})

document.addEventListener("keydown", e => {
    if (e.key == 'o' && e.ctrlKey) {
        e.preventDefault()
        file.click()
    }
})

function decodeHeader(header) {
    // header definition from http://www.fastgraph.com/help/pcx_header_format.html
    const output = {}
    if (header[0] != 10) return
    output['version'] = header[1]
    if (header[2] != 1) return
    output['bitsPerPixel'] = header[3]
    output['xmin'] = header[4] + header[5] * 256
    output['ymin'] = header[6] + header[7] * 256
    output['xmax'] = header[8] + header[9] * 256
    output['ymax'] = header[10] + header[11] * 256
    output['xdpi'] = header[12] + header[13] * 256
    output['ydpi'] = header[14] + header[15] * 256
    output['palette16'] = header.slice(16, 64)
    if (header[64] != 0) return
    output['planes'] = header[65]
    output['bytesPerRow'] = header[66] + header[67] * 256
    output['paletteInterpretation'] = header[68] + header[69] * 256
    output['xsize'] = header[70] + header[71] * 256
    output['ysize'] = header[72] + header[73] * 256
    for (let i = 74; i < 128; i++)
        if (header[i] != 0) return // 74~127為全空，必須為零
    return output
}

function decodeHeaderBmp(header) {
    const output = {}
    let fileHeader = header.slice(0, 14),
        infoHeader = header.slice(14)
    console.log(fileHeader, infoHeader)
    output['bitsPerPixel'] = infoHeader[14] + infoHeader[15] * 256
    output['xmin'] = 0
    output['ymin'] = 0
    output['xmax'] = infoHeader[4] + infoHeader[5] * 256 + infoHeader[6] * 256 * 256 + infoHeader[7] * 256 * 256 * 256 - 1
    output['ymax'] = infoHeader[8] + infoHeader[9] * 256 + infoHeader[10] * 256 * 256 + infoHeader[11] * 256 * 256 * 256 - 1
    output['planes'] = output['bitsPerPixel'] / 8
    output['bytesPerRow'] = output['xmax'] + 1
    if (output['bytesPerRow'] % 4 != 0) {
        output['bytesPerRow'] = output['bytesPerRow'] + 4 - output['bytesPerRow'] % 4
    }
    return output
}

function readdata8(header, data, palette) {
    console.log("8bit")
    image = [
        []
    ]
    for (let i = 0; i < data.length; i++) {
        if (data[i] >= 192) {
            for (let j = 0; j < data[i] - 192; j++) image[0].push(data[i + 1])
            i++
        } else image[0].push(data[i])
    }
}


function readdata8bmp(header, data) {
    console.log("8bit")
    image = [
        []
    ]
    let temp = []
    for (let i = 0; i < data.length; i++) {
        if (i % header.bytesPerRow == 0) {
            image[0] = temp.concat(image[0])
            temp = []
        }
        temp.push(data[i])
    }
}

function readdata24(header, data) {
    console.log("24bit")
    let rgb = 0
    let count = 0
    image = [
        [],
        [],
        []
    ]
    for (let i = 0; i < data.length; i++) {
        if (count == header.bytesPerRow) {
            rgb = (rgb + 1) % 3
            count = 0
        }
        if (data[i] > 192) {
            for (let j = 0; j < data[i] - 192; j++) {
                if (count == header.bytesPerRow) {
                    rgb = (rgb + 1) % 3
                    count = 0
                }
                image[rgb].push(data[i + 1])
                count++
            }
            i++
        } else {
            image[rgb].push(data[i])
            count++
        }
    }
}


function readdata24bmp(header, data) {
    console.log("24bit")
    image = [
        [],
        [],
        []
    ]
    let temp = [
        [],
        [],
        []
    ]
    for (let i = 0; i < data.length; i += 3) {
        if (i % header.bytesPerRow == 0) {
            image[0] = temp[0].concat(image[0])
            image[1] = temp[1].concat(image[1])
            image[2] = temp[2].concat(image[2])
            temp = [
                [],
                [],
                []
            ]
        }
        temp[2].push(data[i])
        temp[1].push(data[i + 1])
        temp[0].push(data[i + 2])
    }
}

function loadImage() {
    console.log(image)
    originalImage = image
    newWidth = decodedHeader.xmax - decodedHeader.xmin + 1
    newHeight = decodedHeader.ymax - decodedHeader.ymin + 1
    newBytePerRow = decodedHeader.bytesPerRow
    canvasOriginal.width = newWidth
    canvasOriginal.height = newHeight
    var id = ctxOriginal.createImageData(newBytePerRow, newHeight)

    if (decodedHeader.planes == 3)
        for (let i = 0, j = 0; i < image[0].length; i++, j += 4) {
            id.data[j] = image[0][i] * (r / 255)
            id.data[j + 1] = image[1][i] * (g / 255)
            id.data[j + 2] = image[2][i] * (b / 255)
            id.data[j + 3] = 255
        }

    else
        for (let i = 0, j = 0; i < image[0].length; i++, j += 4) {
            id.data[j] = palette256[image[0][i] * 3] * (r / 255)
            id.data[j + 1] = palette256[image[0][i] * 3 + 1] * (g / 255)
            id.data[j + 2] = palette256[image[0][i] * 3 + 2] * (b / 255)
            id.data[j + 3] = 255
        }
    ctxOriginal.putImageData(id, 0, 0);
}

function updateImage() {
    console.log(image)
    canvasModified.width = newWidth
    canvasModified.height = newHeight
    var id = ctxModified.createImageData(newBytePerRow, newHeight)

    if (decodedHeader.planes == 3)
        for (let i = 0, j = 0; i < image[0].length; i++, j += 4) {
            id.data[j] = image[0][i] * (r / 255)
            id.data[j + 1] = image[1][i] * (g / 255)
            id.data[j + 2] = image[2][i] * (b / 255)
            id.data[j + 3] = 255
        }

    else
        for (let i = 0, j = 0; i < image[0].length; i++, j += 4) {
            id.data[j] = palette256[image[0][i] * 3] * (r / 255)
            id.data[j + 1] = palette256[image[0][i] * 3 + 1] * (g / 255)
            id.data[j + 2] = palette256[image[0][i] * 3 + 2] * (b / 255)
            id.data[j + 3] = 255
        }
    ctxModified.putImageData(id, 0, 0);
}

canvasOriginal.addEventListener("mousemove", e => {
    let p = [0, 0, 0]
    if (decodedHeader) {
        if (decodedHeader.planes == 3) {
            p[0] = originalImage[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * (r / 255)
            p[1] = originalImage[1][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * (g / 255)
            p[2] = originalImage[2][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * (b / 255)
        } else {
            p[0] = palette256[originalImage[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * 3] * (r / 255)
            p[1] = palette256[originalImage[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * 3 + 1] * (g / 255)
            p[2] = palette256[originalImage[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * 3 + 2] * (b / 255)
        }
    }
    originalDetail.innerHTML = `X: ${e.offsetX} Y: ${e.offsetY} R: ${parseInt(p[0])} G: ${parseInt(p[1])} B: ${parseInt(p[2])}`
    for (let i in p) p[i] /= 255
    let h, s, i
    let max = Math.max(...p),
        min = Math.min(...p)
    if (max == min) h = 0
    else if (max == p[0] && p[1] >= p[2]) h = 60 * (p[1] - p[2]) / (max - min)
    else if (max == p[0] && p[1] < p[2]) h = 60 * (p[1] - p[2]) / (max - min) + 360
    else if (max == p[1]) h = 60 * (p[2] - p[0]) / (max - min) + 120
    else if (max == p[2]) h = 60 * (p[0] - p[1]) / (max - min) + 240
    i = (max + min) / 2
    if (i == 0 || max == min) s = 0
    else if (i <= 0.5) s = (max - min) / (2 * i)
    else s = (max - min) / (2 - 2 * i)
    originalDetail.innerHTML += ` H: ${parseInt(h)}° S: ${s.toFixed(2)} I: ${i.toFixed(2)}`
})

canvasModified.addEventListener("mousemove", e => {
    let p = [0, 0, 0]
    if (decodedHeader) {
        if (decodedHeader.planes == 3) {
            p[0] = image[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * (r / 255)
            p[1] = image[1][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * (g / 255)
            p[2] = image[2][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * (b / 255)
        } else {
            p[0] = palette256[image[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * 3] * (r / 255)
            p[1] = palette256[image[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * 3 + 1] * (g / 255)
            p[2] = palette256[image[0][e.offsetX + e.offsetY * decodedHeader.bytesPerRow] * 3 + 2] * (b / 255)
        }
    }
    modifiedDetail.innerHTML = `X: ${e.offsetX} Y: ${e.offsetY} R: ${parseInt(p[0])} G: ${parseInt(p[1])} B: ${parseInt(p[2])}`
    for (let i in p) p[i] /= 255
    let h, s, i
    let max = Math.max(...p),
        min = Math.min(...p)
    if (max == min) h = 0
    else if (max == p[0] && p[1] >= p[2]) h = 60 * (p[1] - p[2]) / (max - min)
    else if (max == p[0] && p[1] < p[2]) h = 60 * (p[1] - p[2]) / (max - min) + 360
    else if (max == p[1]) h = 60 * (p[2] - p[0]) / (max - min) + 120
    else if (max == p[2]) h = 60 * (p[0] - p[1]) / (max - min) + 240
    i = (max + min) / 2
    if (i == 0 || max == min) s = 0
    else if (i <= 0.5) s = (max - min) / (2 * i)
    else s = (max - min) / (2 - 2 * i)
    modifiedDetail.innerHTML += ` H: ${parseInt(h)}° S: ${s.toFixed(2)} I: ${i.toFixed(2)}`

})

function resizeSimple(scale) {
    let newImage = null
    if (decodedHeader.planes == 3) {
        newImage = [
            [],
            [],
            []
        ]
    } else {
        newImage = [
            []
        ]
    }
    for (let i = 0; i < Math.floor(newHeight * scale); i++) {
        for (let j = 0; j < Math.floor(newBytePerRow * scale); j++) {
            newImage[0].push(image[0][Math.floor(Math.floor(i / scale) * newBytePerRow + j / scale)])
            if (decodedHeader.planes == 3) {
                newImage[1].push(image[1][Math.floor(Math.floor(i / scale) * newBytePerRow + j / scale)])
                newImage[2].push(image[2][Math.floor(Math.floor(i / scale) * newBytePerRow + j / scale)])
            }
        }
    }
    newWidth = Math.floor(newWidth * scale)
    newHeight = Math.floor(newHeight * scale)
    newBytePerRow = Math.floor(newBytePerRow * scale)
    image = newImage
    updateImage()
}


function resizeLinear(scale) {
    let newImage = null
    if (decodedHeader.planes == 3) {
        newImage = [
            [],
            [],
            []
        ]
    } else {
        newImage = [
            []
        ]
    }
    for (let i = 0; i < Math.floor(newHeight * scale); i++) {
        for (let j = 0; j < Math.floor(newBytePerRow * scale); j++) {
            let p = [Math.floor(Math.floor(i / scale) * newBytePerRow + j / scale),
                Math.floor(Math.floor(i / scale) * newBytePerRow + j / scale + 1),
                Math.floor(Math.floor(i / scale + 1) * newBytePerRow + j / scale),
                Math.floor(Math.floor(i / scale + 1) * newBytePerRow + j / scale + 1)
            ]
            if (j / scale + 1 >= newBytePerRow) {
                p[1] = Math.floor(Math.floor(i / scale) * newBytePerRow + j / scale - 1)
                p[3] = Math.floor(Math.floor(i / scale + 1) * newBytePerRow + j / scale - 1)
            }
            for (let k in p)
                if (p[k] >= image[0].length) p[k] = image[0].length - 1
            let sum = [0, 0, 0]
            for (let k in p) {
                sum[0] += image[0][p[k]]
                if (decodedHeader.planes == 3) {
                    sum[1] += image[1][p[k]]
                    sum[2] += image[2][p[k]]
                }
            }
            newImage[0].push(sum[0] / 4)
            if (decodedHeader.planes == 3) {
                newImage[1].push(sum[1] / 4)
                newImage[2].push(sum[2] / 4)
            }
        }
    }
    newWidth = Math.floor(newWidth * scale)
    newHeight = Math.floor(newHeight * scale)
    newBytePerRow = Math.floor(newBytePerRow * scale)
    image = newImage
    updateImage()
}