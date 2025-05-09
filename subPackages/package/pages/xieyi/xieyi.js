// subPackages/package/pages/xieyi/xieyi.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this
    let itjid = 0
    if (options.agreement == 'user') {
      itjid = 10600
      wx.setNavigationBarTitle({
        title: '卡狄咖啡用户服务协议',
      })
    }
    else if (options.agreement == 'privacy') {
      itjid = 10601
      wx.setNavigationBarTitle({
        title: '卡狄咖啡用户隐私使用协议',
      })
    }

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=${itjid}`,
      method: 'GET',
      success(res) {
        that.setData({
          content: res.data.content
        })
      }
    })
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