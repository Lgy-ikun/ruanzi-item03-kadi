// subPackages/package3/pages/chooseLocation/chooseLocation.js
const app = getApp();

Page({
  data: {
    tagIndex: 1, // 默认地址
    list: [],
    AUrl: app.globalData.AUrl,
  },

  onLoad(options) {
    this.setData({
      type: options.type
    });
    console.log(this.data.type);
  },

  gotoAddress(e) {
    let id = e.currentTarget.dataset.id;
    if (id) {
      const i = this.data.list.find(item => item.id === id);
      let isIndex = 0;
      if (this.data.tagIndex === i.id) {
        isIndex = 1;
      }
      wx.navigateTo({
        url: `/subPackages/package/pages/address/address?target=edit&name=${i.username}&gender=${i.gender}&phone=${i.phone}&address=${i.address}&addressdesc=${i.addressDesc}&door=${i.door}&isIndex=${isIndex}`,
      });
    } else {
      wx.navigateTo({
        url: '/subPackages/package/pages/address/address?target=add',
      });
    }
  },

  gobackPublish(e) {
    const addressDesc = e.currentTarget.dataset.addressdesc;
    const phone = e.currentTarget.dataset.phone;
    const username = e.currentTarget.dataset.username; // 新增姓名

    const selected = e.currentTarget.dataset.selected;

    if (!addressDesc) {
      console.error('AddressDesc data is missing in dataset');
      return;
    }

    app.globalData.addressDesc = addressDesc;
    app.globalData.phone = phone;
    app.globalData.username = username; // 存储到全局
    app.globalData.selected = selected;
    app.globalData.delivery = 5;

    console.log('Setting globalData:', app.globalData);

    if (this.data.type === 'exchangeResult') {
      wx.navigateBack();
    } else if (this.data.type === 'order') {
      wx.switchTab({
        url: '/pages/order/order',
      });
    } else if (this.data.type === 'jiesuan') {
      wx.navigateBack({
        url: '/subPackages/package/pages/jiesuan/jiesuan',
      });
    }
  },

  onShow: function () {
    this.fetchData();
  },

  fetchData: function () {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    // 后台接口地址
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10606&itcid=10606&itsid=${itsid}`,
      method: 'GET',
      success: function (res) {
        console.log('Fetched list:', res.data.result.list); // 打印 list 数据
        that.setData({
          list: res.data.result.list
        });
      },
      fail: function (error) {
        console.error('获取数据失败', error);
      }
    });
  },

  onReady: function () {
    // 页面初次渲染完成时触发
  },

  onHide: function () {
    // 页面隐藏时触发
  },

  onUnload: function () {
    // 页面卸载时触发
  },

  onPullDownRefresh: function () {
    // 监听用户下拉动作
  },

  onReachBottom: function () {
    // 页面上拉触底事件的处理函数
  },

  onShareAppMessage: function () {
    // 用户点击右上角分享
  }
});