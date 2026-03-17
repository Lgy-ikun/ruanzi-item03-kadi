const app = getApp();

const SCENE_MAP = {
  balance: {
    title: '充值中心',
    assetName: '个人余额',
    options: [
      { amount: 600, gift: 0 },
      { amount: 1800, gift: 0 },
      { amount: 5400, gift: 0 },
      { amount: 12000, gift: 0 },
      { amount: 16200, gift: 0 }
    ],
    amountCodeMap: { 600: 920, 1800: 920, 5400: 920, 12000: 920, 16200: 920 }
  },
  stored: {
    title: '储值卡充值',
    assetName: '储值卡',
    options: [
      { amount: 100, gift: 30 },
      { amount: 300, gift: 120 },
      { amount: 498, gift: 250 },
      { amount: 998, gift: 600 }
    ],
    amountCodeMap: { 100: 920, 300: 920, 498: 920, 998: 920 },
    tips: '当前充值储值卡，只能用于消费购物，不能用于其它使用！'
  },
  new_store: {
    title: '新门店储值',
    assetName: '新店储值卡',
    options: [
      { amount: 100, gift: 30 },
      { amount: 300, gift: 120 },
      { amount: 498, gift: 250 },
      { amount: 998, gift: 600 }
    ],
    amountCodeMap: { 100: 920, 300: 920, 498: 920, 998: 920 },
    tips: '当前充值门店储值卡，仅限指定门店使用。'
  }
};

Page({
  data: {
    scene: 'balance',
    assetName: '个人余额',
    tips: '',
    currentBalance: '0.00',
    storecardid: '',
    amountOptions: [],
    selectedAmount: 0,
    payMethod: 'wechat'
  },

  onLoad(options) {
    const scene = options?.scene && SCENE_MAP[options.scene] ? options.scene : 'balance';
    const config = SCENE_MAP[scene];
    wx.setNavigationBarTitle({ title: config.title });
    this.setData({
      scene,
      assetName: config.assetName,
      tips: config.tips || '',
      amountOptions: config.options,
      selectedAmount: config.options[0]?.amount || 0,
      payMethod: 'wechat'
    });
    this.loadBalance(scene);
  },

  loadBalance(scene) {
    const itsid = wx.getStorageSync('itsid');
    if (!itsid) {
      return;
    }
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        const data = res?.data || {};
        const balanceValue = scene === 'balance'
          ? data.money
          : (scene === 'new_store' ? data.storecard : data.chuzhika);
        const storecardid = String(data.storecardid || '');
        this.setData({
          currentBalance: Number(balanceValue || 0).toFixed(2),
          storecardid
        });
      }
    });
  },

  selectAmount(e) {
    const value = Number(e.currentTarget.dataset.value || 0);
    if (!value) {
      return;
    }
    this.setData({ selectedAmount: value });
  },

  selectPayMethod(e) {
    this.setData({ payMethod: 'wechat' });
  },

  createOrder() {
    const { selectedAmount, scene, payMethod } = this.data;
    if (!selectedAmount) {
      wx.showToast({ title: '请选择充值金额', icon: 'none' });
      return;
    }
    if (payMethod !== 'wechat') {
      wx.showToast({ title: '仅支持微信支付', icon: 'none' });
      return;
    }
    const itsid = wx.getStorageSync('itsid');
    if (!itsid) {
      if (scene === 'new_store') {
        wx.navigateTo({
          url: '/subPackages/user/pages/register/register?from=home'
        });
        return;
      }
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const config = SCENE_MAP[scene] || SCENE_MAP.balance;
    const mcode = config.amountCodeMap[selectedAmount] || 920;
    const opidMap = {
      balance: '1207',
      stored: '1217',
      new_store: '1218'
    };
    const opid = opidMap[scene];
    if (!opid) {
      wx.showToast({ title: '充值场景参数错误', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '创建订单中...', mask: true });
    const requestData = {
      MCODE: mcode,
      OPID: opid,
      UNITID: '1',
      NUM: 1,
      USERID: '0',
      NOTE: ' ',
      AMT: Number(selectedAmount),
      RURL: '/subPackages/package/pages/recharge-result/recharge-result'
    };
    if (scene === 'new_store') {
      requestData.storecardid = this.data.storecardid || '';
    }
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10651&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      // url: `${app.globalData.backUrl}phone.aspx?mbid=10601&ituid=${app.globalData.ituid}&itsid=${itsid}`这个是会员页面充值,
      // url: `${app.globalData.backUrl}phone.aspx?mbid=10634&ituid=${app.globalData.ituid}&itsid=${itsid}`这个是股东页面充值,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        const data = res?.data || {};
        if (!(res.statusCode === 200 && data.orderid)) {
          wx.hideLoading();
          wx.showToast({
            title: data.msg || data.message || '订单创建失败',
            icon: 'none'
          });
          return;
        }
        const payPayload = {
          timeStamp: String(data.timeStamp || ''),
          nonceStr: data.nonceStr || '',
          package: data.package || '',
          signType: data.signType || 'MD5',
          paySign: data.paySign || ''
        };
        if (!payPayload.timeStamp || !payPayload.nonceStr || !payPayload.package || !payPayload.paySign) {
          wx.hideLoading();
          wx.showToast({
            title: '支付参数缺失，请稍后重试',
            icon: 'none'
          });
          return;
        }
        wx.requestPayment({
          ...payPayload,
          success: () => {
            wx.hideLoading();
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 800);
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({
              title: '已取消或支付失败',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    });
  },

  goRechargeAgreement() {
    wx.navigateTo({
      url: '/subPackages/package/pages/xieyi/xieyi?agreement=recharge'
    });
  }
});
