function getPixel(x, y, id) {
    let _image = id
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

function getPixelG(x, y, id) {
    let _image = id
    if (x >= _image.width) x = _image.width - 1
    if (y >= _image.height) y = _image.height - 1
    if (x < 0) x = 0
    if (y < 0) y = 0
    return _image.data[(y * _image.width + x) * 4]
}

function putPixelG(id, x, y, p) {
    id.data[(y * id.width + x) * 4 + 0] = p
    id.data[(y * id.width + x) * 4 + 1] = p
    id.data[(y * id.width + x) * 4 + 2] = p
    id.data[(y * id.width + x) * 4 + 3] = 255
}

function getHistogramGrey(image) {
    let histogram = new Array(256).fill(0)
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i, image)
            histogram[parseInt(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2])] += 1
        }
    }
    return histogram
}

function thresholding(image) {
    let newImage = new ImageData(image.width, image.height)
    let threshold = otsu(image)
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            let p = getPixel(j, i, image)
            let _p = new Array(3).fill(parseInt(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) >= threshold ? 255 : 0)
            putPixel(newImage, j, i, _p)
        }
    }
    return newImage
}

function otsu(image) {
    let histogram = getHistogramGrey(image)
    let total = image.width * image.height
    let sum = 0;
    for (let i = 1; i < 256; ++i)
        sum += i * histogram[i];
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let mB;
    let mF;
    let max = 0.0;
    let between = 0.0;
    let threshold1 = 0.0;
    let threshold2 = 0.0;
    for (let i = 0; i < 256; ++i) {
        wB += histogram[i];
        if (wB == 0)
            continue;
        wF = total - wB;
        if (wF == 0)
            break;
        sumB += i * histogram[i];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * (mB - mF) * (mB - mF);
        if (between >= max) {
            threshold1 = i;
            if (between > max) {
                threshold2 = i;
            }
            max = between;
        }
    }
    return (threshold1 + threshold2) / 2.0;
}

async function findItem(image) {

    let newImage = new ImageData(image.width, image.height)
    newImage.data.set(image.data)
    let visited = [], idx = 0
    for (let i = 0; i < image.height; i++) {
        visited.push(new Array(image.width).fill(false))
    }

    let found

    let group = [[]]

    for (let i = 0; i < newImage.height; i++) {
        for (let j = 0; j < newImage.width; j++) {
            if (visited[i][j]) continue
            visited[i][j] = true
            if (getPixelG(j, i, image) == 0) continue
            if (!group[idx]) group.push([])
            group[idx].push({ x: j, y: i })
            found = true
            while (found) {
                found = false
                for (let m in group[idx]) {
                    for (let k = group[idx][m].y - 1; k <= group[idx][m].y + 1; k++) {
                        for (let l = group[idx][m].x - 1; l <= group[idx][m].x + 1; l++) {
                            if (k < 0 || k >= image.height) continue
                            if (l < 0 || l >= image.width) continue
                            if (visited[k][l]) continue
                            visited[k][l] = true
                            if (getPixelG(l, k, image) == 255) {
                                found = true
                                group[idx].push({ x: l, y: k })
                            }
                        }
                    }
                }
            }
            idx++
        }
    }

    let xmin = [], xmax = [], ymin = [], ymax = []

    for (let i in group) {
        let color = [Math.floor(Math.random() * 128) + 128, Math.floor(Math.random() * 128) + 128, Math.floor(Math.random() * 128) + 128]
        xmin.push(Math.min(...group[i].map(x => x.x)))
        xmax.push(Math.max(...group[i].map(x => x.x)))
        ymin.push(Math.min(...group[i].map(x => x.y)))
        ymax.push(Math.max(...group[i].map(x => x.y)))
        for (let j in group[i]) {
            putPixel(newImage, group[i][j].x, group[i][j].y, color)
        }
        // for (let j = xmin; j <= xmax; j++) {
        //     putPixel(newImage, j, ymin, [255, 255, 255])
        // }
        // for (let j = xmin; j <= xmax; j++) {
        //     putPixel(newImage, j, ymax, [255, 255, 255])
        // }
        // for (let j = ymin; j <= ymax; j++) {
        //     putPixel(newImage, xmin, j, [255, 255, 255])
        // }
        // for (let j = ymin; j <= ymax; j++) {
        //     putPixel(newImage, xmax, j, [255, 255, 255])
        // }
    }

    return [newImage, group.length, xmin, xmax, ymin, ymax]
}

async function init() {
    let canvas = $("canvas")
    let ctx = canvas[0].getContext("2d")

    let img = $("<img />")
    img.attr("src", "./images/bmp/Test Pattern.bmp")
    img.on("load", async e => {
        let width = img[0].width
        let height = img[0].height
        const scale = 0.4
        canvas.attr("width", width)
        canvas.attr("height", height)
        ctx.drawImage(img[0], 0, 0, width, height)
        let image = ctx.getImageData(0, 0, width, height)
        width = Math.floor(width * scale),
            height = Math.floor(height * scale)
        let newImage = new ImageData(width, height)
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let x = Math.floor(j / scale),
                    y = Math.floor(i / scale)
                let pixel = getPixel(x, y, image)
                newImage.data[(i * width + j) * 4 + 0] = pixel[0]
                newImage.data[(i * width + j) * 4 + 1] = pixel[1]
                newImage.data[(i * width + j) * 4 + 2] = pixel[2]
                newImage.data[(i * width + j) * 4 + 3] = 255
            }
        }
        canvas.attr("width", width)
        canvas.attr("height", height)
        ctx.putImageData(newImage, 0, 0)

        $("#row1").append($(`<div style='display:block;text-align:center'>Original image</div>`))

        function newCanvas(image,f) {
            canvas = $("<canvas></canvas>")
            ctx = canvas[0].getContext("2d")
            canvas.attr("width", image.width)
            canvas.attr("height", image.height)
            ctx.putImageData(image, 0, 0)
            if(!f) $("#row1").append(canvas)
            return canvas
        }

        let image2 = thresholding(newImage)
        newCanvas(image2)
        $("#row1").append($(`<div style='display:block;text-align:center'>Otsu image</div>`))

        let [image3, items, xmin, xmax, ymin, ymax] = await findItem(image2)

        // newCanvas(image3)

        let _c = newCanvas(image3)[0]
        $("#row1").append($(`<div id='a' style='display:block;text-align:center'>Find objects</div><hr>`))
        let c = _c.getContext("2d")
        c.setLineDash([3]);
        c.strokeStyle = "white"
        let images = []
        for (let i = 0; i < items; i++) {
            images.push(c.getImageData(xmin[i], ymin[i], xmax[i] - xmin[i], ymax[i] - ymin[i]))
            c.strokeRect(xmin[i], ymin[i], xmax[i] - xmin[i], ymax[i] - ymin[i])
        }

        circles = []

        let row = $("#row2")

        for (let i in images) {
            let col = $("<div class='col-4 d-flex align-items-center justify-content-around'></div>")
            row.append(col)
            _c = newCanvas(images[i],true)
            str = ""
            str += `Width: ${xmax[i] - xmin[i]}`
            str += ` Height: ${ymax[i] - ymin[i]}`
            let count = 0
            for (let j = 0; j < images[i].height; j++) {
                for (let k = 0; k < images[i].width; k++) {
                    if (getPixelG(k, j, images[i]) != 0) count++
                }
            }

            str += ` Area: ${count}`
            if ((xmax[i] - xmin[i]) * 0.95 < (ymax[i] - ymin[i]) && (ymax[i] - ymin[i]) < (xmax[i] - xmin[i]) * 1.05) {
                if ((xmax[i] - xmin[i]) * (ymax[i] - ymin[i]) * 0.95 < count && count < (xmax[i] - xmin[i]) * (ymax[i] - ymin[i]) * 1.05) {
                    str += ` Shape: Square`
                } else {
                    str += ` Shape: Circle`
                    circles.push({ x: (xmax[i] + xmin[i]) / 2, y: (ymax[i] + ymin[i]) / 2 })
                }
            } else {
                if ((xmax[i] - xmin[i]) * (ymax[i] - ymin[i]) * 0.95 < count && count < (xmax[i] - xmin[i]) * (ymax[i] - ymin[i]) * 1.05) {
                    str += ` Shape: Rectangle`
                } else str += ` Shape: Other`
            }
            col.append(_c)
            _c.after(`<div style='display:block;text-align:center'>${str}</div>`)
        }

        $("#a").after($(`<hr><div id="b" style='display:block;text-align:center'>Angle</div>`))
        canvas = $("<canvas></canvas>")
        canvas.attr("width", image3.width)
        canvas.attr("height", image3.height)
        _c = canvas[0]
        c = _c.getContext("2d")
        c.putImageData(image3, 0, 0)

        console.log(circles)
        let _xmin = 0, _xmax = 0, _ymin = 0, _ymax = 0
        for (let i in circles) {
            if (circles[i].x < circles[_xmin].x) _xmin = i
            if (circles[i].x > circles[_xmax].x) _xmax = i
            if (circles[i].y < circles[_ymin].y) _ymin = i
            if (circles[i].y > circles[_ymax].y) _ymax = i
        }

        console.log(_xmin, _xmax, _ymin, _ymax)

        c.strokeStyle = "red"
        c.lineWidth = "3"

        c.beginPath()
        c.moveTo(circles[_ymax].x, circles[_ymax].y)
        c.lineTo(circles[_ymin].x, circles[_ymin].y)
        c.stroke()
        c.closePath()


        c.beginPath()
        c.moveTo(circles[_xmax].x, circles[_xmax].y)
        c.lineTo(circles[_xmin].x, circles[_xmin].y)
        c.stroke()
        c.closePath()

        $("#b").after(canvas)
        canvas.after($(`<div style='margin-bottom:20px'></div>`))
        canvas.after($(`<div style='display:block;text-align:center'>Vertical: ${(Math.atan(Math.abs((circles[_xmax].y - circles[_xmin].y) / (circles[_xmax].x - circles[_xmin].x))) / Math.PI * 180).toFixed(2)}⁰</div>`))
        canvas.after($(`<div style='display:block;text-align:center'>Horizontal: ${(Math.atan(Math.abs((circles[_ymax].y - circles[_ymin].y) / (circles[_ymax].x - circles[_ymin].x))) / Math.PI * 180).toFixed(2)}⁰</div>`))
    })
}

init()