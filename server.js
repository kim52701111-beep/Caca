const express = require("express");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// 카카오 설정
const KAKAO_ACCESS_TOKEN = process.env.KAKAO_ACCESS_TOKEN;
const TEMPLATE_ID = "137319";


/*
 * Roblox 닉네임 → 사용자 정보
 */
async function getRobloxUser(username) {

    const response = await fetch(
        "https://users.roblox.com/v1/usernames/users",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: false
            })
        }
    );

    if (!response.ok) {
        throw new Error("Roblox 사용자 검색 실패");
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
        return null;
    }

    return data.data[0];
}


/*
 * Roblox 아바타 이미지
 */
async function getAvatar(userId) {

    const url =
        "https://thumbnails.roblox.com/v1/users/avatar" +
        "?userIds=" + userId +
        "&size=720x720" +
        "&format=Png" +
        "&isCircular=false";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Roblox 아바타 조회 실패");
    }

    const data = await response.json();

    if (
        !data.data ||
        !data.data[0] ||
        !data.data[0].imageUrl
    ) {
        return null;
    }

    return data.data[0].imageUrl;
}


/*
 * 카카오톡 나에게 메시지 보내기
 */
async function sendKakaoMessage(user, avatar) {

    const profile =
        "https://www.roblox.com/users/" +
        user.id +
        "/profile";

    const args = {
        NAME: user.name,
        IMG: avatar,
        LINK: profile,
        ID: String(user.id)
    };

    const body =
        "template_id=" +
        encodeURIComponent(TEMPLATE_ID) +

        "&template_args=" +
        encodeURIComponent(JSON.stringify(args));


    const response = await fetch(
        "https://kapi.kakao.com/v2/api/talk/memo/send",
        {
            method: "POST",

            headers: {
                "Authorization":
                    "Bearer " + KAKAO_ACCESS_TOKEN,

                "Content-Type":
                    "application/x-www-form-urlencoded;charset=utf-8"
            },

            body: body
        }
    );

    const result = await response.text();

    if (!response.ok) {
        throw new Error(
            "Kakao API 오류: " + result
        );
    }

    return result;
}


/*
 * Roblox 검색
 */
app.get("/roblox/:username", async (req, res) => {

    try {

        const username =
            decodeURIComponent(req.params.username);

        const user =
            await getRobloxUser(username);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "로블록스 사용자를 찾을 수 없습니다."
            });
        }


        const avatar =
            await getAvatar(user.id);

        if (!avatar) {

            return res.status(404).json({
                success: false,
                message: "아바타 이미지를 찾을 수 없습니다."
            });
        }


        res.json({
            success: true,

            username: user.name,

            displayName:
                user.displayName,

            userId:
                user.id,

            avatar:
                avatar,

            profile:
                "https://www.roblox.com/users/" +
                user.id +
                "/profile"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/*
 * Roblox 정보 + 카카오톡 메시지 전송
 */
app.get("/send/:username", async (req, res) => {

    try {

        if (!KAKAO_ACCESS_TOKEN) {

            return res.status(500).json({
                success: false,
                message:
                    "KAKAO_ACCESS_TOKEN 환경변수가 없습니다."
            });
        }


        const username =
            decodeURIComponent(req.params.username);


        const user =
            await getRobloxUser(username);


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "로블록스 사용자를 찾을 수 없습니다."
            });
        }


        const avatar =
            await getAvatar(user.id);


        if (!avatar) {

            return res.status(404).json({
                success: false,
                message:
                    "아바타 이미지를 찾을 수 없습니다."
            });
        }


        const result =
            await sendKakaoMessage(
                user,
                avatar
            );


        res.json({
            success: true,

            message:
                "카카오톡으로 아바타를 보냈습니다.",

            username:
                user.name,

            userId:
                user.id,

            avatar:
                avatar,

            kakao:
                result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
});


/*
 * 서버 확인
 */
app.get("/", (req, res) => {

    res.send(
        "Roblox Kakao Bot Server OK"
    );

});


app.listen(PORT, () => {

    console.log(
        "Server started on port " + PORT
    );

});
