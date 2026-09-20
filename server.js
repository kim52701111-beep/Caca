const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("🤖 PremiumBot 서버 정상 작동 중!");
});

// MessengerBot에서 데이터를 받는 주소
app.post("/api/event", (req, res) => {
    console.log("===== MessengerBot 데이터 =====");
    console.log(JSON.stringify(req.body, null, 2));

    res.json({
        success: true,
        message: "데이터를 정상적으로 받았습니다."
    });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("서버 실행 완료 : " + PORT);
});
