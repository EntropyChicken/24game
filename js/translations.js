const TRANSLATIONS = {
    english: {
        titleScreen:{
            mainTitle: "Make 24",
            randomSetSection: "Random",
            designedSetSection: "Designed",
            duelButton: "Two-Player\nMode",
            battleButton: "Team\nBattle",
            randomSets: ["Easy", "Medium", "Hard", "Tricky", "Very Hard"],
            designedSets: ["Simple", "Interesting", "JavaScript", "CRAZY HARD"],
            getGameCountUpperText: (val) => val === 1 ? "game" : "games",
            gameCountLowerText: "won worldwide!",
        },
        level:{
            homeButton:"Home",
            skipButton:"Skip",
            undoButton:"Undo",
            hintButton:"Hint",
            solutionButton:"Solution",
            getPointsText: (val) => val === 1 ? " point" : " points"
        }
    },
    chinese: {
        titleScreen:{
            mainTitle: "24点000",
            randomSetSection: "随机挑战",
            designedSetSection: "精选关卡",
            duelButton: "双人模式",
            battleButton: "团战",
            randomSets: [
                "简单",   // Easy (Simple)
                "普通",   // Medium (Normal)
                "困难",   // Hard (Difficult)
                "进阶",   // Tricky (Advanced/Nuanced)
                "极难"    // Very Hard (Extremely Difficult)
            ],
            designedSets: [
                "极简",   // Simple
                "巧妙",   // Interesting/Clever
                "代码",   // JavaScript (Code)
                "大师级"  // CRAZY HARD (Master Level - sounds prestigious rather than torturous)
            ],
            getGameCountUpperText: (val) => "次通关",
            gameCountLowerText: "来自全球玩家!",
        },
        level: {
            homeButton: "主页",
            skipButton: "跳过",
            undoButton: "撤销",
            hintButton: "提示",
            solutionButton: "答案",
            getPointsText: (val) => " 分"
        }
    }
};