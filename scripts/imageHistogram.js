function getHistogram(onlyGet, id) {
    let histogram = [new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0)]
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i, id)
            histogram[0][p[0]] += 1
            histogram[1][p[1]] += 1
            histogram[2][p[2]] += 1
            histogram[3][parseInt(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2])] += 1
        }
    }

    let cdf = [new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0)]

    for (let i = 0; i < histogram.length; i++) {
        cdf[i][0] = histogram[i][0]
        for (let j = 1; j < histogram[i].length; j++) {
            cdf[i][j] = histogram[i][j] + cdf[i][j - 1]
        }

        for (let j = 0; j < histogram[i].length; j++) {
            cdf[i][j] /= width * height / Math.max(...histogram[i])
        }
    }


    if (!onlyGet) {
    $("#histogram h5").text("Histogram")
    let rgb = ["red", "green", "blue", "black"]
        histogram.forEach((ele, idx) => {
            charts[idx].config.data.datasets[0].data = histogram[idx]
            charts[idx].config.data.datasets[1].data = cdf[idx]
            charts[idx].config.data.datasets[0].backgroundColor = rgb[idx]
            charts[idx].config.data.datasets[1].backgroundColor = "grey"
            charts[idx].update()
        })
    }
    $("#eqR").hide()
    $("#spR").hide()
    $(".chart2").hide()
    $(".contrast").hide()
    return [histogram, cdf]
}

function histoEqual() {
    $("#histogram h5").text("Histogram Equalization")
    let newImage = new ImageData(image.width, image.height)
    let [histogram, cdf] = getHistogram(true)
    let min = [],
        max = []
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < histogram[i].length; j++) {
            if (histogram[i][j] != 0) {
                min.push(j)
                break
            }
        }
        for (let j = histogram[i].length - 1; j >= 0; j--) {
            if (histogram[i][j] != 0) {
                max.push(j)
                break
            }
        }
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            let _p = p.map((x, idx) => {
                return Math.round((cdf[idx][x] - cdf[idx][min[idx]]) / (cdf[idx][max[idx]] - cdf[idx][min[idx]]) * 255)
            })
            putPixel(newImage, j, i, _p)
        }
    }

    $("#eqR canvas").attr("width", newImage.width)
    $("#eqR canvas").attr("height", newImage.height)
    $("#eqR canvas")[0].getContext("2d").putImageData(newImage, 0, 0)
    let [histogram2, cdf2] = getHistogram(true, newImage)

    let rgb = ["red", "green", "blue", "black"]
    histogram2.forEach((ele, idx) => {
        charts[idx].config.data.datasets[0].data = histogram2[idx]
        charts[idx].config.data.datasets[1].data = cdf2[idx]
        charts[idx].config.data.datasets[0].backgroundColor = rgb[idx]
        charts[idx].config.data.datasets[1].backgroundColor = "grey"
        charts[idx].update()
    })

    $("#eqR").show()
}

$("input#left").on("input", e => {
    $("label[for='left']").text("Left = " + $("input#left").val())
    contrast()
})

$("input#right").on("input", e => {
    $("label[for='right']").text("Right = " + $("input#right").val())
    contrast()
})

function contrast() {
    $("#histogram h5").text("Contrast streaching")
    let newImage = new ImageData(image.width, image.height)

    let l = parseFloat($("input#left").val()), r = parseFloat($("input#right").val())

    let c = (r - l) / 255

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            let _p = p.map(x => {
                return Math.floor((x - l) / c)
            })
            putPixel(newImage, j, i, _p)
        }
    }

    $("#eqR canvas").attr("width", newImage.width)
    $("#eqR canvas").attr("height", newImage.height)
    $("#eqR canvas")[0].getContext("2d").putImageData(newImage, 0, 0)
    let [histogram2, cdf2] = getHistogram(true, newImage)

    let rgb = ["red", "green", "blue", "black"]
    histogram2.forEach((ele, idx) => {
        charts[idx].config.data.datasets[0].data = histogram2[idx]
        charts[idx].config.data.datasets[1].data = cdf2[idx]
        charts[idx].config.data.datasets[0].backgroundColor = rgb[idx]
        charts[idx].config.data.datasets[1].backgroundColor = "grey"
        charts[idx].update()
    })

    $("#spR").hide()
    $(".chart2").hide()
    $("#eqR").show()
    $(".contrast").show()

}

async function histoSpec() {
    $("#histogram h5").text("Histogram Specification")
    let newImage = new ImageData(image.width, image.height)
    let [histogram, cdf] = getHistogram(true)
    await openImageForCompare()
    let [histogram2, cdf2] = getHistogram(true, image2)
    let min = [],
        max = [],
        min2 = [],
        max2 = []
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < histogram[i].length; j++) {
            if (histogram[i][j] != 0) {
                min.push(j)
                break
            }
        }
        for (let j = histogram[i].length - 1; j >= 0; j--) {
            if (histogram[i][j] != 0) {
                max.push(j)
                break
            }
        }

        for (let j = 0; j < histogram2[i].length; j++) {
            if (histogram2[i][j] != 0) {
                min2.push(j)
                break
            }
        }
        for (let j = histogram2[i].length - 1; j >= 0; j--) {
            if (histogram2[i][j] != 0) {
                max2.push(j)
                break
            }
        }
    }

    let map = [new Array(256).fill(-1), new Array(256).fill(-1), new Array(256).fill(-1)]

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 256; j++) {
            map[i][Math.round((cdf2[i][j] - cdf2[i][min2[i]]) / (cdf2[i][max2[i]] - cdf2[i][min2[i]]) * 255)] = j
        }
    }


    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 256; j++) {
            if (map[i][j] == -1) {
                if (j == 0) map[i][j] = 0
                else map[i][j] = map[i][j - 1]
            }
        }
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            let _p = p.map((x, idx) => map[idx][x])
            putPixel(newImage, j, i, _p)
        }
    }

    $("#spR canvas").attr("width", newImage.width)
    $("#spR canvas").attr("height", newImage.height)
    $("#spR canvas")[0].getContext("2d").putImageData(image, 0, 0)
    $("#spR canvas")[1].getContext("2d").putImageData(image2, 0, 0)
    $("#spR canvas")[2].getContext("2d").putImageData(newImage, 0, 0)
    let [histogram3, cdf3] = getHistogram(true, newImage)

    let rgb = ["red", "green", "blue", "black"]
    histogram.forEach((ele, idx) => {
        charts[idx].config.data.datasets[0].data = ele
        charts[idx].config.data.datasets[1].data = cdf[idx]
        charts[idx].config.data.datasets[0].backgroundColor = rgb[idx]
        charts[idx].config.data.datasets[1].backgroundColor = "grey"
        charts[idx].update()
    })

    histogram2.forEach((ele, idx) => {
        charts[idx + 4].config.data.datasets[0].data = ele
        charts[idx + 4].config.data.datasets[1].data = cdf2[idx]
        charts[idx + 4].config.data.datasets[0].backgroundColor = rgb[idx]
        charts[idx + 4].config.data.datasets[1].backgroundColor = "grey"
        charts[idx + 4].update()
    })

    histogram3.forEach((ele, idx) => {
        charts[idx + 8].config.data.datasets[0].data = ele
        charts[idx + 8].config.data.datasets[1].data = cdf3[idx]
        charts[idx + 8].config.data.datasets[0].backgroundColor = rgb[idx]
        charts[idx + 8].config.data.datasets[1].backgroundColor = "grey"
        charts[idx + 8].update()
    })

    $("#spR").show()
    $(".chart2").show()

}

function getHistogramGrey() {
    let histogram = new Array(256).fill(0)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            histogram[parseInt(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2])] += 1
        }
    }
    return histogram
}
let threshold = 128

function thresholding() {
    let newImage = new ImageData(image.width, image.height)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            let _p = new Array(3).fill(parseInt(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) >= threshold ? 255 : 0)
            putPixel(newImage, j, i, _p)
        }
    }
    let canvas = $("#thresholding canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = image.width
    canvas.height = image.height
    ctx.putImageData(newImage, 0, 0)
}


function otsu() {
    let histogram = getHistogramGrey()
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

let huffmanCode

function exploreTree(node, code) {
    if (node.val) huffmanCode[node.val] = code
    if (node.lchild) exploreTree(node.lchild, code + "0")
    if (node.rchild) exploreTree(node.rchild, code + "1")
}

function huffman() {
    let count = {}
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i)
            if (count[`${p[0]},${p[1]},${p[2]}`]) count[`${p[0]},${p[1]},${p[2]}`]++
            else count[`${p[0]},${p[1]},${p[2]}`] = 1
        }
    }

    let tree = []
    for (let i in count) {
        tree.push({
            val: i,
            freq: count[i],
            lchild: null,
            rchild: null
        })
    }

    let is8bit = tree.length <= 256

    while (tree.length > 1) {
        tree.sort((a, b) => a.freq - b.freq)
        let lchild = tree.shift(),
            rchild = tree.shift()
        tree.push({
            val: null,
            freq: lchild.freq + rchild.freq,
            lchild: lchild,
            rchild: rchild
        })
    }
    huffmanCode = {}
    exploreTree(tree[0], "")

    let original = image.width * image.height * 24,
        compressed = 0
    for (let i in count) {
        compressed += huffmanCode[i].length * count[i]
    }

    if (is8bit) alert(`未壓縮時使用 ${original / 3} bits\n壓縮後使用 ${compressed} bits\n壓縮比:${(original / 3 / compressed * 100).toFixed(2)} %`)
    else alert(`未壓縮時使用 ${original} bits\n壓縮後使用 ${compressed} bits\n壓縮比:${(original / compressed * 100).toFixed(2)} %`)
}