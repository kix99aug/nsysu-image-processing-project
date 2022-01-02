const file = document.querySelector("input#file")
const openfile = document.querySelector("a#openfile")
const originalDetail = document.querySelector("span#detail")
const canvasOriginal = document.querySelector(".canvasBox canvas")
const ctxOriginal = canvasOriginal.getContext("2d")

let image = null,
    image2
let height, width
let degree = 0,
    brightness = 100,
    scale = 1,
    transparency = 50
let charts = []

file.addEventListener("change", e => {
    let loadedFile = file.files[0]
    if (!loadedFile) return
    let reader = new FileReader()
    let bmp = false
    reader.onload = async ee => {
        let buffer = reader.result
        let array = new Uint8Array(buffer)
        let decodedHeader = null
        let palette256 = null

        if (file.files[0].name.split(".").pop().toLowerCase() == "pcx") {
            let header = array.slice(0, 128)
            decodedHeader = decodeHeader(header)
            if (!decodedHeader) {
                console.log("PCX decode failed.")
                return
            }
            // console.log(decodedHeader)
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
            // console.log(decodedHeader)
            if (decodedHeader.bitsPerPixel == 8) {
                bmp = true
                let palette = array.slice(54, 54 + 1024)
                let data = array.slice(54 + 1024)
                palette256 = []
                for (let i = 0; i < 1024; i += 4) {
                    palette256.push(palette[i + 2])
                    palette256.push(palette[i + 1])
                    palette256.push(palette[i])
                }
                readdata8bmp(decodedHeader, data, palette256)
            } else if (decodedHeader.bitsPerPixel == 24) {
                bmp = true
                let data = array.slice(54)
                readdata24bmp(decodedHeader, data)
            } else if (decodedHeader.bitsPerPixel == 32) {
                await new Promise(function (resolve, reject) {
                    bmp = true
                    let img = document.createElement("img")
                    img.src = URL.createObjectURL(loadedFile)
                    img.style.display = "none"
                    document.body.append(img)

                    img.onload = function () {
                        width = img.width
                        height = img.height
                        canvasOriginal.width = width
                        canvasOriginal.height = height
                        ctxOriginal.drawImage(img, 0, 0)
                        image = ctxOriginal.getImageData(0, 0, width, height)
                        resolve(image)
                    }
                })
            }
        }
        let str = ""
        for (let i in decodedHeader) {
            let _i = i
            _i = _i[0].toUpperCase() + _i.substring(1)
            str += `${_i}: ${decodedHeader[i]}\n`
        }
        $("pre#info").text(str)
        let ctx = $("canvas#plate")[0].getContext("2d")
        ctx.clearRect(0, 0, 256, 256)
        if (palette256) {
            for (let i = 0; i < 16; i++) {
                for (let j = 0; j < 16; j++) {
                    ctx.fillStyle = `rgb(${palette256[(j + i * 16) * 3 + 0]},${palette256[(j + i * 16) * 3 + 1]},${palette256[(j + i * 16) * 3 + 2]})`
                    ctx.fillRect(j * 16, i * 16, 16, 16);
                }
            }
        }
        if (!bmp) {
            loadImage(decodedHeader, palette256)
        } else {
            width = image.width
            height = image.height
            canvasOriginal.width = width
            canvasOriginal.height = height
            ctxOriginal.putImageData(image, 0, 0);
        }
        image = ctxOriginal.getImageData(0, 0, width, height);
        rotate()
        light()
        resizeSimple()
        $("h2").show()
        // huffman()
    }
    reader.readAsArrayBuffer(loadedFile)
})

function openImageForCompare() {
    return new Promise(function (resolve, reject) {
        let file2 = document.createElement("input")
        file2.type = "file"
        file2.click()
        let bmp = false
        $(file2).on("change", async e => {
            let loadedFile = file2.files[0]
            if (!loadedFile) reject();
            let buffer = await new Response(loadedFile).arrayBuffer()
            let array = new Uint8Array(buffer)
            let decodedHeader = null
            let palette256 = null
            let _image = image, _width = width, _height = height
            if (file2.files[0].name.split(".").pop().toLowerCase() == "pcx") {
                let header = array.slice(0, 128)
                decodedHeader = decodeHeader(header)
                if (!decodedHeader) {
                    console.log("PCX decode failed.")
                    reject();
                }
                // console.log(decodedHeader)
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
                    reject();
                }
                // console.log(decodedHeader)
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
                    bmp = true
                    let data = array.slice(54)
                    readdata24bmp(decodedHeader, data)
                } else if (decodedHeader.bitsPerPixel == 32) {
                    await new Promise(function (_resolve, reject) {
                        bmp = true
                        let img = document.createElement("img")
                        img.src = URL.createObjectURL(loadedFile)
                        img.style.display = "none"
                        document.body.append(img)
    
                        img.onload = function () {
                            width = img.width
                            height = img.height
                            canvasOriginal.width = width
                            canvasOriginal.height = height
                            ctxOriginal.drawImage(img, 0, 0)
                            image = ctxOriginal.getImageData(0, 0, width, height)
                            _resolve(image)
                        }
                    })
                }
            }
            if(!bmp) loadImage(decodedHeader, palette256)
            image = ctxOriginal.getImageData(0, 0, width, height);
            image2 = image
            image = _image, width = _width, height = _height
            canvasOriginal.width = image.width
            canvasOriginal.height = image.height
            ctxOriginal.putImageData(image, 0, 0)
            requestAnimationFrame(changeTransparency)
            resolve(image2)
        })
    });
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
    // output['palette16'] = header.slice(16, 64)
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
    // console.log(fileHeader, infoHeader)
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
    // console.log("8bit")
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


function readdata8bmp(header, data, palette) {
    // console.log("8bit")
    // image = [
    //     []
    // ]
    // let temp = []
    // for (let i = 0; i < data.length; i++) {
    //     if (i % header.bytesPerRow == 0) {
    //         image[0] = temp.concat(image[0])
    //         temp = []
    //     }
    //     temp.push(data[i])
    // }

    id = new ImageData(header.bytesPerRow, header.ymax + 1)
    let h = header.ymax + 1
    for (let i = 0, j = h * header.bytesPerRow * 4; i < data.length; i++, j += 4) {
        if (i % header.bytesPerRow == 0) j = (--h) * header.bytesPerRow * 4
        id.data[j + 3] = 255
        id.data[j + 2] = palette[data[i] * 3 + 2]
        id.data[j + 1] = palette[data[i] * 3 + 1]
        id.data[j + 0] = palette[data[i] * 3]
    }
    image = id
}

function readdata24(header, data) {
    // console.log("24bit")
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
    // console.log("24bit")
    id = new ImageData(header.bytesPerRow, header.ymax + 1)
    let h = header.ymax + 1
    for (let i = 0, j = h * header.bytesPerRow * 4; i < data.length; i += 3, j += 4) {
        if (i % header.bytesPerRow == 0) j = (--h) * header.bytesPerRow * 4
        id.data[j + 3] = 255
        id.data[j + 2] = data[i]
        id.data[j + 1] = data[i + 1]
        id.data[j + 0] = data[i + 2]
    }
    image = id
}

function loadImage(decodedHeader, palette256) {
    width = decodedHeader.xmax - decodedHeader.xmin + 1
    height = decodedHeader.ymax - decodedHeader.ymin + 1
    newBytePerRow = decodedHeader.bytesPerRow
    canvasOriginal.width = width
    canvasOriginal.height = height
    var id = ctxOriginal.createImageData(decodedHeader.bytesPerRow, height)
    if (!palette256)
        for (let i = 0, j = 0; i < image[0].length; i++, j += 4) {
            id.data[j] = image[0][i]
            id.data[j + 1] = image[1][i]
            id.data[j + 2] = image[2][i]
            id.data[j + 3] = 255
        }
    else {
        for (let i = 0, j = 0; i < image[0].length; i++, j += 4) {
            id.data[j] = palette256[image[0][i] * 3]
            id.data[j + 1] = palette256[image[0][i] * 3 + 1]
            id.data[j + 2] = palette256[image[0][i] * 3 + 2]
            id.data[j + 3] = 255
        }


    }
    image = id
    ctxOriginal.putImageData(image, 0, 0);
}

function calculateHSV(p) {
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

    return [h, s, i]

}

function getPixel(x, y, id) {
    let _image = image
    if (id) _image = id
    if (x >= _image.width) x = _image.width - 1
    if (y >= _image.height) y = _image.height - 1
    if (x < 0) x = 0
    if (y < 0) y = 0
    return [_image.data[(y * _image.width + x) * 4], _image.data[(y * _image.width + x) * 4 + 1], _image.data[(y * _image.width + x) * 4 + 2]]
}

function putPixel(id, x, y, p) {
    id.data[(y * id.width + x) * 4 + 0] = p[0]
    id.data[(y * id.width + x) * 4 + 1] = p[1]
    id.data[(y * id.width + x) * 4 + 2] = p[2]
    id.data[(y * id.width + x) * 4 + 3] = 255
}

canvasOriginal.addEventListener("mousemove", e => {
    if (!image) return
    if (e.offsetX < 0 || e.offsetX >= width || e.offsetY < 0 || e.offsetY >= height) return
    let p = [0, 0, 0]
    p[0] = image.data[(e.offsetX + e.offsetY * width) * 4]
    p[1] = image.data[(e.offsetX + e.offsetY * width) * 4 + 1]
    p[2] = image.data[(e.offsetX + e.offsetY * width) * 4 + 2]
    originalDetail.innerHTML = `X: ${e.offsetX} Y: ${e.offsetY} R: ${parseInt(p[0])} G: ${parseInt(p[1])} B: ${parseInt(p[2])}`
    let [h, s, i] = calculateHSV(p)
    originalDetail.innerHTML += ` H: ${parseInt(h)}° S: ${s.toFixed(2)} I: ${i.toFixed(2)}`
})




function update(i, t) {
    $("#commonResultTitle").text(t)
    let w = i.width, h = i.height
    let canvas = $("#commonResult canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = w
    canvas.height = h
    $("#commonResult canvas").off("mousemove")
    $("#commonResult canvas").on("mousemove", e => {
        if (e.offsetX < 0 || e.offsetX >= w || e.offsetY < 0 || e.offsetY >= h) return
        let p = [0, 0, 0]
        p[0] = i.data[(e.offsetX + e.offsetY * w) * 4]
        p[1] = i.data[(e.offsetX + e.offsetY * w) * 4 + 1]
        p[2] = i.data[(e.offsetX + e.offsetY * w) * 4 + 2]
        let str = `X: ${e.offsetX} Y: ${e.offsetY} R: ${parseInt(p[0])} G: ${parseInt(p[1])} B: ${parseInt(p[2])}`
        let [_h, s, _i] = calculateHSV(p)
        str += ` H: ${parseInt(_h)}° S: ${s.toFixed(2)} I: ${_i.toFixed(2)}`
        $("#resultDetail").text(str)
    })
    ctx.putImageData(i, 0, 0)
    $("div#hbA").hide()
    $("div#filterSize").show()
    commonResult.show()
}

var commonResult = new bootstrap.Offcanvas(document.getElementById('commonResult'), {})
var rotateMenu = new bootstrap.Offcanvas(document.getElementById('rotateMenu'), {})
var britMenu = new bootstrap.Offcanvas($("div#brit")[0], {})
var transparentMenu = new bootstrap.Offcanvas($("div#transparency")[0], {})

// britMenu.show()

// rotateMenu.show()

function GrayCode(n) {
    if (n < 0) {
        throw new RangeError("cannot convert negative numbers to gray code");
    }
    return n ^ (n >>> 1);
};