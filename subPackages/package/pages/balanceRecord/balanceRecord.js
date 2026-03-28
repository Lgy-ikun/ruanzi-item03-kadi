const app = getApp();

// Tab 配置：全部/收入/支出
const TABS = [
  { label: '全部', type: 'all' },
  { label: '收入', type: 'income' },
  { label: '支出', type: 'expense' }
];

Page({
  data: {
    pageType: '',           // 当前页面类型：balance/stored/coffee
    titleLabel: '',         // 页面标题描述
    money: '0.00',          // 账户余额
    canRecharge: false,     // 是否显示充值按钮
    canTransfer: false,     // 是否显示转增按钮
    tabs: TABS,             // Tab 列表
    currentTab: 'all',      // 当前选中的 Tab
    
    // ========== 【优化】本地数据缓存 ==========
    incomeList: [],   // 缓存：收入数据列表
    expenseList: [],  // 缓存：支出数据列表
    records: [],      // 最终显示在页面上的列表
    
    loading: true,            // 加载状态
    refresherTriggered: false // 下拉刷新状态
  },

  /**
   * 页面加载：根据参数初始化页面类型
   */
  onLoad(options) {
    const type = options && options.type;
    // 不同账户类型的配置映射
    const configMap = {
      balance: {
        title: '个人余额',
        titleLabel: '个人余额可用',
        canRecharge: true,
        canTransfer: false
      },
      stored: {
        title: '储值卡',
        titleLabel: '储值卡可用',
        canRecharge: true,
        canTransfer: false
      },
      coffee: {
        title: '咖啡券',
        titleLabel: '咖啡券可用',
        canRecharge: false,
        canTransfer: true
      }
    };
    const pageConfig = configMap[type];

    if (pageConfig) {
      wx.setNavigationBarTitle({ title: pageConfig.title });
      this.type = type;
      this.setData({
        pageType: type,
        titleLabel: pageConfig.titleLabel,
        canRecharge: pageConfig.canRecharge,
        canTransfer: pageConfig.canTransfer
      });
      return;
    }

    // 参数错误处理
    wx.showToast({ title: '页面参数错误', icon: 'none', duration: 1500 });
    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
        return;
      }
      wx.switchTab({ url: '/pages/home/home' });
    }, 1500);
  },

  /**
   * 页面显示：每次回到页面都刷新数据
   */
  onShow() {
    if (!this.type) {
      return;
    }
    this.refreshPage();
  },

  /**
   * 【优化】Tab 切换事件：不发请求，直接用本地数据更新显示
   */
  handleTabChange(event) {
    const { type } = event.currentTarget.dataset;
    if (!type || type === this.data.currentTab) {
      return;
    }

    // 只切换 Tab 状态，不发网络请求
    this.setData({ currentTab: type });
    this.updateDisplayRecords(type);
  },

  /**
   * 【核心】根据当前 Tab 类型，从本地缓存中更新显示列表
   * @param {string} tabType - Tab 类型：all/income/expense
   */
  updateDisplayRecords(tabType) {
    let records = [];
    const { incomeList, expenseList } = this.data;

    if (tabType === 'income') {
      // 收入：直接使用缓存的收入列表
      records = incomeList;
    } else if (tabType === 'expense') {
      // 支出：直接使用缓存的支出列表
      records = expenseList;
    } else {
      // 【核心拼接逻辑】全部：拼接收支 + 按时间倒序排列
      records = [...incomeList, ...expenseList].sort((a, b) => {
        // 时间字符串转时间戳比较，确保最新的在最上面
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });
    }

    // 更新页面显示
    this.setData({ records, loading: false });
  },

  /**
   * 下拉刷新事件
   */
  handleListRefresh() {
    if (this.data.refresherTriggered) {
      return;
    }

    this.setData({ refresherTriggered: true });

    this.refreshPage({
      refreshMoney: false,
      showLoading: false,
      stopRefresh: true
    });
  },

  /**
   * 【优化】刷新页面核心逻辑：并行请求收入和支出，不再请求“全部”接口
   */
  refreshPage(options = {}) {
    const {
      refreshMoney = true,
      showLoading = true,
      stopRefresh = false
    } = options;

    if (showLoading) {
      this.setData({ loading: true });
    }

    // 刷新账户余额
    if (refreshMoney) {
      this.fetchUserMoney();
    }

    // 【优化】Promise.all 并行请求：同时拿收入和支出，速度更快
    Promise.all([
      this.fetchRecordsRaw('income'),
      this.fetchRecordsRaw('expense')
    ]).then(([incomeList, expenseList]) => {
      // 1. 更新本地缓存
      this.setData({ incomeList, expenseList });
      // 2. 根据当前 Tab 更新显示（不切换 Tab）
      this.updateDisplayRecords(this.data.currentTab);
    }).catch(() => {
      this.setData({ loading: false });
    }).finally(() => {
      // 处理下拉刷新结束状态
      if (stopRefresh) {
        this.setData({ refresherTriggered: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 【优化】纯数据请求方法：只负责拿数据、格式化，不操作 setData
   * @param {string} tabType - 类型：income/expense
   * @returns {Promise<Array>} 格式化后的记录列表
   */
  fetchRecordsRaw(tabType) {
    return new Promise((resolve) => {
      const that = this;
      const userid = wx.getStorageSync('userid') || app.globalData.userid;

      if (!userid) {
        resolve([]);
        return;
      }

      const url = this.getRecordApiUrl(tabType, userid);

      wx.request({
        url,
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
        success(res) {
          // 兼容不同的接口返回数据结构
          const result = res && res.data ? res.data.result : null;
          const list = Array.isArray(result)
            ? result
            : (Array.isArray(result && result.list) ? result.list : Array.isArray(result && result.goods) ? result.goods : []);
          
          // 格式化每条记录
          const records = list.map((item, index) => that.normalizeRecord(item, index, tabType));
          resolve(records);
        },
        fail() {
          resolve([]);
        }
      });
    });
  },

  /**
   * 获取账户余额
   */
  fetchUserMoney() {
    const that = this;
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid;

    if (!itsid) {
      that.setData({ money: '0.00' });
      return;
    }

    const url = `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`;

    wx.request({
      url,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        const data = res && res.data ? res.data : {};
        let moneyField = data.money;

        // 根据页面类型取不同的余额字段
        if (that.type === 'stored') {
          moneyField = data.chuzhika;
        }

        if (that.type === 'coffee') {
          moneyField = data.score;
        }

        that.setData({ money: that.formatMoney(moneyField) });
      },
      fail() {
        that.setData({ money: '0.00' });
      }
    });
  },

  /**
   * 获取接口地址：根据页面类型和 Tab 类型匹配对应的接口
   */
  getRecordApiUrl(tabType, userid) {
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid;
    const baseUrl = app.globalData.AUrl;
    
    // 接口映射配置
    const apiMap = {
      balance: {
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10629&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0107&itcid=10656&itsid=${itsid}&opid=1210`
      },
      stored: {
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10659&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0107&itcid=10656&itsid=${itsid}&opid=1211`
      },
      coffee: {
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10630&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0107&itcid=10656&itsid=${itsid}&opid=1203`
      }
    };

    const typeApiMap = apiMap[this.type] || apiMap.balance;
    return typeApiMap[tabType];
  },

  /**
   * 格式化单条记录：统一 id、时间、金额格式
   */
    /**
   * 格式化单条记录：统一 id、时间、金额格式，增加类型标记用于颜色判断
   */
    normalizeRecord(item, index, tabType) {
      // 兼容多种金额字段名
      const amountSource = this.getFirstValidValue([
        item.money,
        item.amount,
        item.price,
        item.changeMoney,
        item.dan,
        item.returnscore,
        item.score,
        item.content,
        item.value,
        item.total,
        0
      ]);
      const amountNumber = this.parseNumber(amountSource);
  
      return {
        id: item.id || item.orderid || item.logid || `${tabType}-${index}`,
        time: item.time || item.addtime || item.createTime || item.createtime || item.date || '--',
        money: this.buildDisplayAmount(amountNumber, tabType, item),
        // 【新增】记录类型：income/expense，用于WXML判断颜色
        recordType: tabType
      };
    },
  /**
   * 构建显示金额：支出加负号，收入保持正数
   */
    /**
   * 构建显示金额：收入固定加+号，支出固定加-号，同时兼容颜色规则
   */
    buildDisplayAmount(amountNumber, tabType, item) {
      if (!Number.isFinite(amountNumber)) {
        return '0.00';
      }
  
      const absAmount = Math.abs(amountNumber).toFixed(2);
      // 支出：固定加-号（所有tab都生效）
      if (tabType === 'expense' || amountNumber < 0 || item.type === 'expense' || item.direction === 'out') {
        return `-${absAmount}`;
      }
      // 收入：固定加+号（所有tab都生效）
      return `+${absAmount}`;
    },

  /**
   * 格式化余额：保留两位小数
   */
  formatMoney(value) {
    const amount = this.parseNumber(value);
    if (!Number.isFinite(amount)) {
      return '0.00';
    }
    return amount.toFixed(2);
  },

  /**
   * 安全解析数字：兼容字符串、数字、空值等各种情况
   */
  parseNumber(value) {
    if (typeof value === 'string') {
      // 字符串处理：去掉逗号，提取数字部分
      const matched = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
      return matched ? Number(matched[0]) : 0;
    }

    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  },

  /**
   * 获取第一个有效值：用于兼容多种字段名
   */
  getFirstValidValue(values) {
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] !== undefined && values[i] !== null) {
        return values[i];
      }
    }
    return '';
  },

  /**
   * 跳转到充值页面
   */
  goRecharge() {
    if (!this.data.canRecharge) {
      wx.showToast({
        title: '咖啡券暂不支持充值',
        icon: 'none'
      });
      return;
    }

    const scene = this.type === 'stored' ? 'stored' : 'balance';
    wx.navigateTo({
      url: `/subPackages/package/pages/recharge-input/recharge-input?scene=${scene}`
    });
  },

  /**
   * 跳转到转增页面
   */
  goTransfer() {
    if (!this.data.canTransfer) {
      return;
    }

    wx.navigateTo({
      url: '/subPackages/package/pages/xiaofeiquan/xiaofeiquan'
    });
  }
});