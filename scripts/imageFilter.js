function toGrayPixel(p) {
    return parseInt(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2])
}

$("#xxx").click(()=>$("#filterSize input").val(3).trigger("input"))

function applyFilter(f) {
    let img = new ImageData(image.width, image.height)
    let size = f.length
    let hs = Math.floor(size / 2)
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let sum = [0, 0, 0]
            for (let k = -hs; k <= hs; k++) {
                for (let l = -hs; l <= hs; l++) {
                    let p = getPixel(j + l, i + k)
                    sum[0] += p[0] * f[k + hs][l + hs]
                    sum[1] += p[1] * f[k + hs][l + hs]
                    sum[2] += p[2] * f[k + hs][l + hs]
                }
            }
            sum = sum.map(x => Math.abs(x))
            putPixel(img, j, i, sum)
        }
    }
    return img
}

let filterSize = 3, hSize = Math.floor(filterSize / 2)
let lastFunction

function outlier() {
    lastFunction = outlier
    let img = new ImageData(image.width, image.height)
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let p = getPixel(j, i)
            let sum = [0, 0, 0]
            for (let k = -hSize; k <= hSize; k++) {
                for (let l = -hSize; l <= hSize; l++) {
                    if (k == 0 && l == 0) continue
                    let _p = getPixel(j + l, i + k)
                    sum[0] += _p[0]
                    sum[1] += _p[1]
                    sum[2] += _p[2]
                }
            }
            sum[0] /= filterSize * filterSize - 1
            sum[1] /= filterSize * filterSize - 1
            sum[2] /= filterSize * filterSize - 1
            if (Math.abs(toGrayPixel(p) - toGrayPixel(sum)) > 32) p = sum
            putPixel(img, j, i, p)
        }
    }
    update(img, "Outlier filter")
}

function avg() {
    lastFunction = avg
    let filter = []
    for (let i = 0; i < filterSize; i++) {
        let arr = []
        for (let j = 0; j < filterSize; j++) {
            arr.push(1 / filterSize / filterSize)
        }
        filter.push(arr)
    }
    update(applyFilter(filter), "Lowpass filter")
}
function medianS() {
    lastFunction = medianS
    let img = new ImageData(image.width, image.height)
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let sum = [[], [], []]
            for (let k = -hSize; k <= hSize; k++) {
                for (let l = -hSize; l <= hSize; l++) {
                    let _p = getPixel(j + l, i + k)
                    sum[0].push(_p[0])
                    sum[1].push(_p[1])
                    sum[2].push(_p[2])
                }
            }
            let p = sum.map(x => x.sort()[parseInt(x.length / 2)])
            // console.log(p,sum)
            // break
            putPixel(img, j, i, p)
        }
    }
    update(img, "Median filter (Square)")
}
function medianC() {
    lastFunction = medianC
    let img = new ImageData(image.width, image.height)
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let sum = [[], [], []]
            for (let k = -hSize; k <= hSize; k++) {
                for (let l = -hSize; l <= hSize; l++) {
                    if (k != l) continue
                    let _p = getPixel(j + l, i + k)
                    sum[0].push(_p[0])
                    sum[1].push(_p[1])
                    sum[2].push(_p[2])
                }
            }
            let p = sum.map(x => x.sort()[parseInt(x.length / 2)])
            putPixel(img, j, i, p)
        }
    }
    update(img, "Median filter (Cross)")
}

function maxmin(arr) {
    let all = []
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            for (let k = j + 1; k < arr.length; k++) {
                all.push(Math.min(arr[i], arr[j], arr[k]))
            }
        }
    }
    return Math.max(...all)
}
function minmax(arr) {
    let all = []
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            for (let k = j + 1; k < arr.length; k++) {
                all.push(Math.max(arr[i], arr[j], arr[k]))
            }
        }
    }
    return Math.min(...all)
}
function pMedian() {
    lastFunction = pMedian
    let img = new ImageData(image.width, image.height)
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let sum = [[], [], []]
            for (let k = -1; k <= 1; k++) {
                for (let l = -1; l <= 1; l++) {
                    let _p = getPixel(j + l, i + k)
                    sum[0].push(_p[0])
                    sum[1].push(_p[1])
                    sum[2].push(_p[2])
                }
            }
            sum = sum.map(x => maxmin(x) / 2 + minmax(x) / 2)
            putPixel(img, j, i, sum)
        }
    }
    update(img, "Pseudo Median filter")
    $("div#filterSize").hide()
}

function highpass() {
    lastFunction = highpass
    let filter = []
    for (let i = 0; i < filterSize; i++) {
        let arr = []
        for (let j = 0; j < filterSize; j++) {
            arr.push(-1 / filterSize / filterSize)
        }
        filter.push(arr)
    }
    filter[hSize][hSize] = 1 - 1 / filterSize / filterSize
    
    update(applyFilter(filter), "Highpass filter")
}
function ec() {
    lastFunction = ec
    let filter = []
    for (let i = 0; i < filterSize; i++) {
        let arr = []
        for (let j = 0; j < filterSize; j++) {
            arr.push(-1)
        }
        filter.push(arr)
    }
    filter[hSize][hSize] = filterSize * filterSize
    update(applyFilter(filter), "Edge Crispening filter")
}

let hbA = $("input#hbA").val()
function hb() {
    lastFunction = hb
    let filter = []
    for (let i = 0; i < filterSize; i++) {
        let arr = []
        for (let j = 0; j < filterSize; j++) {
            arr.push(-1 / filterSize / filterSize)
        }
        filter.push(arr)
    }
    filter[hSize][hSize] = hbA - 1 / filterSize / filterSize
    update(applyFilter(filter), "High-boost filter")
    $("div#hbA").show()
}

$("input#hbA").on("input", e => {
    $("label[for='hbA']").text("A of High-boost: " + $("input#hbA").val())
    hbA = parseFloat($("input#hbA").val())
    hb()
})

$("#filterSize input").on("input", e => {
    $("#filterSize label").text("Filter size: " + $("#filterSize input").val())
    filterSize = parseInt($("#filterSize input").val())
    hSize = Math.floor(filterSize / 2)
    console.log(hSize)
    lastFunction()
})

function rbF(f) {
    let img = new ImageData(image.width, image.height)
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let sum = [0, 0, 0]
            for (let k = 0; k <= 1; k++) {
                for (let l = 0; l <= 1; l++) {
                    let p = getPixel(j + l, i + k)
                    sum[0] += p[0] * f[k][l]
                    sum[1] += p[1] * f[k][l]
                    sum[2] += p[2] * f[k][l]
                }
            }
            sum = sum.map(x => Math.abs(x))
            putPixel(img, j, i, sum)
        }
    }
    console.log(img)
    return img
}

let _a, _b, _img

function rb() {
    let f = [
        [
            [1, 0],
            [0, -1]
        ],
        [
            [0, 1],
            [-1, 0],
        ]]
    let a = rbF(f[0]), b = rbF(f[1])
    let img = new ImageData(image.width, image.height)
    for (let i = 0; i < img.height; i++) {
        for (let j = 0; j < img.width; j++) {
            let p1 = getPixel(j, i, a)
            let p2 = getPixel(j, i, b)
            let p3 = [0, 0, 0]
            for (let k = 0; k < 3; k++) {
                p3[k] = Math.floor(Math.sqrt(p1[k] * p1[k] + p2[k] * p2[k]))
            }
            putPixel(img, j, i, p3)
        }
    }
    _a = a, _b = b, _img = img
    update(img, "Roberts filter")
    $("div#filterSize").hide()
}
function so() {
    let f = [
        [
            [+1, 0, -1],
            [+2, 0, -2],
            [+1, 0, -1],
        ],
        [
            [+1, +2, +1],
            [0, 0, 0],
            [-1, -2, -1],
        ]
    ]
    let a = applyFilter(f[0]), b = applyFilter(f[1])
    for (let i = 0; i < a.data.length; i += 4) {
        for (let j = i; j < i + 3; j++) {
            let ans = Math.floor(Math.sqrt(a.data[j] * a.data[j] + b.data[j] * b.data[j]))
            a.data[j] = ans
        }
    }
    update(a, "Sobel filter")
    $("div#filterSize").hide()
}
function pr() {

    let f = [
        [
            [+1, 0, -1],
            [+1, 0, -1],
            [+1, 0, -1],
        ],
        [
            [+1, +1, +1],
            [0, 0, 0],
            [-1, -1, -1],
        ]
    ]
    let a = applyFilter(f[0]), b = applyFilter(f[1])
    for (let i = 0; i < a.data.length; i += 4) {
        for (let j = i; j < i + 3; j++) {
            let ans = Math.floor(Math.sqrt(a.data[j] * a.data[j] + b.data[j] * b.data[j]))
            a.data[j] = ans
        }
    }
    update(a, "Prewitt filter")
    $("div#filterSize").hide()
}