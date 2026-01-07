/**
 * ====================================
 * 金融精英模拟器 - 核心游戏逻辑
 * ====================================
 *
 * 游戏架构说明：
 * 1. GameState: 游戏状态管理，存储所有核心数值
 * 2. CareerSystem: 职级和晋升系统
 * 3. ActionSystem: 行动和决策系统
 * 4. EventSystem: 事件触发和处理系统
 * 5. UIManager: 界面更新和交互管理
 * 6. GameLoop: 游戏主循环控制器
 */

// ====================================
// 1. 游戏配置常量
// ====================================

const CONFIG = {
    // 数值上限
    MAX_STAT: 100,
    MAX_PERFORMANCE: 200,
    MAX_RISK: 100,

    // 初始数值（优化平衡性）
    INITIAL_STATS: {
        energy: 90,          // 精力储备
        reputation: 70,      // 职业声誉
        executive: 30,       // 高层关系（从20提升到30）
        network: 25,         // 业内人脉（从20提升到25）
        ability: 50,         // 专业能力（从40提升到50）
        performance: 10,     // 业绩表现（从0提升到10，避免开局即失败）
        risk: 5,             // 风险指数 (%)
        money: 50000,        // 个人资产（元）
        teamMorale: 50       // 团队士气（从60降低到50）
    },

    // 每年行动次数（月度系统）
    ACTIONS_PER_YEAR: 12
};

// ====================================
// 2. 职级系统定义
// ====================================

const CAREER_LEVELS = [
    { name: 'Analyst', chineseName: '初级分析师', index: 0 },
    { name: 'Associate', chineseName: '高级分析师', index: 1 },
    { name: 'VP', chineseName: '副总裁', index: 2 },
    { name: 'Director', chineseName: '董事', index: 3 },
    { name: 'MD', chineseName: '董事总经理', index: 4 },
    { name: 'Partner', chineseName: '合伙人', index: 5 }
];

// 晋升条件
const PROMOTION_REQUIREMENTS = {
    'Analyst': {
        nextLevel: 'Associate',
        ability: 50,
        performance: 120,
        executive: 40
    },
    'Associate': {
        nextLevel: 'VP',
        ability: 70,
        performance: 150,
        executive: 60
    },
    'VP': {
        nextLevel: 'Director',
        ability: 80,
        performance: 180,
        executive: 70
    },
    'Director': {
        nextLevel: 'MD',
        ability: 90,
        performance: 200,
        executive: 80
    },
    'MD': {
        nextLevel: 'Partner',
        ability: 85,  // 原95，降低为85
        performance: 250,
        executive: 90
    },
    'Partner': {
        nextLevel: null  // 已达顶峰
    }
};

// ====================================
// 3. 行动定义
// ====================================

const ACTIONS = [
    {
        id: 'push_project',
        name: '推动业务落地',
        description: '出卖灵魂换取业绩，KPI才是你的上帝',
        costAP: 1,
        minLevel: 0,
        autoAdvance: true,
        effects: {
            performance: 50,
            ability: 3,
            energy: -10,
            risk: 5,
            money: 30000
        }
    },
    {
        id: 'connect_resources',
        name: '拉通资源',
        description: '请客吃饭搞好关系，这就是"资源整合"',
        costAP: 1,
        minLevel: 2,
        effects: {
            executive: 10,
            network: 5,
            money: -5000,
            energy: -5
        }
    },
    {
        id: 'rest',
        name: '偷偷摸鱼回血',
        description: '带薪拉屎，职场人最后的倔强',
        costAP: 1,
        minLevel: 0,
        autoAdvance: true,
        effects: {
            energy: 15,
            performance: -10,
            ability: -2,         // 从-3降低到-2，避免过快归零
            teamMorale: -5,      // 新增：领导摸鱼会影响团队士气
            money: 8000
        }
    },
    {
        id: 'training',
        name: '参加协会培训',
        description: '花钱买课，假装自己在进步',
        costAP: 1,
        minLevel: 0,
        autoAdvance: true,
        effects: {
            ability: 8,
            energy: -5,
            money: 5000
        }
    },
    {
        id: 'networking',
        name: '行业社交',
        description: '互换名片，假装很熟的样子',
        costAP: 1,
        minLevel: 1,
        effects: {
            network: 15,
            executive: 5,
            energy: -5,
            money: -15000
        }
    },
    {
        id: 'risk_trading',
        name: '风险交易',
        description: '赌一把，输了算公司的，赢了算你的',
        costAP: 1,
        minLevel: 2,
        effects: {
            money: 0,
            risk: 15,
            ability: 0
        }
    },
    {
        id: 'team_building',
        name: '团队建设',
        description: '花钱买笑脸，营造虚假的团结氛围',
        costAP: 1,
        minLevel: 2,
        effects: {
            teamMorale: 10,
            performance: 10,
            money: -20000
        }
    },
    {
        id: 'business_trip',
        name: '猛猛出差拜访',
        description: '机票酒店报销，名正言顺蹭吃蹭喝',
        costAP: 1,
        minLevel: 0,
        autoAdvance: true,
        effects: {
            network: 20,
            executive: 5,
            energy: -10,
            money: -20000
        }
    }
];

// ====================================
// 4. 事件库（示例事件）
// ====================================

const EVENTS = [
    {
        id: 'regulatory_storm',
        title: '监管风暴',
        description: '证监会突然来查了，你那些"创新操作"眼看就要露馅。',
        triggerCondition: (gameState) => gameState.risk > 30,
        choices: [
            {
                text: '立马认怂，从宽处理',
                effects: {
                    reputation: 10,
                    risk: -15,
                    performance: -30
                },
                narrative: '你跪得姿势标准，虽然业绩难看，但好歹保住了小命。毕竟，活得久才是硬道理。'
            },
            {
                text: '花钱消灾，找关系摆平',
                effects: {
                    executive: -10,
                    money: -50000,
                    risk: -5
                },
                narrative: '关系是硬通货，但人情债是要还的。你欠了一屁股债，今晚又要失眠了。'
            },
            {
                text: '死不承认，赌一把',
                effects: {
                    risk: 30,
                    performance: 20,
                    reputation: -25
                },
                narrative: '你选择了掩耳盗铃，把头埋进沙子里。定时炸弹已启动，祝你好运。'
            }
        ]
    },
    {
        id: 'client_crisis',
        title: '客户危机',
        description: '大客户亏得底裤都没了，扬言要曝光你还要拉横幅。',
        triggerCondition: (gameState) => gameState.performance > 50,
        choices: [
            {
                text: '自掏腰包，当冤大头',
                effects: {
                    money: -100000,
                    reputation: 15
                },
                narrative: '你用自己的血汗钱填坑，客户满意地走了。你的心在滴血，但脸上还要笑嘻嘻。'
            },
            {
                text: '甩锅给市场，我也没办法',
                effects: {
                    risk: 10,
                    executive: 5,
                    reputation: -5
                },
                narrative: '你成功地把责任推给了"大环境"和"市场波动"。客户心里骂娘，但表面上也没话说。'
            },
            {
                text: '免费咨询，用时间换空间',
                effects: {
                    energy: -20,
                    network: 10,
                    reputation: 5
                },
                narrative: '你牺牲宝贵的休息时间去安抚客户，用廉价的真诚换取了廉价的信任。'
            }
        ]
    },
    {
        id: 'internal_competition',
        title: '内斗现场',
        description: '同事挖走了你的核心客户，职场如战场，毫无情义可言。',
        triggerCondition: (gameState) => gameState.network < 60,
        choices: [
            {
                text: '找领导打小报告',
                effects: {
                    executive: 10,
                    network: -15
                },
                narrative: "领导表面支持，心里把你当告密精。你在办公室的人缘跌至谷底，以后点外卖都要小心被下毒。"
            },
            {
                text: '以牙还牙，挖他客户',
                effects: {
                    risk: 15,
                    performance: 20,
                    reputation: -10
                },
                narrative: '你选择了互相伤害，办公室气氛降至冰点。以后电梯里遇到，尴尬到想跳楼。'
            },
            {
                text: '虚伪地"合作共赢"',
                effects: {
                    performance: 10,
                    network: 5
                },
                narrative: '你们表面笑嘻嘻，心里MMP。这就是成年人的"双赢"，谁信谁傻。'
            }
        ]
    },
    {
        id: 'market_opportunity',
        title: '风口上的猪',
        description: '市场出现"机会"，可能是财富自由，也可能是韭菜的命运。',
        triggerCondition: (gameState) => gameState.money > 300000,
        choices: [
            {
                text: '梭哈！富贵险中求',
                effects: {
                    money: 150000,
                    risk: 20,
                    performance: 80
                },
                narrative: '你胆子够大，运气也够好，暂时站在了风口上。但记住，风停了会摔死猪。'
            },
            {
                text: '适度参与，保持理性',
                effects: {
                    money: 50000,
                    risk: 5,
                    performance: 30
                },
                narrative: '你选择了稳中求进，赚了不多但也不亏。平庸，但安全。'
            },
            {
                text: '冷漠旁观，错过机会',
                effects: {
                    reputation: -5
                },
                narrative: '你选择了安全，看着别人发财。你的理性值得赞赏，但嫉妒心在燃烧。'
            }
        ]
    },
    {
        id: 'noble_help',
        title: '贵人相助',
        description: '某业内大佬看中了你，愿意提携你一把。',
        triggerCondition: (gameState) => gameState.network >= 70,
        choices: [
            {
                text: '虚心接受，感恩戴德',
                effects: {
                    ability: 10,
                    reputation: 5,
                    network: 5
                },
                narrative: '大佬指点迷津，你感觉打开了新世界的大门。这就是人脉的价值！'
            },
            {
                text: '婉拒好意，独自打拼',
                effects: {
                    reputation: 10,
                    network: -5
                },
                narrative: '你选择了靠自己的实力，赢得了大佬的尊重。但错过机会的感觉有点酸。'
            },
            {
                text: '顺杆爬，直接要钱',
                effects: {
                    money: 100000,
                    reputation: -5,
                    network: 10
                },
                narrative: '你直接开口要钱，大佬愣了一下但还是给了。人脉变现成功，虽然有点尴尬。'
            }
        ]
    },
    {
        id: 'team_conflict',
        title: '团队矛盾',
        description: '你的两名核心骨干因为项目分歧闹翻了，整个团队气氛降至冰点。',
        triggerCondition: (gameState) => gameState.teamMorale < 60 && gameState.teamMorale > 20,
        choices: [
            {
                text: '各打五十大板，强制和好',
                effects: {
                    teamMorale: -5,
                    reputation: 5
                },
                narrative: '你用权威压制了矛盾，但大家心有不甘。表面上风平浪静，暗地里怨声载道。'
            },
            {
                text: '公开调解，倾听双方意见',
                effects: {
                    teamMorale: 5,
                    energy: -10,
                    reputation: 5
                },
                narrative: '你花了一整天时间调解，最终达成了妥协。累是累点，但团队关系有所改善。'
            },
            {
                text: '开除挑事的人',
                effects: {
                    teamMorale: -15,
                    reputation: -5,
                    ability: -5
                },
                narrative: '你开除了其中一个骨干，震慑了所有人。团队安静了，但士气大跌。杀鸡儆猴？不，是杀猴儆鸡。'
            }
        ]
    },
    {
        id: 'burnout_crisis',
        title: '集体倦怠',
        description: '连续加班之后，团队进入了集体倦怠期。工作效率直线下降，怨气连天。',
        triggerCondition: (gameState) => gameState.teamMorale <= 40,
        choices: [
            {
                text: '强制团建，花钱买笑脸',
                effects: {
                    teamMorale: 15,
                    money: -30000,
                    reputation: 5
                },
                narrative: '你花了三万块搞团建。大家玩得挺开心，但你知道这只是短暂的麻醉剂。'
            },
            {
                text: '画大饼，畅想未来',
                effects: {
                    teamMorale: -5,
                    reputation: -10
                },
                narrative: '你开始讲故事画大饼，但大家早已听腻了。士气不升反降，你显得很尴尬。'
            },
            {
                text: '放大家几天假',
                effects: {
                    teamMorale: 10,
                    performance: -20,
                    reputation: 10
                },
                narrative: '你给团队放了几天假。业绩受了影响，但大家回来后状态好多了。以人为本？不，是以生产力为本。'
            }
        ]
    },
    {
        id: 'boss_dissatisfaction',
        title: '领导不满',
        description: '你的顶头上司对你的表现表示不满，暗示你的位置岌岌可危。',
        triggerCondition: (gameState) => gameState.executive < 50 && gameState.executive > 20,
        choices: [
            {
                text: '立即认错，表决心',
                effects: {
                    executive: 5,
                    reputation: -5
                },
                narrative: '你认错态度诚恳，领导脸色稍有缓和。但你在团队中的形象打了折扣。'
            },
            {
                text: '主动汇报工作成果',
                effects: {
                    executive: 8,
                    energy: -10,
                    performance: 5
                },
                narrative: '你连夜准备汇报材料，展示工作成果。领导点了点头，至少暂时安全了。'
            },
            {
                text: '找更高层领导告状',
                effects: {
                    executive: -10,
                    reputation: -15,
                    risk: 5
                },
                narrative: '你越级投诉，结果两头不是人。直属上司恨死你了，更高层领导觉得你不懂规矩。作死小能手。'
            }
        ]
    },
    {
        id: 'ability_questioned',
        title: '能力质疑',
        description: '在一次重要会议上，你的专业判断被公开质疑，场面一度尴尬。',
        triggerCondition: (gameState) => gameState.ability < 45 && gameState.ability > 20,
        choices: [
            {
                text: '虚心接受，承诺改进',
                effects: {
                    ability: 5,
                    reputation: -5
                },
                narrative: '你选择了低调处理，虽然丢面子，但至少保住了职业形象。知耻而后勇？'
            },
            {
                text: '当场反驳，据理力争',
                effects: {
                    ability: -5,
                    reputation: 5,
                    executive: -5
                },
                narrative: '你争得面红耳赤，虽然赢得了口舌之争，但得罪了一片人。硬刚是要付出代价的。'
            },
            {
                text: '会后私下请教',
                effects: {
                    ability: 10,
                    energy: -5,
                    network: 5
                },
                narrative: '你选择了最稳妥的方式。既保住了面子，又学到了东西，还建立了人脉。高情商操作。'
            }
        ]
    }
];

// ====================================
// 5. 游戏状态类
// ====================================

class GameState {
    constructor() {
        // 核心数值
        this.energy = CONFIG.INITIAL_STATS.energy;
        this.reputation = CONFIG.INITIAL_STATS.reputation;
        this.executive = CONFIG.INITIAL_STATS.executive;
        this.network = CONFIG.INITIAL_STATS.network;
        this.ability = CONFIG.INITIAL_STATS.ability;
        this.performance = CONFIG.INITIAL_STATS.performance;
        this.risk = CONFIG.INITIAL_STATS.risk;
        this.money = CONFIG.INITIAL_STATS.money;
        this.teamMorale = CONFIG.INITIAL_STATS.teamMorale;  // 新增团队士气

        // 游戏进度 - 月度系统（使用实际年份）
        this.careerLevel = 0;  // 当前职级索引
        this.year = 2020;      // 实际年份（从2020年开始）
        this.month = 1;        // 当前月份 (1-12)
        this.hasAction = true; // 本月是否还有行动机会

        // 团队相关
        this.teamSize = 0;

        // 稳定发展追踪（新增胜利条件）
        this.stableYears = 0;  // 连续稳定年数

        // 游戏状态
        this.isGameOver = false;
        this.log = [];  // 游戏日志

        // 行动连续使用计数（用于消耗递增机制）
        this.actionConsecutiveCount = {};  // {actionId: count}
    }

    /**
     * 检查数值边界并限制在合理范围
     */
    clampStats() {
        this.energy = Math.max(0, Math.min(CONFIG.MAX_STAT, this.energy));
        this.reputation = Math.max(0, Math.min(CONFIG.MAX_STAT, this.reputation));
        this.executive = Math.max(0, Math.min(CONFIG.MAX_STAT, this.executive));
        this.network = Math.max(0, Math.min(CONFIG.MAX_STAT, this.network));
        this.ability = Math.max(0, Math.min(CONFIG.MAX_STAT, this.ability));
        // 注意：performance不限制下限，允许负数以触发"业绩归零"失败条件
        this.performance = Math.min(CONFIG.MAX_PERFORMANCE, this.performance);
        this.risk = Math.max(0, Math.min(CONFIG.MAX_RISK, this.risk));
    }

    /**
     * 添加日志
     */
    addLog(message) {
        this.log.push(message);
        // 保持日志最多50条
        if (this.log.length > 50) {
            this.log.shift();
        }
    }

    /**
     * 计算职业生涯长度（从2020年1月开始）
     */
    getCareerLength() {
        const startYear = 2020;
        const startMonth = 1;
        const totalMonths = (this.year - startYear) * 12 + (this.month - startMonth);
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        return { years, months };
    }

    /**
     * 获取行动的连续使用次数
     */
    getConsecutiveCount(actionId) {
        return this.actionConsecutiveCount[actionId] || 0;
    }

    /**
     * 更新行动连续使用计数
     */
    updateConsecutiveCount(actionId) {
        const count = this.getConsecutiveCount(actionId) + 1;
        this.actionConsecutiveCount[actionId] = count;

        // 重置其他行动的计数
        Object.keys(this.actionConsecutiveCount).forEach(id => {
            if (id !== actionId) {
                this.actionConsecutiveCount[id] = 0;
            }
        });

        return count;
    }

    /**
     * 计算消耗倍数（基于连续使用次数）
     * 1-2次：1.0倍
     * 3-4次：1.8倍
     * 5-6次：2.5倍
     * 7次+：3.5倍（几乎无法承受）
     */
    getCostMultiplier(actionId) {
        const count = this.getConsecutiveCount(actionId);
        if (count <= 2) return 1.0;
        if (count <= 4) return 1.8;
        if (count <= 6) return 2.5;
        return 3.5;
    }

    /**
     * 检查晋升时的日志
     */
    checkPromotion() {
        const currentLevel = CAREER_LEVELS[this.careerLevel].name;
        const requirements = PROMOTION_REQUIREMENTS[currentLevel];

        if (!requirements || !requirements.nextLevel) {
            return;  // 已达最高职级
        }

        // 检查是否满足所有硬性条件
        if (this.ability >= requirements.ability &&
            this.performance >= requirements.performance &&
            this.executive >= requirements.executive) {

            // 晋升成功
            this.careerLevel++;
            const newLevel = this.getCurrentCareerLevel();
            this.addLog(`🎉 晋升了！终于熬成了${newLevel.chineseName}！`);
            this.addLog(`（离财务自由又近了一步，离发际线又远了一寸）`);
        }
    }

    /**
     * 获取当前职级名称
     */
    getCurrentCareerLevel() {
        return CAREER_LEVELS[this.careerLevel];
    }

    /**
     * 获取当前职级的月度工资
     */
    getMonthlySalary() {
        const salaries = {
            0: 15000,    // Analyst（初级分析师）
            1: 25000,    // Associate（高级分析师）
            2: 40000,    // VP（副总裁）
            3: 60000,    // Director（董事）
            4: 80000,    // MD（董事总经理）
            5: 120000    // Partner（合伙人）
        };
        return salaries[this.careerLevel] || 15000;
    }

    /**
     * 进入下一个月
     */
    nextMonth() {
        this.month++;
        if (this.month > 12) {
            this.month = 1;
            this.year++;
            this.annualSettlement();  // 年度结算
        }
        this.hasAction = true;  // 每月有一次行动机会

        // 重置连续使用计数（新月份新的开始）
        this.actionConsecutiveCount = {};

        // 发放月度工资（基于职级）
        const monthlySalary = this.getMonthlySalary();
        this.money += monthlySalary;
        this.addLog(`💳 发放本月工资：¥${monthlySalary.toLocaleString()}`);
        this.addLog(`（出卖劳动力的价码）`);

        // 年龄增长导致精力缓慢下降
        this.energy = Math.max(0, this.energy - 1);

        // 知识更新滞后 - 改为-1（原-2）
        // 达到80后不再老化
        if (this.ability < 80) {
            this.ability = Math.max(0, this.ability - 1);
        }

        // 团队士气年度自然增长+5（仅在每年1月）
        if (this.month === 1) {
            this.teamMorale = Math.min(100, this.teamMorale + 5);
        }

        this.clampStats();
    }

    /**
     * 年度结算
     */
    annualSettlement() {
        // 根据业绩给予奖金
        const bonus = Math.floor(this.performance * 1000);
        this.money += bonus;
        this.addLog(`💰 年度结算：业绩${this.performance}，奖金¥${bonus.toLocaleString()}`);
        this.addLog(`（这就是你的青春变现）`);

        // 年度奖金发放：精力+20（新增）
        this.energy = Math.min(100, this.energy + 20);
        this.addLog('🎁 年度奖金发放：精力+20');
        this.addLog(`（短暂的回血，继续当社畜）`);

        // 业绩保留30%滚存到下一年（新增）
        const carriedPerformance = Math.floor(this.performance * 0.3);
        this.performance = carriedPerformance;
        this.addLog(`📊 业绩滚存：保留30%（${carriedPerformance}）到下一年`);

        // 检查晋升
        this.checkPromotion();

        // 检查稳定发展胜利条件
        this.checkStableDevelopment();
    }

    /**
     * 检查稳定发展胜利条件（新增）
     */
    checkStableDevelopment() {
        // 检查所有核心指标是否≥80
        const allStatsGood =
            this.energy >= 80 &&
            this.reputation >= 80 &&
            this.executive >= 80 &&
            this.network >= 80 &&
            this.ability >= 80 &&
            this.teamMorale >= 80;

        if (allStatsGood) {
            this.stableYears++;
            this.addLog(`⭐ 稳定发展年数：${this.stableYears}/5年`);
            this.addLog(`（你是传说中的不倒翁吗？）`);
        } else {
            this.stableYears = 0;  // 重置计数
        }
    }

    /**
     * 检查是否可以晋升
     */
    checkPromotion() {
        const currentLevel = CAREER_LEVELS[this.careerLevel].name;
        const requirements = PROMOTION_REQUIREMENTS[currentLevel];

        if (!requirements || !requirements.nextLevel) {
            return;  // 已达最高职级
        }

        // 检查是否满足所有硬性条件
        if (this.ability >= requirements.ability &&
            this.performance >= requirements.performance &&
            this.executive >= requirements.executive) {

            // 晋升成功
            this.careerLevel++;
            const newLevel = this.getCurrentCareerLevel();
            this.addLog(`🎉 恭喜晋升！成为${newLevel.chineseName}！`);
        }
    }

    /**
     * 检查游戏结束条件
     */
    checkGameOver() {
        // 失败条件
        if (this.energy <= 0) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '身心崩溃',
                description: '你把自己卷进了ICU。\n\n医生说你的体检报告像恐怖小说。\n\n公司表示慰问，然后迅速把你移出了钉钉群。\n\n健康诚可贵，内卷价更高。'
            };
        }

        if (this.reputation <= 0) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '社会性死亡',
                description: '你的名声臭到了大街上。\n\n行业黑名单上有你的专属位置，\n\nHR看到你的简历都直接粉碎。\n\n建议改行去卖煎饼果子。'
            };
        }

        if (this.risk >= 100) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '喜提银手镯',
                description: '你的"创新操作"被发现了。\n\n巨额罚款加上牢狱之灾，\n\n你在铁窗里反思：做人不能太金融。\n\n希望里面的伙食能比食堂好吃点。'
            };
        }

        if (this.money < -5000000) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '破产清算',
                description: '你负了500万，成功实现了财务自由。\n\n不过是负债的自由。\n\n银行和债主正在排队起诉你，\n\n建议连夜买站票跑路。'
            };
        }

        if (this.network <= 0) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '圈子边缘人',
                description: '你在业内已经没有任何人脉了。\n\n通讯录里只有推销电话和前任同事，\n\n连年会都没人邀请你。\n\n在金融圈混，没圈子等于没活路。\n\n建议转行做独立开发者，至少还有GitHub。'
            };
        }

        if (this.performance <= 0) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '绩效淘汰',
                description: '你的业绩长期垫底，最终归零。\n\nHR找你谈话，委婉地表示：\n\n"公司的天花板容纳不下你的才华。"\n\n你的工牌被收回，门禁卡失效。\n\n社畜生涯终结，外卖员生涯开启。\n\n（好歹还是送外卖，不算彻底失业）'
            };
        }

        if (this.executive <= 0) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '职场天花板',
                description: '你在领导眼里就是透明人。\n\n升职加薪永远轮不到你，\n\n重要项目没人带你，\n\n连开会坐哪都没人提醒你。\n\n你在公司就是个NPC，\n\n建议尽早寻找新的舞台。\n\n（或者学会当个快乐的混子）'
            };
        }

        if (this.ability <= 0) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '能力不足',
                description: '你的专业能力已经退化到初级水平。\n\n做出来的PPT被实习生嘲笑，\n\n写的报告错误百出，\n\n客户直接投诉要求换人。\n\n公司在考虑把你调去行政部，\n\n那里至少只需要会订咖啡。\n\n（但也别太乐观，行政也要专业的）'
            };
        }

        if (this.teamMorale <= 0) {
            return {
                isGameOver: true,
                type: 'failure',
                title: '众叛亲离',
                description: '你的团队已经彻底失去了信心。\n\n下属集体离职，只剩你一个人光杆司令，\n\nHR找你谈话问发生了什么。\n\n没人愿意为你干活，\n\n也没人愿意和你合作。\n\n孤家寡人的滋味，不好受吧？\n\n（建议反思一下管理风格）'
            };
        }

        // 胜利条件
        const currentLevelName = CAREER_LEVELS[this.careerLevel].name;

        if (currentLevelName === 'Partner') {
            const careerLength = this.getCareerLength();
            const careerText = careerLength.years > 0
                ? `${careerLength.years}年${careerLength.months}个月`
                : `${careerLength.months}个月`;

            return {
                isGameOver: true,
                type: 'victory',
                title: '上岸成功',
                description: `恭喜！经过${careerText}的社畜生涯，\n\n你终于爬到了顶层，成为了人上人。\n\n现在你可以压榨年轻人了，\n\n这就是所谓的"传承"吧？`
            };
        }

        if (this.money >= 50000000) {  // 5000万
            return {
                isGameOver: true,
                type: 'victory',
                title: '财务自由',
                description: '你攒够了5000万，决定提前退休！\n\n在最后一天，你把辞职信甩在了老板桌上。\n\n同事们的眼神充满了嫉妒和迷茫。\n\n你发了一条朋友圈："老子不干了！"\n\n然后深藏功与名。'
            };
        }

        if (this.reputation >= 90 && this.ability >= 90) {
            return {
                isGameOver: true,
                type: 'victory',
                title: '行业神话',
                description: '你成了金融圈的传说。\n\n别人提起你时都会加一句"膜拜大神"。\n\n但你心里清楚，\n\n这不过是运气好加脸皮厚的混合产物。\n\n低调，低调。'
            };
        }

        if (this.stableYears >= 5) {  // 稳定发展典范
            return {
                isGameOver: true,
                type: 'victory',
                title: '稳健大师',
                description: '你连续5年保持了所有指标在80以上！\n\n这种四平八稳的生存智慧，\n\n在混乱的金融圈简直是奇迹。\n\nHR把你当成了典型案例，\n\n"看，这就是传说中的不倒翁！"'
            };
        }

        return { isGameOver: false };
    }
}

// ====================================
// 6. UI管理器
// ====================================

class UIManager {
    constructor(gameState, controller) {
        this.gameState = gameState;
        this.controller = controller;  // 保存controller引用
    }

    /**
     * 更新所有界面元素
     */
    updateAll() {
        this.updateStats();
        this.updateGameInfo();
        this.updateActionButtons();
        this.updateLog();
    }

    /**
     * 更新核心数值显示
     */
    updateStats() {
        // 精力
        this.updateStatBar('energy', this.gameState.energy, CONFIG.MAX_STAT);

        // 声誉
        this.updateStatBar('reputation', this.gameState.reputation, CONFIG.MAX_STAT);

        // 高层关系
        this.updateStatBar('executive', this.gameState.executive, CONFIG.MAX_STAT);

        // 人脉
        this.updateStatBar('network', this.gameState.network, CONFIG.MAX_STAT);

        // 专业能力
        this.updateStatBar('ability', this.gameState.ability, CONFIG.MAX_STAT);

        // 团队士气（新增）
        this.updateStatBar('teamMorale', this.gameState.teamMorale, CONFIG.MAX_STAT);

        // 业绩
        this.updateStatBar('performance', this.gameState.performance, CONFIG.MAX_PERFORMANCE);

        // 风险
        this.updateStatBar('risk', this.gameState.risk, CONFIG.MAX_RISK, true);

        // 资产
        document.getElementById('value-money').textContent =
            `¥${this.gameState.money.toLocaleString()}`;

        // 低数值警告
        this.applyWarningStyles();
    }

    /**
     * 更新单个数值条
     */
    updateStatBar(statName, value, maxValue, isPercentage = false) {
        const bar = document.getElementById(`stat-${statName}`);
        const valueText = document.getElementById(`value-${statName}`);

        // 检查元素是否存在
        if (!bar || !valueText) {
            console.error(`找不到元素: stat-${statName} 或 value-${statName}`);
            return;
        }

        const percentage = (value / maxValue) * 100;
        bar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;

        if (isPercentage) {
            valueText.textContent = `${value}%`;
        } else {
            valueText.textContent = Math.floor(value);
        }

        // 添加动画效果
        valueText.classList.add('stat-value-update');
        setTimeout(() => {
            valueText.classList.remove('stat-value-update');
        }, 500);
    }

    /**
     * 应用低数值警告样式
     */
    applyWarningStyles() {
        const warningStats = [
            { id: 'stat-energy', value: this.gameState.energy, threshold: 20 },
            { id: 'stat-reputation', value: this.gameState.reputation, threshold: 30 }
        ];

        warningStats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (stat.value < stat.threshold) {
                element.classList.add('warning');
            } else {
                element.classList.remove('warning');
            }
        });
    }

    /**
     * 更新游戏信息（职级、时间、行动）
     */
    updateGameInfo() {
        const level = this.gameState.getCurrentCareerLevel();
        document.getElementById('career-level').textContent =
            `职级: ${level.chineseName}`;
        document.getElementById('game-time').textContent =
            `${this.gameState.year}年${this.gameState.month}月`;
        document.getElementById('action-points').textContent =
            this.gameState.hasAction ? '本月可行动' : '本月已行动';

        // 更新职业生涯长度
        const careerLength = this.gameState.getCareerLength();
        const lengthElement = document.getElementById('career-length');
        if (lengthElement) {
            lengthElement.textContent = `入行${careerLength.years}年${careerLength.months}个月`;
        }
    }

    /**
     * 更新行动按钮
     */
    updateActionButtons() {
        const actionsList = document.getElementById('actions-list');
        if (!actionsList) {
            console.error('找不到actions-list元素');
            return;
        }

        actionsList.innerHTML = '';

        const currentLevel = this.gameState.careerLevel;

        ACTIONS.forEach(action => {
            // 检查职级要求
            if (currentLevel < action.minLevel) {
                return;
            }

            // 检查是否还有行动机会
            const disabled = !this.gameState.hasAction;

            const button = document.createElement('button');
            button.className = 'action-button';
            button.disabled = disabled;

            button.innerHTML = `
                <div class="action-title">${action.name}</div>
                <div class="action-cost">
                    消耗 <span>1次月度行动</span> | ${action.description}
                </div>
            `;

            button.onclick = () => this.handleActionClick(action);

            actionsList.appendChild(button);
        });
    }

    /**
     * 处理行动点击
     */
    handleActionClick(action) {
        // 检查行动机会
        if (!this.gameState.hasAction) {
            alert('别太贪心，一个月只能做一件大事！');
            return;
        }

        // 更新连续使用计数并获取倍数
        const consecutiveCount = this.gameState.updateConsecutiveCount(action.id);
        const costMultiplier = this.gameState.getCostMultiplier(action.id);

        // 如果连续使用超过2次，显示警告
        if (consecutiveCount > 2) {
            const warnings = [
                `⚠️ 连续第${consecutiveCount}次使用"${action.name}"，消耗增加到${costMultiplier.toFixed(1)}倍！`,
                `⚠️ 重复使用"${action.name}"会越来越累，消耗已×${costMultiplier.toFixed(1)}！`,
                `⚠️ 身体吃不消了！"${action.name}"消耗×${costMultiplier.toFixed(1)}，建议换个行动`
            ];

            const warningIndex = Math.min(consecutiveCount - 3, 2);
            this.gameState.addLog(warnings[warningIndex]);

            if (consecutiveCount >= 6) {
                this.gameState.addLog(`（这样下去会进ICU的，听句劝吧）`);
            }
        }

        // 消耗本月行动机会
        this.gameState.hasAction = false;

        // 处理特殊行动效果
        if (action.id === 'risk_trading') {
            // 风险交易：成功率受专业能力影响
            const successRate = 0.5 + (this.gameState.ability * 0.003);
            const success = Math.random() < successRate;

            // 应用收益倍数
            const incomeMultiplier = Math.max(0.5, 1.5 - costMultiplier * 0.25);
            const lossMultiplier = costMultiplier;

            if (success) {
                this.gameState.money += 150000 * incomeMultiplier;
                this.gameState.ability += 5;
                this.gameState.addLog(`🎲 赌对了！成功率${(successRate * 100).toFixed(1)}%，赚了¥${(150000 * incomeMultiplier).toLocaleString()}`);
                this.gameState.addLog(`（这就是"专业能力"的价值）`);
            } else {
                this.gameState.money -= 80000 * lossMultiplier;
                this.gameState.ability -= 5;
                this.gameState.addLog(`❌ 赌输了！成功率${(successRate * 100).toFixed(1)}%，亏了¥${(80000 * lossMultiplier).toLocaleString()}`);
                this.gameState.addLog(`（市场教你做人）`);
            }
            this.gameState.risk += action.effects.risk;
        } else if (action.id === 'push_project') {
            // 推项目：团队士气加成 + 业内人脉加成
            let performanceGain = action.effects.performance;

            // 团队士气影响
            if (this.gameState.teamMorale > 80) {
                performanceGain += 10;
                this.gameState.addLog('💪 团队士气高涨，业绩加成+20%！');
                this.gameState.addLog(`（终于有人认真干活了）`);
            } else if (this.gameState.teamMorale < 40) {
                performanceGain -= 10;
                this.gameState.addLog('😓 团队士气低落，业绩打八折');
                this.gameState.addLog(`（一群咸鱼，带不动）`);
            }

            // 业内人脉影响
            if (this.gameState.network >= 80) {
                performanceGain += 15;
                this.gameState.addLog('🤝 业内人脉广泛，业绩额外+15！');
                this.gameState.addLog(`（朋友圈就是钱包圈）`);
            } else if (this.gameState.network >= 60) {
                performanceGain += 5;
                this.gameState.addLog('🤝 业内人脉不错，业绩额外+5');
                this.gameState.addLog(`（有点小面子）`);
            }

            this.applyEffects(action.effects, costMultiplier);
            this.gameState.performance = performanceGain;
            this.gameState.addLog(`📈 出卖灵魂换取业绩+${action.effects.performance}，资产+¥30,000`);
            this.gameState.addLog(`（项目提成到账，真香）`);
        } else if (action.id === 'rest') {
            // 摸鱼回血
            this.applyEffects(action.effects, costMultiplier);
            this.gameState.addLog(`🚽 带薪拉屎成功，精力+15，资产+¥8,000，专业能力-3`);
            this.gameState.addLog(`（带薪摸鱼，打工人的智慧）`);
        } else if (action.id === 'training') {
            // 专业进修
            this.applyEffects(action.effects, costMultiplier);
            this.gameState.addLog(`📚 参加协会培训，专业能力+8，资产+¥5,000`);
            this.gameState.addLog(`（公司报销学费，顺便赚点津贴）`);
        } else if (action.id === 'business_trip') {
            // 猛猛出差拜访
            this.applyEffects(action.effects, costMultiplier);
            this.gameState.addLog(`✈️ 猛猛出差拜访，人脉+20，高层关系+5，资产-¥20,000`);
            this.gameState.addLog(`（垫付差旅费，回来报销）`);
        } else if (action.autoAdvance) {
            // 其他自动推进的行动
            this.applyEffects(action.effects, costMultiplier);
            this.gameState.addLog(`✅ 执行了：${action.name}`);
        } else {
            // 不自动推进的行动（行业社交、拉通资源、风险交易、团队建设）
            this.applyEffects(action.effects, costMultiplier);
            this.gameState.addLog(`✅ 执行了：${action.name}`);
            this.gameState.addLog(`（本月还可继续行动）`);
        }

        this.gameState.clampStats();
        this.updateAll();

        // 检查游戏结束
        const result = this.gameState.checkGameOver();
        if (result.isGameOver) {
            this.showEnding(result);
            return;
        }

        // 检查是否需要自动推进到下个月
        if (action.autoAdvance) {
            setTimeout(() => {
                this.controller.endMonth(true);  // 传递true表示已执行行动
            }, 500);
        }
    }

    /**
     * 应用行动效果
     * @param {Object} effects - 行动效果对象
     * @param {number} costMultiplier - 消耗倍数（基于连续使用次数）
     */
    applyEffects(effects, costMultiplier = 1.0) {
        // 精力：消耗类效果（负值）应用倍数
        if (effects.energy) {
            if (effects.energy < 0) {
                // 消耗精力，应用倍数
                this.gameState.energy += effects.energy * costMultiplier;
            } else {
                // 恢复精力，应用反向倍数（连续使用恢复效果递减）
                const recoveryMultiplier = Math.max(0.5, 2.0 - costMultiplier);
                this.gameState.energy += effects.energy * recoveryMultiplier;
            }
        }

        // 资产：消耗类效果（负值）应用倍数
        if (effects.money) {
            if (effects.money < 0) {
                // 消耗资产，应用倍数
                this.gameState.money += effects.money * costMultiplier;
            } else {
                // 获得资产，轻微递减（但最低保持50%）
                const incomeMultiplier = Math.max(0.5, 1.5 - costMultiplier * 0.25);
                this.gameState.money += effects.money * incomeMultiplier;
            }
        }

        // 其他效果保持不变
        if (effects.reputation) this.gameState.reputation += effects.reputation;
        if (effects.executive) this.gameState.executive += effects.executive;
        if (effects.network) this.gameState.network += effects.network;
        if (effects.ability) this.gameState.ability += effects.ability;
        if (effects.performance) this.gameState.performance += effects.performance;
        if (effects.risk) this.gameState.risk += effects.risk;
        if (effects.teamMorale) this.gameState.teamMorale += effects.teamMorale;
    }

    /**
     * 更新日志显示
     */
    updateLog() {
        const logContent = document.getElementById('log-content');
        logContent.innerHTML = '';

        // 显示最后10条日志
        const recentLogs = this.gameState.log.slice(-10);
        recentLogs.forEach(log => {
            const p = document.createElement('p');
            p.className = 'log-entry';
            p.textContent = log;
            logContent.appendChild(p);
        });

        // 平滑滚动到底部，确保最新日志可见
        logContent.scrollTo({
            top: logContent.scrollHeight,
            behavior: 'smooth'
        });
    }

    /**
     * 显示事件弹窗
     */
    showEvent(eventData) {
        const modal = document.getElementById('event-modal');
        document.getElementById('event-title').textContent = eventData.title;
        document.getElementById('event-description').textContent = eventData.description;

        const choicesDiv = document.getElementById('event-choices');
        choicesDiv.innerHTML = '';

        eventData.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.onclick = () => this.handleEventChoice(eventData, choice);
            choicesDiv.appendChild(button);
        });

        modal.classList.add('active');
    }

    /**
     * 处理事件选择
     */
    handleEventChoice(eventData, choice) {
        // 应用效果
        this.applyEffects(choice.effects);

        // 添加日志
        this.gameState.addLog(`⚡ 事件处理：${choice.text}`);
        this.gameState.addLog(`💭 ${choice.narrative}`);

        // 关闭弹窗
        document.getElementById('event-modal').classList.remove('active');

        // 更新界面
        this.gameState.clampStats();
        this.updateAll();

        // 检查游戏结束
        const result = this.gameState.checkGameOver();
        if (result.isGameOver) {
            this.showEnding(result);
        }
    }

    /**
     * 显示结局
     */
    showEnding(result) {
        const modal = document.getElementById('ending-modal');
        const level = this.gameState.getCurrentCareerLevel();

        document.getElementById('ending-title').textContent =
            result.type === 'victory' ? '🎉 胜利！' : '💔 失败';

        document.getElementById('ending-description').textContent = result.description;

        // 计算从业年限
        const careerLength = this.gameState.getCareerLength();
        const careerText = careerLength.years > 0
            ? `${careerLength.years}年${careerLength.months}个月`
            : `${careerLength.months}个月`;

        document.getElementById('ending-stats').innerHTML = `
            <p><strong>从业年限：</strong>${careerText}</p>
            <p><strong>最终职级：</strong>${level.chineseName}</p>
            <p><strong>最终资产：</strong>¥${this.gameState.money.toLocaleString()}</p>
            <p><strong>专业能力：</strong>${this.gameState.ability}</p>
            <p><strong>职业声誉：</strong>${this.gameState.reputation}</p>
        `;

        modal.classList.add('active');
        this.gameState.isGameOver = true;
    }
}

// ====================================
// 7. 游戏控制器
// ====================================

class GameController {
    constructor() {
        this.gameState = new GameState();
        this.ui = new UIManager(this.gameState, this);  // 传递controller引用

        this.initializeEventListeners();
        this.startGame();
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        try {
            // 结束月份按钮
            const endBtn = document.getElementById('end-month-btn');
            if (endBtn) {
                endBtn.addEventListener('click', () => {
                    this.endMonth();
                });
            } else {
                console.error('找不到结束月份按钮');
            }

            // 重新开始按钮
            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    location.reload();
                });
            } else {
                console.error('找不到重新开始按钮');
            }
        } catch (error) {
            console.error('初始化事件监听器时出错:', error);
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.gameState.addLog('🎮 欢迎来到金融精英模拟器！');
        this.gameState.addLog('（在这里体验什么叫"人上人"的代价）');
        this.gameState.addLog('当前时间：2020年1月');
        this.gameState.addLog('（从社畜开始你的旅程）');
        this.ui.updateAll();
    }

    /**
     * 结束月份（自动推进/按部就班）
     * @param {boolean} isActionTaken - 是否已经执行了行动
     */
    endMonth(isActionTaken = false) {
        if (this.gameState.isGameOver) {
            return;
        }

        // 检查是否还有行动机会（仅按部就班时检查）
        if (!isActionTaken && this.gameState.hasAction) {
            if (!confirm('本月还没干啥大事，确定要混过去吗？')) {
                return;
            }
        }

        // 进入下一个月
        this.gameState.nextMonth();

        // 根据是否执行行动显示不同日志
        if (isActionTaken) {
            // 已经执行过行动，直接显示进入下个月
            this.gameState.addLog(`⏰ 进入${this.gameState.year}年${this.gameState.month}月`);
        } else {
            // 按部就班
            this.gameState.addLog(`⏰ 按部就班混了一个月，进入${this.gameState.year}年${this.gameState.month}月`);
            this.gameState.addLog(`（平平淡淡才是真）`);
        }

        // 检查是否触发事件
        this.tryTriggerEvent();

        // 更新界面
        this.ui.updateAll();

        // 检查游戏结束
        const result = this.gameState.checkGameOver();
        if (result.isGameOver) {
            this.ui.showEnding(result);
        }
    }

    /**
     * 尝试触发随机事件
     */
    tryTriggerEvent() {
        const currentMonth = this.gameState.month;
        let shouldTrigger = false;
        let triggerReason = '';

        // 半年度必然触发（每年6月、12月）
        if (currentMonth === 6 || currentMonth === 12) {
            shouldTrigger = true;
            triggerReason = '半年度事件';
        }
        // 季度随机触发（3月、9月，30%概率）
        else if ((currentMonth === 3 || currentMonth === 9) && Math.random() < 0.3) {
            shouldTrigger = true;
            triggerReason = '季度事件';
        }

        if (!shouldTrigger) {
            return;
        }

        // 筛选可触发的事件
        const availableEvents = EVENTS.filter(event =>
            event.triggerCondition(this.gameState)
        );

        if (availableEvents.length > 0) {
            // 随机选择一个事件
            const event = availableEvents[
                Math.floor(Math.random() * availableEvents.length)
            ];
            this.gameState.addLog(`【${this.gameState.year}年${currentMonth}月】${triggerReason}：${event.title}`);
            this.ui.showEvent(event);
        } else {
            this.gameState.addLog(`【${this.gameState.year}年${currentMonth}月】${triggerReason}：平静度过。`);
        }
    }
}

// ====================================
// 8. 游戏初始化
// ====================================

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('开始初始化游戏...');
        window.game = new GameController();
        console.log('游戏初始化成功！');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败，请查看浏览器控制台获取详细错误信息。\n\n错误信息: ' + error.message);
    }
});
