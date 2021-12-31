const originalImages = [], images = []

let FPS = 30

let videoData

let ctx = Array.prototype.map.call($("canvas"), x => x.getContext("2d"))

$("#file1").on("change", async function () {
    let loadedFiles = $("#file1")[0].files
    if (!loadedFiles[0]) return
    for (let _i = 0; _i < loadedFiles.length; _i++) {
        let buffer = await new Response(loadedFiles[_i]).arrayBuffer()
        let array = new Uint8Array(buffer, 8)
        let a = array.slice(0, array.length - 126)
        let b = array.slice(array.length - 126, array.length)
        let image = new ImageData(256, 256)
        let data = image.data
        for (let i = 0; i < a.length; i++) {
            data[i * 4 + 0] = a[i]
            data[i * 4 + 1] = a[i]
            data[i * 4 + 2] = a[i]
            data[i * 4 + 3] = 255
        }
        originalImages.push(image)
    }
    ctx[0].putImageData(originalImages[0], 0, 0)
    $("#file2").on("change", async function () {
        let file = $(this)[0].files[0]
        let data = await (new Response(file).json())
        images.push(originalImages[0])
        videoData = data
        decode()
        draw()
    })
    $("#file2").click()
})



let frame = 0, playing

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

ctx[2].fillStyle = "rgba(0,0,0,0.5)";


function draw() {
    $("#frame").text(`Current frame #${frame+1}`)
    ctx[2].clearRect(0, 0, 256, 256)
    drawMotionVectorBG()
    ctx[1].clearRect(0, 0, 256, 256)
    ctx[0].putImageData(images[frame], 0, 0)
    ctx[1].putImageData(originalImages[frame], 0, 0)

    if (frame != 0) {
        for (let j = 0; j < 32; j++) {
            for (let i = 0; i < 32; i++) {
                ctx[2].beginPath();
                ctx[2].moveTo(i * 8 + 4, j * 8 + 4);
                ctx[2].lineTo(i * 8 + videoData["motionVectors"][frame - 1][i + j * 32][0] + 4, j * 8 + videoData["motionVectors"][frame - 1][i + j * 32][1] + 4);
                ctx[2].strokeStyle = "red";
                ctx[2].stroke();
                ctx[2].closePath()
            }
        }
        chart.config.data.datasets[0].backgroundColor = []
        for (let a = 1; a < images.length; a++) {
            if (a == frame) chart.config.data.datasets[0].backgroundColor.push('purple')
            else chart.config.data.datasets[0].backgroundColor.push('pink')
        }
        chart.update()
    } else {
        chart.config.data.datasets[0].backgroundColor = []
        for (let a = 1; a < images.length; a++) {
            chart.config.data.datasets[0].backgroundColor.push('pink')
        }
        chart.update()
    }
}

function psnr(ref, target) {
    let mse = 0
    for (let i = 0; i < ref.data.length / 4; i++) {
        mse += Math.pow(ref.data[i * 4 + 0] - target.data[i * 4 + 0], 2)
    }
    mse /= 256 * 256
    return 10 * Math.log10(255 * 255 / mse)
}
let chartData = [], chartLabel = [], backgroundColor = [], chart

function decode() {
    console.log("decode")
    for (let a = 0; a < videoData["motionVectors"].length; a++) {
        for (let j = 0; j < 32; j++) {
            for (let i = 0; i < 32; i++) {
                let ref = ctx[0].getImageData(i * 8 + videoData["motionVectors"][a][i + j * 32][0], j * 8 + videoData["motionVectors"][a][i + j * 32][1], 8, 8)
                ctx[1].putImageData(ref, i * 8, j * 8)
            }
        }
        images.push(ctx[1].getImageData(0, 0, 256, 256))
        ctx[0].putImageData(images[images.length - 1], 0, 0)
    }
    ctx[0].putImageData(images[0], 0, 0)
    ctx[1].putImageData(originalImages[0], 0, 0)


    for (let a = 1; a < images.length; a++) {
        chartData.push(psnr(images[a], originalImages[a]))
        chartLabel.push(a + 1)
        backgroundColor.push('pink')
    }

    chart.config.data.datasets[0].data = chartData
    chart.config.data.labels = chartLabel
    chart.config.data.datasets[0].backgroundColor = backgroundColor
    chart.update()
}

chart = new Chart(ctx[3], {
    type: 'line',
    data: {
        labels: chartLabel,
        datasets: [{
            data: chartData,
            backgroundColor: backgroundColor,
            fill: false,
            borderColor: 'rgba(75, 192, 192,0.3)',
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

$("#openfile").click(e => {
    $("#file1").click()
})

$(document).on("keydown", e => {
    if (e.key == 'o' && e.ctrlKey) {
        e.preventDefault()
        $("#openfile").click()
    }
})

function drawMotionVectorBG() {
    for (let j = 0; j < 32; j++) {
        for (let i = 0; i < 32; i++) {
            ctx[2].beginPath();
            ctx[2].arc(i * 8 + 4, j * 8 + 4, 1, 0, 2 * Math.PI);
            ctx[2].strokeStyle = "rgba(0,0,0,0.5)";
            ctx[2].fill();
            ctx[2].closePath()
        }
    }
}

$(drawMotionVectorBG)