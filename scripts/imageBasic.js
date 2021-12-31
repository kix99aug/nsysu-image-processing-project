(function setting() {
    $("#scaleRatio").on("input", () => {
        $("label[for='scaleRatio']").text("Ratio " + $("#scaleRatio").val() + "x")
        scale = parseFloat($("#scaleRatio").val())
        if ($("#scaleMenu input[type='radio']")[0].checked) {
            requestAnimationFrame(resizeSimple)
        } else {
            requestAnimationFrame(resizeLinear)
        }
    })
    $("input#brit").on("input", () => {
        $("label[for='brit']").text($("input#brit").val() + "%")
        brightness = $("input#brit").val()
        requestAnimationFrame(light)
    })
    $("input#transparency").on("input", () => {
        $("label[for='transparency']").text($("input#transparency").val() + "%")
        transparency = $("input#transparency").val()
        requestAnimationFrame(changeTransparency)
    })
    $("#rotateRatio").on("input", () => {
        $("label[for='rotateRatio']").text("Degree " + $("#rotateRatio").val() + "°")
        degree = $("#rotateRatio").val()
        requestAnimationFrame(rotate)
    })
    $("[href='#RGBHSV']").click(() => {
        RGBHSV()
    })
    let ctx = Array.prototype.map.call($("#histogram canvas"), x => x.getContext("2d"))
    let i = 0, labels = []
    while (i < 256) labels.push(i++)
    ctx.forEach((c, i) => {
        if (i == 4) return
        charts[i] = new Chart(c, {
            data: {
                labels: labels,
                datasets: [{
                    type: 'bar',
                    data: [],
                    backgroundColor: [],
                    fill: false,
                    // borderColor: 'rgba(75, 192, 192,0.3)',
                    tension: 0.1
                }, {
                    type: 'line',
                    data: [],
                    backgroundColor: [],
                    fill: false,
                    // borderColor: 'rgba(75, 192, 192,0.3)',
                    tension: 0.1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        })
    })
})()

function clearCanvas(target) {
    Array.prototype.map.call($(target), x => x.getContext("2d").clearRect(0, 0, 5000, 5000))
}


function changeTransparency() {
    let newImage = new ImageData(image.width, image.height)
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i)
            let p2 = getPixel(j, i, image2)
            putPixel(newImage, j, i, p.map((x, idx) => {
                return Math.floor(x * transparency / 100 + p2[idx] * (100 - transparency) / 100)
            }))
        }
    }
    let canvas = $(".offcanvas#transparency canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = image.width
    canvas.height = image.height
    ctx.putImageData(newImage, 0, 0)
}



function light() {
    let newImage = new ImageData(image.width, image.height)
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i)
            putPixel(newImage, j, i, p.map(x => Math.floor(x * brightness / 100)))
        }
    }
    let canvas = $(".offcanvas#brit canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = image.width
    canvas.height = image.height
    ctx.putImageData(newImage, 0, 0)

}

function rotate() {
    let cycle = 1,
        target = degree
    while (target > 90) {
        cycle += 1
        target -= 90
    }
    let d = Math.PI / 2
    let canvas = $("#rotateMenu canvas")[0]
    let ctx = canvas.getContext("2d")
    let w, h
    let _image = image

    for (let k = 0; k < cycle; k++) {
        if (k == cycle - 1) d = target * (Math.PI / 180)
        w = Math.floor(_image.width * Math.cos(d) + _image.height * Math.sin(d))
        h = Math.floor(_image.height * Math.cos(d) + _image.width * Math.sin(d))
        let newImage = new ImageData(w, h)
        let offset = _image.height * Math.sin(d)
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                let x = j - offset
                let y = i
                let _x = Math.floor(x * Math.cos(d) + y * Math.sin(d))
                let _y = Math.floor(y * Math.cos(d) - x * Math.sin(d))
                if (_x < -1 || _x >= _image.width + 1 || _y < -1 || _y >= _image.height + 1) continue
                let p = getPixel(_x, _y, _image)
                putPixel(newImage, j, i, p)
            }
        }
        _image = newImage
    }

    canvas.width = w
    canvas.height = h
    ctx.putImageData(_image, 0, 0)
}


async function watermark() {
    $("#watermark canvas").attr("width", width)
    $("#watermark canvas").attr("height", height)
    clearCanvas("#watermark canvas")
    await openImageForCompare()
    let ctx = Array.prototype.map.call($("#watermark canvas"), x => x.getContext("2d"))
    let id = [new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height),
    new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height)
    ]


    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i)
            let p2 = getPixel(j, i, image2)
            let _p2 = p2.map(x => (x >> 7) % 2)
            let _p = p.map((x, idx) => {
                x -= x % 2
                x += _p2[idx]
                return x
            })
            putPixel(image2, j, i, _p)
        }
    }

    ctx[0].putImageData(image2, 0, 0)

    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i, image2)
            for (let k = 0; k < 8; k++) {
                let _p = p.map(x => (x >> k) % 2 * 255)
                putPixel(id[k], j, i, _p)
            }
        }
    }

    for (let k = 0; k < 8; k++) {
        ctx[k + 1].putImageData(id[k], 0, 0)
    }
}


function bitplane() {
    $("#bitplane canvas").attr("width", width)
    $("#bitplane canvas").attr("height", height)
    let ctx = Array.prototype.map.call($("#bitplane canvas"), x => x.getContext("2d"))
    let id = [new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height),
    new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height)
    ]
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i)
            for (let k = 0; k < 8; k++) {
                let _p = p.map(x => (x >> k) % 2 * 255)
                putPixel(id[k], j, i, _p)
            }
        }
    }
    for (let k = 0; k < 8; k++) {
        ctx[k].putImageData(id[k], 0, 0)
    }
}

function bitplaneGrayCode() {
    $("#bitplane canvas").attr("width", width)
    $("#bitplane canvas").attr("height", height)
    let ctx = Array.prototype.map.call($("#bitplane canvas"), x => x.getContext("2d"))
    let id = [new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height),
    new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height)
    ]
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i)
            for (let k = 0; k < 8; k++) {
                let _p = p.map(x => (GrayCode(x) >> k) % 2 * 255)
                putPixel(id[k], j, i, _p)
            }
        }
    }
    for (let k = 0; k < 8; k++) {
        ctx[k].putImageData(id[k], 0, 0)
    }
}

function RGBHSV() {
    $("#RGBHSV canvas").attr("width", width)
    $("#RGBHSV canvas").attr("height", height)
    let ctx = Array.prototype.map.call($("#RGBHSV canvas"), x => x.getContext("2d"))
    let id = [new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height),
    new ImageData(image.width, image.height), new ImageData(image.width, image.height), new ImageData(image.width, image.height)
    ]
    id.forEach(ele => {
        for (let i = 0; i < ele.data.length; i += 4) {
            ele.data[i] = 0
            ele.data[i + 1] = 0
            ele.data[i + 2] = 0
            ele.data[i + 3] = 255
        }
    })
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i)
            let _p = calculateHSV(p.slice(0))
            _p[0] = parseInt(_p[0] / 360 * 255)
            _p[1] = parseInt(_p[1] * 255)
            _p[2] = parseInt(_p[2] * 255)
            for (let k = 0; k < 3; k++) {
                id[k].data[(j + i * image.width) * 4 + k] = p[k]
            }
            for (let k = 0; k < 3; k++) {
                id[k + 3].data[(j + i * image.width) * 4 + 0] = _p[k]
                id[k + 3].data[(j + i * image.width) * 4 + 1] = _p[k]
                id[k + 3].data[(j + i * image.width) * 4 + 2] = _p[k]
            }
        }
    }
    for (let i = 0; i < 6; i++) ctx[i].putImageData(id[i], 0, 0)
    console.log(ctx)
}

function resizeSimple() {
    let newWidth = Math.floor(width * scale),
        newHeight = Math.floor(height * scale)
    let newImage = new ImageData(newWidth, newHeight)
    for (let i = 0; i < newHeight; i++) {
        for (let j = 0; j < newWidth; j++) {
            let x = Math.floor(j / scale),
                y = Math.floor(i / scale)
            let pixel = getPixel(x, y)
            newImage.data[(i * newWidth + j) * 4 + 0] = pixel[0]
            newImage.data[(i * newWidth + j) * 4 + 1] = pixel[1]
            newImage.data[(i * newWidth + j) * 4 + 2] = pixel[2]
            newImage.data[(i * newWidth + j) * 4 + 3] = 255
        }
    }
    // update(newImage, newWidth, newHeight)

    let canvas = $(".offcanvas#scaleMenu canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = newWidth
    canvas.height = newHeight
    ctx.putImageData(newImage, 0, 0)
}

function resizeLinear() {
    let newWidth = Math.floor(width * scale),
        newHeight = Math.floor(height * scale)
    let newImage = new ImageData(newWidth, newHeight)

    for (let i = 0; i < newHeight; i++) {
        for (let j = 0; j < newWidth; j++) {
            let x = Math.floor(j / scale),
                y = Math.floor(i / scale)
            let rgb = [0, 0, 0]
            if ((i * 10) % (scale * 10) == 0 && (j * 10) % (scale * 10) == 0) {
                rgb = getPixel(x, y)
            } else {
                for (let k = 0; k <= 1; k += 1) {
                    for (let l = 0; l <= 1; l += 1) {
                        let p = getPixel(x + k, y + l)
                        for (let m = 0; m < 3; m++) rgb[m] += p[m]
                    }
                }
                for (let m = 0; m < 3; m++) rgb[m] = parseInt(rgb[m] / 4)
            }
            newImage.data[(i * newWidth + j) * 4 + 0] = rgb[0]
            newImage.data[(i * newWidth + j) * 4 + 1] = rgb[1]
            newImage.data[(i * newWidth + j) * 4 + 2] = rgb[2]
            newImage.data[(i * newWidth + j) * 4 + 3] = 255
        }
    }
    // update(newImage, newWidth, newHeight)

    let canvas = $(".offcanvas#scaleMenu canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = newWidth
    canvas.height = newHeight
    ctx.putImageData(newImage, 0, 0)
}


function greyout() {
    let newImage = new ImageData(width, height)

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            let sum = 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]
            sum = parseInt(sum)
            p = [sum, sum, sum]
            putPixel(newImage, j, i, p)
        }
    }
    update(newImage, "Greyout")
    $("div#filterSize").hide()
}

function negativeRGB() {
    let newImage = new ImageData(width, height)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            putPixel(newImage, j, i, p.map(x => 255 - x))
        }
    }
    update(newImage, "RGB Negative")
    $("div#filterSize").hide()
}

function negativeGrey() {
    let newImage = new ImageData(width, height)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            let sum = 255 - parseInt(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2])
            p = [sum, sum, sum]
            putPixel(newImage, j, i, p)
        }
    }
    update(newImage, "Greylevel Negative")
    $("div#filterSize").hide()
}

async function snr() {
    let _image = image
    await openImageForCompare()
    let top = 0, bot = 0
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p1 = getPixel(j, i, _image)
            let p2 = getPixel(j, i, image2)
            top += toGrayPixel(p1) * toGrayPixel(p1)
            bot += (toGrayPixel(p1) - toGrayPixel(p2)) * (toGrayPixel(p1) - toGrayPixel(p2))
        }
    }
    let ans = 10 * Math.log10(top / bot)
    update(image2,"SNR: "+ans.toString())
    $("div#filterSize").hide()
}