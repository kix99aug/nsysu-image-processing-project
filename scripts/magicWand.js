
$("#magic input").on("input", () => {
    $("#magic label").text("Threshold = " + $("#magic input").val())
})

function magicPrepare() {
    let canvas = $("#magic canvas")[0]
    let ctx = canvas.getContext("2d")
    canvas.width = image.width
    canvas.height = image.height
    ctx.putImageData(image, 0, 0)
    $("#magic input")[0].checked = false
    $("#magic input").trigger("input")
    $("#magic .row").empty()
}

function magicInit() {
    let canvas = $("#magic canvas")[0]
    let ctx = canvas.getContext("2d")


    $(canvas).on("mouseup", e => {
        let threshold = parseFloat($("#magic input").val())
        ctx.putImageData(image, 0, 0)
        let newImage = new ImageData(width, height)
        let newCanvas = document.createElement("canvas")
        newCanvas.width = newImage.width
        newCanvas.height = newImage.height
        let newCtx = newCanvas.getContext("2d")

        let visited = []
        for (let i = 0; i < image.height; i++) {
            visited.push(new Array(image.width).fill(false))
        }

        let group = []
        let j = e.offsetX, i = e.offsetY

        let p = getPixel(j, i)

        visited[i][j] = true
        putPixel(newImage, j, i, p)
        group.push({ x: j, y: i })
        let found = true
        while (found) {
            found = false
            for (let m in group) {
                for (let k = group[m].y - 1; k <= group[m].y + 1; k++) {
                    for (let l = group[m].x - 1; l <= group[m].x + 1; l++) {
                        if (k < 0 || k >= image.height) continue
                        if (l < 0 || l >= image.width) continue
                        if (visited[k][l]) continue
                        visited[k][l] = true
                        let _p = getPixel(l, k, image)
                        if (Math.abs(toGrayPixel(_p) - toGrayPixel(p)) < threshold) {
                            found = true
                            putPixel(newImage, l, k, _p)
                            group.push({ x: l, y: k })
                        }
                    }
                }
            }
        }
        newCtx.putImageData(newImage, 0, 0)
        let a = $("<div class='col'></div>")
        a.append(newCanvas)
        $("#magic .row").append(a)
    })
}

magicInit()