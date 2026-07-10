const TRANSLATIONS = {
    english: {
        titleScreen:{
            mainTitle: "Make 24",
            randomSetSection: "Random",
            designedSetSection: "Designed",
            duelButton: "Two-Player Mode",
            battleButton: "Team Battle",
            randomSets: ["Easy", "Medium", "Hard", "Tricky", "Very Hard"],
            designedSets: ["Discovery", "Insight", "Theory", "JavaScript", "Crazy Hard"],
            getGameCountUpperText: (val) => val === 1 ? "game" : "games",
            gameCountLowerText: "won worldwide!",
            historyButton: "My\nwins"
        },
        level:{
            homeButton:"Home",
            skipButton:"Skip",
            undoButton:"Undo",
            hintButton:"Hint",
            solutionButton:"Solution",
            getPointsText: (val) => val === 1 ? " point" : " points"
        },
        history:{
            screenToMode:{
                game:"solo",
                duel:"two-player",
                battle:"team battle"
            },
            prevButton: "prev",
            nextButton: "next",
            copyButton: "copy",
            copyButtonSucceeded: "copied!",
            copyButtonFailed: "failed",
            getWinsText: (val) => val === 1 ? " win" : " wins"
        },
    },
    chinese_simplified: {
        titleScreen:{
            mainTitle: "24点000",
            randomSetSection: "随机挑战",
            designedSetSection: "精选关卡",
            duelButton: "双人模式",
            battleButton: "团战",
            randomSets: ["简单", "中等", "困难", "刁钻", "极难"],
            designedSets: ["探索", "洞察", "理论", "JS代码", "抓狂"],
            getGameCountUpperText: (val) => "次通关",
            gameCountLowerText: "来自全球玩家!",
            historyButton: "我的\n通关"
        },
        level: {
            homeButton: "主页",
            skipButton: "跳过",
            undoButton: "撤销",
            hintButton: "提示",
            solutionButton: "解法",
            getPointsText: (val) => " 分"
        },
        history: {
            screenToMode: {
                game: "单人模式",
                duel: "双人模式",
                battle: "团队战"
            },
            prevButton: "上一页",
            nextButton: "下一页",
            copyButton: "复制",
            copyButtonSucceeded: "已复制！",
            copyButtonFailed: "失败",
            getWinsText: (val) => " 次获胜"
        }
    },
    chinese_traditional: {
        titleScreen:{
            mainTitle: "24點000",
            randomSetSection: "隨機挑戰",
            designedSetSection: "精選關卡",
            duelButton: "雙人模式",
            battleButton: "團戰",
            randomSets: ["簡單", "中等", "困難", "刁鑽", "極難"],
            designedSets: ["探索", "洞察", "理論", "JS程式碼", "抓狂"],
            getGameCountUpperText: (val) => "次通關",
            gameCountLowerText: "來自全球玩家!",
            historyButton: "我的\n通關"
        },
        level: {
            homeButton: "主頁",
            skipButton: "跳過",
            undoButton: "撤銷",
            hintButton: "提示",
            solutionButton: "解法",
            getPointsText: (val) => " 分"
        },
        history: {
            screenToMode: {
                game: "單人模式",
                duel: "雙人模式",
                battle: "團隊戰"
            },
            prevButton: "上一頁",
            nextButton: "下一頁",
            copyButton: "複製",
            copyButtonSucceeded: "已複製！",
            copyButtonFailed: "失敗",
            getWinsText: (val) => " 次獲勝"
        }
    }
};