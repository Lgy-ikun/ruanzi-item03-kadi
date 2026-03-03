const app = getApp();
Page({
  data: {
    coupons: [],
    selectedId: ''
  },
  onLoad() {
    const userid = wx.getStorageSync('userid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10619&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        const list = (res.data && res.data.result) ? res.data.result : [];
        this.setData({ coupons: list });
      }
    });
  },
  // 单选选中
  radioChange(e) {
    this.setData({ selectedId: e.detail.value });
  },
  confirm() {
    const { coupons, selectedId } = this.data;
    const picked = coupons.find(c => (c.cardid || c.id) == selectedId) || coupons[0];
    if (!picked) {
      wx.showToast({ title: '请选择优惠券', icon: 'none' });
      return;
    }
    wx.setStorageSync('selectedCoupon', {
      cardid: picked.cardid || picked.id,
      cardName: picked.cardName,
      atm: picked.atm
    });
    wx.navigateBack();
  }
});
