function getRandomColor() {
    return `rgb(${Math.random() * 128 + 128},${Math.random() * 128 + 128},${Math.random() * 128 + 128})`;
}

let balls = []

function ballPrepare() {
    let canvas = document.querySelector("canvas#bouncingBall")
    let ctx = canvas.getContext("2d")

    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight

    function move() {
        for (let i in balls) {
            balls[i].x += Math.sin(balls[i].a / 180 * Math.PI) * balls[i].v
            balls[i].y += Math.cos(balls[i].a / 180 * Math.PI) * balls[i].v
            if (balls[i].x <= balls[i].r) {
                balls[i].x = balls[i].r
                balls[i].a = 360 - balls[i].a
                balls[i].v *= 1.01
            }
            if (balls[i].y <= balls[i].r) {
                balls[i].y = balls[i].r
                balls[i].a = 180 - balls[i].a
                balls[i].v *= 1.01
            }
            if (balls[i].x + balls[i].r >= canvas.width) {
                balls[i].x = canvas.width - balls[i].r
                balls[i].a = 360 - balls[i].a
                balls[i].v *= 1.01
            }
            if (balls[i].y + balls[i].r >= canvas.height) {
                balls[i].y = canvas.height - balls[i].r
                balls[i].a = 180 - balls[i].a
                balls[i].v *= 1.01
            }
        }

        for (let i in balls) {
            for (let j in balls) {
                if (i == j) continue
                let d = Math.sqrt((balls[i].x - balls[j].x) * (balls[i].x - balls[j].x) + (balls[i].y - balls[j].y) * (balls[i].y - balls[j].y))
                if (d <= balls[i].r + balls[j].r) {
                    if (balls[i].x > balls[j].x) {
                        balls[i].a = Math.random() * 180
                        balls[j].a = Math.random() * 180 + 180
                    } else {
                        balls[i].a = Math.random() * 180 + 180
                        balls[j].a = Math.random() * 180
                    }
                    let mv1 = balls[i].v * balls[i].r,
                        mv2 = balls[j].v * balls[j].r
                    balls[i].v = mv2 / balls[i].r
                    balls[j].v = mv1 / balls[j].r
                    balls[i].x += Math.sin(balls[i].a / 180 * Math.PI) * balls[i].v
                    balls[i].y += Math.cos(balls[i].a / 180 * Math.PI) * balls[i].v
                    balls[j].x += Math.sin(balls[j].a / 180 * Math.PI) * balls[j].v
                    balls[j].y += Math.cos(balls[j].a / 180 * Math.PI) * balls[j].v
                }
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (let i in balls) {
            ctx.fillStyle = balls[i].c
            ctx.beginPath()
            ctx.arc(balls[i].x, balls[i].y, balls[i].r, 0, Math.PI * 2)
            ctx.fill()
        }
        requestAnimationFrame(draw)
    }
    setInterval(move, 1)
    requestAnimationFrame(draw)
    document.addEventListener("keypress", e => {
        // console.log(e)
        if (e.code == "Space") randomBall()
        if (e.code == "KeyF") randomBall(true)
    })
}

function randomBall(extraFast) {
    let r = Math.random() * 30 + 10
    let ball = {
        x: Math.random() * (document.querySelector("canvas#bouncingBall").width - r),
        y: Math.random() * (document.querySelector("canvas#bouncingBall").height - r),
        r: r,
        a: Math.random() * 360,
        v: extraFast ? 10 : (10 + Math.random() * 30) / r,
        c: getRandomColor()
    }
    balls.push(ball)
}

function ballInit() {
    balls = []
    for (let i = 0; i < 5; i++) randomBall()
}

ballInit()
ballPrepare()