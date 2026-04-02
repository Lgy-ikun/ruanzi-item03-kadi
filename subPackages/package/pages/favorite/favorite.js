const app = getApp();
Page({
  data: {
    list: [],
    loading: true
  },

  onLoad() {
    this.getList();
  },

  onShow() {
    this.getList();
  },

  getList() {
    let userid = wx.getStorageSync('userid') || 0;

    wx.request({
      url: "https://www.caldicoffee.com.cn/jy/go/we.aspx",
      data: {
        ituid: 106,
        itjid: 10660,
        itcid: 10660,
        userid: userid
      },
      success: res => {
        if (res.data.code === "1") {
          this.setData({
            list: res.data.result.list,
            loading: false
          });
        } else {
          this.setData({ list: [], loading: false });
        }
      }
    });
  },

  goDetail(e) {
    let id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/subPackages/package/pages/diandan/diandan?dishId=" + id
    });
  }
});