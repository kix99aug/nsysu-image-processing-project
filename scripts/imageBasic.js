(function setting() {
    $("#scaleRatio,#scaleMenu input[type='radio']").on("input", () => {
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

    $("#thresholding input").on("input", () => {
        $("#thresholding label").text("Threshold = " + $("#thresholding input").val())
        threshold = $("#thresholding input").val()
        requestAnimationFrame(thresholding)
    })


    $("#thresholding #otsu").on("click", () => {
        $("#thresholding input").val(otsu())
        $("#thresholding input").trigger("input")
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
    let ctx = Array.prototype.map.call($("#histogram .chart canvas,#histogram .chart2 canvas"), x => x.getContext("2d"))
    let i = 0,
        labels = []
    while (i < 256) labels.push(i++)
    ctx.forEach((c, i) => {
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

let direction = true

$('#rotateMenu input[type="radio"]').on("input",e=>{
    direction = $('#rotateMenu input[type="radio"]')[0].checked
    rotate()
})

function rotate() {
    let canvas = $("#rotateMenu canvas")[0]
    let ctx = canvas.getContext("2d")
    if (degree == 0 || degree == 360) {
        canvas.width = image.width
        canvas.height = image.height
        ctx.putImageData(image, 0, 0)
    }
    let cycle = 1,
        target = degree
    while (target > 90) {
        cycle += 1
        target -= 90
    }
    let d = Math.PI / 2
    let w, h
    let _image = image


    for (let k = 0; k < cycle; k++) {
        if (k == cycle - 1) d = target * (Math.PI / 180)
        w = Math.round(_image.width * Math.cos(d) + _image.height * Math.sin(d))
        h = Math.round(_image.height * Math.cos(d) + _image.width * Math.sin(d))
        let newImage = new ImageData(w, h)

        if (direction) {

            let offset = Math.round(image.height * Math.sin(d))
            for (let i = 0; i < _image.height; i++) {
                for (let j = 0; j < _image.width; j++) {
                    let x = Math.round(j * Math.cos(d) - i * Math.sin(d) + offset)
                    let y = Math.round(j * Math.sin(d) + i * Math.cos(d))
                    if (x < 0 || x > w || y < 0 || y > h) continue
                    let p = getPixel(j + 1, i + 1, _image)
                    putPixel(newImage, x, y, p)
                }
            }
        } else {
            let offset = _image.height * Math.sin(d)
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    let x = j - offset
                    let y = i
                    let _x = Math.round(x * Math.cos(d) + y * Math.sin(d))
                    let _y = Math.round(y * Math.cos(d) - x * Math.sin(d))
                    if (_x < 0 || _x > _image.width || _y < 0 || _y > _image.height) continue
                    let p = getPixel(_x + 1, _y + 1, _image)
                    putPixel(newImage, j, i, p)
                }
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
            let x = Math.round(j / scale),
                y = Math.round(i / scale)
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
                y = Math.floor(i / scale),
                a = j / scale - x,
                b = i / scale - y
            let ratio = [
                [(1 - a) * (1 - b), a * (1 - b)],
                [(1 - a) * b, a * b]
            ]
            let rgb = [0, 0, 0]
            for (let k = 0; k <= 1; k++) {
                for (let l = 0; l <= 1; l++) {
                    let p = getPixel(x + l, y + k)
                    for (let m = 0; m < 3; m++) rgb[m] += p[m] * ratio[k][l]
                }
            }
            rgb = rgb.map(x => Math.floor(x))
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
    let top = 0,
        bot = 0
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p1 = getPixel(j, i, _image)
            let p2 = getPixel(j, i, image2)
            top += toGrayPixel(p1) * toGrayPixel(p1)
            bot += (toGrayPixel(p1) - toGrayPixel(p2)) * (toGrayPixel(p1) - toGrayPixel(p2))
        }
    }
    let ans = 10 * Math.log10(top / bot)
    update(image2, "SNR: " + ans.toString())
    $("div#filterSize").hide()
}

let down = false,
    startX = 0,
    startY = 0,
    circle = false

function ellipse(context, x, y, a, b) {
    context.save();
    var r = (a > b) ? a : b;
    var ratioX = a / r;
    var ratioY = b / r;
    context.scale(ratioX, ratioY);
    context.beginPath();
    context.arc(x / ratioX, y / ratioY, Math.abs(r), 0, 2 * Math.PI, false);
    context.closePath();
    context.restore();
    context.stroke();
}

$("#cut input").on("input", () => {
    circle = $("#cut input")[0].checked
})

function cutPrepare() {
    let canvas = $("#cut canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = image.width
    canvas.height = image.height
    ctx.putImageData(image, 0, 0)
    $("#cut input")[0].checked = false
    $("#cut input").trigger("input")
    $("#cut .row").empty()
}

function cutInit() {
    let canvas = $("#cut canvas")[0]
    let ctx = canvas.getContext("2d")

    $(canvas).on("mousedown", e => {
        down = true
        startX = e.offsetX
        startY = e.offsetY
    })

    $(canvas).on("mousemove", e => {
        if (e.offsetX < 0 || e.offsetX >= image.width || e.offsetY < 0 || e.offsetY >= image.height || !down) return
        ctx.setLineDash([10]);
        ctx.putImageData(image, 0, 0)
        if (!circle) ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY)
        else ellipse(ctx, startX + (e.offsetX - startX) / 2, startY + (e.offsetY - startY) / 2, (e.offsetX - startX) / 2, (e.offsetY - startY) / 2)
    })

    $(canvas).on("mouseup", e => {
        down = false
        ctx.putImageData(image, 0, 0)
        let newImage = new ImageData(Math.abs(e.offsetX - startX), Math.abs(e.offsetY - startY))
        let newCanvas = document.createElement("canvas")
        newCanvas.width = newImage.width
        newCanvas.height = newImage.height
        let newCtx = newCanvas.getContext("2d")

        startX = startX > e.offsetX ? e.offsetX : startX
        startY = startY > e.offsetY ? e.offsetY : startY

        for (let i = 0; i < newImage.height; i++) {
            for (let j = 0; j < newImage.width; j++) {
                if (circle) {
                    let x = j - newImage.width / 2
                    let y = i - newImage.height / 2
                    if (x * x / (newImage.width / 2) / (newImage.width / 2) + y * y / (newImage.height / 2) / (newImage.height / 2) > 1) continue
                }
                let p = getPixel(j + startX, i + startY)
                putPixel(newImage, j, i, p)
            }
        }
        newCtx.putImageData(newImage, 0, 0)
        let a = $("<div class='col'></div>")
        a.append(newCanvas)
        $("#cut .row").append(a)
    })
}

cutInit()