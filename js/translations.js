const TRANSLATIONS = {
    english: {
        titleScreen:{
            mainTitle: "Make 24",
            randomSetSection: "Random",
            designedSetSection: "Designed",
            duelButton: "Two-Player Mode",
            joinBattleButton: "Join Team Battle",
            hostBattleButton: "Host Team Battle",
            hostBattleChecking: "Loading...",
            randomSets: ["Easy", "Medium", "Hard", "Tricky", "Very Hard"],
            designedSets: ["Discovery", "Insight", "Theory", "JavaScript", "CRAZY HARD"],
            getGameCountUpperText: (val) => val === 1 ? "game" : "games",
            gameCountLowerText: "won worldwide!",
            historyButton: "My\nwins",
            offlineMode: "Offline mode",
            workshopButton: "My Custom Puzzles"
        },
        level:{
            homeButton:"Home",
            skipButton:"Skip",
            undoButton:"Undo",
            hintButton:"Hint",
            solutionButton:"Solution",
            getPointsText: (val) => val === 1 ? " point" : " points"
        },
        historyScreen:{
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
            clearButton: "Delete all data",
            warningText: "Are you sure you want to clear your win history? This action is permanent and cannot be undone.",
            noWinsYet: "No wins yet... go make some 24s!",
            getWinsText: (val) => val === 1 ? "win" : "wins"
        },
        battleScreen: {
            teamSelection: {
                instructions: "Create or\nChoose Team",
                inputBox: "Type custom team name...",
                join: "Join",
            },
            waitingRoom:{
                team: "Team: ",
                waiting: "...waiting to receive puzzle..."
            }
        }
    },
    chinese_simplified: {
        titleScreen:{
            mainTitle: "凑24", // 24点000
            randomSetSection: "随机挑战",
            designedSetSection: "精选关卡",
            duelButton: "双人模式",
            joinBattleButton: "加入团战",
            hostBattleButton: "发起团战",
            hostBattleChecking: "加载中...",
            randomSets: ["简单", "中等", "困难", "刁钻", "极难"],
            designedSets: ["探索", "洞察", "理论", "JS代码", "抓狂"],
            getGameCountUpperText: (val) => "次通关",
            gameCountLowerText: "来自全球玩家!",
            historyButton: "我的\n通关",
            offlineMode: "离线模式"
        },
        level: {
            homeButton: "主页",
            skipButton: "跳过",
            undoButton: "撤销",
            hintButton: "提示",
            solutionButton: "解法",
            getPointsText: (val) => " 分"
        },
        historyScreen: {
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
            clearButton: "删除所有数据",
            warningText: "您确定要清除您的获胜历史记录吗？此操作是永久性的，且无法撤销。",
            noWinsYet: "暂无获胜记录……快去凑些 24 吧！",
            getWinsText: (val) => " 次获胜"
        },
        battleScreen: {
            teamSelection: {
                instructions: "创建或\n选择队伍",
                inputBox: "输入自定义队伍名称...",
                join: "加入",
            },
            waitingRoom:{
                team: "队伍: ",
                waiting: "...正在等待接收谜题..."
            }
        }
    },
    chinese_traditional: {
        titleScreen:{
            mainTitle: "湊24", // 24點000
            randomSetSection: "隨機挑戰",
            designedSetSection: "精選關卡",
            duelButton: "雙人模式",
            joinBattleButton: "加入團戰",
            hostBattleButton: "發起團戰",
            hostBattleChecking: "載入中...",
            randomSets: ["簡單", "中等", "困難", "刁鑽", "極難"],
            designedSets: ["探索", "洞察", "理論", "JS程式碼", "抓狂"],
            getGameCountUpperText: (val) => "次通關",
            gameCountLowerText: "來自全球玩家!",
            historyButton: "我的\n通關",
            offlineMode: "離線模式"
        },
        level: {
            homeButton: "主頁",
            skipButton: "跳過",
            undoButton: "撤銷",
            hintButton: "提示",
            solutionButton: "解法",
            getPointsText: (val) => " 分"
        },
        historyScreen: {
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
            clearButton: "刪除所有資料",
            warningText: "您確定要清除您的獲勝歷史紀錄嗎？此操作是永久性的，且無法撤銷。",
            noWinsYet: "暫無獲勝記錄……快去湊些 24 吧！",
            getWinsText: (val) => " 次獲勝"
        },
        battleScreen: {
            teamSelection: {
                instructions: "建立或\n選擇隊伍",
                inputBox: "輸入自訂隊伍名稱...",
                join: "加入",
            },
            waitingRoom:{
                team: "隊伍: ",
                waiting: "...正在等待接收謎題..."
            }
        }
    }
};