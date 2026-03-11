const app = getApp();

Page({
  data: {
    titleLabel: '',
    money: '0.00',
    records: [],
    loading: true // 新增：加载状态，避免页面空白
  },

  onLoad(options) {
    // 第一步：先读取参数（不做默认值）
    const type = options?.type;

    // 第二步：严格校验，只接受 stored/balance
    if (type === 'stored') {
      wx.setNavigationBarTitle({ title: '储值卡' });
      this.setData({ titleLabel: '储值卡可用' });
      this.type = type;
    } else if (type === 'balance') {
      wx.setNavigationBarTitle({ title: '个人余额' });
      this.setData({ titleLabel: '个人余额可用' });
      this.type = type;
    } else {
      // 第三步：参数非法/没传 → 提示+返回上一页（优化：无页面返回则跳首页）
      wx.showToast({ title: '页面参数错误', icon: 'none', duration: 1500 });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack(); // 有上一页则返回
        } else {
          wx.switchTab({ url: '/pages/index/index' }); // 无页面则跳首页（替换成你的首页路径）
        }
      }, 1500);
      return; // 终止后续代码执行
    }

    // 只有参数合法，才加载数据
    this.fetchUserMoney();
    this.fetchRecords();
  },

  // 优化：合并重复的请求逻辑，后续改stored接口只需改url
  fetchUserMoney() {
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid;
    // 接口一致，只是获取的参数不同
    let url = `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`;
    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        if (this.type === 'stored') {
          const chuzhika = res?.data?.chuzhika || 0;
          this.setData({
            money: Number(chuzhika).toFixed(2)
          });
        } else {
          const money = res?.data?.money;
          if (money !== undefined && money !== null) {
            this.setData({
              money: Number(money).toFixed(2)
            });
          }
        }
      },
      complete: () => {
        // 无论成功失败，都关闭加载状态
        this.setData({ loading: false });
      }
    });
  },

  // 优化：合并重复的请求逻辑，后续改stored接口只需改url
  fetchRecords() {
    const userid = wx.getStorageSync('userid') || app.globalData.userid;
    // 优化1：未登录提示+清空数据+关闭加载
    if (!userid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.setData({ records: [], loading: false });
      return;
    }

    // 优化2：根据type区分url（后续stored接口做好后，只需改这里的url）
    let url = `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10629&userid=${userid}`;
    // if (this.type === 'stored') {
    //   url = `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=xxx&itcid=xxx&userid=${userid}`; // 后续替换成stored专属接口
    // }

    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        const list = res?.data?.result?.list || [];
        this.setData({ records: list });
      },
      fail: () => {
        this.setData({ records: [] });
        wx.showToast({ title: '获取记录失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  goRecharge() {
    
  }
});