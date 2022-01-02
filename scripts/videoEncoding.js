const file = document.querySelector("input#file")
const openfile = document.querySelector("a#openfile")
const canvasLt = document.querySelector("#lt canvas")
const zoomLt = document.querySelector("canvas#zoomLt")
const ctxLt = canvasLt.getContext("2d")
const ctxZoomLt = zoomLt.getContext("2d")
const canvasRt = document.querySelector("#rt canvas")
const zoomRt = document.querySelector("canvas#zoomRt")
const ctxRt = canvasRt.getContext("2d")
const ctxZoomRt = zoomRt.getContext("2d")

let ctxLb = $("#lb > div > canvas")[0].getContext("2d")
let ctxRb = $("#rb > div > canvas")[0].getContext("2d")

let FPS = 30
const images = [], filenames = []
let frame = 0, playing
let ctx = Array.prototype.map.call($("canvas"), x => x.getContext("2d"))

file.addEventListener("change", async e => {
    let loadedFiles = file.files
    if (!loadedFiles[0]) return
    for (let _i = 0; _i < loadedFiles.length; _i++) {
        filenames.push(loadedFiles[_i].name)
        let buffer = await new Response(loadedFiles[_i]).arrayBuffer()
        let array = new Uint8Array(buffer, 8)
        let a = array.slice(0, array.length - 126)
        let b = array.slice(array.length - 126, array.length)
        // console.log(b)
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
    draw()
})

// function pauseVideo() {
//     playing = false
// }

// function playVideo() {
//     if (playing) playing = false
//     playing = true
//     requestAnimationFrame(nextFrame)
// }

// function nextFrame() {
//     if (frame == images.length - 1) frame = -1
//     ctxRb.clearRect(0, 0, 256, 256)
//     ctxLb.clearRect(0, 0, 256, 256)
//     ctxRt.clearRect(0, 0, 256, 256)
//     ctxLt.putImageData(images[++frame], 0, 0)
//     ctxZoomLt.drawImage(canvasLt, 0, 0, 8, 8, 0, 0, 8, 8)
//     if (!playing) return
//     requestAnimationFrame(nextFrame)
// }

// function previousFrame() {
//     if (frame == 0) return
//     ctxRb.clearRect(0, 0, 256, 256)
//     ctxLb.clearRect(0, 0, 256, 256)
//     ctxRt.clearRect(0, 0, 256, 256)
//     ctxLt.putImageData(images[--frame], 0, 0)
//     ctxZoomLt.drawImage(canvasLt, 0, 0, 8, 8, 0, 0, 8, 8)
// }


// function previewImages() {
//     ctxLt.putImageData(images[++frame], 0, 0)
//     ctxZoomLt.drawImage(canvasLt, 0, 0, 8, 8, 0, 0, 8, 8)
// }

function pauseVideo() {
    playing = false
}

function playVideo() {
    if (playing) {
        playing = false
        return
    }
    playing = true
    FPS = parseInt($("#fps").val())
    setTimeout(nextFrame, 1000 / FPS)
}

function nextFrame() {
    if (frame == images.length - 1) frame = -1
    frame++
    draw()
    if (!playing) return
    FPS = parseInt($("#fps").val())
    setTimeout(nextFrame, 1000 / FPS)
}

function previousFrame() {
    if (frame <= 0) {
        frame = images.length
    }
    frame--
    draw()
}

function draw() {
    $("#frame").text(`Current frame #${frame + 1}`)
    ctx[4].clearRect(0, 0, 256, 256)
    drawMotionVectorBG()
    ctx[0].putImageData(images[frame], 0, 0)
}


function compare(ref, target, pdcThreshold) {
    if ($("[name='criteria']").val() != "4") {
        let sum = 0
        for (let i = 0; i < ref.length / 4; i++) {
            switch ($("[name='criteria']").val()) {
                case "1":
                    sum += Math.abs(ref[i * 4 + 0] - target[i * 4 + 0])
                    break
                case "2":
                    sum += Math.pow(ref[i * 4 + 0] - target[i * 4 + 0], 2)
                    break
                case "3":
                    sum += Math.abs(ref[i * 4 + 0] - target[i * 4 + 0]) < pdcThreshold ? 0 : 1
                    break
            }
        }
        return sum
    } else {
        let refData = new Array(8).fill(new Array(8).fill(0))
        let targetData = new Array(8).fill(new Array(8).fill(0))

        for (let i = 0; i < 64; i++) {
            refData[Math.floor(i / 8)][i % 8] = ref[i * 4 + 0]
            targetData[Math.floor(i / 8)][i % 8] = target[i * 4 + 0]
        }

        let ans = 0

        for (let i = 0; i < 8; i++) {
            let a = 0, b = 0
            for (let j = 0; j < 8; j++) {
                a += refData[i][j]
                b += targetData[i][j]
            }
            ans += Math.abs(a - b)
        }
        
        for (let i = 0; i < 8; i++) {
            let a = 0, b = 0
            for (let j = 0; j < 8; j++) {
                a += refData[j][i]
                b += targetData[j][i]
            }
            ans += Math.abs(a - b)
        }

        return ans
    }
}

let motionVectors = []

function encode() {
    if (!images[frame + 1]) {
        let doc = window.open()
        doc.document.body.innerHTML = JSON.stringify(motionVectors)
    }
    $("#frame").text(`Current frame #${frame + 1}`)
    ctxRt.putImageData(images[frame + 1], 0, 0)
    ctxZoomRt.drawImage(canvasRt, 0, 0, 8, 8, 0, 0, 8, 8)
    let i = 0,
        j = 0
    let k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0
    let target, ref, result = []
    let threshold = 0, pdcThreshold = 0

    ctxLb.lineWidth = "1";
    ctxLb.strokeStyle = "red";
    let motionVector = []

    function b() {
        ctxLt.putImageData(images[frame], 0, 0)

        ref = ctxLt.getImageData(k, l, 8, 8)
        ctxZoomLt.putImageData(ref, 0, 0)

        ctxLt.beginPath();
        ctxLt.lineWidth = "1";
        ctxLt.strokeStyle = "red";
        ctxLt.rect(k, l, 8, 8);
        ctxLt.stroke();

        let ans = compare(ref.data, target.data, pdcThreshold)

        result.push({
            "x": k,
            "y": l,
            "ans": ans
        })

        result.sort((a, b) => a["ans"] - b["ans"])

        if (result[0]["ans"] < (threshold + delta)) {
            motionVector.push([result[0]["x"] - i, result[0]["y"] - j])
            ctxLb.beginPath();
            ctxLb.moveTo(i + 4, j + 4);
            ctxLb.lineTo(result[0]["x"] + 4, result[0]["y"] + 4);
            ctxLb.stroke();
            let temp = ctxLt.getImageData(0, 0, 256, 256)
            ctxLt.putImageData(images[frame], 0, 0)
            ctxRb.putImageData(ctxLt.getImageData(result[0]["x"], result[0]["y"], 8, 8), i, j)
            ctxLt.putImageData(temp, 0, 0)
            i += 8
            if (i >= 256) {
                j += 8
                if (j >= 256) {
                    images[frame + 1] = ctxRb.getImageData(0, 0, 256, 256)
                    motionVectors.push(motionVector)
                    nextFrame()
                    encode()
                    return
                }
                i = 0
            }
            setTimeout(a, 1)
            return
        }

        threshold *= 1.01

        while (true) {
            if (o == 0) { // 右
                k++
            } else if (o == 1) { // 下
                l++
            } else if (o == 2) { // 左
                k--
            } else if (o == 3) { // 上
                l--
            }
            m--
            if (m == 0) {
                o++
                o = o % 4
                if (o % 2 == 0) n++
                m = n
            }
            if (!(k < 0 || k > 255 || l < 0 || l > 255)) break
        }
        setTimeout(b, 1);
    }

    function a() {
        threshold = parseInt($("[name='threshold']").val())
        threshold = isNaN(threshold) ? 100 : threshold

        pdcThreshold = parseInt($("#pdcThreshold").val())
        pdcThreshold = isNaN(pdcThreshold) ? 32 : pdcThreshold

        ctxRt.putImageData(images[frame + 1], 0, 0)
        target = ctxRt.getImageData(i, j, 8, 8)
        ctxZoomRt.putImageData(target, 0, 0)

        ctxRt.beginPath();
        ctxRt.lineWidth = "1";
        ctxRt.strokeStyle = "red";
        ctxRt.rect(i, j, 8, 8);
        ctxRt.stroke();

        result = []
        delta = 0
        k = i
        l = j
        m = 1
        n = 1
        o = 0
        setTimeout(b, 1);
    }
    setTimeout(a, 1);
}


$("[name='first']").click(() => {
    playing = false
    frame = 0
    draw()
})
$("[name='previous']").click(() => {
    playing = false
    previousFrame()
})
$("[name='play']").click(playVideo)
$("[name='next']").click(() => {
    playing = false
    nextFrame()
})
$("[name='last']").click(() => {
    playing = false
    frame = images.length - 1
    draw()
})

$("[name='encode']").click(() => {
    encode()
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

function drawMotionVectorBG() {
    for (let j = 0; j < 32; j++) {
        for (let i = 0; i < 32; i++) {
            ctx[4].beginPath();
            ctx[4].arc(i * 8 + 4, j * 8 + 4, 1, 0, 2 * Math.PI);
            ctx[4].strokeStyle = "rgba(0,0,0,0.5)";
            ctx[4].fill();
            ctx[4].closePath()
        }
    }
}

$(drawMotionVectorBG)