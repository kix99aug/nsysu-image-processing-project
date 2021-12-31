function getHistogram(onlyGet, id) {
    let histogram = [new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0)]
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let p = getPixel(j, i, id)
            histogram[0][p[0]] += 1
            histogram[1][p[1]] += 1
            histogram[2][p[2]] += 1
            histogram[3][parseInt( 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2])] += 1
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
        let rgb = ["red", "green", "blue", "black"]
        histogram.forEach((ele, idx) => {
            charts[idx].config.data.datasets[0].data = histogram[idx]
            charts[idx].config.data.datasets[1].data = cdf[idx]
            charts[idx].config.data.datasets[0].backgroundColor = rgb[idx]
            charts[idx].config.data.datasets[1].backgroundColor = "grey"
            charts[idx].update()
        })
        $("#eqR").hide()
    }
    return [histogram, cdf]
}

function histoEqual() {
    let newImage = new ImageData(image.width, image.height)
    let [histogram, cdf] = getHistogram(true)
    let min = [], max = []
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