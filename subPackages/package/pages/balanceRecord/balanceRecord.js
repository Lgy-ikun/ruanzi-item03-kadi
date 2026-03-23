const app = getApp();

const TABS = [
  { label: '全部', type: 'all' },
  { label: '收入', type: 'income' },
  { label: '支出', type: 'expense' }
];

Page({
  data: {
    pageType: '',
    titleLabel: '',
    money: '0.00',
    canRecharge: false,
    canTransfer: false,
    tabs: TABS,
    currentTab: 'all',
    records: [],
    loading: true,
    refresherTriggered: false
  },

  onLoad(options) {
    const type = options && options.type;
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

  onShow() {
    if (!this.type) {
      return;
    }
    this.refreshPage();
  },

  handleTabChange(event) {
    const { type } = event.currentTarget.dataset;
    if (!type || type === this.data.currentTab) {
      return;
    }

    this.setData({
      currentTab: type,
      records: [],
      loading: true
    });

    this.fetchRecords(type);
  },

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

  refreshPage(options = {}) {
    const {
      refreshMoney = true,
      showLoading = true,
      stopRefresh = false
    } = options;

    if (showLoading) {
      this.setData({ loading: true });
    }

    if (refreshMoney) {
      this.fetchUserMoney();
    }

    this.fetchRecords(this.data.currentTab, stopRefresh);
  },

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

  fetchRecords(tabType, stopRefresh = false) {
    const that = this;
    const userid = wx.getStorageSync('userid') || app.globalData.userid;
    // 切换 tab 太快时，只保留最后一次请求结果
    const requestId = (this.recordsRequestId || 0) + 1;
    this.recordsRequestId = requestId;

    if (!userid) {
      if (requestId !== this.recordsRequestId) {
        return;
      }

      that.setData({
        records: [],
        loading: false,
        refresherTriggered: false
      });

      if (stopRefresh) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    const url = this.getRecordApiUrl(tabType, userid);

    wx.request({
      url,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        if (requestId !== that.recordsRequestId) {
          return;
        }

        const result = res && res.data ? res.data.result : null;
        const list = Array.isArray(result)
          ? result
          : (Array.isArray(result && result.list) ? result.list : []);
          console.log('list', list);
        const records = list.map((item, index) => that.normalizeRecord(item, index, tabType));
        console.log('records', records);
        that.setData({
          records,
          loading: false
        });
      },
      fail() {
        if (requestId !== that.recordsRequestId) {
          return;
        }

        that.setData({
          records: [],
          loading: false
        });
      },
      complete() {
        if (requestId !== that.recordsRequestId || !stopRefresh) {
          return;
        }

        that.setData({ refresherTriggered: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  getRecordApiUrl(tabType, userid) {
    const baseUrl = app.globalData.AUrl;
    const apiMap = {
      balance: {
        all: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10630&userid=${userid}`,
        // income是正确的充值记录接口
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10629&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10631&userid=${userid}`
      },
      stored: {
        all: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10632&userid=${userid}`,
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10629&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10633&userid=${userid}`
      },
      coffee: {
        all: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10630&userid=${userid}`,
        // income是正确的充值记录接口
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10643&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10633&userid=${userid}`
      }
    };

    const typeApiMap = apiMap[this.type] || apiMap.balance;
    return typeApiMap[tabType] || typeApiMap.all;
  },

  normalizeRecord(item, index, tabType) {
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
      0
    ]);
    const amountNumber = this.parseNumber(amountSource);

    return {
      id: item.id || item.orderid || item.logid || `${tabType}-${index}`,
      time: item.time || item.addtime || item.createTime || item.createtime || item.date || '--',
      money: this.buildDisplayAmount(amountNumber, tabType, item)
    };
  },

  buildDisplayAmount(amountNumber, tabType, item) {
    if (!Number.isFinite(amountNumber)) {
      return '0.00';
    }

    if (tabType === 'expense') {
      return `-${Math.abs(amountNumber).toFixed(2)}`;
    }

    if (tabType === 'income') {
      return Math.abs(amountNumber).toFixed(2);
    }

    if (amountNumber < 0 || item.type === 'expense' || item.direction === 'out') {
      return `-${Math.abs(amountNumber).toFixed(2)}`;
    }

    return Math.abs(amountNumber).toFixed(2);
  },

  formatMoney(value) {
    const amount = this.parseNumber(value);
    if (!Number.isFinite(amount)) {
      return '0.00';
    }
    return amount.toFixed(2);
  },

  parseNumber(value) {
    if (typeof value === 'string') {
      const matched = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
      return matched ? Number(matched[0]) : 0;
    }

    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  },

  getFirstValidValue(values) {
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] !== undefined && values[i] !== null) {
        return values[i];
      }
    }
    return '';
  },

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

  goTransfer() {
    if (!this.data.canTransfer) {
      return;
    }

    wx.navigateTo({
      url: '/subPackages/package/pages/xiaofeiquan/xiaofeiquan'
    });
  }
});
