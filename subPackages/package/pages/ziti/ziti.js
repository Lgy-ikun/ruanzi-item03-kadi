const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    stores: [],
    type: 'order',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.getResult(itsid);
    } else {
      wx.showToast({
        title: 'itsid 未设置',
        icon: 'none'
      });
    }
    this.setData({
      type: options.type || 'order'
    });
  },
  getResult: function (itsid) {
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10626&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === '1') {
          this.setData({
            stores: res.data.result.list
          });
        } else {
          console.error('服务器返回错误状态码或操作失败', res);
          wx.showToast({
            title: '请求失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求失败', err);
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
      }
    });
  },

  onStoreSelect: function (e) {
    console.log(e);
    const storeId = e.currentTarget.dataset.id;
    const selectedStore = this.data.stores.find(store => store.id === storeId);
    const app = getApp();

    // 存储选中的门店名称到全局变量
    app.globalData.selectedStoreName = selectedStore.name;

    // 存储选中的门店ID到全局变量
    wx.setStorageSync('selectedStoreId', storeId);
    app.globalData.selectedStoreId = storeId;

    wx.showToast({
      title: `已选择：${selectedStore.name}`,
      icon: 'success',
      duration: 2000
    });
    console.log(`Navigating to order page with store name: ${encodeURIComponent(selectedStore.name)}`);
    if (this.data.type === 'order') {
      wx.switchTab({
        url: '/pages/order/order',
      })
    }
    if (this.data.type === 'jiesuan') {
      wx.navigateBack({
        url: '/subPackages/package/pages/jiesuan/jiesuan',
      });
    }
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }

})